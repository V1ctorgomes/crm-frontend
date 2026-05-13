export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  profilePictureUrl?: string;
  /** false = registo público pendente de aprovação por admin */
  approved?: boolean;
}

export interface PasswordResetRequestRow {
  id: string;
  userId: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    approved: boolean;
  };
}
