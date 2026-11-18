import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBodegasDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsIn(['CENTRAL', 'PERIFERICA', 'PABELLON'])
  tipo: string;

  @IsBoolean()
  @IsOptional()
  gaveta_inteligente?: boolean;
}