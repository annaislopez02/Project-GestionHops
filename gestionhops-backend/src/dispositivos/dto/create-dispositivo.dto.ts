import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateDispositivoDto {
  @IsString()
  @IsNotEmpty()
  codigo_gs1: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  categoria: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  stock_minimo?: number;
}