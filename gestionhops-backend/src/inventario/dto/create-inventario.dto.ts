import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateInventarioDto {
  @IsInt()
  bodega_id: number;

  @IsInt()
  dispositivo_id: number;

  @IsInt()
  @Min(0)
  cantidad_actual: number;

  @IsDateString()
  @IsOptional()
  fecha_vencimiento?: Date;

  @IsString()
  @IsOptional()
  lote?: string;
}
