import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;

  // Self-register hanya boleh jadi "user". Admin dibuat lewat seed atau endpoint /users (oleh admin lain).
  @IsOptional()
  @IsIn(['user'])
  role?: 'user';
}
