import authReducer, { setUser, clearUser } from '../store/auth.reducer';

describe('auth.reducer', () => {
  it('sets a user and marks authenticated', () => {
    const state = authReducer(undefined, setUser({ user_id: 1, email: 'a@b.com' }));
    expect(state.isAuthenticated).toBe(true);
    expect(state.user.email).toBe('a@b.com');
    expect(state.isLoading).toBe(false);
  });

  it('clears a user', () => {
    const loggedIn = authReducer(undefined, setUser({ user_id: 1 }));
    const state = authReducer(loggedIn, clearUser());
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });
});
