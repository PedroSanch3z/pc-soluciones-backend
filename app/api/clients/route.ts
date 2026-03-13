import { getClientesCollection } from "@/app/lib/collections";
import { Client } from "@/app/models/Clients";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Number(searchParams.get("page")) || 1;
    const nombre = searchParams.get("nombre") || "";

    const limit = 6;
    const skip = (page - 1) * limit;

    const collection = await getClientesCollection();

    const filtro = nombre
      ? { nombre: { $regex: nombre, $options: "i" } }
      : {};

    const total = await collection.countDocuments(filtro);

    const clientes = await collection
      .find(filtro)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      data: clientes,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
        limit,
      },
    });

  } catch (error) {
    console.error("Error al buscar clientes:", error);

    return NextResponse.json(
      { error: "Error al buscar clientes" },
      { status: 500 }
    );
  }
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, telefono } = body;

    if (!nombre || !telefono) {
      return NextResponse.json(
        { error: "Falta nombre o telefono" },
        { status: 400 }
      );
    }

    const collection = await getClientesCollection();

    const nuevoCliente: Client = {
      nombre,
      telefono,
      estado: "activo",
    };

    const result = await collection.insertOne(nuevoCliente);

    return NextResponse.json(
      {
        message: "Cliente guardado correctamente",
        data: {
          _id: result.insertedId,
          ...nuevoCliente,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error al guardar cliente:", error);

    return NextResponse.json(
      { error: "Error al guardar cliente" },
      { status: 500 }
    );
  }
}