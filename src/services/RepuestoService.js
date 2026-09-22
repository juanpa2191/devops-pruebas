const ValidationError = require('../errors/ValidationError');
const NotFoundError = require('../errors/NotFoundError');

class RepuestoService {
  constructor(repuestoRepository) {
    this.repuestoRepository = repuestoRepository;
  }

  crear(datos) {
    this._validar(datos);
    return this.repuestoRepository.create({ ...datos, stock: datos.stock ?? 0 });
  }

  listar() {
    return this.repuestoRepository.findAll();
  }

  obtenerPorId(id) {
    const repuesto = this.repuestoRepository.findById(id);
    if (!repuesto) {
      throw new NotFoundError(`Repuesto con id ${id} no encontrado`);
    }
    return repuesto;
  }

  actualizar(id, datos) {
    this.obtenerPorId(id);
    return this.repuestoRepository.update(id, datos);
  }

  eliminar(id) {
    this.obtenerPorId(id);
    return this.repuestoRepository.delete(id);
  }

  aumentarStock(id, cantidad) {
    const repuesto = this.obtenerPorId(id);
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      throw new ValidationError('La cantidad debe ser un numero mayor a cero');
    }
    return this.repuestoRepository.update(id, { stock: repuesto.stock + cantidad });
  }

  reducirStock(id, cantidad) {
    const repuesto = this.obtenerPorId(id);
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      throw new ValidationError('La cantidad debe ser un numero mayor a cero');
    }
    if (repuesto.stock < cantidad) {
      throw new ValidationError(`Stock insuficiente para el repuesto ${repuesto.nombre}`);
    }
    return this.repuestoRepository.update(id, { stock: repuesto.stock - cantidad });
  }

  _validar(datos) {
    if (!datos.nombre || datos.precio == null) {
      throw new ValidationError('Nombre y precio son obligatorios');
    }
    if (datos.precio < 0) {
      throw new ValidationError('El precio no puede ser negativo');
    }
  }
}

module.exports = RepuestoService;
