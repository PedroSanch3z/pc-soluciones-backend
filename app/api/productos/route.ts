import { getProductosCollection } from "@/app/lib/collections";
import { Producto } from "@/app/models/Producto";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const nombre = searchParams.get("nombre");
    const page = Number(searchParams.get("page")) || 1;

    const limit = 6;
    const skip = (page - 1) * limit;

    const collection = await getProductosCollection();

    const filtro = nombre
      ? { nombre: { $regex: nombre, $options: "i" } }
      : {};

    const total = await collection.countDocuments(filtro);

    const productos = await collection
      .find(filtro)
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      data: productos,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
        limit,
      },
    });

  } catch (error) {
    console.error("Error al obtener productos:", error);

    return NextResponse.json(
      { error: "Error al obtener productos" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, precio, stock } = body;

    if (!nombre || precio == null || stock == null) {
      return NextResponse.json(
        { error: "Faltan datos" },
        { status: 400 }
      );
    }

    const collection = await getProductosCollection();

    const nuevoProducto: Producto = {
      nombre,
      precio: Number(precio),
      stock: Number(stock),
      status: "activo",
    };

    const result = await collection.insertOne(nuevoProducto);

    return NextResponse.json(
      {
        message: "Producto creado correctamente",
        data: {
          _id: result.insertedId,
          ...nuevoProducto,
        },
      },
      { status: 201 }
    );

  } catch {
    return NextResponse.json(
      { error: "Error al crear producto" },
      { status: 500 }
    );
  }
}