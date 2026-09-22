const BaseRepository = require('./BaseRepository');
const Repuesto = require('../models/Repuesto');

class RepuestoRepository extends BaseRepository {
  constructor() {
    super(Repuesto);
  }

  findByNombre(nombre) {
    return this.findAll().find((repuesto) => repuesto.nombre === nombre) || null;
  }
}

module.exports = RepuestoRepository;
