import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUser } from '../useUser';

const mockDispatch = vi.fn();
const mockUseSelector = vi.fn();

vi.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: selector => mockUseSelector(selector),
}));

const mockClearUserError = vi.fn();
const mockRegisterUser = vi.fn();
const mockVerifyRegistration = vi.fn();
const mockLoginUser = vi.fn();
const mockLogoutUser = vi.fn();
const mockLogoutUserAction = vi.fn();
const mockForgotPassword = vi.fn();
const mockVerifyPasswordReset = vi.fn();
const mockResetPassword = vi.fn();
const mockGetMyProfile = vi.fn();
const mockGetUserProfile = vi.fn();
const mockUpdateUserProfile = vi.fn();
const mockDeleteAccount = vi.fn();

vi.mock('../../store/slices/userSlice', () => ({
  clearUserError: (...args) => mockClearUserError(...args),
  registerUser: (...args) => mockRegisterUser(...args),
  verifyRegistration: (...args) => mockVerifyRegistration(...args),
  loginUser: (...args) => mockLoginUser(...args),
  logoutUser: (...args) => mockLogoutUser(...args),
  logoutUserAction: (...args) => mockLogoutUserAction(...args),
  forgotPassword: (...args) => mockForgotPassword(...args),
  verifyPasswordReset: (...args) => mockVerifyPasswordReset(...args),
  resetPassword: (...args) => mockResetPassword(...args),
  getMyProfile: (...args) => mockGetMyProfile(...args),
  getUserProfile: (...args) => mockGetUserProfile(...args),
  updateUserProfile: (...args) => mockUpdateUserProfile(...args),
  deleteAccount: (...args) => mockDeleteAccount(...args),
}));

describe('useUser', () => {
  const state = {
    user: {
      currentUser: { _id: 'u1', name: 'Test User', role: 'employer' },
      loading: false,
      error: null,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseSelector.mockImplementation(selector => selector(state));

    mockDispatch.mockImplementation(action => ({
      unwrap: () => Promise.resolve({ data: action }),
    }));
  });

  it('returns user state and methods', () => {
    const { result } = renderHook(() => useUser());

    expect(result.current.currentUser).toEqual(state.user.currentUser);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();

    expect(typeof result.current.loginUser).toBe('function');
    expect(typeof result.current.registerUser).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });

  it('dispatches login and register with mapped payloads', async () => {
    mockLoginUser.mockReturnValue({ type: 'user/loginUser' });
    mockRegisterUser.mockReturnValue({ type: 'user/registerUser' });

    const { result } = renderHook(() => useUser());

    await act(async () => {
      await result.current.loginUser('a@b.com', '123456');
      await result.current.registerUser({ name: 'A', email: 'a@b.com', password: '123456' });
    });

    expect(mockLoginUser).toHaveBeenCalledWith({ email: 'a@b.com', password: '123456' });
    expect(mockRegisterUser).toHaveBeenCalledWith({
      name: 'A',
      email: 'a@b.com',
      password: '123456',
    });
  });

  it('dispatches profile and account related actions', async () => {
    mockGetMyProfile.mockReturnValue({ type: 'user/getMyProfile' });
    mockGetUserProfile.mockReturnValue({ type: 'user/getUserProfile' });
    mockUpdateUserProfile.mockReturnValue({ type: 'user/updateUserProfile' });
    mockDeleteAccount.mockReturnValue({ type: 'user/deleteAccount' });
    mockForgotPassword.mockReturnValue({ type: 'user/forgotPassword' });
    mockVerifyPasswordReset.mockReturnValue({ type: 'user/verifyPasswordReset' });
    mockResetPassword.mockReturnValue({ type: 'user/resetPassword' });
    mockVerifyRegistration.mockReturnValue({ type: 'user/verifyRegistration' });
    mockLogoutUser.mockReturnValue({ type: 'user/logoutUser' });
    mockClearUserError.mockReturnValue({ type: 'user/clearUserError' });

    const { result } = renderHook(() => useUser());

    await act(async () => {
      await result.current.getMyProfile();
      await result.current.getUserProfile('u2');
      await result.current.updateUserProfile({ name: 'Updated' });
      await result.current.deleteAccount('password123');
      await result.current.forgotPassword('0771234567');
      await result.current.verifyPasswordReset('0771234567', '1234');
      await result.current.resetPassword('0771234567', 'token', 'newPass123');
      await result.current.verifyRegistration('0771234567', '1234');
      await result.current.logoutUser();
      result.current.clearError();
    });

    expect(mockGetMyProfile).toHaveBeenCalledWith();
    expect(mockGetUserProfile).toHaveBeenCalledWith('u2');
    expect(mockUpdateUserProfile).toHaveBeenCalledWith({ name: 'Updated' });
    expect(mockDeleteAccount).toHaveBeenCalledWith({ password: 'password123' });
    expect(mockForgotPassword).toHaveBeenCalledWith({ phone: '0771234567' });
    expect(mockVerifyPasswordReset).toHaveBeenCalledWith({ phone: '0771234567', otp: '1234' });
    expect(mockResetPassword).toHaveBeenCalledWith({
      phone: '0771234567',
      resetToken: 'token',
      password: 'newPass123',
    });
    expect(mockVerifyRegistration).toHaveBeenCalledWith({ phone: '0771234567', otp: '1234' });
    expect(mockLogoutUser).toHaveBeenCalledWith();
    expect(mockClearUserError).toHaveBeenCalledWith();
  });

  it('propagates unwrap rejection errors', async () => {
    mockLoginUser.mockReturnValue({ type: 'user/loginUser' });
    mockDispatch.mockImplementation(() => ({
      unwrap: () => Promise.reject(new Error('Invalid credentials')),
    }));

    const { result } = renderHook(() => useUser());

    await expect(result.current.loginUser('a@b.com', 'bad')).rejects.toThrow('Invalid credentials');
  });
});
