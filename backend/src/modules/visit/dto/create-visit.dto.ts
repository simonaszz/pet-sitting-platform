import {
  IsString,
  IsDateString,
  IsOptional,
  IsNumber,
  Min,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';

export class CreateVisitDto {
  @IsString()
  sitterProfileId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  petIds: string[];

  @IsString()
  address: string;

  @IsDateString()
  date: string;

  @IsString()
  timeStart: string; // "09:00"

  @IsString()
  timeEnd: string; // "17:00"

  @IsNumber()
  @Min(0)
  totalPrice: number;

  @IsString()
  @IsOptional()
  notesForSitter?: string;
}
