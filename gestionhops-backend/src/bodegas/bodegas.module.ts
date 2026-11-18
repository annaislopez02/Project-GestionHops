import { Module } from '@nestjs/common';
import { BodegasService } from './bodegas.service';
import { BodegasController } from './bodegas.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BodegasController],
  providers: [BodegasService],
})
export class BodegasModule {}