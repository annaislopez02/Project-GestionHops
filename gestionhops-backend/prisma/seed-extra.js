require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('1. Reparando acentos existentes...');
  await prisma.$executeRawUnsafe(
    'UPDATE "Dispositivo" SET nombre = REPLACE(REPLACE(nombre, \'Cat\' || CHR(65533) || \'ter\', \'Catéter\'), \'Perif\' || CHR(65533) || \'rico\', \'Periférico\')'
  );
  await prisma.$executeRawUnsafe(
    'UPDATE "Movimiento" SET observacion = REPLACE(observacion, \'Recepci\' || CHR(65533) || \'n\', \'Recepción\')'
  );

  console.log('2. Creando 10 usuarios adicionales...');
  const hash = await bcrypt.hash('fricke2026', 10);
  const usuariosData = [
    { rut: '16.432.198-5', nombre: 'Dra. Camila Valdés', rol: 'CLINICO', password_hash: hash },
    { rut: '14.876.234-1', nombre: 'Enf. Sebastián Rojas', rol: 'CLINICO', password_hash: hash },
    { rut: '17.654.321-8', nombre: 'TENS Valentina Muñoz', rol: 'JEFE_BODEGA', password_hash: hash },
    { rut: '13.987.654-3', nombre: 'Dr. Rodrigo Contreras', rol: 'CLINICO', password_hash: hash },
    { rut: '18.234.567-9', nombre: 'Enf. Fernanda Morales', rol: 'CLINICO', password_hash: hash },
    { rut: '12.345.678-5', nombre: 'QF. Ignacio Herrera', rol: 'ADMIN', password_hash: hash },
    { rut: '19.123.456-K', nombre: 'TENS Catalina Díaz', rol: 'JEFE_BODEGA', password_hash: hash },
    { rut: '15.678.901-2', nombre: 'Dra. Javiera Soto', rol: 'CLINICO', password_hash: hash },
    { rut: '16.789.012-4', nombre: 'Enf. Matías Silva', rol: 'CLINICO', password_hash: hash },
    { rut: '18.901.234-6', nombre: 'TENS Daniela Vargas', rol: 'JEFE_BODEGA', password_hash: hash },
  ];
  await prisma.usuario.createMany({ data: usuariosData, skipDuplicates: true });

  console.log('3. Creando 10 bodegas hospitalarias...');
  const bodegasData = [
    { nombre: 'Pabellón Quirúrgico Central', tipo: 'PERIFERICA', gaveta_inteligente: true },
    { nombre: 'Unidad de Paciente Crítico (UCI)', tipo: 'PERIFERICA', gaveta_inteligente: true },
    { nombre: 'Urgencia Adulto - Reanimación', tipo: 'PERIFERICA', gaveta_inteligente: true },
    { nombre: 'Urgencia Pediátrica', tipo: 'PERIFERICA', gaveta_inteligente: false },
    { nombre: 'Hemodinamia y Cardiología', tipo: 'PERIFERICA', gaveta_inteligente: true },
    { nombre: 'Unidad de Diálisis', tipo: 'PERIFERICA', gaveta_inteligente: false },
    { nombre: 'Maternidad y Neonatología', tipo: 'PERIFERICA', gaveta_inteligente: false },
    { nombre: 'Traumatología y Ortopedia', tipo: 'PERIFERICA', gaveta_inteligente: false },
    { nombre: 'Esterilización Central', tipo: 'CENTRAL', gaveta_inteligente: true },
    { nombre: 'Farmacia Clínica e Insumos', tipo: 'CENTRAL', gaveta_inteligente: false },
  ];
  await prisma.bodega.createMany({ data: bodegasData, skipDuplicates: true });

  console.log('4. Creando 12 dispositivos médicos GS1...');
  const dispositivosData = [
    { codigo_gs1: '0107801234567891', nombre: 'Jeringa Desechable 10ml Luer Lock', categoria: 'Punción y Administración', stock_minimo: 200 },
    { codigo_gs1: '0107801234567892', nombre: 'Guantes Quirúrgicos Estériles N° 7.5', categoria: 'Protección Clínica', stock_minimo: 150 },
    { codigo_gs1: '0107801234567893', nombre: 'Sonda Foley 2 Vías Silicona 16Fr', categoria: 'Urología y Sondaje', stock_minimo: 60 },
    { codigo_gs1: '0107801234567894', nombre: 'Mascarilla Quirúrgica Triple Pliegue', categoria: 'Protección Clínica', stock_minimo: 500 },
    { codigo_gs1: '0107801234567895', nombre: 'Apósito Transparente Estéril 10x12cm', categoria: 'Curación Avanzada', stock_minimo: 120 },
    { codigo_gs1: '0107801234567896', nombre: 'Equipo de Fleboclisis Macrogoteo', categoria: 'Terapia Intravenosa', stock_minimo: 180 },
    { codigo_gs1: '0107801234567897', nombre: 'Cánula Nasal de Oxígeno Adulto', categoria: 'Oxigenoterapia', stock_minimo: 100 },
    { codigo_gs1: '0107801234567898', nombre: 'Sutura Ácido Poliglicólico 3-0 Aguja 26mm', categoria: 'Suturas Quirúrgicas', stock_minimo: 80 },
    { codigo_gs1: '0107801234567899', nombre: 'Catéter Venoso Central Triple Lumen 7Fr', categoria: 'Acceso Vascular Crítico', stock_minimo: 30 },
    { codigo_gs1: '0107801234567900', nombre: 'Tubo Endotraqueal con Balón N° 7.5', categoria: 'Vía Aérea', stock_minimo: 45 },
    { codigo_gs1: '0107801234567901', nombre: 'Electrodos ECG Adulto Desechables', categoria: 'Monitorización', stock_minimo: 300 },
    { codigo_gs1: '0107801234567902', nombre: 'Bisturí Desechable Estéril Hoja N° 15', categoria: 'Instrumental Quirúrgico', stock_minimo: 90 },
  ];
  await prisma.dispositivo.createMany({ data: dispositivosData, skipDuplicates: true });

  const usuarios = await prisma.usuario.findMany();
  const bodegas = await prisma.bodega.findMany();
  const dispositivos = await prisma.dispositivo.findMany();

  console.log('5. Poblando 12 lotes en Inventario...');
  for (let i = 0; i < Math.min(12, dispositivos.length); i++) {
    const bod = bodegas[i % bodegas.length];
    const disp = dispositivos[i];
    const codigoLote = 'LOTE-2026-' + (100 + i);
    await prisma.inventario.upsert({
      where: {
        bodega_id_dispositivo_id_lote: {
          bodega_id: bod.id,
          dispositivo_id: disp.id,
          lote: codigoLote,
        },
      },
      update: {},
      create: {
        bodega_id: bod.id,
        dispositivo_id: disp.id,
        cantidad_actual: 40 + i * 25,
        fecha_vencimiento: new Date(2027, (i % 11) + 1, 15),
        lote: codigoLote,
      },
    });
  }

  console.log('6. Creando 15 movimientos auditados...');
  const tipos = ['INGRESO', 'SALIDA', 'TRASPASO'];
  const observaciones = [
    'Recepción central orden de compra CENABAST',
    'Consumo procedimiento quirúrgico pabellón 3',
    'Reposición gaveta inteligente turno noche',
    'Entrega urgencia adulto paciente crítico',
    'Traspaso por quiebre de stock preventivo',
    'Recepción proveedor certificado lote estéril',
    'Abastecimiento semanal unidad de diálisis',
    'Consumo clínico sala hospitalización médica',
    'Reposición carro de paro reanimación',
    'Recepción insumos cirugía cardiovascular',
    'Salida por procedimiento hemodinamia',
    'Traspaso desde esterilización central',
    'Ajuste recepción conformidad guía despacho',
    'Consumo atención parto y neonatología',
    'Reposición stock mínimo mensual',
  ];

  const movimientosData = Array.from({ length: 15 }, (_, idx) => {
    const tipo = tipos[idx % 3];
    const origen = bodegas[idx % bodegas.length];
    const destino = bodegas[(idx + 1) % bodegas.length];
    return {
      usuario_id: usuarios[idx % usuarios.length].id,
      dispositivo_id: dispositivos[idx % dispositivos.length].id,
      bodega_origen_id: tipo === 'INGRESO' ? null : origen.id,
      bodega_destino_id: tipo === 'SALIDA' ? null : destino.id,
      tipo_movimiento: tipo,
      cantidad: 15 + idx * 5,
      observacion: observaciones[idx],
    };
  });

  await prisma.movimiento.createMany({ data: movimientosData });
  console.log('¡Base de datos poblada y acentos corregidos con éxito!');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
