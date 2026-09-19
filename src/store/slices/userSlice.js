import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const clearStoredSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('session_expiry');
};

const loadStoredUser = () => {
  try {
    const expiry = localStorage.getItem('session_expiry');
    if (expiry && Date.now() > parseInt(expiry)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('session_expiry');
      return null;
    }
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const loadStoredToken = () => {
  try {
    const expiry = localStorage.getItem('session_expiry');
    if (expiry && Date.now() > parseInt(expiry)) {
      return null;
    }
    return localStorage.getItem('token') || null;
  } catch {
    return null;
  }
};

const toErrorMessage = data => {
  return data?.message || data?.errors?.[0]?.msg || 'Request failed';
};

const authHeaders = token => {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const storeAuthFromResponse = data => {
  const token = data?.token || null;
  const user =
    data?.user ||
    (data && typeof data === 'object'
      ? (() => {
          // Common pattern: { token, ...userFields }

          const { token: _token, ...rest } = data;
          return rest;
        })()
      : null);

  if (token) {
    localStorage.setItem('token', token);
    localStorage.setItem('session_expiry', (Date.now() + SESSION_DURATION).toString());
  }
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  return { token, user };
};

export const registerUser = createAsyncThunk(
  'user/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(toErrorMessage(data));
      return data;
    } catch (err) {
      return rejectWithValue(err?.message || 'Registration failed');
    }
  }
);

export const verifyRegistration = createAsyncThunk(
  'user/verifyRegistration',
  async ({ phone, otp }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/users/verify-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(toErrorMessage(data) || 'OTP verification failed');

      const { token, user } = storeAuthFromResponse(data);
      return { data, token, user };
    } catch (err) {
      return rejectWithValue(err?.message || 'OTP verification failed');
    }
  }
);

export const loginUser = createAsyncThunk(
  'user/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(toErrorMessage(data) || 'Login failed');

      const { token, user } = storeAuthFromResponse(data);
      return { data, token, user };
    } catch (err) {
      return rejectWithValue(err?.message || 'Login failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'user/logout',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState()?.user?.token || loadStoredToken();
      const response = await fetch(`${API_URL}/users/logout`, {
        method: 'POST',
        headers: authHeaders(token),
      });
      const data = await response.json();

      // A 401 means the session is already unusable, so local logout is still complete.
      if (!response.ok && response.status !== 401) {
        return rejectWithValue(toErrorMessage(data) || 'Logout failed');
      }

      return data;
    } catch (err) {
      return rejectWithValue(err?.message || 'Logout failed');
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'user/forgotPassword',
  async ({ phone }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/users/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(toErrorMessage(data) || 'Failed to send OTP');
      return data;
    } catch (err) {
      return rejectWithValue(err?.message || 'Failed to send OTP');
    }
  }
);

export const verifyPasswordReset = createAsyncThunk(
  'user/verifyPasswordReset',
  async ({ phone, otp }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/users/verify-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(toErrorMessage(data) || 'OTP verification failed');
      return data;
    } catch (err) {
      return rejectWithValue(err?.message || 'OTP verification failed');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'user/resetPassword',
  async ({ phone, resetToken, password }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/users/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, resetToken, password }),
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(toErrorMessage(data) || 'Password reset failed');
      return data;
    } catch (err) {
      return rejectWithValue(err?.message || 'Password reset failed');
    }
  }
);

export const getMyProfile = createAsyncThunk(
  'user/getMyProfile',
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const token = getState()?.user?.token || loadStoredToken();
      const response = await fetch(`${API_URL}/users/me`, {
        headers: authHeaders(token),
      });

      if (response.status === 401) {
        dispatch(logoutUserAction());
        return rejectWithValue('Session expired. Please login again.');
      }

      const data = await response.json();
      if (!response.ok) return rejectWithValue(toErrorMessage(data) || 'Failed to fetch profile');
      return data;
    } catch (err) {
      return rejectWithValue(err?.message || 'Failed to fetch profile');
    }
  }
);

