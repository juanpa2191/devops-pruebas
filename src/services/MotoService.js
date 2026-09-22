const ValidationError = require('../errors/ValidationError');
const NotFoundError = require('../errors/NotFoundError');

class MotoService {
  constructor(motoRepository) {
    this.motoRepository = motoRepository;
  }

  crear(datos) {
    this._validar(datos);
    const existente = this.motoRepository.findByPlaca(datos.placa);
    if (existente) {
      throw new ValidationError(`Ya existe una moto registrada con la placa ${datos.placa}`);
    }
    return this.motoRepository.create(datos);
  }

  listar() {
    return this.motoRepository.findAll();
  }

  obtenerPorId(id) {
    const moto = this.motoRepository.findById(id);
    if (!moto) {
      throw new NotFoundError(`Moto con id ${id} no encontrada`);
    }
    return moto;
  }

  actualizar(id, datos) {
    this.obtenerPorId(id);
    return this.motoRepository.update(id, datos);
  }

  eliminar(id) {
    this.obtenerPorId(id);
    return this.motoRepository.delete(id);
  }

  _validar(datos) {
    if (!datos.placa || !datos.marca || !datos.modelo) {
      throw new ValidationError('Placa, marca y modelo son obligatorios');
    }
  }
}

module.exports = MotoService;
