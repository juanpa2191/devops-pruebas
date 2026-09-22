const ValidationError = require('../errors/ValidationError');
const NotFoundError = require('../errors/NotFoundError');
const { ESTADOS_REPARACION } = require('../config/constants');

class ReparacionService {
  constructor(reparacionRepository, motoRepository, repuestoService) {
    this.reparacionRepository = reparacionRepository;
    this.motoRepository = motoRepository;
    this.repuestoService = repuestoService;
  }

  crear(datos) {
    if (!datos.motoId || !datos.descripcion) {
      throw new ValidationError('motoId y descripcion son obligatorios');
    }
    const moto = this.motoRepository.findById(datos.motoId);
    if (!moto) {
      throw new NotFoundError(`Moto con id ${datos.motoId} no encontrada`);
    }
    const costoManoObra = datos.costoManoObra || 0;
    return this.reparacionRepository.create({
      motoId: datos.motoId,
      descripcion: datos.descripcion,
      mecanico: datos.mecanico,
      costoManoObra,
      estado: ESTADOS_REPARACION.PENDIENTE,
      repuestos: [],
      costoTotal: costoManoObra,
    });
  }

  listar() {
    return this.reparacionRepository.findAll();
  }

  obtenerPorId(id) {
    const reparacion = this.reparacionRepository.findById(id);
    if (!reparacion) {
      throw new NotFoundError(`Reparacion con id ${id} no encontrada`);
    }
    return reparacion;
  }

  agregarRepuesto(reparacionId, repuestoId, cantidad) {
    const reparacion = this.obtenerPorId(reparacionId);
    if (reparacion.estado === ESTADOS_REPARACION.COMPLETADA) {
      throw new ValidationError('No se pueden agregar repuestos a una reparacion completada');
    }
    if (reparacion.estado === ESTADOS_REPARACION.CANCELADA) {
      throw new ValidationError('No se pueden agregar repuestos a una reparacion cancelada');
    }

    const repuesto = this.repuestoService.obtenerPorId(repuestoId);
    this.repuestoService.reducirStock(repuestoId, cantidad);

    const nuevoItem = { repuestoId, cantidad, precioUnitario: repuesto.precio };
    const repuestosActualizados = [...reparacion.repuestos, nuevoItem];
    const costoRepuestos = repuestosActualizados.reduce(
      (acumulado, item) => acumulado + item.precioUnitario * item.cantidad,
      0,
    );

    return this.reparacionRepository.update(reparacionId, {
      repuestos: repuestosActualizados,
      costoTotal: costoRepuestos + reparacion.costoManoObra,
    });
  }

  cambiarEstado(reparacionId, nuevoEstado) {
    const estadosValidos = Object.values(ESTADOS_REPARACION);
    if (!estadosValidos.includes(nuevoEstado)) {
      throw new ValidationError(`Estado invalido: ${nuevoEstado}`);
    }
    this.obtenerPorId(reparacionId);
    return this.reparacionRepository.update(reparacionId, { estado: nuevoEstado });
  }

  eliminar(id) {
    this.obtenerPorId(id);
    return this.reparacionRepository.delete(id);
  }
}

module.exports = ReparacionService;
