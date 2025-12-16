import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateRejectedVisitDto } from './dto/update-rejected-visit.dto';
import { VisitStatus, type Pet } from '@prisma/client';
import {
  visitIncludeForOwnerList,
  visitIncludeForSitterList,
  visitIncludeForSitterStatusUpdate,
} from './visit.prisma';

@Injectable()
export class VisitService {
  constructor(private prisma: PrismaService) {}

  private mapVisitPets(visit: Record<string, unknown>) {
    const visitPets = visit.visitPets;

    const pets: Pet[] = [];
    if (Array.isArray(visitPets)) {
      for (const vp of visitPets) {
        if (typeof vp !== 'object' || vp === null) continue;
        const pet = (vp as { pet?: unknown }).pet;
        if (typeof pet === 'object' && pet !== null) {
          pets.push(pet as Pet);
        }
      }
    }

    return { ...visit, pets };
  }

  // Sukurti rezervaciją (owner creates visit)
  async create(ownerId: string, dto: CreateVisitDto) {
    await this.assertPetsOwnedByOwner(ownerId, dto.petIds);
    const sitterUserId = await this.getSitterUserIdByProfileId(
      dto.sitterProfileId,
    );

    // Sukurti visit
    const created = await this.prisma.visit.create({
      data: {
        ownerId,
        sitterId: dto.sitterProfileId,
        sitterUserId,
        address: dto.address,
        date: new Date(dto.date),
        timeStart: dto.timeStart,
        timeEnd: dto.timeEnd,
        totalPrice: dto.totalPrice,
        notesForSitter: dto.notesForSitter,
        status: 'PENDING',
        visitPets: {
          create: dto.petIds.map((petId) => ({ petId })),
        },
      },
      include: visitIncludeForOwnerList,
    });

    return this.mapVisitPets(created);
  }

  // Gauti visas mano rezervacijas (kaip owner)
  async findMyVisitsAsOwner(ownerId: string) {
    const visits = await this.prisma.visit.findMany({
      where: { ownerId },
      include: visitIncludeForOwnerList,
      orderBy: {
        date: 'desc',
      },
    });

    return visits.map((visit) => this.mapVisitPets(visit));
  }

  // Gauti rezervacijas kaip sitter
  async findMyVisitsAsSitter(userId: string) {
    const visits = await this.prisma.visit.findMany({
      where: { sitterUserId: userId },
      include: visitIncludeForSitterList,
      orderBy: {
        date: 'desc',
      },
    });

    return visits.map((visit) => this.mapVisitPets(visit));
  }

