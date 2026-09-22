const RepuestoRepository = require('../../../src/repositories/RepuestoRepository');

describe('RepuestoRepository', () => {
  let repository;

  beforeEach(() => {
    repository = new RepuestoRepository();
  });

  test('create asigna stock 0 por defecto cuando no se especifica', () => {
    const repuesto = repository.create({ nombre: 'Cadena', precio: 50000 });

    expect(repuesto.stock).toBe(0);
  });

  test('findByNombre encuentra el repuesto correcto', () => {
    repository.create({ nombre: 'Cadena', precio: 50000 });
    repository.create({ nombre: 'Pastillas de freno', precio: 30000 });

    const encontrado = repository.findByNombre('Pastillas de freno');

    expect(encontrado).not.toBeNull();
    expect(encontrado.precio).toBe(30000);
  });

  test('update permite modificar el stock', () => {
    const repuesto = repository.create({ nombre: 'Cadena', precio: 50000, stock: 5 });

    const actualizado = repository.update(repuesto.id, { stock: 10 });

    expect(actualizado.stock).toBe(10);
  });
});
