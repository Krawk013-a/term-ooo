import { createClient } from '@supabase/supabase-js';

// Lista de palavras gigante embutida para não depender de busca online
const PALAVRAS_BACKUP = ["sagaz","âmago","negro","êxito","termo","nobre","moral","afeto","plena","sonho","justo","honra","lapso","dengo","tenro","fluxo","hábil","ideia","sutil","poder","dever","regra","temor","ânimo","ápice","ânsia","louco","mundo","dogma","genro","saúde","senso","jeito","razão","valor","legal","sonso","forte","vital","calma","vivaz","crise","união","amigo","feliz","mesmo","assim","causa","pleno","audaz","fácil","sério","pudor","praxe","vigor","burro","bruma","ímpio","ápice","sanar","digno","todos","cisma","comum","fazer","lugar","culto","temer","ainda","ceder","ponto","saber","coçar","velho","nunca","sorte","olhar","xeque","doçura","ardil","gleba","servo","parvo","livro","ontem","óbvio","noite","ajuda","algoz","fugaz","prole","coito","caixa","leito","platô","vezes","aliás","corja","átomo","ébrio","salve","prumo","paixão","louça","fixar","grato","tendo","cisão","falar","álibi","farol","bravo","dança","fosso","sesta","ordem","linda","gesto","pobre","dotar","verbo","vital","afora","trama","visar","brisa","fraco","obter","impor","pompa","fusão","censo","julgo","ameno","manso","inato","sério","garbo","valia","logro","chulo","pardo","plebe","ápice","lesse","chato","clava","relva","casto","óbolo","cruel","óbito","seita","autor","risco","coser","basal","parco","dócil","lápis","rival","solto","viril","grata","brega","mútua","veraz","turba","hábil","sesta","vezes","rubro","povoa","favor","turvo","pensa","certo","supor","zelar","sonho","abrir","fluir","puder","morar"];

export default async function handler(request, response) {
    // 1. --- CONTROLE DE PALAVRAS ---
    if (request.query.action === 'getPalavras') {
        try {
            const { count = 10 } = request.query;
            const palavrasEmbaralhadas = PALAVRAS_BACKUP.sort(() => 0.5 - Math.random());
            const palavrasSelecionadas = palavrasEmbaralhadas.slice(0, count);
            return response.status(200).json(palavrasSelecionadas);
        } catch (error) {
            return response.status(500).json({ error: "Erro ao selecionar palavras." });
        }
    }

    // 2. --- CONTROLE DE RANKING ---
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
    );

    if (request.method === 'POST') {
        try {
            const { nome, modo, tentativas } = request.body;
            if (!nome || !modo || !tentativas) throw new Error('Dados incompletos.');
            
            const { error } = await supabase.from('ranking').insert({ nome, modo, tentativas });
            if (error) throw error;

            return response.status(200).json({ success: true });
        } catch (error) {
            return response.status(500).json({ error: error.message });
        }
    }

    if (request.method === 'GET') {
        try {
            const { modo } = request.query;
            if (!modo) throw new Error('Modo não especificado.');

            const { data, error } = await supabase
                .from('ranking')
                .select('nome, tentativas')
                .eq('modo', modo)
                .order('tentativas', { ascending: true })
                .limit(10);
            
            if (error) throw error;
            return response.status(200).json(data);
        } catch (error) {
            return response.status(500).json({ error: error.message });
        }
    }

    // Se nenhuma ação for encontrada
    return response.status(404).json({ error: 'Ação não encontrada.' });
}