import { IsIn, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty()
  rut: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsIn(['ADMIN', 'JEFE_BODEGA', 'CLINICO'])
  rol: string;

  @IsString()
  @MinLength(6)
  password_hash: string;
}