import { ObjectId } from "mongodb";

export interface ProductoPedido {
  productoId: ObjectId;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
}

export interface ClientePedido {
  clienteId: ObjectId;
  nombre: string;
  telefono: string;
}

export interface Pedido {
  _id?: ObjectId;

  cliente: ClientePedido;

  productos: ProductoPedido[];

  total: number;

  fechaCreacion: Date;
  fechaLimitePago: Date;

  estado: "pendiente" | "pagado" | "retrasado" | "pagado_con_retraso";
}