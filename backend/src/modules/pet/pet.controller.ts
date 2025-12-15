import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PetService } from './pet.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('pets')
@UseGuards(JwtAuthGuard)
export class PetController {
  constructor(private readonly petService: PetService) {}

  // POST /pets - Sukurti naują augintinį
  @Post()
  create(@CurrentUser() user: any, @Body() createPetDto: CreatePetDto) {
    return this.petService.create(user.id, createPetDto);
  }

  // GET /pets - Gauti visus vartotojo augintinius
  @Get()
  findAll(@CurrentUser() user: any) {
    return this.petService.findAllByUser(user.id);
  }

  // GET /pets/:id - Gauti vieną augintinį
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.petService.findOne(id, user.id);
  }

  // PATCH /pets/:id - Atnaujinti augintinį
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updatePetDto: UpdatePetDto,
  ) {
    return this.petService.update(id, user.id, updatePetDto);
  }

  // DELETE /pets/:id - Ištrinti augintinį
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.petService.remove(id, user.id);
  }
}
