const createApp = require('./app');

const PORT = process.env.PORT || 3030;
const app = createApp();

app.listen(PORT, () => {
  console.log(`Servidor del taller de motos escuchando en el puerto ${PORT}`);
});
