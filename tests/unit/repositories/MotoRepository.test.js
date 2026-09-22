const MotoRepository = require('../../../src/repositories/MotoRepository');

describe('MotoRepository', () => {
  let repository;

  beforeEach(() => {
    repository = new MotoRepository();
  });

  test('create genera un id y almacena la moto', () => {
    const moto = repository.create({ placa: 'ABC123', marca: 'Yamaha', modelo: 'FZ' });

    expect(moto.id).toBeDefined();
    expect(repository.findAll()).toHaveLength(1);
  });

  test('findById retorna null si no existe', () => {
    expect(repository.findById('no-existe')).toBeNull();
  });

  test('findByPlaca encuentra la moto correcta', () => {
    repository.create({ placa: 'ABC123', marca: 'Yamaha', modelo: 'FZ' });
    repository.create({ placa: 'XYZ789', marca: 'Honda', modelo: 'CB1' });

    const encontrada = repository.findByPlaca('XYZ789');

    expect(encontrada).not.toBeNull();
    expect(encontrada.marca).toBe('Honda');
  });

  test('update modifica los campos indicados', () => {
    const moto = repository.create({ placa: 'ABC123', marca: 'Yamaha', modelo: 'FZ' });

    const actualizada = repository.update(moto.id, { marca: 'Honda' });

    expect(actualizada.marca).toBe('Honda');
    expect(actualizada.placa).toBe('ABC123');
  });

  test('delete elimina la moto y retorna true', () => {
    const moto = repository.create({ placa: 'ABC123', marca: 'Yamaha', modelo: 'FZ' });

    expect(repository.delete(moto.id)).toBe(true);
    expect(repository.findById(moto.id)).toBeNull();
  });
});
