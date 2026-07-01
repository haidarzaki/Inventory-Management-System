import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class CreateConsumableAssetDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  category: string;

  @IsString()
  @MinLength(1)
  unit: string;

  @IsInt()
  @Min(0)
  quantity: number;

  @IsInt()
  @Min(0)
  minStock: number;

  @IsString()
  @MinLength(1)
  location: string;

  @IsString()
  @MinLength(1)
  site: string;
}
