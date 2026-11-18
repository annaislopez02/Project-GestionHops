-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "rut" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bodega" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "gaveta_inteligente" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Bodega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispositivo" (
    "id" SERIAL NOT NULL,
    "codigo_gs1" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "stock_minimo" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Dispositivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventario" (
    "id" SERIAL NOT NULL,
    "bodega_id" INTEGER NOT NULL,
    "dispositivo_id" INTEGER NOT NULL,
    "cantidad_actual" INTEGER NOT NULL DEFAULT 0,
    "fecha_vencimiento" TIMESTAMP(3),
    "lote" TEXT,

    CONSTRAINT "Inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movimiento" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "dispositivo_id" INTEGER NOT NULL,
    "bodega_origen_id" INTEGER,
    "bodega_destino_id" INTEGER,
    "tipo_movimiento" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacion" TEXT,

    CONSTRAINT "Movimiento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_rut_key" ON "Usuario"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "Dispositivo_codigo_gs1_key" ON "Dispositivo"("codigo_gs1");

-- CreateIndex
CREATE UNIQUE INDEX "Inventario_bodega_id_dispositivo_id_lote_key" ON "Inventario"("bodega_id", "dispositivo_id", "lote");

-- AddForeignKey
ALTER TABLE "Inventario" ADD CONSTRAINT "Inventario_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "Bodega"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventario" ADD CONSTRAINT "Inventario_dispositivo_id_fkey" FOREIGN KEY ("dispositivo_id") REFERENCES "Dispositivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimiento" ADD CONSTRAINT "Movimiento_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimiento" ADD CONSTRAINT "Movimiento_dispositivo_id_fkey" FOREIGN KEY ("dispositivo_id") REFERENCES "Dispositivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimiento" ADD CONSTRAINT "Movimiento_bodega_origen_id_fkey" FOREIGN KEY ("bodega_origen_id") REFERENCES "Bodega"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimiento" ADD CONSTRAINT "Movimiento_bodega_destino_id_fkey" FOREIGN KEY ("bodega_destino_id") REFERENCES "Bodega"("id") ON DELETE SET NULL ON UPDATE CASCADE;
