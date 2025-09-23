import { createClient } from '@vercel/kv';

export default async function handler(request, response) {
    const debugInfo = {
        timestamp: new Date().toISOString(),
        connectionStatus: 'Não iniciado',
        envVars: {
            KV_REST_API_URL: process.env.KV_REST_API_URL ? 'Encontrada' : 'NÃO ENCONTRADA',
            KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? 'Encontrada' : 'NÃO ENCONTRADA',
        },
        writeTest: 'Não tentado',
        readTest: 'Não tentado',
    };

    // 1. Verifica se as variáveis de ambiente estão presentes
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
        debugInfo.connectionStatus = 'Falha: Variáveis de ambiente não configuradas.';
        return response.status(500).json(debugInfo);
    }

    try {
        // 2. Tenta conectar
        const kv = createClient({
            url: process.env.KV_REST_API_URL,
            token: process.env.KV_REST_API_TOKEN,
        });
        debugInfo.connectionStatus = 'Conexão estabelecida com sucesso!';

        // 3. Tenta escrever um valor de teste
        const testKey = 'debug:test';
        const testValue = { message: 'Conexão OK', timestamp: Date.now() };
        await kv.set(testKey, JSON.stringify(testValue));
        debugInfo.writeTest = 'Sucesso ao escrever valor de teste.';

        // 4. Tenta ler o valor de volta
        const readValueRaw = await kv.get(testKey);
        const readValue = JSON.parse(readValueRaw);
        if (readValue.message === 'Conexão OK') {
            debugInfo.readTest = 'Sucesso ao ler o valor de teste.';
        } else {
            throw new Error('Valor lido não corresponde ao valor escrito.');
        }

        // Se tudo deu certo, retorna sucesso
        return response.status(200).json(debugInfo);

    } catch (error) {
        // Se qualquer passo falhar, captura o erro
        debugInfo.connectionStatus = 'Falha na operação com o banco de dados.';
        debugInfo.error = error.message;
        return response.status(500).json(debugInfo);
    }
}