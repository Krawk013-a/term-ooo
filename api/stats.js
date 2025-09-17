// api/stats.js
// Suporta GET (retorna todas stats) e POST (envia nova estatística individual)

import fs from 'fs';
import path from 'path';

const STATS_FILE = path.join(process.cwd(), 'data', 'stats.json');

async function readFileSafe() {
  try {
    if (!fs.existsSync(STATS_FILE)) {
      fs.mkdirSync(path.dirname(STATS_FILE), { recursive: true });
      fs.writeFileSync(STATS_FILE, JSON.stringify({ entries: [] }, null, 2));
    }
    const raw = fs.readFileSync(STATS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return { entries: [] };
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Retorna as estatísticas (arquivo)
    const data = await readFileSafe();
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    // Espera um body JSON com: { playerId?, date, won: boolean, attempts, distribution }
    const body = req.body;

    // Validações básicas
    if (!body || !body.date) return res.status(400).json({ error: 'Formato inválido' });

    // Opção 1: gravar em arquivo (WARNING: não persistente no Vercel serverless em longo prazo)
    try {
      const data = await readFileSafe();
      data.entries.push(body);
      fs.writeFileSync(STATS_FILE, JSON.stringify(data, null, 2));
      return res.status(201).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: 'Falha ao gravar stats', detail: String(e) });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}