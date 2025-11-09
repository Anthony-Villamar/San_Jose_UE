import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const iaRouter = express.Router();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Asegúrate de tener app.use(express.json()) en tu app principal
iaRouter.post('/generar-mensaje', async (req, res) => {
  const { categoria, puntaje } = req.body;

  if (!categoria || typeof puntaje !== 'number') {
    return res.status(400).json({ mensaje: "Se requiere 'categoria' y 'puntaje' numérico" });
  }

  try {
    const prompt = `
      Eres un asistente que que genera un mensaje motivacional positivo y muy breve para un usuario sobre su ${categoria}
      con puntaje ${puntaje} (rango 0–5).
    `.trim();

    const response = await client.responses.create({
      model: "gpt-4o-mini",           // también puedes usar "gpt-4.1-mini"
      input: prompt,
      temperature: 0.7
    });

    // 2 maneras de extraer texto (usa la que prefieras)
    const mensaje =
      response.output_text ??
      response.output?.[0]?.content?.[0]?.text ??
      "¡Sigue adelante! Estás progresando.";

    res.json({ mensaje });
  } catch (err) {
    console.error("Error IA:", err);
    res.status(500).json({ mensaje: "Error generando mensaje motivacional" });
  }
});

export default iaRouter;
