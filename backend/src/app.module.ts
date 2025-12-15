import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { PetModule } from './modules/pet/pet.module';
import { SitterProfileModule } from './modules/sitter-profile/sitter-profile.module';
import { VisitModule } from './modules/visit/visit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Docker Compose automatically loads .env from root
    }),
    DatabaseModule,
    AuthModule,
    PetModule,
    SitterProfileModule,
    VisitModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