  // Atnaujinti rezervacijos statusą (tik sitter gali)
  async updateStatus(visitId: string, userId: string, status: VisitStatus) {
    if (status === VisitStatus.REJECTED) {
      throw new BadRequestException(
        'Atmetimui naudokite /visits/:id/reject su priežastimi',
      );
    }

    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
    });

    if (!visit) {
      throw new NotFoundException('Rezervacija nerasta');
    }

    if (visit.sitterUserId !== userId) {
      throw new ForbiddenException('Neturite teisės keisti šios rezervacijos');
    }

    const updated = await this.prisma.visit.update({
      where: { id: visitId },
      data: { status },
      include: visitIncludeForSitterStatusUpdate,
    });

    return this.mapVisitPets(updated);
  }

  async updateRejected(
    visitId: string,
    ownerId: string,
    dto: UpdateRejectedVisitDto,
  ) {
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        visitPets: {
          select: { petId: true },
        },
      },
    });

    if (!visit) {
      throw new NotFoundException('Rezervacija nerasta');
    }

    if (visit.ownerId !== ownerId) {
      throw new ForbiddenException(
        'Neturite teisės redaguoti šios rezervacijos',
      );
    }

    if (visit.status !== VisitStatus.REJECTED) {
      throw new BadRequestException(
        'Redaguoti galima tik atmestas (REJECTED) rezervacijas',
      );
    }

    if (dto.petIds) {
      await this.assertPetsOwnedByOwner(ownerId, dto.petIds);
    }

    const updated = await this.prisma.visit.update({
      where: { id: visitId },
      data: {
        address: dto.address,
        date: dto.date ? new Date(dto.date) : undefined,
        timeStart: dto.timeStart,
        timeEnd: dto.timeEnd,
        totalPrice:
          typeof dto.totalPrice === 'number' ? dto.totalPrice : undefined,
        notesForSitter: dto.notesForSitter,
        visitPets: dto.petIds
          ? {
              deleteMany: {},
              create: dto.petIds.map((petId) => ({ petId })),
            }
          : undefined,
      },
      include: visitIncludeForOwnerList,
    });

    return this.mapVisitPets(updated);
  }

  async resubmit(visitId: string, ownerId: string) {
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
    });

    if (!visit) {
      throw new NotFoundException('Rezervacija nerasta');
    }

    if (visit.ownerId !== ownerId) {
      throw new ForbiddenException(
        'Neturite teisės pateikti iš naujo šios rezervacijos',
      );
    }

    if (visit.status !== VisitStatus.REJECTED) {
      throw new BadRequestException(
        'Pateikti iš naujo galima tik atmestas (REJECTED) rezervacijas',
      );
    }

    const updated = await this.prisma.visit.update({
      where: { id: visitId },
      data: {
        status: VisitStatus.PENDING,
        rejectionReason: null,
      } as unknown as Record<string, unknown>,
      include: visitIncludeForOwnerList,
    });

    return this.mapVisitPets(updated);
  }

  async removeRejected(visitId: string, ownerId: string) {
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
      select: { id: true, ownerId: true, status: true },
    });

    if (!visit) {
      throw new NotFoundException('Rezervacija nerasta');
    }

    if (visit.ownerId !== ownerId) {
      throw new ForbiddenException(
        'Neturite teisės ištrinti šios rezervacijos',
      );
    }

    if (visit.status !== VisitStatus.REJECTED) {
      throw new BadRequestException(
        'Ištrinti galima tik atmestas (REJECTED) rezervacijas',
      );
    }

    await this.prisma.visit.delete({
      where: { id: visitId },
    });

    return { success: true };
  }

  async reject(visitId: string, userId: string, rejectionReason: string) {
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
    });

    if (!visit) {
      throw new NotFoundException('Rezervacija nerasta');
    }

    if (visit.sitterUserId !== userId) {
      throw new ForbiddenException('Neturite teisės atmesti šios rezervacijos');
    }

    if (
      visit.status !== VisitStatus.PENDING &&
      visit.status !== VisitStatus.ACCEPTED
    ) {
      throw new BadRequestException('Šios rezervacijos atmesti negalima');
    }

    const trimmedReason = rejectionReason?.trim();
    if (!trimmedReason) {
      throw new BadRequestException('Atmetimo priežastis privaloma');
    }

    const updated = await this.prisma.visit.update({
      where: { id: visitId },
      data: {
        status: VisitStatus.REJECTED,
        rejectionReason: trimmedReason,
      } as unknown as Record<string, unknown>,
      include: visitIncludeForSitterStatusUpdate,
    });

    return this.mapVisitPets(updated);
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

    const updated = await this.prisma.visit.update({
      where: { id: visitId },
      data: {
        status: VisitStatus.CANCELED,
        canceledBy: ownerId,
      },
      include: visitIncludeForOwnerList,
    });

    return this.mapVisitPets(updated);
  }

  private async assertPetsOwnedByOwner(ownerId: string, petIds: string[]) {
    const pets = await this.prisma.pet.findMany({
      where: {
        id: {
          in: petIds,
        },
        ownerId,
      },
      select: { id: true },
    });

    if (pets.length !== petIds.length) {
      throw new ForbiddenException(
        'Vienas ar keli augintiniai jums nepriklauso',
      );
    }
  }

  private async getSitterUserIdByProfileId(sitterProfileId: string) {
    const sitterProfile = await this.prisma.sitterProfile.findUnique({
      where: { id: sitterProfileId },
      select: { userId: true },
    });

    if (!sitterProfile) {
      throw new NotFoundException('Prižiūrėtojo profilis nerastas');
    }

    return sitterProfile.userId;
  }
}
