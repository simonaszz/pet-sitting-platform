export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string | null;
  address: string | null;
  avatar: string | null;
  isEmailVerified: boolean;
  createdAt: Date;
};
