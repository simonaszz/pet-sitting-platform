import { IsString, IsInt, IsOptional, IsEnum, Min, MinLength } from 'class-validator';
import { PetType } from './create-pet.dto';

export class UpdatePetDto {
  @IsString()
  @MinLength(2, { message: 'Augintinio vardas turi būti bent 2 simbolių' })
  @IsOptional()
  name?: string;

  @IsEnum(PetType, { message: 'Neteisingas augintinio tipas' })
  @IsOptional()
  type?: PetType;

  @IsString()
  @IsOptional()
  breed?: string;

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
