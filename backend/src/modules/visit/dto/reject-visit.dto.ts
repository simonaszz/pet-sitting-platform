import { IsString, MinLength } from 'class-validator';

export class RejectVisitDto {
  @IsString()
  @MinLength(3)
  rejectionReason: string;
}
