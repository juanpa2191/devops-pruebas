const express = require('express');

module.exports = (motoController) => {
  const router = express.Router();

  router.post('/', motoController.crear);
  router.get('/', motoController.listar);
  router.get('/:id', motoController.obtener);
  router.put('/:id', motoController.actualizar);
  router.delete('/:id', motoController.eliminar);

  return router;
};
