const BaseRepository = require('./BaseRepository');
const Moto = require('../models/Moto');

class MotoRepository extends BaseRepository {
  constructor() {
    super(Moto);
  }

  findByPlaca(placa) {
    return this.findAll().find((moto) => moto.placa === placa) || null;
  }
}

module.exports = MotoRepository;
