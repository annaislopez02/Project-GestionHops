import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async create(createUsuarioDto: CreateUsuarioDto) {
    const hashedPassword = await bcrypt.hash(createUsuarioDto.password_hash, 10);

    return this.prisma.usuario.create({
      data: {
        ...createUsuarioDto,
        password_hash: hashedPassword,
      },
      select: {
        id: true,
        rut: true,
        nombre: true,
        rol: true,
      },
    });
  }

  findAll() {
    return this.prisma.usuario.findMany({
      select: {
        id: true,
        rut: true,
        nombre: true,
        rol: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        rut: true,
        nombre: true,
        rol: true,
      },
    });
  }

  findByRut(rut: string) {
    return this.prisma.usuario.findUnique({
      where: { rut },
    });
  }

  async update(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    const data = { ...updateUsuarioDto };

    if (data.password_hash) {
      data.password_hash = await bcrypt.hash(data.password_hash, 10);
    }

    return this.prisma.usuario.update({
      where: { id },
      data,
      select: {
        id: true,
        rut: true,
        nombre: true,
        rol: true,
      },
    });
  }

  remove(id: number) {
    return this.prisma.usuario.delete({
      where: { id },
    });
  }
}