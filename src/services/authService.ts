import { apiClient } from '../lib/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    id: number;
    email: string;
    full_name: string;
    role: string;
    tenant_id: number;
    campus_id: number;
  };
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface User {
  id: number;
  tenant_id: number;
  email: string;
  full_name: string;
  role: string;
  campus_id: number;
  created_at: string;
  last_login_at: string;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse | null> {
    console.log('🔐 [AUTH_SERVICE] login() called with:', { email: credentials.email, password: '***' });

    console.log('📡 [AUTH_SERVICE] Calling apiClient.post(/auth/login)...');
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    console.log('📨 [AUTH_SERVICE] apiClient.post() response:', response);

    if (response) {
      console.log('💾 [AUTH_SERVICE] Storing tokens in localStorage...');
      // Store tokens
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      console.log('✅ [AUTH_SERVICE] Tokens stored successfully');

      console.log('🎯 [AUTH_SERVICE] Returning login response data');
      return response;
    }

    console.error('❌ [AUTH_SERVICE] No response data, throwing error');
    throw new Error('Login failed');
  },

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse | null> {
    const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    if (response) {
      // Update tokens
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      return response;
    }
    throw new Error('Token refresh failed');
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed, but continuing with local logout:', error);
    }
    // Clear tokens regardless of response
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  async getCurrentUser(): Promise<User | null> {
    const response = await apiClient.get<{ user: User }>('/auth/me');
    if (response && response.user) {
      return response.user;
    }
    throw new Error('Failed to get user info');
  },

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  },

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  },

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },
};