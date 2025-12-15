import { Module } from '@nestjs/common';
import { SitterProfileService } from './sitter-profile.service';
import { SitterProfileController } from './sitter-profile.controller';

@Module({
  controllers: [SitterProfileController],
  providers: [SitterProfileService],
  exports: [SitterProfileService],
})
export class SitterProfileModule {}
