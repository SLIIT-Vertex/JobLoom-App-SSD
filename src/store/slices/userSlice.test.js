import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import userReducer, { logoutUser } from './userSlice';

const storedValues = new Map();
const localStorageStub = {
  clear: () => storedValues.clear(),
  getItem: key => storedValues.get(key) ?? null,
  removeItem: key => storedValues.delete(key),
  setItem: (key, value) => storedValues.set(key, String(value)),
};

const createStore = () =>
  configureStore({
    reducer: { user: userReducer },
    preloadedState: {
      user: {
        currentUser: { _id: 'user-1', email: 'user@test.com' },
        token: 'copied-token',
        loading: false,
        error: null,
      },
    },
  });

describe('logoutUser', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('localStorage', localStorageStub);
    localStorage.clear();
    localStorage.setItem('token', 'copied-token');
    localStorage.setItem('user', JSON.stringify({ _id: 'user-1' }));
    localStorage.setItem('session_expiry', String(Date.now() + 60_000));
  });

  it('calls backend logout with the JWT before clearing local session state', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: 'Logged out successfully' }),
    });
    const store = createStore();

    await store.dispatch(logoutUser());

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/users/logout',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer copied-token' }),
      })
    );
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('session_expiry')).toBeNull();
    expect(store.getState().user.currentUser).toBeNull();
    expect(store.getState().user.token).toBeNull();
  });

  it('still clears local state when the logout request cannot reach the backend', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network unavailable'));
    const store = createStore();

    const result = await store.dispatch(logoutUser());

    expect(result.type).toBe('user/logout/rejected');
    expect(localStorage.getItem('token')).toBeNull();
    expect(store.getState().user.token).toBeNull();
  });
});
