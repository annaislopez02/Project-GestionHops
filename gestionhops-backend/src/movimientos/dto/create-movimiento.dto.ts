import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateMovimientoDto {
  @IsInt()
  @IsOptional()
  usuario_id?: number;

  @IsInt()
  dispositivo_id: number;

  @IsInt()
  @IsOptional()
  bodega_origen_id?: number;

  @IsInt()
  @IsOptional()
  bodega_destino_id?: number;

  @IsString()
  @IsIn(['INGRESO', 'SALIDA', 'TRASPASO'])
  tipo_movimiento: 'INGRESO' | 'SALIDA' | 'TRASPASO';

  @IsInt()
  @Min(1)
  cantidad: number;

  @IsString()
  @IsOptional()
  observacion?: string;
}