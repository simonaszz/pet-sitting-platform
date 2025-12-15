import { IsString, IsInt, IsOptional, IsEnum, Min, MinLength } from 'class-validator';

export enum PetType {
  DOG = 'DOG',
  CAT = 'CAT',
  BIRD = 'BIRD',
  RABBIT = 'RABBIT',
  OTHER = 'OTHER',
}

export class CreatePetDto {
  @IsString()
  @MinLength(2, { message: 'Augintinio vardas turi būti bent 2 simbolių' })
  name: string;

  @IsEnum(PetType, { message: 'Neteisingas augintinio tipas' })
  type: PetType; // DOG, CAT, BIRD, RABBIT, OTHER

  @IsString()
  @IsOptional()
  breed?: string; // 'Vokiečių aviganis', 'Persiška', etc.

  @IsInt({ message: 'Amžius turi būti sveikas skaičius' })
  @IsOptional()
  @Min(0, { message: 'Amžius negali būti neigiamas' })
  age?: number;

  @IsString()
  @IsOptional()
  photo?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  medicalNotes?: string;
}
