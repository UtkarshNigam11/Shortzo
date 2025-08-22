import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../services/api';
import { getToken, setToken, removeToken } from '../utils/auth';

const AuthContext = createContext();

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_TOKEN: 'SET_TOKEN',
  LOGOUT: 'LOGOUT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Initial state
const initialState = {
  user: null,
  token: getToken(),
  loading: true,
  error: null,
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        loading: false,
        error: null,
      };
    case AUTH_ACTIONS.SET_TOKEN:
      return {
        ...state,
        token: action.payload,
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null,
      };
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      
      if (!token) {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        return;
      }

      try {
        const response = await api.get('/auth/me');
        
        if (response.data.success) {
          dispatch({ type: AUTH_ACTIONS.SET_USER, payload: response.data.data.user });
          dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: token });
        } else {
          removeToken();
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        removeToken();
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const response = await api.post('/auth/login', { email, password });

      if (response.data.success) {
        const { user, token } = response.data.data;
        
        setToken(token);
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
        dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: token });
        
        return { success: true, user };
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: response.data.message });
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const response = await api.post('/auth/register', userData);

      if (response.data.success) {
        const { user, token } = response.data.data;
        
        setToken(token);
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
        dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: token });
        
        return { success: true, user };
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: response.data.message });
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      removeToken();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Update user profile
  const updateUser = (userData) => {
    dispatch({ type: AUTH_ACTIONS.SET_USER, payload: { ...state.user, ...userData } });
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Refresh token
  const refreshToken = async () => {
    try {
      const response = await api.post('/auth/refresh-token');
      
      if (response.data.success) {
        const { token } = response.data.data;
        setToken(token);
        dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: token });
        return token;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
    }
  };

  const value = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
    updateUser,
    clearError,
    refreshToken,
    isAuthenticated: !!state.user,
    isAdmin: state.user?.role === 'admin',
    isModerator: state.user?.role === 'moderator' || state.user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
