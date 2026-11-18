import { Injectable } from '@nestjs/common';
import { CreateInventarioDto } from './dto/create-inventario.dto';
import { UpdateInventarioDto } from './dto/update-inventario.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventarioService {
  constructor(private prisma: PrismaService) {}

  create(createInventarioDto: CreateInventarioDto) {
    return this.prisma.inventario.create({
      data: createInventarioDto,
    });
  }

  findAll() {
    return this.prisma.inventario.findMany({
      include: {
        bodega: true,
        dispositivo: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.inventario.findUnique({
      where: { id },
      include: {
        bodega: true,
        dispositivo: true,
      },
    });
  }

  async getAlertasStockCritico() {
    const dispositivos = await this.prisma.dispositivo.findMany({
      include: {
        inventarios: {
          include: {
            bodega: true,
          },
        },
      },
    });

    return dispositivos
      .map((disp) => {
        const stockTotal = disp.inventarios.reduce(
          (acc, inv) => acc + inv.cantidad_actual,
          0,
        );
        return {
          dispositivo_id: disp.id,
          codigo_gs1: disp.codigo_gs1,
          nombre: disp.nombre,
          categoria: disp.categoria,
          stock_minimo: disp.stock_minimo,
          stock_total: stockTotal,
          deficit: Math.max(0, disp.stock_minimo - stockTotal),
          detalle_bodegas: disp.inventarios.map((inv) => ({
            bodega: inv.bodega.nombre,
            lote: inv.lote,
            cantidad: inv.cantidad_actual,
          })),
        };
      })
      .filter((item) => item.stock_total <= item.stock_minimo);
  }

  async getAlertasVencimiento(dias = 30) {
    const hoy = new Date();
    const fechaLimite = new Date();
    fechaLimite.setDate(hoy.getDate() + dias);

    const lotes = await this.prisma.inventario.findMany({
      where: {
        cantidad_actual: { gt: 0 },
        fecha_vencimiento: {
          not: null,
          lte: fechaLimite,
        },
      },
      include: {
        bodega: true,
        dispositivo: true,
      },
      orderBy: {
        fecha_vencimiento: 'asc',
      },
    });

    return lotes.map((item) => {
      const vencimiento = new Date(item.fecha_vencimiento!);
      const diffMs = vencimiento.getTime() - hoy.getTime();
      const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      return {
        inventario_id: item.id,
        bodega: item.bodega.nombre,
        dispositivo: item.dispositivo.nombre,
        codigo_gs1: item.dispositivo.codigo_gs1,
        lote: item.lote,
        cantidad_actual: item.cantidad_actual,
        fecha_vencimiento: item.fecha_vencimiento,
        dias_restantes: diasRestantes,
        estado: diasRestantes < 0 ? 'VENCIDO' : 'PROXIMO_A_VENCER',
      };
    });
  }

  update(id: number, updateInventarioDto: UpdateInventarioDto) {
    return this.prisma.inventario.update({
      where: { id },
      data: updateInventarioDto,
    });
  }

  remove(id: number) {
    return this.prisma.inventario.delete({
      where: { id },
    });
  }
}