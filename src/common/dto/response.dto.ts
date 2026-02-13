export class ApiResponseDto<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  timestamp: string;
  path: string;

  constructor(success: boolean, message: string, data?: T, errors?: string[], path?: string) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.errors = errors;
    this.timestamp = new Date().toISOString();
    this.path = path || '';
  }
}

// auth/interfaces/jwt-user.interface.ts
export interface JwtUser {
  _id: string;
  email: string;
  role: string;
}
