import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  MinLength,
  IsArray,
  IsInt,
  ValidateIf,
} from 'class-validator';
import type { Prisma } from '@prisma/client';

export class UpdateSitterProfileDto {
  @IsString()
  @ValidateIf(
    (o: UpdateSitterProfileDto) => o.bio !== undefined && o.bio.trim() !== '',
  )
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
  availability?: Prisma.InputJsonValue;

  @IsInt()
  @IsOptional()
  @Min(1)
  maxPets?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  experienceYears?: number;
}