export const getUserProfile = createAsyncThunk(
  'user/getUserProfile',
  async (id, { getState, rejectWithValue }) => {
    try {
      const token = getState()?.user?.token || loadStoredToken();
      const response = await fetch(`${API_URL}/users/profile/${id}`, {
        headers: authHeaders(token),
      });
      const data = await response.json();
      if (!response.ok)
        return rejectWithValue(toErrorMessage(data) || 'Failed to fetch user profile');
      return data;
    } catch (err) {
      return rejectWithValue(err?.message || 'Failed to fetch user profile');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateUserProfile',
  async (updates, { getState, rejectWithValue }) => {
    try {
      const token = getState()?.user?.token || loadStoredToken();
      const isFormData = updates instanceof FormData;
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
        },
        body: isFormData ? updates : JSON.stringify(updates),
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(toErrorMessage(data) || 'Failed to update profile');

      // When API returns updated user, persist it
      if (data && typeof data === 'object' && data._id) {
        localStorage.setItem('user', JSON.stringify(data));
      }

      return data;
    } catch (err) {
      return rejectWithValue(err?.message || 'Failed to update profile');
    }
  }
);

export const deleteAccount = createAsyncThunk(
  'user/deleteAccount',
  async ({ password }, { getState, rejectWithValue }) => {
    try {
      const token = getState()?.user?.token || loadStoredToken();
      const response = await fetch(`${API_URL}/users/account`, {
        method: 'DELETE',
        headers: authHeaders(token),
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(toErrorMessage(data) || 'Failed to delete account');

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return data;
    } catch (err) {
      return rejectWithValue(err?.message || 'Failed to delete account');
    }
  }
);

const initialState = {
  currentUser: loadStoredUser(),
  token: loadStoredToken(),
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearSession(state) {
      clearStoredSession();
      state.currentUser = null;
      state.token = null;
      state.error = null;
      state.loading = false;
    },
    clearUserError(state) {
      state.error = null;
    },
  },
  extraReducers: builder => {
    const setPending = state => {
      state.loading = true;
      state.error = null;
    };
    const setRejected = (state, action) => {
      state.loading = false;
      state.error = action.payload || action.error?.message || 'Request failed';
    };

    builder
      .addCase(registerUser.pending, setPending)
      .addCase(registerUser.fulfilled, state => {
        state.loading = false;
      })
      .addCase(registerUser.rejected, setRejected)
      .addCase(verifyRegistration.pending, setPending)
      .addCase(verifyRegistration.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload?.token || state.token;
        state.currentUser = action.payload?.user || state.currentUser;
      })
      .addCase(verifyRegistration.rejected, setRejected)
      .addCase(loginUser.pending, setPending)
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload?.token || state.token;
        state.currentUser = action.payload?.user || state.currentUser;
      })
      .addCase(loginUser.rejected, setRejected)
      .addCase(logoutUser.pending, setPending)
      .addCase(logoutUser.fulfilled, state => {
        clearStoredSession();
        state.currentUser = null;
        state.token = null;
        state.loading = false;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        clearStoredSession();
        state.currentUser = null;
        state.token = null;
        state.loading = false;
        state.error = action.payload || action.error?.message || 'Logout failed';
      })
      .addCase(forgotPassword.pending, setPending)
      .addCase(forgotPassword.fulfilled, state => {
        state.loading = false;
      })
      .addCase(forgotPassword.rejected, setRejected)
      .addCase(verifyPasswordReset.pending, setPending)
      .addCase(verifyPasswordReset.fulfilled, state => {
        state.loading = false;
      })
      .addCase(verifyPasswordReset.rejected, setRejected)
      .addCase(resetPassword.pending, setPending)
      .addCase(resetPassword.fulfilled, state => {
        state.loading = false;
      })
      .addCase(resetPassword.rejected, setRejected)
      .addCase(getMyProfile.pending, setPending)
      .addCase(getMyProfile.fulfilled, (state, action) => {
        state.loading = false;
        // Keep store + localStorage in sync with freshest profile
        state.currentUser = action.payload;
        try {
          localStorage.setItem('user', JSON.stringify(action.payload));
        } catch {
          // ignore
        }
      })
      .addCase(getMyProfile.rejected, setRejected)
      .addCase(getUserProfile.pending, setPending)
      .addCase(getUserProfile.fulfilled, state => {
        state.loading = false;
      })
      .addCase(getUserProfile.rejected, setRejected)
      .addCase(updateUserProfile.pending, setPending)
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && typeof action.payload === 'object' && action.payload._id) {
          state.currentUser = action.payload;
        }
      })
      .addCase(updateUserProfile.rejected, setRejected)
      .addCase(deleteAccount.pending, setPending)
      .addCase(deleteAccount.fulfilled, state => {
        state.loading = false;
        state.currentUser = null;
        state.token = null;
      })
      .addCase(deleteAccount.rejected, setRejected);
  },
});

export const { clearSession: logoutUserAction, clearUserError } = userSlice.actions;
export default userSlice.reducer;
