// You already have User interface in AuthContext, 
// but this makes it easier to import elsewhere

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  fullName: string;
  email: string;
  createdAt: string;
  createdBy?: string;
  isActive: boolean;
  firebaseUid?: string;
}