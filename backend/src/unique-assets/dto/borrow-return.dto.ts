import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class BorrowAssetDto {
  @IsOptional()
  @IsString()
  note?: string;

  // Jumlah hari sampai jatuh tempo pengembalian, default 14 hari (sama seperti frontend awal)
  @IsOptional()
  @IsInt()
  @Min(1)
  durationDays?: number;
}

export class ReturnAssetDto {
  @IsOptional()
  @IsString()
  note?: string;
}
