import { RoleName } from '@/modules/role';

export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roleId: { _id: string; name: string };
    roleName?: RoleName;
  };
}

export interface QueueStatsDto {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}
