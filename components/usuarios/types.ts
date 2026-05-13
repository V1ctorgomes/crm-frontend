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