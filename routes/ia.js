// iaRouter.js
import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { Temporal } from '@js-temporal/polyfill';
dotenv.config();

const iaRouter = express.Router();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Cache: (userId|YYYY-MM-DD|categoria) -> { mensaje, fecha, userId, categoria, puntaje, timestamp }
const dailyCache = new Map();

const VENTANA_HORAS = 1;     // “espera 1 hora”
const UMBRAL_CAMBIO = 0.5;   // cambio mínimo de puntaje para regenerar tras la hora (ajústalo)

function hoyEC() {
  return Temporal.Now.plainDateISO('America/Guayaquil').toString(); // YYYY-MM-DD local EC
}
function getUserId(req) {
  return req.session?.user?.cedula || req.user?.id || 'anon';
}
function nowMs() {
  return Temporal.Now.instant().epochMilliseconds; // instante estable
}

// (opcional) normalizar y acotar
function normCategoria(c) { return String(c || '').trim(); }
function clamp05(n) { const x = Number(n); return Number.isFinite(x) ? Math.min(5, Math.max(0, x)) : 0; }

iaRouter.post('/generar-mensaje', async (req, res) => {
  let { categoria, puntaje, force } = req.body || {};
  if (categoria == null || typeof puntaje !== 'number') {
    return res.status(400).json({ mensaje: "Se requiere 'categoria' y 'puntaje' numérico" });
  }

  categoria = normCategoria(categoria);
  puntaje   = clamp05(puntaje);

  const userId  = getUserId(req);
  const fecha   = hoyEC();
  const cacheKey = `${userId}|${fecha}|${categoria}`;
  const now      = nowMs();

  const cached = dailyCache.get(cacheKey);

  // 1) Si no hay cache aún -> generar y guardar
  if (!cached) {
    try {
      const mensaje = await generarMensaje(client, categoria, puntaje);
      dailyCache.set(cacheKey, { mensaje, fecha, userId, categoria, puntaje, timestamp: now });
      res.set('Cache-Control', 'no-store');
      return res.json({ mensaje, fuente: 'ia', fecha, categoria, puntaje_usado: puntaje });
    } catch (err) {
      console.error("Error IA:", err);
      return res.status(500).json({ mensaje: "Error generando mensaje motivacional" });
    }
  }

  // 2) Si hay cache y NO forzamos
  if (!force) {
    const horasPasadas = (now - cached.timestamp) / 3600000;

    if (horasPasadas < VENTANA_HORAS) {
      // Aún no cumple 1 hora: devolvemos SIEMPRE el mismo mensaje
      res.set('Cache-Control', 'no-store');
      return res.json({
        mensaje: cached.mensaje,
        fuente: 'cache',
        fecha,
        categoria,
        puntaje_usado: cached.puntaje,
        proximo_intento_en_min: Math.max(0, Math.ceil((VENTANA_HORAS - horasPasadas) * 60))
      });
    }

    // Ya pasó 1 hora: regenerar SOLO si el cambio de puntaje es significativo
    const cambio = Math.abs(puntaje - Number(cached.puntaje));
    if (cambio < UMBRAL_CAMBIO) {
      // No hubo cambio relevante: mantener el mismo mensaje (no tocamos timestamp)
      res.set('Cache-Control', 'no-store');
      return res.json({
        mensaje: cached.mensaje,
        fuente: 'cache',
        fecha,
        categoria,
        puntaje_usado: cached.puntaje,
        nota: 'Sin cambio significativo tras 1h; se mantiene mensaje'
      });
    }
  }

  // 3) Forzado o pasó 1h + cambio relevante -> regenerar
  try {
    const mensaje = await generarMensaje(client, categoria, puntaje);
    dailyCache.set(cacheKey, { mensaje, fecha, userId, categoria, puntaje, timestamp: now });
    res.set('Cache-Control', 'no-store');
    return res.json({
      mensaje,
      fuente: 'refresh',
      fecha,
      categoria,
      puntaje_usado: puntaje
    });
  } catch (err) {
    console.error("Error IA:", err);
    return res.status(500).json({ mensaje: "Error generando mensaje motivacional" });
  }
});

export default iaRouter;

// --- helper ---
async function generarMensaje(client, categoria, puntaje) {
  const prompt = `
    Eres un asistente que genera un mensaje motivacional POSITIVO y MUY breve,
    en una sola línea, sin emojis, para un usuario sobre su ${categoria}
    con puntaje ${puntaje} (0–5). Máximo 16 palabras.
  `.trim();

  const response = await client.responses.create({
    model: "gpt-4o-mini",
    input: prompt,
    temperature: 0.7
  });

  return (
    response.output_text ??
    response.output?.[0]?.content?.[0]?.text ??
    "¡Sigue adelante! Estás progresando."
  );
}


