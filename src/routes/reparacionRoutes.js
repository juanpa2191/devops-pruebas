const express = require('express');

module.exports = (reparacionController) => {
  const router = express.Router();

  router.post('/', reparacionController.crear);
  router.get('/', reparacionController.listar);
  router.get('/:id', reparacionController.obtener);
  router.delete('/:id', reparacionController.eliminar);
  router.post('/:id/repuestos', reparacionController.agregarRepuesto);
  router.patch('/:id/estado', reparacionController.cambiarEstado);

  return router;
};
