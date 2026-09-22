const express = require('express');
const errorHandler = require('./middlewares/errorHandler');

const MotoRepository = require('./repositories/MotoRepository');
const RepuestoRepository = require('./repositories/RepuestoRepository');
const ReparacionRepository = require('./repositories/ReparacionRepository');

const MotoService = require('./services/MotoService');
const RepuestoService = require('./services/RepuestoService');
const ReparacionService = require('./services/ReparacionService');

const motoControllerFactory = require('./controllers/motoController');
const repuestoControllerFactory = require('./controllers/repuestoController');
const reparacionControllerFactory = require('./controllers/reparacionController');

const motoRoutesFactory = require('./routes/motoRoutes');
const repuestoRoutesFactory = require('./routes/repuestoRoutes');
const reparacionRoutesFactory = require('./routes/reparacionRoutes');

function createApp() {
  const app = express();
  app.use(express.json());

  // Capa de acceso a datos
  const motoRepository = new MotoRepository();
  const repuestoRepository = new RepuestoRepository();
  const reparacionRepository = new ReparacionRepository();

  // Capa de logica de negocio
  const motoService = new MotoService(motoRepository);
  const repuestoService = new RepuestoService(repuestoRepository);
  const reparacionService = new ReparacionService(
    reparacionRepository,
    motoRepository,
    repuestoService,
  );

  // Capa de presentacion (HTTP)
  const motoController = motoControllerFactory(motoService);
  const repuestoController = repuestoControllerFactory(repuestoService);
  const reparacionController = reparacionControllerFactory(reparacionService);

  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/motos', motoRoutesFactory(motoController));
  app.use('/api/repuestos', repuestoRoutesFactory(repuestoController));
  app.use('/api/reparaciones', reparacionRoutesFactory(reparacionController));

  app.use((req, res) => res.status(404).json({ error: 'Recurso no encontrado' }));
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
