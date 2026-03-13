import { getPedidosCollection, getProductosCollection } from "@/app/lib/collections";
import { Pedido } from "@/app/models/Pedido";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { estado, fechaLimitePago } = body;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const pedidosCol = await getPedidosCollection();

    const updateData: Partial<Pedido> = {};

    if (estado) updateData.estado = estado;
    if (fechaLimitePago) updateData.fechaLimitePago = new Date(fechaLimitePago);

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No hay datos para actualizar" },
        { status: 400 }
      );
    }

    const result = await pedidosCol.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Pedido actualizado correctamente",
    });

  } catch (error) {
    console.error("Error actualizando pedido:", error);

    return NextResponse.json(
      { error: "Error actualizando pedido" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const pedidosCol = await getPedidosCollection();
    const productosCol = await getProductosCollection();

    const pedido = await pedidosCol.findOne({
      _id: new ObjectId(id),
    });

    if (!pedido) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    // 🔄 restaurar stock de productos
    for (const producto of pedido.productos) {
      await productosCol.updateOne(
        { _id: producto.productoId },
        {
          $inc: { stock: producto.cantidad },
          $set: { status: "activo" },
        }
      );
    }

    await pedidosCol.deleteOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json({
      message: "Pedido eliminado correctamente",
    });

  } catch (error) {
    console.error("Error eliminando pedido:", error);

    return NextResponse.json(
      { error: "Error eliminando pedido" },
      { status: 500 }
    );
  }
}