/*END POINT con generacion de mensajes por dia*/
// iaRouter.js
// import express from 'express';
// import OpenAI from 'openai';
// import dotenv from 'dotenv';
// import { Temporal } from '@js-temporal/polyfill';
// dotenv.config();

// const iaRouter = express.Router();
// const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// // ===== Cache en memoria (clave: userId|YYYY-MM-DD|categoria) usando el temporalapi de js=====
// // Nota: se pierde al reiniciar. Para producción, ver versión con BD.
// const dailyCache = new Map();

// function hoyEC() {
//   // Fecha local de Ecuador en ISO (YYYY-MM-DD)
//   return Temporal.Now.plainDateISO('America/Guayaquil').toString();
// }

// function getUserId(req) {
//   // Se usa el req.session.user?.cedula por el express session
//   return req.session?.user?.cedula || req.user?.id || 'anon';
// }

// /**
//  * POST /api/generar-mensaje
//  * Crea/recupera un mensaje motivacional por categoría (Puntualidad/Trato/Resolución)
//  * limitado a 1 por día por usuario y categoría.
//  * Body: { categoria: string, puntaje: number }
//  */
// iaRouter.post('/generar-mensaje', async (req, res) => {
//   const { categoria, puntaje } = req.body;

//   if (!categoria || typeof puntaje !== 'number') {
//     return res.status(400).json({ mensaje: "Se requiere 'categoria' y 'puntaje' numérico" });
//   }

//   const userId = getUserId(req);
//   const fecha = hoyEC();
//   const cacheKey = `${userId}|${fecha}|${categoria}`;

//   // 1) Si ya existe para hoy, devolverlo
//   const cached = dailyCache.get(cacheKey);
//   if (cached) {
//     res.set('Cache-Control', 'no-store');
//     return res.json({ mensaje: cached.mensaje, fuente: 'cache' });
//   }

//   // 2) Generarlo y guardar
//   try {
//     const prompt = `
//       Eres un asistente que genera un mensaje motivacional POSITIVO y MUY breve en una sola linea para un usuario sobre su ${categoria} con puntaje ${puntaje} (0–5).
//     `.trim();

//     const response = await client.responses.create({
//       model: "gpt-4o-mini",
//       input: prompt,
//       temperature: 0.7
//     });

//     const mensaje =
//       response.output_text ??
//       response.output?.[0]?.content?.[0]?.text ??
//       "¡Sigue adelante! Estás progresando.";

//     dailyCache.set(cacheKey, { mensaje, fecha, userId, categoria });

//     res.set('Cache-Control', 'no-store');
//     return res.json({ mensaje, fuente: 'ia' });
//   } catch (err) {
//     console.error("Error IA:", err);
//     return res.status(500).json({ mensaje: "Error generando mensaje motivacional" });
//   }
// });

// export default iaRouter;

/*END POINT DE MENSAJES CAMBIANDO A CADA REFRESH DE LA PAGINA*/
// import express from 'express';
// import OpenAI from 'openai';
// import dotenv from 'dotenv';
// dotenv.config();

// const iaRouter = express.Router();
// const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// // Asegúrate de tener app.use(express.json()) en tu app principal
// iaRouter.post('/generar-mensaje', async (req, res) => {
//   const { categoria, puntaje } = req.body;

//   if (!categoria || typeof puntaje !== 'number') {
//     return res.status(400).json({ mensaje: "Se requiere 'categoria' y 'puntaje' numérico" });
//   }

//   try {
//     const prompt = `
//       Eres un asistente que que genera un mensaje motivacional positivo y muy breve para un usuario sobre su ${categoria}
//       con puntaje ${puntaje} (rango 0–5).
//     `.trim();

//     const response = await client.responses.create({
//       model: "gpt-4o-mini",
//       input: prompt,
//       temperature: 0.7
//     });

//     // 2 maneras de extraer texto (usa la que prefieras)
//     const mensaje =
//       response.output_text ??
//       response.output?.[0]?.content?.[0]?.text ??
//       "¡Sigue adelante! Estás progresando.";

//     res.json({ mensaje });
//   } catch (err) {
//     console.error("Error IA:", err);
//     res.status(500).json({ mensaje: "Error generando mensaje motivacional" });
//   }
// });

// export default iaRouter;
