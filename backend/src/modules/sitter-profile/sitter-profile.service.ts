import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSitterProfileDto } from './dto/create-sitter-profile.dto';
import { UpdateSitterProfileDto } from './dto/update-sitter-profile.dto';

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

    return this.prisma.sitterProfile.create({
      data: {
        userId,
        ...dto,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  // Gauti savo profilį
  async getMyProfile(userId: string) {
    const profile = await this.prisma.sitterProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
      },
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
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
      },
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
    const where: any = {};

    if (filters?.city) {
      where.city = {
        contains: filters.city,
        mode: 'insensitive',
      };
    }

    if (filters?.minRate !== undefined || filters?.maxRate !== undefined) {
      where.hourlyRate = {};
      if (filters.minRate !== undefined) {
        where.hourlyRate.gte = filters.minRate;
      }
      if (filters.maxRate !== undefined) {
        where.hourlyRate.lte = filters.maxRate;
      }
    }

    if (filters?.minRating !== undefined) {
      where.avgRating = {
        gte: filters.minRating,
      };
    }

    return this.prisma.sitterProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
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

    return this.prisma.sitterProfile.update({
      where: { userId },
      data: dto,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
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
