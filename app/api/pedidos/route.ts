import { getClientesCollection, getPedidosCollection, getProductosCollection } from "@/app/lib/collections";
import { Pedido, ProductoPedido } from "@/app/models/Pedido";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const collection = await getPedidosCollection();

    const pedidos = await collection
      .find()
      .sort({ fechaCreacion: -1 })
      .toArray(); // 🔥 traer TODOS

    const pedidosConEstadoCalculado = pedidos.map((pedido) => {
      if (!pedido.fechaLimitePago) return pedido;

      const fechaLimite = new Date(pedido.fechaLimitePago);
      const hoy = new Date();

      hoy.setHours(0, 0, 0, 0);
      fechaLimite.setHours(0, 0, 0, 0);

      const diff = fechaLimite.getTime() - hoy.getTime();
      const horasRestantes = diff / (1000 * 60 * 60);

      if (pedido.estado === "pendiente") {
        if (hoy > fechaLimite) {
          return { ...pedido, estado: "retrasado" };
        }

        if (horasRestantes <= 6) {
          return { ...pedido, estado: "aviso6h" };
        }

        if (horasRestantes <= 12) {
          return { ...pedido, estado: "aviso12h" };
        }
      }

      return pedido;
    });

    return NextResponse.json({
      data: pedidosConEstadoCalculado,
    });

  } catch (error) {
    console.error("Error al obtener pedidos:", error);

    return NextResponse.json(
      { error: "Error al obtener pedidos" },
      { status: 500 }
    );
  }
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clienteId, productos, fechaLimitePago, pagado } = body;

    if (!clienteId || !productos || productos.length === 0) {
      return NextResponse.json(
        { error: "Faltan datos" },
        { status: 400 }
      );
    }

    const clientesCol = await getClientesCollection();
    const productosCol = await getProductosCollection();
    const pedidosCol = await getPedidosCollection();

    // 🔎 Verificar cliente
    const cliente = await clientesCol.findOne({
      _id: new ObjectId(clienteId),
    });

    if (!cliente) {
      return NextResponse.json(
        { error: "Cliente no existe", clienteExiste: false },
        { status: 400 }
      );
    }

    let total = 0;
    const productosFinal: ProductoPedido[] = [];

    for (const item of productos) {
    const producto = await productosCol.findOne({
      _id: new ObjectId(item.productoId),
    });

    if (!producto) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 400 }
      );
    }

    if (producto.stock < item.cantidad) {
      return NextResponse.json(
        { error: `Stock insuficiente para ${producto.nombre}` },
        { status: 400 }
      );
    }

    const subtotal = producto.precio * item.cantidad;
    total += subtotal;

    productosFinal.push({
      productoId: producto._id!,
      nombre: producto.nombre,
      precioUnitario: producto.precio,
      cantidad: item.cantidad,
      subtotal,
    });

  const nuevoStock = producto.stock - item.cantidad;

  await productosCol.updateOne(
    { _id: producto._id },
    {
      $set: {
        stock: nuevoStock,
        status: nuevoStock === 0 ? "inactivo" : "activo",
      },
    }
  );
}

    const nuevoPedido: Pedido = {
      cliente: {
        clienteId: cliente._id!,
        nombre: cliente.nombre,
        telefono: cliente.telefono,
      },
      productos: productosFinal,
      total,
      fechaCreacion: new Date(),
      fechaLimitePago: new Date(fechaLimitePago),
      estado: pagado ? "pagado" : "pendiente",
    };

    const result = await pedidosCol.insertOne(nuevoPedido);

    return NextResponse.json(
      {
        message: "Pedido creado correctamente",
        data: {
          _id: result.insertedId,
          ...nuevoPedido,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error al crear pedido:", error);
    return NextResponse.json(
      { error: "Error al crear pedido" },
      { status: 500 }
    );
  }
}