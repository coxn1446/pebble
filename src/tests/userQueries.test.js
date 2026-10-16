const { userQueries } = require('../../server/queries');

describe('userQueries identity columns', () => {
  test('selects google_id, apple_id, and has_password without a provider enum', () => {
    expect(userQueries.USER_FIELDS).toMatch(/google_id/);
    expect(userQueries.USER_FIELDS).toMatch(/apple_id/);
    expect(userQueries.USER_FIELDS).toMatch(/\(password IS NOT NULL\) AS has_password/);
    expect(userQueries.USER_FIELDS).not.toMatch(/auth_provider/);
    expect(userQueries.USER_FIELDS).not.toMatch(/provider_id/);
    expect(userQueries.PUBLIC_USER_FIELDS).not.toMatch(/google_id/);
    expect(userQueries.PUBLIC_USER_FIELDS).not.toMatch(/apple_id/);
    expect(userQueries.PUBLIC_USER_FIELDS).not.toMatch(/password/);
  });

  test('looks up and links each provider on its own column', () => {
    expect(userQueries.findByGoogleId).toMatch(/WHERE google_id = \$1/);
    expect(userQueries.findByAppleId).toMatch(/WHERE apple_id = \$1/);
    expect(userQueries.findByEmail).toMatch(/LOWER\(email\) = LOWER\(\$1\)/);
    expect(userQueries.insertLocalUser).toMatch(/password/);
    expect(userQueries.insertLocalUser).not.toMatch(/auth_provider/);
    expect(userQueries.insertOAuthUser).toMatch(/google_id, apple_id/);
    expect(userQueries.linkGoogleId).toMatch(/SET google_id = \$2/);
    expect(userQueries.linkGoogleId).not.toMatch(/password\s*=/);
    expect(userQueries.linkAppleId).toMatch(/SET apple_id = \$2/);
    expect(userQueries.linkAppleId).not.toMatch(/password\s*=/);
  });
});
