const MotoService = require('../../../src/services/MotoService');
const ValidationError = require('../../../src/errors/ValidationError');
const NotFoundError = require('../../../src/errors/NotFoundError');

describe('MotoService', () => {
  let motoRepository;
  let motoService;

  beforeEach(() => {
    motoRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByPlaca: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    motoService = new MotoService(motoRepository);
  });

  describe('crear', () => {
    test('crea una moto cuando los datos son validos y la placa no existe', () => {
      motoRepository.findByPlaca.mockReturnValue(null);
      const motoCreada = { id: '1', placa: 'ABC123', marca: 'Yamaha', modelo: 'FZ' };
      motoRepository.create.mockReturnValue(motoCreada);

      const resultado = motoService.crear({ placa: 'ABC123', marca: 'Yamaha', modelo: 'FZ' });

      expect(motoRepository.create).toHaveBeenCalledWith({
        placa: 'ABC123',
        marca: 'Yamaha',
        modelo: 'FZ',
      });
      expect(resultado).toBe(motoCreada);
    });

    test('lanza ValidationError si faltan campos obligatorios', () => {
      expect(() => motoService.crear({ placa: 'ABC123' })).toThrow(ValidationError);
      expect(motoRepository.create).not.toHaveBeenCalled();
    });

    test('lanza ValidationError si la placa ya esta registrada', () => {
      motoRepository.findByPlaca.mockReturnValue({ id: '1', placa: 'ABC123' });

      expect(() =>
        motoService.crear({ placa: 'ABC123', marca: 'Yamaha', modelo: 'FZ' }),
      ).toThrow(ValidationError);
      expect(motoRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('obtenerPorId', () => {
    test('retorna la moto si existe', () => {
      const moto = { id: '1', placa: 'ABC123' };
      motoRepository.findById.mockReturnValue(moto);

      expect(motoService.obtenerPorId('1')).toBe(moto);
    });

    test('lanza NotFoundError si no existe', () => {
      motoRepository.findById.mockReturnValue(null);

      expect(() => motoService.obtenerPorId('x')).toThrow(NotFoundError);
    });
  });

  describe('actualizar', () => {
    test('actualiza la moto si existe', () => {
      motoRepository.findById.mockReturnValue({ id: '1' });
      motoRepository.update.mockReturnValue({ id: '1', marca: 'Honda' });

      const resultado = motoService.actualizar('1', { marca: 'Honda' });

      expect(motoRepository.update).toHaveBeenCalledWith('1', { marca: 'Honda' });
      expect(resultado.marca).toBe('Honda');
    });

    test('lanza NotFoundError si la moto no existe', () => {
      motoRepository.findById.mockReturnValue(null);

      expect(() => motoService.actualizar('x', { marca: 'Honda' })).toThrow(NotFoundError);
      expect(motoRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('eliminar', () => {
    test('elimina la moto si existe', () => {
      motoRepository.findById.mockReturnValue({ id: '1' });
      motoRepository.delete.mockReturnValue(true);

      const resultado = motoService.eliminar('1');

      expect(motoRepository.delete).toHaveBeenCalledWith('1');
      expect(resultado).toBe(true);
    });

    test('lanza NotFoundError si la moto no existe', () => {
      motoRepository.findById.mockReturnValue(null);

      expect(() => motoService.eliminar('x')).toThrow(NotFoundError);
    });
  });
});
