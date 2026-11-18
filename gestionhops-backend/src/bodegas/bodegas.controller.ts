import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { BodegasService } from './bodegas.service';
import { CreateBodegasDto } from './dto/create-bodegas.dto';
import { UpdateBodegasDto } from './dto/update-bodegas.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(AuthGuard)
@Controller('bodegas')
export class BodegasController {
  constructor(private readonly bodegasService: BodegasService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN', 'JEFE_BODEGA')
  @Post()
  create(@Body() createBodegasDto: CreateBodegasDto) {
    return this.bodegasService.create(createBodegasDto);
  }

  @Get()
  findAll() {
    return this.bodegasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bodegasService.findOne(+id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN', 'JEFE_BODEGA')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBodegasDto: UpdateBodegasDto) {
    return this.bodegasService.update(+id, updateBodegasDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN', 'JEFE_BODEGA')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bodegasService.remove(+id);
  }
}