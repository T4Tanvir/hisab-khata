import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: window.location.origin, // Since Vite proxies /api to backend
});

export const { signIn, signUp, signOut, useSession } = authClient;

