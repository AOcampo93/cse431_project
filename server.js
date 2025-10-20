// server.js
const express = require('express');
const cors = require('cors');
const mongodb = require('./db/connect');
const errorHandler = require('./middleware/error');

const swaggerUi = require('swagger-ui-express');
const rawSpec = require('./swagger.json');

const port = process.env.PORT || 8080;
const app = express();

// IMPORTANT: para que req.protocol refleje 'https' detrás del proxy de Render
app.enable('trust proxy');

/* ---------- Middlewares globales ---------- */
app.use(express.json());
app.use(
  cors({
    origin: true, // puedes restringir a ['https://TU-APP.onrender.com']
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.options('*', cors()); // responde preflights

/* ---------- Swagger UI con host/esquema dinámicos ---------- */
// 1) servir assets de Swagger UI
app.use('/api-docs', swaggerUi.serve);

// 2) ajustar host/esquema según la request (Render vs local)
app.use('/api-docs', (req, res, next) => {
  const spec = JSON.parse(JSON.stringify(rawSpec)); // clonar para no mutar el import
  const host = req.get('host');

  // Render envía x-forwarded-proto = 'https'
  const forwardedProto = (req.headers['x-forwarded-proto'] || '').split(',')[0];
  const protoRaw = forwardedProto || req.protocol || 'https';

  // Si por cualquier motivo llega 'http' en Render, forzamos https
  const proto =
    protoRaw === 'http' && host && host.endsWith('onrender.com') ? 'https' : protoRaw;

  spec.host = host;          // p.ej. cse341-week4-xxxx.onrender.com
  spec.schemes = [proto];    // https en Render, http en local

  return swaggerUi.setup(spec)(req, res, next);
});

// (Opcional) Exponer el JSON ya ajustado para verificación
app.get('/api-docs.json', (req, res) => {
  const spec = JSON.parse(JSON.stringify(rawSpec));
  const host = req.get('host');
  const forwardedProto = (req.headers['x-forwarded-proto'] || '').split(',')[0];
  const protoRaw = forwardedProto || req.protocol || 'https';
  const proto =
    protoRaw === 'http' && host && host.endsWith('onrender.com') ? 'https' : protoRaw;

  spec.host = host;
  spec.schemes = [proto];
  res.json(spec);
});

/* ---------- Rutas de la API ---------- */
// Register explicit routes for each resource.  These take precedence over the
// index router.  See ./routes for implementation details.
app.use('/users', require('./routes/users'));
app.use('/services', require('./routes/services'));
app.use('/providers', require('./routes/providers'));
app.use('/appointments', require('./routes/appointments'));

// Fallback to the default index router (currently exposes Swagger UI)
app.use('/', require('./routes'));

// Global error handler
app.use(errorHandler);

/* ---------- DB & server ---------- */
mongodb.initDb((err) => {
  if (err) {
    console.error('DB init error:', err);
  } else {
    app.listen(port, () => {
      console.log(`Connected to DB and listening on ${port}`);
    });
  }
});
