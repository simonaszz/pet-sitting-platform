import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { VisitService } from './visit.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../../common/types/current-user.type';
import { VisitStatus } from '@prisma/client';

@Controller('visits')
@UseGuards(JwtAuthGuard)
export class VisitController {
  constructor(private readonly visitService: VisitService) {}

  // POST /visits - Sukurti rezervaciją (owner)
  @Post()
  create(
    @CurrentUser() user: CurrentUserType,
    @Body() createDto: CreateVisitDto,
  ) {
    return this.visitService.create(user.id, createDto);
  }

  // GET /visits/my-bookings - Mano rezervacijos kaip owner
  @Get('my-bookings')
  findMyBookings(@CurrentUser() user: CurrentUserType) {
    return this.visitService.findMyVisitsAsOwner(user.id);
  }

  // GET /visits/my-jobs - Mano rezervacijos kaip sitter
  @Get('my-jobs')
  findMyJobs(@CurrentUser() user: CurrentUserType) {
    return this.visitService.findMyVisitsAsSitter(user.id);
  }

  // PATCH /visits/:id/status - Atnaujinti statusą (sitter)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
    @Body('status') status: VisitStatus,
  ) {
    return this.visitService.updateStatus(id, user.id, status);
  }

  // PATCH /visits/:id/cancel - Atšaukti (owner)
  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.visitService.cancel(id, user.id);
  }
}
