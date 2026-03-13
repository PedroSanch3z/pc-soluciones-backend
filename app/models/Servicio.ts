import { ObjectId } from "mongodb";

export interface Servicio {
    _id?: ObjectId,
    nombre: string,
    descripcion: string,
    precio: number
}