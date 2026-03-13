import clientPromise from "./mongodb";
import { Client } from "../models/Clients";
import { Producto } from "../models/Producto";
import { Servicio } from "../models/Servicio";
import { Pedido } from "../models/Pedido";

export async function getClientesCollection() {
  const client = await clientPromise
  const db = client.db();
  return db.collection<Client>("clientes");
}

export async function getProductosCollection() {
  const client = await clientPromise
  const db = client.db()
  return db.collection<Producto>("productos")
}
export async function getServiciosCollection() {
  const client = await clientPromise
  const db = client.db()
  return db.collection<Servicio>("servicios")
}

export async function getPedidosCollection() {
  const client = await clientPromise
  const db = client.db()
  return db.collection<Pedido>("pedidos")
}