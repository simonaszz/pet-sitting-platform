import { IsString, IsNumber, IsOptional, Min, MinLength, IsArray, IsInt } from 'class-validator';

export class UpdateSitterProfileDto {
  @IsString()
  @MinLength(10, { message: 'Aprašymas turi būti bent 10 simbolių' })
  @IsOptional()
  bio?: string;

  @IsString()
  @MinLength(2, { message: 'Miestas turi būti bent 2 simbolių' })
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  @Min(0, { message: 'Kaina negali būti neigiama' })
  @IsOptional()
  hourlyRate?: number;

  @IsArray()
  @IsOptional()
  services?: string[];

  @IsArray()
  @IsOptional()
  photos?: string[];

  @IsOptional()
  availability?: any;

  @IsInt()
  @IsOptional()
  @Min(1)
  maxPets?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  experienceYears?: number;
}
