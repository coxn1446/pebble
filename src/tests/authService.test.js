jest.mock('../../server/db', () => ({
  isDbHealthy: jest.fn(() => true),
  query: jest.fn(),
  withTransaction: jest.fn(),
}));

const { query } = require('../../server/db');
const authService = require('../../server/services/authService');
const { userQueries } = require('../../server/queries');

const googleProfile = {
  id: 'google-sub-1',
  displayName: 'Ada Lovelace',
  emails: [{ value: 'Ada@Example.com' }],
};

describe('authService oauth accounts', () => {
  beforeEach(() => {
    query.mockReset();
    process.env.SESSION_SECRET = 'test-secret';
  });

  test('returns an existing Google user by google_id', async () => {
    query.mockResolvedValueOnce({
      rows: [{ user_id: 3, email: 'ada@example.com', google_id: 'google-sub-1', password: 'hash' }],
    });

    const user = await authService.findOrCreateOAuthUser('google', googleProfile);

    expect(query).toHaveBeenCalledWith(userQueries.findByGoogleId, ['google-sub-1']);
    expect(user.user_id).toBe(3);
    expect(user.password).toBeUndefined();
  });

  test('links Google onto the account with the same email and keeps the password', async () => {
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ user_id: 1, email: 'ada@example.com', google_id: null, apple_id: null, password: 'hash' }],
      })
      .mockResolvedValueOnce({
        rows: [{ user_id: 1, email: 'ada@example.com', google_id: 'google-sub-1', apple_id: null, has_password: true }],
      });

    const user = await authService.findOrCreateOAuthUser('google', googleProfile);

    expect(query).toHaveBeenNthCalledWith(2, userQueries.findByEmail, ['ada@example.com']);
    expect(query).toHaveBeenNthCalledWith(3, userQueries.linkGoogleId, [1, 'google-sub-1']);
    expect(user.google_id).toBe('google-sub-1');
    expect(user.password).toBeUndefined();
  });

  test('rejects a Google subject when that email is already linked to a different Google account', async () => {
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ user_id: 1, email: 'ada@example.com', google_id: 'other-google', apple_id: null }],
      });

    await expect(authService.findOrCreateOAuthUser('google', googleProfile)).rejects.toMatchObject({
      status: 409,
    });
    expect(query).not.toHaveBeenCalledWith(userQueries.linkGoogleId, expect.anything());
  });

  test('creates an OAuth user when the email is new', async () => {
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ user_id: 9, email: 'ada@example.com', username: 'ada', google_id: 'google-sub-1', apple_id: null }],
      });

    const user = await authService.findOrCreateOAuthUser('google', googleProfile);

    expect(query).toHaveBeenNthCalledWith(3, userQueries.findByUsername, ['ada']);
    expect(query).toHaveBeenNthCalledWith(4, userQueries.insertOAuthUser, [
      'ada@example.com',
      'ada',
      'google-sub-1',
      null,
      'Ada Lovelace',
    ]);
    expect(user.user_id).toBe(9);
    expect(user.username).toBe('ada');
  });

  test('links Apple onto a profile account even when the Apple email differs', async () => {
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ user_id: 4, email: 'ada@example.com', google_id: 'google-sub-1', apple_id: null, has_password: true }],
      })
      .mockResolvedValueOnce({
        rows: [{ user_id: 4, email: 'ada@example.com', google_id: 'google-sub-1', apple_id: 'apple-sub-1' }],
      });

    const user = await authService.findOrCreateOAuthUser(
      'apple',
      { id: 'apple-sub-1', emails: [{ value: 'relay@privaterelay.appleid.com' }] },
      { linkUserId: 4 }
    );

    expect(query).toHaveBeenNthCalledWith(2, userQueries.findById, [4]);
    expect(query).toHaveBeenNthCalledWith(3, userQueries.linkAppleId, [4, 'apple-sub-1']);
    expect(user.apple_id).toBe('apple-sub-1');
    expect(user.google_id).toBe('google-sub-1');
  });

  test('refuses to attach a provider that already belongs to someone else', async () => {
    query.mockResolvedValueOnce({
      rows: [{ user_id: 8, google_id: 'google-sub-1' }],
    });

    await expect(
      authService.findOrCreateOAuthUser('google', googleProfile, { linkUserId: 4 })
    ).rejects.toMatchObject({ status: 409 });
    expect(query).not.toHaveBeenCalledWith(userQueries.linkGoogleId, expect.anything());
  });

  test('refuses to replace a provider id already stored on the profile', async () => {
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ user_id: 4, google_id: 'existing-google', apple_id: null }],
      });

    await expect(
      authService.findOrCreateOAuthUser('google', googleProfile, { linkUserId: 4 })
    ).rejects.toMatchObject({ status: 409 });
  });

  test('requires an email before creating a new OAuth account', async () => {
    query.mockResolvedValueOnce({ rows: [] });

    await expect(
      authService.findOrCreateOAuthUser('google', { id: 'google-sub-9' })
    ).rejects.toMatchObject({ status: 400 });
  });

  test('reads the Apple subject and email from the id token', () => {
    const payload = Buffer.from(
      JSON.stringify({ sub: 'apple-sub-9', email: 'Ada@Example.com' })
    ).toString('base64url');
    const profile = authService.profileFromAppleCallback({
      idToken: `header.${payload}.sig`,
      profile: {},
      req: { body: { user: JSON.stringify({ name: { firstName: 'Ada', lastName: 'Lovelace' } }) } },
    });

    expect(profile.id).toBe('apple-sub-9');
    expect(profile.email).toBe('ada@example.com');
    expect(profile.displayName).toBe('Ada Lovelace');
  });

  test('round-trips a signed link state and rejects a tampered one', () => {
    const state = authService.signOAuthState({
      purpose: 'link',
      provider: 'google',
      userId: 4,
      returnTo: '/settings',
    });

    expect(authService.readOAuthState(state)).toMatchObject({
      purpose: 'link',
      provider: 'google',
      userId: 4,
      returnTo: '/settings',
    });
    expect(authService.readOAuthState(`${state}x`)).toBeNull();
  });
});
