module.exports = (reparacionService) => ({
  crear(req, res, next) {
    try {
      const reparacion = reparacionService.crear(req.body);
      res.status(201).json(reparacion);
    } catch (err) {
      next(err);
    }
  },

  listar(req, res, next) {
    try {
      res.json(reparacionService.listar());
    } catch (err) {
      next(err);
    }
  },

  obtener(req, res, next) {
    try {
      res.json(reparacionService.obtenerPorId(req.params.id));
    } catch (err) {
      next(err);
    }
  },

  eliminar(req, res, next) {
    try {
      reparacionService.eliminar(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  agregarRepuesto(req, res, next) {
    try {
      const { repuestoId, cantidad } = req.body;
      const reparacion = reparacionService.agregarRepuesto(req.params.id, repuestoId, cantidad);
      res.json(reparacion);
    } catch (err) {
      next(err);
    }
  },

  cambiarEstado(req, res, next) {
    try {
      const { estado } = req.body;
      const reparacion = reparacionService.cambiarEstado(req.params.id, estado);
      res.json(reparacion);
    } catch (err) {
      next(err);
    }
  },
});
