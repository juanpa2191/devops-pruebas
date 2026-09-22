const express = require('express');

module.exports = (repuestoController) => {
  const router = express.Router();

  router.post('/', repuestoController.crear);
  router.get('/', repuestoController.listar);
  router.get('/:id', repuestoController.obtener);
  router.put('/:id', repuestoController.actualizar);
  router.delete('/:id', repuestoController.eliminar);
  router.patch('/:id/aumentar-stock', repuestoController.aumentarStock);
  router.patch('/:id/reducir-stock', repuestoController.reducirStock);

  return router;
};
