// src/types/auth.types.ts
import type { User } from './database.types'

export interface AuthState {
  user: User | null
  session: any | null
  loading: boolean
  initialized: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  user: User | null
  error: string | null
}