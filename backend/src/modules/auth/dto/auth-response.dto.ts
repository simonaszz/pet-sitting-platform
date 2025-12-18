export class AuthResponseDto {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    phone?: string | null;
    address?: string | null;
    avatar?: string | null;
  };

  accessToken: string;
  refreshToken: string;
}
