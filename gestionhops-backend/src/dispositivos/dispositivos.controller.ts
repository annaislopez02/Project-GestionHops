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
import { DispositivosService } from './dispositivos.service';
import { CreateDispositivoDto } from './dto/create-dispositivo.dto';
import { UpdateDispositivoDto } from './dto/update-dispositivo.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(AuthGuard)
@Controller('dispositivos')
export class DispositivosController {
  constructor(private readonly dispositivosService: DispositivosService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN', 'JEFE_BODEGA')
  @Post()
  create(@Body() createDispositivoDto: CreateDispositivoDto) {
    return this.dispositivosService.create(createDispositivoDto);
  }

  @Get()
  findAll() {
    return this.dispositivosService.findAll();
  }

  @Get('gs1/:codigo')
  findByGs1(@Param('codigo') codigo: string) {
    return this.dispositivosService.findByGs1(codigo);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dispositivosService.findOne(+id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN', 'JEFE_BODEGA')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDispositivoDto: UpdateDispositivoDto,
  ) {
    return this.dispositivosService.update(+id, updateDispositivoDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN', 'JEFE_BODEGA')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dispositivosService.remove(+id);
  }
}