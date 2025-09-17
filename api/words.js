// api/words.js
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    const p = path.join(process.cwd(), 'public', 'words');
    const sols = JSON.parse(fs.readFileSync(path.join(p, 'solutions_ptbr.json'), 'utf8'));
    const vals = JSON.parse(fs.readFileSync(path.join(p, 'valid_ptbr.json'), 'utf8'));
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).json({ solutions: sols, valid: vals });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao ler listas de palavras', detail: String(err) });
  }
}