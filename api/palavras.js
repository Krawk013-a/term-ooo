// A função principal que a Vercel vai executar.
export default async function handler(request, response) {
    // Define a quantidade de palavras que queremos buscar
    const { count = 10 } = request.query; // Pega o 'count' da URL, padrão é 10

    try {
        // URL de uma lista de palavras de 5 letras mantida pela comunidade no GitHub
        const url = 'https://raw.githubusercontent.com/fserb/pt-br/master/dicionario/txt/palavras_de_5_letras.txt';
        
        // Faz a requisição para buscar a lista de palavras
        const palavrasResponse = await fetch(url);
        if (!palavrasResponse.ok) {
            throw new Error('Não foi possível buscar a lista de palavras.');
        }

        // Converte a resposta para texto
        const textoLista = await palavrasResponse.text();
        
        // Quebra o texto em um array de palavras, removendo espaços vazios
        const todasAsPalavras = textoLista.split('\n').filter(p => p.trim().length === 5).map(p => p.trim());

        // Embaralha o array para pegar palavras aleatórias
        const palavrasEmbaralhadas = todasAsPalavras.sort(() => 0.5 - Math.random());
        
        // Pega a quantidade de palavras que pedimos (ex: 10)
        const palavrasSelecionadas = palavrasEmbaralhadas.slice(0, count);

        // Retorna as palavras selecionadas como resposta
        return response.status(200).json(palavrasSelecionadas);

    } catch (error) {
        console.error('Erro ao buscar palavras:', error);
        // Se der erro, retorna uma lista de palavras de backup para o jogo não quebrar
        const backup = ['sagaz', 'âmago', 'negro', 'êxito', 'termo', 'nobre', 'moral', 'afeto', 'plena', 'sonho'];
        return response.status(500).json(backup);
    }
}