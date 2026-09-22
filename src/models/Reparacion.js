const { ESTADOS_REPARACION } = require('../config/constants');

class Reparacion {
  constructor({
    id,
    motoId,
    descripcion,
    mecanico,
    estado,
    fecha,
    repuestos,
    costoManoObra,
    costoTotal,
  }) {
    this.id = id;
    this.motoId = motoId;
    this.descripcion = descripcion;
    this.mecanico = mecanico;
    this.estado = estado || ESTADOS_REPARACION.PENDIENTE;
    this.fecha = fecha || new Date().toISOString();
    this.repuestos = repuestos || [];
    this.costoManoObra = costoManoObra || 0;
    this.costoTotal = costoTotal ?? this.costoManoObra;
  }
}

module.exports = Reparacion;
