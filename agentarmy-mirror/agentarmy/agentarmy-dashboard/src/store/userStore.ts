/**
 * User Store - Zustand store for authentication and user profile management.
 * Handles JWT token persistence, login/logout flows, and profile data.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'user' | 'admin' | 'strategist';
  createdAt: string;
}

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';

interface UserDataState {
  user: UserProfile | null;
  token: string | null;
  status: AuthStatus;
  error: string | null;
}

interface UserActions {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  checkAuth: () => void; // To be called on app initialization
  isAuthenticated: () => boolean;
}

export type UserState = UserDataState & UserActions;

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: UserDataState = {
  user: null,
  token: null,
  status: 'idle',
  error: null,
};

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...initialState,

      isAuthenticated: () => {
        const { token, user } = get();
        return !!token && !!user;
      },

      login: async (email, password) => {
        set({ status: 'loading', error: null });
        try {
          // This would be a real API call
          const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
          const response = await fetch(`${backendUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: email, password }), // Assuming backend uses 'username'
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Login failed');
          }

          const { token, user } = await response.json();

          set({ token, user, status: 'authenticated', error: null });
          return true;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
          set({ status: 'error', error: errorMessage, token: null, user: null });
          return false;
        }
      },

      logout: () => {
        // This will clear the persisted state as well
        set(initialState);
        // Explicitly set status to unauthenticated for immediate UI updates
        set({ status: 'unauthenticated' });
      },

      fetchProfile: async () => {
        const { token } = get();
        if (!token) {
          set({ status: 'unauthenticated' });
          return;
        }

        set({ status: 'loading' });
        try {
          // This would be a real API call to a /profile or /me endpoint
          const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
          const response = await fetch(`${backendUrl}/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch profile. Your session may have expired.');
          }

          const user: UserProfile = await response.json();
          set({ user, status: 'authenticated', error: null });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
          set({ status: 'error', error: errorMessage });
          // If profile fetch fails, the token is likely invalid, so log out.
          get().logout();
        }
      },
      
      updateProfile: async (data) => {
         const { token, user } = get();
         if (!token || !user) return;

         try {
            // API call to PATCH /profile
            const updatedUser = { ...user, ...data };
            set({ user: updatedUser });
         } catch (error) {
            console.error("Failed to update profile", error);
         }
      },

      checkAuth: () => {
        const { token } = get();
        if (token) {
          // If a token exists from persistence, validate it by fetching the profile
          get().fetchProfile();
        } else {
          set({ status: 'unauthenticated' });
        }
      },
    }),
    {
      name: 'agentarmy-user-auth',
      // Only persist the token, not the full user object or status
      partialize: (state) => ({ token: state.token }),
    }
  )
);

export default useUserStore;