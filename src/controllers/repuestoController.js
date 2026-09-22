module.exports = (repuestoService) => ({
  crear(req, res, next) {
    try {
      const repuesto = repuestoService.crear(req.body);
      res.status(201).json(repuesto);
    } catch (err) {
      next(err);
    }
  },

  listar(req, res, next) {
    try {
      res.json(repuestoService.listar());
    } catch (err) {
      next(err);
    }
  },

  obtener(req, res, next) {
    try {
      res.json(repuestoService.obtenerPorId(req.params.id));
    } catch (err) {
      next(err);
    }
  },

  actualizar(req, res, next) {
    try {
      res.json(repuestoService.actualizar(req.params.id, req.body));
    } catch (err) {
      next(err);
    }
  },

  eliminar(req, res, next) {
    try {
      repuestoService.eliminar(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  aumentarStock(req, res, next) {
    try {
      const { cantidad } = req.body;
      res.json(repuestoService.aumentarStock(req.params.id, cantidad));
    } catch (err) {
      next(err);
    }
  },

  reducirStock(req, res, next) {
    try {
      const { cantidad } = req.body;
      res.json(repuestoService.reducirStock(req.params.id, cantidad));
    } catch (err) {
      next(err);
    }
  },
});
