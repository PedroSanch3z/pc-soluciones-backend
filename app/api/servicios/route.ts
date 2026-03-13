import { getServiciosCollection } from "@/app/lib/collections";
import { Servicio } from "@/app/models/Servicio";
import { NextResponse } from "next/server";

export async function GET(request: Request){
    try {
    const { searchParams } = new URL(request.url);
    const nombre = searchParams.get("nombre");

    const collection = await getServiciosCollection();

    let servicios;

    if (nombre) {
      servicios = await collection
        .find({
          nombre: { $regex: nombre, $options: "i" },
        })
        .toArray();
    } else {
      servicios = await collection.find().toArray();
    }

    return NextResponse.json({
      message: nombre
        ? `Buscando servicios con nombre ${nombre}`
        : "Buscando todos los servicios",
      data: servicios,
    });

  } catch {
    return NextResponse.json(
      { error: "Error al obtener servicios" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, descripcion, precio} = body;

    if (!nombre || !descripcion || precio == null) {
      return NextResponse.json(
        { error: "Faltan datos" },
        { status: 400 }
      );
    }

    const collection = await getServiciosCollection();

    const nuevoServicio: Servicio = {
      nombre,
      descripcion,
      precio: Number(precio),
    };

    const result = await collection.insertOne(nuevoServicio);

    return NextResponse.json(
      {
        message: "Servicio creado correctamente",
        data: {
          _id: result.insertedId,
          ...nuevoServicio,
        },
      },
      { status: 201 }
    );

  } catch {
    return NextResponse.json(
      { error: "Error al crear servicio" },
      { status: 500 }
    );
  }
}