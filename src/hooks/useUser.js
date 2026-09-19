import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  clearUserError,
  deleteAccount,
  forgotPassword,
  getMyProfile,
  getUserProfile,
  loginUser,
  logoutUser,
  registerUser,
  resetPassword,
  verifyPasswordReset,
  verifyRegistration,
  updateUserProfile,
} from '../store/slices/userSlice';

/**
 * Custom hook to interact with Redux User State.
 * Replaces the need for UserContext while maintaining a clean API.
 */
export const useUser = () => {
  const dispatch = useDispatch();
  const { currentUser, loading, error } = useSelector(state => state.user);

  const clearError = useCallback(() => dispatch(clearUserError()), [dispatch]);

  const registerUserFn = useCallback(
    userData => dispatch(registerUser(userData)).unwrap(),
    [dispatch]
  );

  const verifyRegistrationFn = useCallback(
    (phone, otp) =>
      dispatch(verifyRegistration({ phone, otp }))
        .unwrap()
        .then(res => res.data),
    [dispatch]
  );

  const loginUserFn = useCallback(
    (email, password) =>
      dispatch(loginUser({ email, password }))
        .unwrap()
        .then(res => res.data),
    [dispatch]
  );

  const logoutUserFn = useCallback(() => dispatch(logoutUser()).unwrap(), [dispatch]);

  const forgotPasswordFn = useCallback(
    phone => dispatch(forgotPassword({ phone })).unwrap(),
    [dispatch]
  );

  const verifyPasswordResetFn = useCallback(
    (phone, otp) => dispatch(verifyPasswordReset({ phone, otp })).unwrap(),
    [dispatch]
  );

  const resetPasswordFn = useCallback(
    (phone, resetToken, password) =>
      dispatch(resetPassword({ phone, resetToken, password })).unwrap(),
    [dispatch]
  );

  const getMyProfileFn = useCallback(() => dispatch(getMyProfile()).unwrap(), [dispatch]);

  const getUserProfileFn = useCallback(id => dispatch(getUserProfile(id)).unwrap(), [dispatch]);

  const updateUserProfileFn = useCallback(
    updates => dispatch(updateUserProfile(updates)).unwrap(),
    [dispatch]
  );

  const deleteAccountFn = useCallback(
    password => dispatch(deleteAccount({ password })).unwrap(),
    [dispatch]
  );

  return useMemo(
    () => ({
      currentUser,
      loading,
      error,
      clearError,
      registerUser: registerUserFn,
      verifyRegistration: verifyRegistrationFn,
      loginUser: loginUserFn,
      logoutUser: logoutUserFn,
      forgotPassword: forgotPasswordFn,
      verifyPasswordReset: verifyPasswordResetFn,
      resetPassword: resetPasswordFn,
      getMyProfile: getMyProfileFn,
      getUserProfile: getUserProfileFn,
      updateUserProfile: updateUserProfileFn,
      deleteAccount: deleteAccountFn,
    }),
    [
      currentUser,
      loading,
      error,
      clearError,
      registerUserFn,
      verifyRegistrationFn,
      loginUserFn,
      logoutUserFn,
      forgotPasswordFn,
      verifyPasswordResetFn,
      resetPasswordFn,
      getMyProfileFn,
      getUserProfileFn,
      updateUserProfileFn,
      deleteAccountFn,
    ]
  );
};
