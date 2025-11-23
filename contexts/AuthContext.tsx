"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api';

interface User {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  emailVerified?: boolean;
  mobileVerified?: boolean;
  mobileNumber?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrUsername: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  setPassword: (email: string, otp: string, password: string, confirmPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyEmailOTP: (email: string, otp: string, mobileNumber?: string) => Promise<boolean>;
  verifyMobileOTP: (mobile: string, otp: string) => Promise<boolean>;
  sendEmailOTP: (email: string) => Promise<void>;
  sendMobileOTP: (mobile: string) => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  updateUser: (user: User) => void;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  password: string;
  confirmPassword: string;
  emailVerified: boolean;
  mobileVerified: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved auth data on mount
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const savedAccessToken = localStorage.getItem('wedesign_access_token');
        const savedRefreshToken = localStorage.getItem('wedesign_refresh_token');
        const savedUser = localStorage.getItem('wedesign_user');
        
        if (savedAccessToken && savedRefreshToken && savedUser) {
          setToken(savedAccessToken);
          setRefreshToken(savedRefreshToken);
          setUser(JSON.parse(savedUser));
          
          // Verify token is still valid by fetching user profile
          try {
            const response = await apiClient.getUserProfile();
            if (response.data) {
              // Update user data
              const updatedUser = transformUserData(response.data);
              setUser(updatedUser);
              localStorage.setItem('wedesign_user', JSON.stringify(updatedUser));
            } else {
              // Token invalid, try to refresh
              const refreshResponse = await apiClient.refreshToken(savedRefreshToken);
              if (refreshResponse.data) {
                setToken(refreshResponse.data.access);
                setRefreshToken(refreshResponse.data.refresh);
                localStorage.setItem('wedesign_access_token', refreshResponse.data.access);
                localStorage.setItem('wedesign_refresh_token', refreshResponse.data.refresh);
              } else {
                clearAuthData();
              }
            }
          } catch (error) {
            // Token invalid, clear auth data
            clearAuthData();
          }
        }
      } catch (e) {
        console.error('Failed to load auth data', e);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthData();
  }, []);

  // Proactive token refresh - refresh token before it expires
  useEffect(() => {
    const isRefreshingRef = { current: false }; // Prevent concurrent refresh attempts
    let interval: NodeJS.Timeout | null = null;

    const checkAndRefreshToken = async () => {
      // Prevent concurrent refresh attempts
      if (isRefreshingRef.current) {
        return;
      }

      try {
        // Get fresh tokens from localStorage (don't rely on closure)
        const currentToken = localStorage.getItem('wedesign_access_token');
        const currentRefreshToken = localStorage.getItem('wedesign_refresh_token');

        if (!currentToken || !currentRefreshToken) {
          // Clear interval if tokens are missing
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
          return;
        }

        // Decode JWT to check expiration
        const tokenParts = currentToken.split('.');
        if (tokenParts.length === 3) {
          try {
            const payload = JSON.parse(atob(tokenParts[1]));
            const expirationTime = payload.exp * 1000; // Convert to milliseconds
            const currentTime = Date.now();
            const timeUntilExpiry = expirationTime - currentTime;
            
            // Log token lifetime information
            const minutesRemaining = Math.floor(timeUntilExpiry / (60 * 1000));
            const secondsRemaining = Math.floor((timeUntilExpiry % (60 * 1000)) / 1000);
            const expirationDate = new Date(expirationTime);
            const issuedAt = payload.iat ? new Date(payload.iat * 1000) : null;
            const tokenAgeMinutes = payload.iat ? Math.floor((currentTime - (payload.iat * 1000)) / (60 * 1000)) : null;
            
            console.log('[WebApp TokenRefresh] 🔑 Access Token Status:', {
              'Expires At': expirationDate.toLocaleString(),
              'Time Remaining': `${minutesRemaining}m ${secondsRemaining}s`,
              'Will Refresh Soon': timeUntilExpiry < 5 * 60 * 1000 ? '✅ Yes (within 5 min)' : '❌ No',
              'Token Age': tokenAgeMinutes !== null ? `${tokenAgeMinutes} minutes` : 'Unknown',
              'Issued At': issuedAt ? issuedAt.toLocaleString() : 'Unknown'
            });
            
            // If token expires in less than 5 minutes, refresh it proactively
            if (timeUntilExpiry > 0 && timeUntilExpiry < 5 * 60 * 1000) {
              console.log('[WebApp TokenRefresh] ⚠️ Token expiring soon, refreshing...');
              isRefreshingRef.current = true;
              
              try {
                const refreshResponse = await apiClient.refreshToken(currentRefreshToken);
                if (refreshResponse.data) {
                  setToken(refreshResponse.data.access);
                  setRefreshToken(refreshResponse.data.refresh);
                  localStorage.setItem('wedesign_access_token', refreshResponse.data.access);
                  localStorage.setItem('wedesign_refresh_token', refreshResponse.data.refresh);
                  console.log('[WebApp TokenRefresh] ✅ Token refreshed successfully');
                }
              } catch (error) {
                // Don't log errors - let normal flow handle it
              } finally {
                isRefreshingRef.current = false;
              }
            }
          } catch (parseError) {
            // If we can't parse the token, it might be malformed
            // Don't do anything, let the normal 401 handling deal with it
          }
        }
      } catch (error) {
        // Don't log errors - let normal flow handle it
      }
    };

    // Check every 2 minutes
    interval = setInterval(checkAndRefreshToken, 2 * 60 * 1000);
    
    // Initial check after 1 second
    const initialTimeout = setTimeout(checkAndRefreshToken, 1000);
    
    return () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      clearTimeout(initialTimeout);
    };
  }, []); // Empty dependency array - only run once on mount

  const clearAuthData = () => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('wedesign_access_token');
    localStorage.removeItem('wedesign_refresh_token');
    localStorage.removeItem('wedesign_user');
  };

  const transformUserData = (apiUser: any): User => {
    return {
      id: apiUser.id,
      email: apiUser.email,
      username: apiUser.username,
      firstName: apiUser.first_name,
      lastName: apiUser.last_name,
      isActive: apiUser.is_active,
      emailVerified: apiUser.emails?.some((e: any) => e.is_verified && e.is_primary) || false,
      mobileVerified: apiUser.mobile_numbers?.some((m: any) => m.is_verified && m.is_primary) || false,
      mobileNumber: apiUser.mobile_numbers?.find((m: any) => m.is_primary)?.mobile_number || '',
    };
  };

  const login = async (emailOrUsername: string, password: string, rememberMe: boolean = false) => {
    try {
      const response = await apiClient.login(emailOrUsername, password, rememberMe);
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.data) {
        throw new Error('Login failed - no data received');
      }

      const { user: apiUser, tokens } = response.data;
      
      const transformedUser = transformUserData(apiUser);
      
      setUser(transformedUser);
      setToken(tokens.access);
      setRefreshToken(tokens.refresh);
      
      localStorage.setItem('wedesign_access_token', tokens.access);
      localStorage.setItem('wedesign_refresh_token', tokens.refresh);
      localStorage.setItem('wedesign_user', JSON.stringify(transformedUser));
    } catch (error: any) {
      console.error('Login error in AuthContext:', error);
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      // Signup with email, mobile number, and password (no verification required)
      const signupResponse = await apiClient.signup({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        mobile_number: data.mobileNumber,
        password: data.password,
        confirm_password: data.confirmPassword,
      });

      if (signupResponse.error) {
        throw new Error(signupResponse.error);
      }

      if (!signupResponse.data) {
        throw new Error('Registration failed - no data received');
      }

      const { user: apiUser, tokens } = signupResponse.data;
      
      // Save tokens and user
      setToken(tokens.access);
      setRefreshToken(tokens.refresh);
      localStorage.setItem('wedesign_access_token', tokens.access);
      localStorage.setItem('wedesign_refresh_token', tokens.refresh);

      // Transform and save user data
      const transformedUser = transformUserData(apiUser);
      setUser(transformedUser);
      localStorage.setItem('wedesign_user', JSON.stringify(transformedUser));
    } catch (error: any) {
      console.error('Registration error in AuthContext:', error);
      throw error;
    }
  };

  const logout = async () => {
    const savedRefreshToken = localStorage.getItem('wedesign_refresh_token');
    
    if (savedRefreshToken) {
      try {
        await apiClient.logout(savedRefreshToken);
      } catch (error) {
        console.error('Logout error:', error);
        // Continue with local logout anyway
      }
    }
    
    clearAuthData();
  };

  const setPassword = async (email: string, otp: string, password: string, confirmPassword: string) => {
    const response = await apiClient.confirmPasswordReset({
      email,
      otp,
      new_password: password,
      confirm_password: confirmPassword,
    });

    if (response.error) {
      throw new Error(response.error);
    }
  };

  const resetPassword = async (email: string) => {
    const response = await apiClient.requestPasswordReset(email);

    if (response.error) {
      throw new Error(response.error);
    }
  };

  const sendEmailOTP = async (email: string) => {
    // During registration, OTP is sent automatically after signup
    // For resending, use resend-otp endpoint
    const response = await apiClient.resendOTP({
      email,
      otp_for: 'email_verification',
    });

    if (response.error) {
      throw new Error(response.error);
    }
  };

  const sendMobileOTP = async (mobile: string) => {
    // First, add mobile number if not already added
    try {
      await apiClient.addMobileNumber({ mobile_number: mobile });
    } catch (error: any) {
      // If mobile already exists, that's okay - just resend OTP
      if (!error.message?.includes('already exists')) {
        throw error;
      }
    }

    // Resend OTP for mobile verification
    const response = await apiClient.resendOTP({
      mobile_number: mobile,
      otp_for: 'mobile_verification',
    });

    if (response.error) {
      throw new Error(response.error);
    }
  };

  const verifyEmailOTP = async (email: string, otp: string, mobileNumber?: string): Promise<boolean> => {
    const response = await apiClient.verifyEmail(email, otp);

    if (response.error) {
      return false;
    }

    if (response.data?.user) {
      // Update user data after email verification
      const updatedUser = transformUserData(response.data.user);
      setUser(updatedUser);
      localStorage.setItem('wedesign_user', JSON.stringify(updatedUser));

      // Now that user is active, add mobile number if provided
      if (mobileNumber) {
        const mobileResponse = await apiClient.addMobileNumber({ mobile_number: mobileNumber });
        if (mobileResponse.error) {
          // If mobile already exists, that's okay - just log it
          if (mobileResponse.error.includes('already exists') || 
              mobileResponse.errorDetails?.fieldErrors?.mobile_number?.some((msg: string) => msg.includes('already exists'))) {
            // Mobile number already exists, continue
          } else {
            console.error('Failed to add mobile number after email verification:', mobileResponse.error);
            // Continue anyway - mobile can be added later
          }
        }
      }
    }

    return !!response.data;
  };

  const verifyMobileOTP = async (mobile: string, otp: string): Promise<boolean> => {
    const response = await apiClient.verifyMobileNumber({
      mobile_number: mobile,
      otp: otp,
    });

    if (response.error) {
      return false;
    }

    // Refresh user profile to get updated mobile verification status
    try {
      const profileResponse = await apiClient.getUserProfile();
      if (profileResponse.data) {
        const updatedUser = transformUserData(profileResponse.data);
        setUser(updatedUser);
        localStorage.setItem('wedesign_user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }

    return !!response.data;
  };

  const refreshAccessToken = async () => {
    const savedRefreshToken = localStorage.getItem('wedesign_refresh_token');
    
    if (!savedRefreshToken) {
      clearAuthData();
      return;
    }

    const response = await apiClient.refreshToken(savedRefreshToken);

    if (response.error || !response.data) {
      clearAuthData();
      throw new Error('Failed to refresh token');
    }

    setToken(response.data.access);
    setRefreshToken(response.data.refresh);
    localStorage.setItem('wedesign_access_token', response.data.access);
    localStorage.setItem('wedesign_refresh_token', response.data.refresh);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('wedesign_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
        setPassword,
        resetPassword,
        verifyEmailOTP,
        verifyMobileOTP,
        sendEmailOTP,
        sendMobileOTP,
        refreshAccessToken,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
