const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const PORT = process.env.SMOKE_TEST_PORT || 4500;
const MAX_INTENTOS = 20;
const INTERVALO_MS = 300;

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function verificarHealth() {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:${PORT}/health`, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200 && JSON.parse(data).status === 'ok') {
          resolve();
        } else {
          reject(new Error(`Respuesta inesperada de /health: ${res.statusCode} ${data}`));
        }
      });
    });
    req.on('error', reject);
  });
}

async function main() {
  const serverPath = path.join(__dirname, '..', 'src', 'server.js');
  const proceso = spawn(process.execPath, [serverPath], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'inherit',
  });

  let procesoTermino = false;
  proceso.on('exit', () => {
    procesoTermino = true;
  });

  try {
    let exito = false;
    for (let intento = 0; intento < MAX_INTENTOS && !procesoTermino; intento += 1) {
      // eslint-disable-next-line no-await-in-loop
      await esperar(INTERVALO_MS);
      try {
        // eslint-disable-next-line no-await-in-loop
        await verificarHealth();
        exito = true;
        break;
      } catch (err) {
        // seguimos reintentando hasta agotar MAX_INTENTOS
      }
    }

    if (!exito) {
      throw new Error('El servidor no respondio correctamente en /health dentro del tiempo esperado');
    }

    console.log(`Smoke test OK: el servidor respondio en /health (puerto ${PORT})`);
  } finally {
    if (!procesoTermino) {
      proceso.kill();
    }
  }
}

main().catch((err) => {
  console.error('Smoke test FALLIDO:', err.message);
  process.exit(1);
});
