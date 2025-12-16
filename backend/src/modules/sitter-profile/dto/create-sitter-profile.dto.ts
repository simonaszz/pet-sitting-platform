import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  MinLength,
  IsArray,
  IsInt,
} from 'class-validator';
import type { Prisma } from '@prisma/client';

export class CreateSitterProfileDto {
  @IsString()
  @MinLength(10, { message: 'Aprašymas turi būti bent 10 simbolių' })
  @IsOptional()
  bio?: string;

  @IsString()
  @MinLength(2, { message: 'Miestas turi būti bent 2 simbolių' })
  city: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  @Min(0, { message: 'Kaina negali būti neigiama' })
  hourlyRate: number;

  @IsArray()
  @IsOptional()
  services?: string[]; // ['DOG_WALKING', 'PET_SITTING', 'HOME_VISITS']

  @IsArray()
  @IsOptional()
  photos?: string[]; // array of URLs

  @IsOptional()
  availability?: Prisma.InputJsonValue; // JSON object

  @IsInt()
  @IsOptional()
  @Min(1)
  maxPets?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  experienceYears?: number;
}
