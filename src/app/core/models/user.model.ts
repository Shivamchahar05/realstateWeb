export type UserRole = 'BUYER' | 'SELLER' | string;

export interface User {
  id: string;
  email: string;
  phone: string | null;
  fullName: string;
  role: UserRole;
  status: string;
  avatarUrl: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  phone?: string;
  fullName: string;
  password: string;
  role: 'BUYER' | 'SELLER';
}
