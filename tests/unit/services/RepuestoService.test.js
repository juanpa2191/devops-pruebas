const RepuestoService = require('../../../src/services/RepuestoService');
const ValidationError = require('../../../src/errors/ValidationError');
const NotFoundError = require('../../../src/errors/NotFoundError');

describe('RepuestoService', () => {
  let repuestoRepository;
  let repuestoService;

  beforeEach(() => {
    repuestoRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByNombre: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    repuestoService = new RepuestoService(repuestoRepository);
  });

  describe('crear', () => {
    test('crea un repuesto con stock por defecto 0', () => {
      repuestoRepository.create.mockImplementation((datos) => ({ id: '1', ...datos }));

      const resultado = repuestoService.crear({ nombre: 'Cadena', precio: 50000 });

      expect(repuestoRepository.create).toHaveBeenCalledWith({
        nombre: 'Cadena',
        precio: 50000,
        stock: 0,
      });
      expect(resultado.stock).toBe(0);
    });

    test('lanza ValidationError si falta el nombre o el precio', () => {
      expect(() => repuestoService.crear({ precio: 100 })).toThrow(ValidationError);
      expect(() => repuestoService.crear({ nombre: 'Cadena' })).toThrow(ValidationError);
    });

    test('lanza ValidationError si el precio es negativo', () => {
      expect(() => repuestoService.crear({ nombre: 'Cadena', precio: -10 })).toThrow(
        ValidationError,
      );
    });
  });

  describe('aumentarStock', () => {
    test('incrementa el stock correctamente', () => {
      repuestoRepository.findById.mockReturnValue({ id: '1', nombre: 'Cadena', stock: 5 });
      repuestoRepository.update.mockReturnValue({ id: '1', nombre: 'Cadena', stock: 8 });

      const resultado = repuestoService.aumentarStock('1', 3);

      expect(repuestoRepository.update).toHaveBeenCalledWith('1', { stock: 8 });
      expect(resultado.stock).toBe(8);
    });

    test('lanza ValidationError si la cantidad no es positiva', () => {
      repuestoRepository.findById.mockReturnValue({ id: '1', nombre: 'Cadena', stock: 5 });

      expect(() => repuestoService.aumentarStock('1', 0)).toThrow(ValidationError);
      expect(() => repuestoService.aumentarStock('1', -2)).toThrow(ValidationError);
    });
  });

  describe('reducirStock', () => {
    test('reduce el stock cuando hay suficiente', () => {
      repuestoRepository.findById.mockReturnValue({ id: '1', nombre: 'Cadena', stock: 5 });
      repuestoRepository.update.mockReturnValue({ id: '1', nombre: 'Cadena', stock: 2 });

      const resultado = repuestoService.reducirStock('1', 3);

      expect(repuestoRepository.update).toHaveBeenCalledWith('1', { stock: 2 });
      expect(resultado.stock).toBe(2);
    });

    test('lanza ValidationError si el stock es insuficiente', () => {
      repuestoRepository.findById.mockReturnValue({ id: '1', nombre: 'Cadena', stock: 2 });

      expect(() => repuestoService.reducirStock('1', 5)).toThrow(ValidationError);
      expect(repuestoRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('obtenerPorId', () => {
    test('lanza NotFoundError si el repuesto no existe', () => {
      repuestoRepository.findById.mockReturnValue(null);

      expect(() => repuestoService.obtenerPorId('x')).toThrow(NotFoundError);
    });
  });
});
