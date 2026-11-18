import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { UpdateMovimientoDto } from './dto/update-movimiento.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MovimientosService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateMovimientoDto) {
    const {
      tipo_movimiento,
      cantidad,
      dispositivo_id,
      bodega_origen_id,
      bodega_destino_id,
    } = dto;

    if (cantidad <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor a 0');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Si es SALIDA o TRASPASO, validar y descontar stock en bodega origen
      if (tipo_movimiento === 'SALIDA' || tipo_movimiento === 'TRASPASO') {
        if (!bodega_origen_id) {
          throw new BadRequestException(
            'Se requiere bodega_origen_id para SALIDA o TRASPASO',
          );
        }

        const invOrigen = await tx.inventario.findFirst({
          where: { bodega_id: bodega_origen_id, dispositivo_id },
        });

        if (!invOrigen || invOrigen.cantidad_actual < cantidad) {
          throw new BadRequestException(
            'Stock insuficiente en la bodega de origen',
          );
        }

        await tx.inventario.update({
          where: { id: invOrigen.id },
          data: { cantidad_actual: invOrigen.cantidad_actual - cantidad },
        });
      }

      // 2. Si es INGRESO o TRASPASO, sumar stock en bodega destino (o crear registro)
      if (tipo_movimiento === 'INGRESO' || tipo_movimiento === 'TRASPASO') {
        if (!bodega_destino_id) {
          throw new BadRequestException(
            'Se requiere bodega_destino_id para INGRESO o TRASPASO',
          );
        }

        const invDestino = await tx.inventario.findFirst({
          where: { bodega_id: bodega_destino_id, dispositivo_id },
        });

        if (invDestino) {
          await tx.inventario.update({
            where: { id: invDestino.id },
            data: { cantidad_actual: invDestino.cantidad_actual + cantidad },
          });
        } else {
          await tx.inventario.create({
            data: {
              bodega_id: bodega_destino_id,
              dispositivo_id,
              cantidad_actual: cantidad,
            },
          });
        }
      }

      // 3. Registrar el movimiento auditado
      return tx.movimiento.create({
        data: {
        ...dto,
        usuario_id: dto.usuario_id!,
      },
        include: {
          usuario: { select: { id: true, nombre: true, rut: true, rol: true } },
          dispositivo: true,
          bodega_origen: true,
          bodega_destino: true,
        },
      });
    });
  }

  findAll() {
    return this.prisma.movimiento.findMany({
      include: {
        usuario: { select: { id: true, nombre: true, rut: true, rol: true } },
        dispositivo: true,
        bodega_origen: true,
        bodega_destino: true,
      },
      orderBy: { fecha_hora: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.movimiento.findUnique({
      where: { id },
      include: {
        usuario: { select: { id: true, nombre: true, rut: true, rol: true } },
        dispositivo: true,
        bodega_origen: true,
        bodega_destino: true,
      },
    });
  }

  update(id: number, updateMovimientoDto: UpdateMovimientoDto) {
    return this.prisma.movimiento.update({
      where: { id },
      data: updateMovimientoDto,
    });
  }

  remove(id: number) {
    return this.prisma.movimiento.delete({
      where: { id },
    });
  }
}
