const BaseRepository = require('./BaseRepository');
const Reparacion = require('../models/Reparacion');

class ReparacionRepository extends BaseRepository {
  constructor() {
    super(Reparacion);
  }

  findByMotoId(motoId) {
    return this.findAll().filter((reparacion) => reparacion.motoId === motoId);
  }
}

module.exports = ReparacionRepository;
