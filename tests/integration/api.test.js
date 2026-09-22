const request = require('supertest');
const createApp = require('../../src/app');

describe('API del taller de motos (integracion end-to-end)', () => {
  const app = createApp();
  let motoId;
  let repuestoId;
  let reparacionId;

  test('GET /health responde ok', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('POST /api/motos crea una moto', async () => {
    const res = await request(app)
      .post('/api/motos')
      .send({ placa: 'INT001', marca: 'Suzuki', modelo: 'GN125' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    motoId = res.body.id;
  });

  test('POST /api/motos retorna 400 si faltan campos obligatorios', async () => {
    const res = await request(app).post('/api/motos').send({ placa: 'INT002' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('POST /api/repuestos crea un repuesto con stock inicial', async () => {
    const res = await request(app)
      .post('/api/repuestos')
      .send({ nombre: 'Bujia', precio: 15000, stock: 10 });

    expect(res.status).toBe(201);
    expect(res.body.stock).toBe(10);
    repuestoId = res.body.id;
  });

  test('POST /api/reparaciones crea una reparacion pendiente para una moto existente', async () => {
    const res = await request(app)
      .post('/api/reparaciones')
      .send({ motoId, descripcion: 'Revision general', costoManoObra: 30000 });

    expect(res.status).toBe(201);
    expect(res.body.estado).toBe('pendiente');
    expect(res.body.costoTotal).toBe(30000);
    reparacionId = res.body.id;
  });

  test('POST /api/reparaciones retorna 404 si la moto no existe', async () => {
    const res = await request(app)
      .post('/api/reparaciones')
      .send({ motoId: 'no-existe', descripcion: 'Cambio de aceite' });

    expect(res.status).toBe(404);
  });

  test('POST /api/reparaciones/:id/repuestos agrega el repuesto, reduce stock y recalcula el costo', async () => {
    const res = await request(app)
      .post(`/api/reparaciones/${reparacionId}/repuestos`)
      .send({ repuestoId, cantidad: 2 });

    expect(res.status).toBe(200);
    expect(res.body.costoTotal).toBe(30000 + 2 * 15000);

    const repuestoRes = await request(app).get(`/api/repuestos/${repuestoId}`);
    expect(repuestoRes.body.stock).toBe(8);
  });

  test('POST /api/reparaciones/:id/repuestos retorna 400 si el stock es insuficiente', async () => {
    const res = await request(app)
      .post(`/api/reparaciones/${reparacionId}/repuestos`)
      .send({ repuestoId, cantidad: 999 });

    expect(res.status).toBe(400);
  });

  test('PATCH /api/reparaciones/:id/estado cambia el estado de la reparacion', async () => {
    const res = await request(app)
      .patch(`/api/reparaciones/${reparacionId}/estado`)
      .send({ estado: 'completada' });

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('completada');
  });

  test('no permite agregar repuestos a una reparacion completada', async () => {
    const res = await request(app)
      .post(`/api/reparaciones/${reparacionId}/repuestos`)
      .send({ repuestoId, cantidad: 1 });

    expect(res.status).toBe(400);
  });

  test('GET /api/motos/:id retorna 404 si no existe', async () => {
    const res = await request(app).get('/api/motos/no-existe');

    expect(res.status).toBe(404);
  });

  test('GET /ruta-inexistente retorna 404', async () => {
    const res = await request(app).get('/ruta-inexistente');

    expect(res.status).toBe(404);
  });
});
