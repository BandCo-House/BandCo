export type JwtPayload = {
  email: string;
  id: string;
  type: 'access' | 'refresh';
};
