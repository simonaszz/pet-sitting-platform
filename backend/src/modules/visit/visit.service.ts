import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { VisitStatus } from '@prisma/client';
import {
  visitIncludeForOwnerList,
  visitIncludeForSitterList,
  visitIncludeForSitterStatusUpdate,
} from './visit.prisma';

@Injectable()
export class VisitService {
  constructor(private prisma: PrismaService) {}

  // Sukurti rezervaciją (owner creates visit)
  async create(ownerId: string, dto: CreateVisitDto) {
    await this.assertPetOwnedByOwner(ownerId, dto.petId);
    const sitterUserId = await this.getSitterUserIdByProfileId(
      dto.sitterProfileId,
    );

    // Sukurti visit
    return this.prisma.visit.create({
      data: {
        ownerId,
        sitterId: dto.sitterProfileId,
        sitterUserId,
        petId: dto.petId,
        address: dto.address,
        date: new Date(dto.date),
        timeStart: dto.timeStart,
        timeEnd: dto.timeEnd,
        totalPrice: dto.totalPrice,
        notesForSitter: dto.notesForSitter,
        status: 'PENDING',
      },
      include: visitIncludeForOwnerList,
    });
  }

  // Gauti visas mano rezervacijas (kaip owner)
  async findMyVisitsAsOwner(ownerId: string) {
    return this.prisma.visit.findMany({
      where: { ownerId },
      include: visitIncludeForOwnerList,
      orderBy: {
        date: 'desc',
      },
    });
  }

  // Gauti rezervacijas kaip sitter
  async findMyVisitsAsSitter(userId: string) {
    return this.prisma.visit.findMany({
      where: { sitterUserId: userId },
      include: visitIncludeForSitterList,
      orderBy: {
        date: 'desc',
      },
    });
  }

  // Atnaujinti rezervacijos statusą (tik sitter gali)
  async updateStatus(visitId: string, userId: string, status: VisitStatus) {
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
      include: visitIncludeForSitterStatusUpdate,
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
      throw new ForbiddenException(
        'Neturite teisės atšaukti šios rezervacijos',
      );
    }

    return this.prisma.visit.update({
      where: { id: visitId },
      data: {
        status: VisitStatus.CANCELED,
        canceledBy: ownerId,
      },
    });
  }

  private async assertPetOwnedByOwner(ownerId: string, petId: string) {
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
    });

    if (!pet || pet.ownerId !== ownerId) {
      throw new ForbiddenException('Šis augintinys jums nepriklauso');
    }
  }

  private async getSitterUserIdByProfileId(sitterProfileId: string) {
    const sitterProfile = await this.prisma.sitterProfile.findUnique({
      where: { id: sitterProfileId },
      select: { userId: true },
    });

    if (!sitterProfile) {
      throw new NotFoundException('Priežiūrėtojo profilis nerastas');
    }

    return sitterProfile.userId;
  }
}
