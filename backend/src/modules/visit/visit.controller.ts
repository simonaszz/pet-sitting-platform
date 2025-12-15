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

@Controller('visits')
@UseGuards(JwtAuthGuard)
export class VisitController {
  constructor(private readonly visitService: VisitService) {}

  // POST /visits - Sukurti rezervaciją (owner)
  @Post()
  create(@CurrentUser() user: any, @Body() createDto: CreateVisitDto) {
    return this.visitService.create(user.id, createDto);
  }

  // GET /visits/my-bookings - Mano rezervacijos kaip owner
  @Get('my-bookings')
  findMyBookings(@CurrentUser() user: any) {
    return this.visitService.findMyVisitsAsOwner(user.id);
  }

  // GET /visits/my-jobs - Mano rezervacijos kaip sitter
  @Get('my-jobs')
  findMyJobs(@CurrentUser() user: any) {
    return this.visitService.findMyVisitsAsSitter(user.id);
  }

  // PATCH /visits/:id/status - Atnaujinti statusą (sitter)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('status') status: string,
  ) {
    return this.visitService.updateStatus(id, user.id, status);
  }

  // PATCH /visits/:id/cancel - Atšaukti (owner)
  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.visitService.cancel(id, user.id);
  }
}
