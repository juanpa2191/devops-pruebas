module.exports = (motoService) => ({
  crear(req, res, next) {
    try {
      const moto = motoService.crear(req.body);
      res.status(201).json(moto);
    } catch (err) {
      next(err);
    }
  },

  listar(req, res, next) {
    try {
      res.json(motoService.listar());
    } catch (err) {
      next(err);
    }
  },

  obtener(req, res, next) {
    try {
      res.json(motoService.obtenerPorId(req.params.id));
    } catch (err) {
      next(err);
    }
  },

  actualizar(req, res, next) {
    try {
      res.json(motoService.actualizar(req.params.id, req.body));
    } catch (err) {
      next(err);
    }
  },

  eliminar(req, res, next) {
    try {
      motoService.eliminar(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
});
