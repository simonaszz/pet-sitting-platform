import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';

@Injectable()
export class PetService {
  constructor(private prisma: PrismaService) {}

  // Sukurti naują augintinį
  async create(userId: string, dto: CreatePetDto) {
    return this.prisma.pet.create({
      data: {
        ...dto,
        ownerId: userId,
      },
    });
  }

  // Gauti visus vartotojo augintinius
  async findAllByUser(userId: string) {
    return this.prisma.pet.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Gauti vieną augintinį pagal ID
  async findOne(id: string, userId: string) {
    const pet = await this.prisma.pet.findUnique({
      where: { id },
    });

    if (!pet) {
      throw new NotFoundException('Augintinys nerastas');
    }

    // Patikrinti ar vartotojas yra savininkas
    if (pet.ownerId !== userId) {
      throw new ForbiddenException('Neturite teisės peržiūrėti šio augintinio');
    }

    return pet;
  }

  // Atnaujinti augintinį
  async update(id: string, userId: string, dto: UpdatePetDto) {
    // Pirmiausia patikrinti ar egzistuoja ir ar vartotojas yra savininkas
    await this.findOne(id, userId);

    return this.prisma.pet.update({
      where: { id },
      data: dto,
    });
  }

  // Ištrinti augintinį
  async remove(id: string, userId: string) {
    // Pirmiausia patikrinti ar egzistuoja ir ar vartotojas yra savininkas
    await this.findOne(id, userId);

    return this.prisma.pet.delete({
      where: { id },
    });
  }
}
