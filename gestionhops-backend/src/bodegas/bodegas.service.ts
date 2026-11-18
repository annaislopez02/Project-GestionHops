import { Injectable } from '@nestjs/common';
import { CreateBodegasDto } from './dto/create-bodegas.dto';
import { UpdateBodegasDto } from './dto/update-bodegas.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BodegasService {
  constructor(private prisma: PrismaService) {}

  create(createBodegasDto: CreateBodegasDto) {
    return this.prisma.bodega.create({
      data: createBodegasDto,
    });
  }

  findAll() {
    return this.prisma.bodega.findMany();
  }

  findOne(id: number) {
    return this.prisma.bodega.findUnique({
      where: { id },
    });
  }

  update(id: number, updateBodegasDto: UpdateBodegasDto) {
    return this.prisma.bodega.update({
      where: { id },
      data: updateBodegasDto,
    });
  }

  remove(id: number) {
    return this.prisma.bodega.delete({
      where: { id },
    });
  }
}
