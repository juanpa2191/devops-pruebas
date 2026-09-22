const ReparacionService = require('../../../src/services/ReparacionService');
const ValidationError = require('../../../src/errors/ValidationError');
const NotFoundError = require('../../../src/errors/NotFoundError');
const { ESTADOS_REPARACION } = require('../../../src/config/constants');

describe('ReparacionService', () => {
  let reparacionRepository;
  let motoRepository;
  let repuestoService;
  let reparacionService;

  beforeEach(() => {
    reparacionRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByMotoId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    motoRepository = {
      findById: jest.fn(),
    };
    repuestoService = {
      obtenerPorId: jest.fn(),
      reducirStock: jest.fn(),
    };
    reparacionService = new ReparacionService(reparacionRepository, motoRepository, repuestoService);
  });

  describe('crear', () => {
    test('crea una reparacion pendiente cuando la moto existe', () => {
      motoRepository.findById.mockReturnValue({ id: 'moto-1' });
      const reparacionCreada = { id: 'rep-1', motoId: 'moto-1', estado: ESTADOS_REPARACION.PENDIENTE };
      reparacionRepository.create.mockReturnValue(reparacionCreada);

      const resultado = reparacionService.crear({
        motoId: 'moto-1',
        descripcion: 'Cambio de aceite',
        costoManoObra: 20000,
      });

      expect(reparacionRepository.create).toHaveBeenCalledWith({
        motoId: 'moto-1',
        descripcion: 'Cambio de aceite',
        mecanico: undefined,
        costoManoObra: 20000,
        estado: ESTADOS_REPARACION.PENDIENTE,
        repuestos: [],
        costoTotal: 20000,
      });
      expect(resultado).toBe(reparacionCreada);
    });

    test('lanza ValidationError si faltan motoId o descripcion', () => {
      expect(() => reparacionService.crear({ descripcion: 'Cambio de aceite' })).toThrow(
        ValidationError,
      );
      expect(() => reparacionService.crear({ motoId: 'moto-1' })).toThrow(ValidationError);
    });

    test('lanza NotFoundError si la moto no existe', () => {
      motoRepository.findById.mockReturnValue(null);

      expect(() =>
        reparacionService.crear({ motoId: 'moto-x', descripcion: 'Cambio de aceite' }),
      ).toThrow(NotFoundError);
    });
  });

  describe('agregarRepuesto', () => {
    test('agrega el repuesto, reduce stock y recalcula el costo total', () => {
      const reparacion = {
        id: 'rep-1',
        estado: ESTADOS_REPARACION.PENDIENTE,
        repuestos: [],
        costoManoObra: 20000,
      };
      reparacionRepository.findById.mockReturnValue(reparacion);
      repuestoService.obtenerPorId.mockReturnValue({ id: 'rep-p1', nombre: 'Cadena', precio: 50000 });
      reparacionRepository.update.mockImplementation((id, datos) => ({ ...reparacion, ...datos }));

      const resultado = reparacionService.agregarRepuesto('rep-1', 'rep-p1', 2);

      expect(repuestoService.reducirStock).toHaveBeenCalledWith('rep-p1', 2);
      expect(reparacionRepository.update).toHaveBeenCalledWith('rep-1', {
        repuestos: [{ repuestoId: 'rep-p1', cantidad: 2, precioUnitario: 50000 }],
        costoTotal: 120000, // 2 * 50000 + 20000 de mano de obra
      });
      expect(resultado.costoTotal).toBe(120000);
    });

    test('lanza ValidationError si la reparacion ya esta completada', () => {
      reparacionRepository.findById.mockReturnValue({
        id: 'rep-1',
        estado: ESTADOS_REPARACION.COMPLETADA,
        repuestos: [],
        costoManoObra: 0,
      });

      expect(() => reparacionService.agregarRepuesto('rep-1', 'rep-p1', 1)).toThrow(
        ValidationError,
      );
      expect(repuestoService.reducirStock).not.toHaveBeenCalled();
    });

    test('lanza ValidationError si la reparacion esta cancelada', () => {
      reparacionRepository.findById.mockReturnValue({
        id: 'rep-1',
        estado: ESTADOS_REPARACION.CANCELADA,
        repuestos: [],
        costoManoObra: 0,
      });

      expect(() => reparacionService.agregarRepuesto('rep-1', 'rep-p1', 1)).toThrow(
        ValidationError,
      );
    });

    test('propaga el error si no hay stock suficiente', () => {
      reparacionRepository.findById.mockReturnValue({
        id: 'rep-1',
        estado: ESTADOS_REPARACION.PENDIENTE,
        repuestos: [],
        costoManoObra: 0,
      });
      repuestoService.obtenerPorId.mockReturnValue({ id: 'rep-p1', nombre: 'Cadena', precio: 50000 });
      repuestoService.reducirStock.mockImplementation(() => {
        throw new ValidationError('Stock insuficiente para el repuesto Cadena');
      });

      expect(() => reparacionService.agregarRepuesto('rep-1', 'rep-p1', 100)).toThrow(
        ValidationError,
      );
    });
  });

  describe('cambiarEstado', () => {
    test('actualiza el estado cuando es valido', () => {
      reparacionRepository.findById.mockReturnValue({ id: 'rep-1', estado: ESTADOS_REPARACION.PENDIENTE });
      reparacionRepository.update.mockReturnValue({
        id: 'rep-1',
        estado: ESTADOS_REPARACION.EN_PROCESO,
      });

      const resultado = reparacionService.cambiarEstado('rep-1', ESTADOS_REPARACION.EN_PROCESO);

      expect(reparacionRepository.update).toHaveBeenCalledWith('rep-1', {
        estado: ESTADOS_REPARACION.EN_PROCESO,
      });
      expect(resultado.estado).toBe(ESTADOS_REPARACION.EN_PROCESO);
    });

    test('lanza ValidationError si el estado no es valido', () => {
      expect(() => reparacionService.cambiarEstado('rep-1', 'estado_invalido')).toThrow(
        ValidationError,
      );
      expect(reparacionRepository.update).not.toHaveBeenCalled();
    });

    test('lanza NotFoundError si la reparacion no existe', () => {
      reparacionRepository.findById.mockReturnValue(null);

      expect(() =>
        reparacionService.cambiarEstado('rep-x', ESTADOS_REPARACION.EN_PROCESO),
      ).toThrow(NotFoundError);
    });
  });
});
