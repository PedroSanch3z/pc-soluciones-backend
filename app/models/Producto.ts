import { ObjectId } from "mongodb";

export interface Producto {
  _id?: ObjectId;
  nombre: string;
  precio: number;
  stock: number;
  status: "activo" | "inactivo";
}