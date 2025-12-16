import {
  IsString,
  IsDateString,
  IsOptional,
  IsNumber,
  Min,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';

export class UpdateRejectedVisitDto {
  @IsString()
  @IsOptional()
  address?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  timeStart?: string;

  @IsString()
  @IsOptional()
  timeEnd?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  totalPrice?: number;

  @IsString()
  @IsOptional()
  notesForSitter?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsOptional()
  petIds?: string[];
}
