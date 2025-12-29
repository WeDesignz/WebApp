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
  setPassword: (email: string, otp: string, password: string, confirmPassword: string, phoneNumber?: string) => Promise<void>;
  resetPassword: (email: string, deliveryMethod?: 'email' | 'whatsapp', phoneNumber?: string) => Promise<void>;
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
          // Don't set auth state yet - verify token first to prevent queries from running with invalid tokens
          // Token is already in localStorage, so API calls will work
          
          // Verify token is still valid by fetching user profile
          try {
            const response = await apiClient.getUserProfile();
            if (response.data) {
              // Token is valid, set both token and user
              const updatedUser = transformUserData(response.data);
              setToken(savedAccessToken);
              setRefreshToken(savedRefreshToken);
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
                // Parse and set user from saved data after successful refresh
                setUser(JSON.parse(savedUser));
              } else {
                // Refresh failed, clear everything
                clearAuthData();
              }
            }
          } catch (error: any) {
            // Only clear auth data if it's a 401 (token expired/invalid)
            // For other errors (network, etc.), don't set state - user stays unauthenticated
            if (error?.errorDetails?.statusCode === 401) {
              // Token invalid, clear auth data silently
            clearAuthData();
            }
            // For other errors, don't set token/user state - isAuthenticated stays false
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
            
            // Debug logging disabled to reduce console noise
            // Token status logging can be re-enabled for debugging if needed
            
            // If token expires in less than 5 minutes, refresh it proactively
            if (timeUntilExpiry > 0 && timeUntilExpiry < 5 * 60 * 1000) {
              isRefreshingRef.current = true;
              
              try {
                const refreshResponse = await apiClient.refreshToken(currentRefreshToken);
                if (refreshResponse.data) {
                  setToken(refreshResponse.data.access);
                  setRefreshToken(refreshResponse.data.refresh);
                  localStorage.setItem('wedesign_access_token', refreshResponse.data.access);
                  localStorage.setItem('wedesign_refresh_token', refreshResponse.data.refresh);
                  // Token refresh successful - no need to log
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
        // Create error with proper message
        const error = new Error(response.error);
        // Preserve any additional error details
        if (response.fieldErrors) {
          (error as any).fieldErrors = response.fieldErrors;
        }
        if (response.errorDetails) {
          (error as any).errorDetails = response.errorDetails;
        }
        // Also attach the full response for debugging
        (error as any).response = { error: response.error, data: response.data };
        throw error;
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
      // Re-throw error so it can be handled by the calling component
      // The error should already have a proper message from the API response
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      // Clean mobile number - remove any non-digit characters and ensure it's exactly 10 digits
      const cleanMobileNumber = data.mobileNumber.replace(/\D/g, '').slice(0, 10);
      
      // Signup with email, mobile number, and password (no verification required)
      const signupResponse = await apiClient.signup({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        mobile_number: cleanMobileNumber,
        password: data.password,
        confirm_password: data.confirmPassword,
      });

      if (signupResponse.error) {
        // Create error object with field errors attached
        const error = new Error(signupResponse.error);
        // Attach field errors for form validation display
        if (signupResponse.fieldErrors) {
          (error as any).fieldErrors = signupResponse.fieldErrors;
        }
        // Attach error details for more context
        if (signupResponse.errorDetails) {
          (error as any).errorDetails = signupResponse.errorDetails;
        }
        throw error;
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
      } catch (error: any) {
        // Silently handle logout errors - token might be invalid/expired which is fine
        // We still want to clear local auth data regardless of API response
        // Only log in development for debugging
        if (process.env.NODE_ENV === 'development') {
          console.debug('Logout API call failed (this is usually fine):', error?.message || error);
        }
      }
    }
    
    // Always clear local auth data, even if API call failed
    clearAuthData();
  };

  const setPassword = async (email: string, otp: string, password: string, confirmPassword: string, phoneNumber?: string) => {
    const payload: any = {
      otp,
      new_password: password,
      confirm_password: confirmPassword,
    };
    
    if (phoneNumber) {
      payload.phone_number = phoneNumber;
    } else {
      payload.email = email;
    }
    
    const response = await apiClient.confirmPasswordReset(payload);

    if (response.error) {
      throw new Error(response.error);
    }
  };

  const resetPassword = async (email: string, deliveryMethod: 'email' | 'whatsapp' = 'email', phoneNumber?: string) => {
    const response = await apiClient.requestPasswordReset(email, deliveryMethod, phoneNumber);

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
