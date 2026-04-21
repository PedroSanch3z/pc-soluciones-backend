import { getClientesCollection, getPedidosCollection } from "@/app/lib/collections";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function GET(
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

    const clientesCol = await getClientesCollection();
    const pedidosCol = await getPedidosCollection();

    // 🔎 Buscar cliente
    const cliente = await clientesCol.findOne({
      _id: new ObjectId(id),
    });

    if (!cliente) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    // 🔎 Buscar pedidos del cliente
    const pedidos = await pedidosCol
      .find({
        "cliente.clienteId": new ObjectId(id),
      })
      .sort({ fechaCreacion: -1 })
      .toArray();

    const ahora = new Date();

    let pagados = 0;
    let pendientes = 0;
    let retrasados = 0;
    let total = 0

    const pedidosProcesados = pedidos.map((pedido) => {
      let estadoFinal = pedido.estado;

      if (
        pedido.estado === "pendiente" &&
        pedido.fechaLimitePago &&
        new Date(pedido.fechaLimitePago) < ahora
      ) {
        estadoFinal = "retrasado";
      }

      if (estadoFinal === "pagado") {
       pagados++;

        if (
          pedido.fechaLimitePago &&
          new Date(pedido.fechaLimitePago) < ahora
        ) {
          estadoFinal = "pagado_con_retraso";
        }

        total += pedido.total || 0;
      };
      if (estadoFinal === "pendiente") pendientes++;
      if (estadoFinal === "retrasado") retrasados++;

      return {
        ...pedido,
        estado: estadoFinal,
      };
    });

    return NextResponse.json({
      cliente,
      estadisticas: {
        totalPedidos: pedidos.length,
        pagados,
        pendientes,
        retrasados,
        total
      },
      pedidos: pedidosProcesados,
    });

  } catch (error) {
    console.error("Error al obtener resumen del cliente:", error);

    return NextResponse.json(
      { error: "Error al obtener resumen del cliente" },
      { status: 500 }
    );
  }
}