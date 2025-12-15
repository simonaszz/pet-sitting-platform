import { Module } from '@nestjs/common';
import { PetService } from './pet.service';
import { PetController } from './pet.controller';

@Module({
  controllers: [PetController],
  providers: [PetService],
  exports: [PetService],
})
export class PetModule {}
