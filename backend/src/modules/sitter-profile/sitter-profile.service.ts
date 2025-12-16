import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateSitterProfileDto } from './dto/create-sitter-profile.dto';
import { UpdateSitterProfileDto } from './dto/update-sitter-profile.dto';
import {
  sitterProfileIncludeForCreateOrUpdate,
  sitterProfileIncludeForList,
  sitterProfileIncludeWithUserPublic,
} from './sitter-profile.prisma';

@Injectable()
export class SitterProfileService {
  constructor(private prisma: PrismaService) {}

  // Sukurti sitter profilį
  async create(userId: string, dto: CreateSitterProfileDto) {
    // Patikrinti ar jau turi profilį
    const existing = await this.prisma.sitterProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new ConflictException('Jūs jau turite priežiūrėtojo profilį');
    }

    const data: Prisma.SitterProfileUncheckedCreateInput = {
      userId,
      ...dto,
    };

    return this.prisma.sitterProfile.create({
      data,
      include: sitterProfileIncludeForCreateOrUpdate,
    });
  }

  // Gauti savo profilį
  async getMyProfile(userId: string) {
    const profile = await this.prisma.sitterProfile.findUnique({
      where: { userId },
      include: sitterProfileIncludeWithUserPublic,
    });

    if (!profile) {
      throw new NotFoundException('Neturite priežiūrėtojo profilio');
    }

    return profile;
  }

  // Gauti bet kurio sitter profilį (public)
  async getById(id: string) {
    const profile = await this.prisma.sitterProfile.findUnique({
      where: { id },
      include: sitterProfileIncludeWithUserPublic,
    });

    if (!profile) {
      throw new NotFoundException('Priežiūrėtojo profilis nerastas');
    }

    return profile;
  }

  // Gauti visus sitters (su filtrais)
  async findAll(filters?: {
    city?: string;
    minRate?: number;
    maxRate?: number;
    minRating?: number;
  }) {
    const where: Prisma.SitterProfileWhereInput = {};

    if (filters?.city) {
      where.city = {
        contains: filters.city,
        mode: 'insensitive',
      };
    }

    if (filters?.minRate !== undefined || filters?.maxRate !== undefined) {
      const hourlyRate: Prisma.IntFilter = {};
      if (filters.minRate !== undefined) {
        hourlyRate.gte = filters.minRate;
      }
      if (filters.maxRate !== undefined) {
        hourlyRate.lte = filters.maxRate;
      }
      where.hourlyRate = hourlyRate;
    }

    if (filters?.minRating !== undefined) {
      where.avgRating = { gte: filters.minRating };
    }

    return this.prisma.sitterProfile.findMany({
      where,
      include: sitterProfileIncludeForList,
      orderBy: {
        avgRating: 'desc',
      },
    });
  }

  // Atnaujinti savo profilį
  async update(userId: string, dto: UpdateSitterProfileDto) {
    // Patikrinti ar turi profilį
    const profile = await this.prisma.sitterProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Neturite priežiūrėtojo profilio');
    }

    const data: Prisma.SitterProfileUncheckedUpdateInput = {
      ...dto,
    };

    return this.prisma.sitterProfile.update({
      where: { userId },
      data,
      include: sitterProfileIncludeForCreateOrUpdate,
    });
  }

  // Ištrinti savo profilį
  async delete(userId: string) {
    const profile = await this.prisma.sitterProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Neturite priežiūrėtojo profilio');
    }

    return this.prisma.sitterProfile.delete({
      where: { userId },
    });
  }
}
