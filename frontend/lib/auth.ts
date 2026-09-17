export interface User {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'STAFF';
}

export interface Business {
  id: string;
  name: string;
}

export const getAccessToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

export const getRefreshToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

export const setTokens = (accessToken: string, refreshToken: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

export const clearAuth = () => {
  if (typeof window === 'undefined') return;
  localStorage.clear();
};

export const setUser = (user: User) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
};

export const setBusiness = (business: Business) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('business', JSON.stringify(business));
};

export const getBusiness = (): Business | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('business');
  return raw ? JSON.parse(raw) : null;
};

export const isAuthenticated = () => !!getAccessToken();

export const hasRole = (...roles: string[]) => {
  const user = getUser();
  return user ? roles.includes(user.role) : false;
};

export const isOwner = () => hasRole('OWNER');
export const isAdmin = () => hasRole('OWNER', 'ADMIN');