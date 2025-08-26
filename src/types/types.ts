// utils/types.ts
import { UserType } from '@prisma/client';
export type ExpiresIn = string | number;
export interface TokenPayload {
  id: string;
  role: UserType;
}
