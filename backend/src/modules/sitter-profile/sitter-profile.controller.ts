import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { SitterProfileService } from './sitter-profile.service';
import { CreateSitterProfileDto } from './dto/create-sitter-profile.dto';
import { UpdateSitterProfileDto } from './dto/update-sitter-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../../common/types/current-user.type';

@Controller('sitter-profiles')
export class SitterProfileController {
  constructor(private readonly sitterProfileService: SitterProfileService) {}

  // POST /sitter-profiles - Sukurti savo profilį (protected)
  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: CurrentUserType,
    @Body() createDto: CreateSitterProfileDto,
  ) {
    return this.sitterProfileService.create(user.id, createDto);
  }

  // GET /sitter-profiles - Gauti visus sitters (public)
  @Get()
  findAll(
    @Query('city') city?: string,
    @Query('minRate') minRate?: string,
    @Query('maxRate') maxRate?: string,
    @Query('minRating') minRating?: string,
  ) {
    const filters = {
      city,
      minRate: minRate ? parseFloat(minRate) : undefined,
      maxRate: maxRate ? parseFloat(maxRate) : undefined,
      minRating: minRating ? parseFloat(minRating) : undefined,
    };
    return this.sitterProfileService.findAll(filters);
  }

  // GET /sitter-profiles/me - Gauti savo profilį (protected)
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyProfile(@CurrentUser() user: CurrentUserType) {
    return this.sitterProfileService.getMyProfile(user.id);
  }

  // GET /sitter-profiles/:id - Gauti bet kurio sitter profilį (public)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sitterProfileService.getById(id);
  }

  // PATCH /sitter-profiles/me - Atnaujinti savo profilį (protected)
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() user: CurrentUserType,
    @Body() updateDto: UpdateSitterProfileDto,
  ) {
    return this.sitterProfileService.update(user.id, updateDto);
  }

  // DELETE /sitter-profiles/me - Ištrinti savo profilį (protected)
  @Delete('me')
  @UseGuards(JwtAuthGuard)
  remove(@CurrentUser() user: CurrentUserType) {
    return this.sitterProfileService.delete(user.id);
  }
}
