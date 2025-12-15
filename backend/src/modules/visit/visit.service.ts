import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateVisitDto } from './dto/create-visit.dto';

@Injectable()
export class VisitService {
  constructor(private prisma: PrismaService) {}

  // Sukurti rezervaciją (owner creates visit)
  async create(ownerId: string, dto: CreateVisitDto) {
    // Patikrinti ar pet priklauso owner'iui
    const pet = await this.prisma.pet.findUnique({
      where: { id: dto.petId },
    });

    if (!pet || pet.ownerId !== ownerId) {
      throw new ForbiddenException('Šis augintinys jums nepriklauso');
    }

    // Patikrinti ar sitter profile egzistuoja ir gauti userId
    const sitterProfile = await this.prisma.sitterProfile.findUnique({
      where: { id: dto.sitterProfileId },
      include: {
        user: true,
      },
    });

    if (!sitterProfile) {
      throw new NotFoundException('Priežiūrėtojo profilis nerastas');
    }

    // Sukurti visit
    return this.prisma.visit.create({
      data: {
        ownerId,
        sitterId: dto.sitterProfileId,
        sitterUserId: sitterProfile.userId,
        petId: dto.petId,
        address: dto.address,
        date: new Date(dto.date),
        timeStart: dto.timeStart,
        timeEnd: dto.timeEnd,
        totalPrice: dto.totalPrice,
        notesForSitter: dto.notesForSitter,
        status: 'PENDING',
      },
      include: {
        pet: true,
        sitter: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });
  }

  // Gauti visas mano rezervacijas (kaip owner)
  async findMyVisitsAsOwner(ownerId: string) {
    return this.prisma.visit.findMany({
      where: { ownerId },
      include: {
        pet: true,
        sitter: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  // Gauti rezervacijas kaip sitter
  async findMyVisitsAsSitter(userId: string) {
    return this.prisma.visit.findMany({
      where: { sitterUserId: userId },
      include: {
        pet: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  // Atnaujinti rezervacijos statusą (tik sitter gali)
  async updateStatus(visitId: string, userId: string, status: string) {
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
    });

    if (!visit) {
      throw new NotFoundException('Rezervacija nerasta');
    }

    if (visit.sitterUserId !== userId) {
      throw new ForbiddenException('Neturite teisės keisti šios rezervacijos');
    }

    return this.prisma.visit.update({
      where: { id: visitId },
      data: { status },
      include: {
        pet: true,
        owner: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });
  }

  // Cancel visit (owner)
  async cancel(visitId: string, ownerId: string) {
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
    });

    if (!visit) {
      throw new NotFoundException('Rezervacija nerasta');
    }

    if (visit.ownerId !== ownerId) {
      throw new ForbiddenException('Neturite teisės atšaukti šios rezervacijos');
    }

    return this.prisma.visit.update({
      where: { id: visitId },
      data: { 
        status: 'CANCELED',
        canceledBy: ownerId,
      },
    });
  }
}
