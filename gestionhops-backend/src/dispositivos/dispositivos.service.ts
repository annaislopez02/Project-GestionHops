import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDispositivoDto } from './dto/create-dispositivo.dto';
import { UpdateDispositivoDto } from './dto/update-dispositivo.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DispositivosService {
  constructor(private prisma: PrismaService) {}

  create(createDispositivoDto: CreateDispositivoDto) {
    return this.prisma.dispositivo.create({
      data: createDispositivoDto,
    });
  }

  findAll() {
    return this.prisma.dispositivo.findMany();
  }

  findOne(id: number) {
    return this.prisma.dispositivo.findUnique({
      where: { id },
    });
  }

  async findByGs1(codigo_gs1: string) {
    const dispositivo = await this.prisma.dispositivo.findUnique({
      where: { codigo_gs1 },
      include: {
        inventarios: {
          include: {
            bodega: true,
          },
          orderBy: {
            fecha_vencimiento: 'asc',
          },
        },
      },
    });

    if (!dispositivo) {
      throw new NotFoundException(`No existe dispositivo con código GS1: ${codigo_gs1}`);
    }

    const stockTotal = dispositivo.inventarios.reduce(
      (acc, item) => acc + item.cantidad_actual,
      0,
    );

    return {
      ...dispositivo,
      stock_total: stockTotal,
      en_alerta_stock: stockTotal <= dispositivo.stock_minimo,
    };
  }

  update(id: number, updateDispositivoDto: UpdateDispositivoDto) {
    return this.prisma.dispositivo.update({
      where: { id },
      data: updateDispositivoDto,
    });
  }

  remove(id: number) {
    return this.prisma.dispositivo.delete({
      where: { id },
    });
  }
}