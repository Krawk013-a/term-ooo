// Importa o cliente do Vercel KV, que já vem pré-instalado em projetos Vercel
import { createClient } from '@vercel/kv';

// O handler principal da nossa função
export default async function handler(request, response) {
    // Conecta ao banco de dados KV usando as Environment Variables que a Vercel configurou
    const kv = createClient({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });

    // Se a requisição for um POST, alguém está enviando uma nova pontuação
    if (request.method === 'POST') {
        try {
            const { nome, modo, tentativas } = request.body;

            // Validação básica dos dados recebidos
            if (!nome || !modo || !tentativas) {
                return response.status(400).json({ error: 'Dados incompletos.' });
            }

            // A chave do ranking no banco de dados será, por exemplo, 'ranking:1' para o modo Clássico
            const rankingKey = `ranking:${modo}`;
            const score = { nome, tentativas, date: new Date().toISOString() };

            // Adiciona a nova pontuação à lista (ranking) no banco de dados
            // O 'lpush' adiciona ao início da lista. 'zadd' seria melhor para rankings ordenados, mas lpush é mais simples.
            await kv.lpush(rankingKey, JSON.stringify(score));
            
            // Limita o ranking aos top 50 para não crescer indefinidamente
            await kv.ltrim(rankingKey, 0, 49);

            return response.status(200).json({ success: true });

        } catch (error) {
            return response.status(500).json({ error: 'Erro ao salvar pontuação.' });
        }
    }

    // Se a requisição for um GET, alguém está pedindo para ver o ranking
    if (request.method === 'GET') {
        try {
            const { modo } = request.query; // Ex: /api/ranking?modo=1

            if (!modo) {
                return response.status(400).json({ error: 'Modo de jogo não especificado.' });
            }

            const rankingKey = `ranking:${modo}`;
            
            // Pega os 10 primeiros scores da lista
            const topScoresRaw = await kv.lrange(rankingKey, 0, 9);
            const topScores = topScoresRaw.map(score => JSON.parse(score));

            // Ordena por tentativas (menor primeiro)
            topScores.sort((a, b) => a.tentativas - b.tentativas);
            
            return response.status(200).json(topScores);

        } catch (error) {
            return response.status(500).json({ error: 'Erro ao buscar ranking.' });
        }
    }

    // Se for qualquer outro método (PUT, DELETE, etc.), retorna um erro.
    return response.status(405).json({ error: 'Método não permitido.' });
}