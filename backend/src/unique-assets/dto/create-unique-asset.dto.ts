import { IsString, MinLength } from 'class-validator';

export class CreateUniqueAssetDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  category: string;

  @IsString()
  @MinLength(1)
  serialNumber: string;

  @IsString()
  @MinLength(1)
  location: string;

  @IsString()
  @MinLength(1)
  site: string;
}
