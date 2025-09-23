import { createClient } from '@supabase/supabase-js';

// Função principal que a Vercel executa
export default async function handler(request, response) {
    // Cria o "cliente" Supabase usando as chaves guardadas na Vercel
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
    );

    // Se o método for POST, o jogo está enviando uma nova pontuação
    if (request.method === 'POST') {
        try {
            const { nome, modo, tentativas } = request.body;

            if (!nome || !modo || !tentativas) {
                return response.status(400).json({ error: 'Dados incompletos.' });
            }

            // Insere os dados na tabela 'ranking' do Supabase
            const { error } = await supabase
                .from('ranking')
                .insert({ nome, modo, tentativas });

            if (error) throw error;

            return response.status(200).json({ success: true });

        } catch (error) {
            console.error('Erro no Supabase (POST):', error.message);
            return response.status(500).json({ error: 'Erro ao salvar pontuação.' });
        }
    }

    // Se o método for GET, o jogo está pedindo para ver o ranking
    if (request.method === 'GET') {
        try {
            const { modo } = request.query;

            if (!modo) {
                return response.status(400).json({ error: 'Modo de jogo não especificado.' });
            }

            // Pede ao Supabase os dados da tabela 'ranking'
            const { data, error } = await supabase
                .from('ranking')
                .select('nome, tentativas') // Pega só as colunas que precisamos
                .eq('modo', modo)             // Filtrando pelo modo de jogo
                .order('tentativas', { ascending: true }) // Ordena do menor para o maior
                .limit(10);                   // Pega só os 10 melhores

            if (error) throw error;
            
            return response.status(200).json(data);

        } catch (error) {
            console.error('Erro no Supabase (GET):', error.message);
            return response.status(500).json({ error: 'Erro ao buscar ranking.' });
        }
    }

    return response.status(405).json({ error: 'Método não permitido.' });
}
