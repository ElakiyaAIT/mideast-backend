import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleSignInDto {
  @IsNotEmpty()
  @IsString()
  idToken: string;
}
