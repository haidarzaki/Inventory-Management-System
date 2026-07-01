import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUniqueAssetDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  category?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  serialNumber?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  location?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  site?: string;

  @IsOptional()
  @IsIn(['available', 'borrowed', 'retired'])
  status?: 'available' | 'borrowed' | 'retired';
}
