class Repuesto {
  constructor({ id, nombre, descripcion, precio, stock, categoria }) {
    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.precio = precio;
    this.stock = stock ?? 0;
    this.categoria = categoria;
  }
}

module.exports = Repuesto;
