import { ObjectId } from "mongodb";

export interface Client {
    _id?: ObjectId,
    nombre: string;
    telefono: string;
    estado: "activo" | "inactivo";
}