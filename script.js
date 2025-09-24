document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DO DOM ---
    const tabuleirosContainer = document.getElementById('tabuleiros-container');
    const tecladoContainer = document.getElementById('teclado-container');
    const notificacaoContainer = document.getElementById('notificacao-container');
    const modoBotoes = document.querySelectorAll('.modo-btn');
    const statsModal = document.getElementById('stats-modal');
    const statsBtn = document.getElementById('stats-btn');
    const closeStatsBtn = document.getElementById('close-stats-btn');
    const usernameModal = document.getElementById('username-modal');
    const usernameInput = document.getElementById('username-input');
    const usernameSaveBtn = document.getElementById('username-save-btn');

    // --- CONSTANTES ---
    const TAMANHO_PALAVRA = 5;
    const API_URL = '/api/game'; // <-- MUDOU PARA A API UNIFICADA

    // --- ESTADO GLOBAL DO JOGO ---
    let numeroDeJogos = 1;
    let numTentativas = 6;
    let palavrasSecretas = [];
    let jogosFinalizados = [];
    let tentativaAtual = 0;
    let letraAtual = 0;
    let jogoPausado = false;
    let palpiteAtual = Array(TAMANHO_PALAVRA).fill('');
    let stats = {};
    let username = '';

    // --- INICIALIZAÇÃO ---
    async function init() {
        limparEstado();
        configurarModo();
        
        jogoPausado = true;
        mostrarNotificacao("Buscando novas palavras...", 5000);
        await selecionarPalavrasOnline();
        jogoPausado = false;
        notificacaoContainer.innerHTML = '';
        
        criarEstruturaUI();
        adicionarListenersDeJogo();
        atualizarCelulaAtiva();
    }
    
    // FUNÇÃO ATUALIZADA PARA USAR A NOVA API
    async function selecionarPalavrasOnline() {
        try {
            const response = await fetch(`${API_URL}?action=getPalavras&count=${numeroDeJogos}`);
            if (!response.ok) throw new Error("Falha na rede");
            const palavras = await response.json();
            palavrasSecretas = palavras;
        } catch (error) {
            console.error("API falhou, usando backup local:", error);
            let disponiveis = [...RESPOSTAS]; // Usa o dicionario.js local como emergência
            for (let i = 0; i < numeroDeJogos; i++) {
                const index = Math.floor(Math.random() * disponiveis.length);
                palavrasSecretas.push(disponiveis.splice(index, 1)[0]);
            }
        }
    }

    // --- O RESTO DO CÓDIGO PERMANECE IDÊNTICO, MAS VAMOS INCLUIR TUDO PARA GARANTIR ---
    
    function limparEstado() {
        tentativaAtual = 0;
        letraAtual = 0;
        jogoPausado = false;
        palpiteAtual.fill('');
        palavrasSecretas = [];
        jogosFinalizados = [];
        tabuleirosContainer.innerHTML = '';
        tecladoContainer.innerHTML = '';
        document.removeEventListener('keydown', handleKeyPress);
    }

    function configurarModo() {
        if (numeroDeJogos === 2) numTentativas = 7;
        else if (numeroDeJogos === 4) numTentativas = 9;
        else numTentativas = 6;
        jogosFinalizados = Array(numeroDeJogos).fill(false);
    }

    function criarEstruturaUI() {
        tabuleirosContainer.className = `modo-${numeroDeJogos}`;
        for (let i = 0; i < numeroDeJogos; i++) criarTabuleiro(i);
        criarTeclado();
    }

    function criarTabuleiro(index) {
        const tabuleiro = document.createElement('div');
        tabuleiro.className = 'tabuleiro';
        tabuleiro.style.gridTemplateRows = `repeat(${numTentativas}, 1fr)`;
        for (let i = 0; i < numTentativas; i++) {
            const linha = document.createElement('div');
            linha.className = 'linha';
            for (let j = 0; j < TAMANHO_PALAVRA; j++) {
                const letraDiv = document.createElement('div');
                letraDiv.className = 'letra';
                letraDiv.id = `letra-${index}-${i}-${j}`;
                letraDiv.innerHTML = `<div class="frente"></div><div class="verso"></div>`;
                linha.appendChild(letraDiv);
            }
            tabuleiro.appendChild(linha);
        }
        tabuleirosContainer.appendChild(tabuleiro);
    }

    function criarTeclado() {
        const layout = ['q w e r t y u i o p', 'a s d f g h j k l', 'enter z x c v b n m backspace'];
        layout.forEach(linhaStr => {
            const linhaDiv = document.createElement('div');
            linhaDiv.className = 'linha-teclado';
            linhaStr.split(' ').forEach(key => {
                const tecla = document.createElement('button');
                tecla.className = 'tecla';
                tecla.textContent = key === 'backspace' ? '⌫' : key;
                tecla.dataset.key = key;
                if (key.length > 1) tecla.classList.add('grande');
                linhaDiv.appendChild(tecla);
            });
            tecladoContainer.appendChild(linhaDiv);
        });
    }

    function adicionarListenersGerais() {
        modoBotoes.forEach(btn => {
            btn.addEventListener('click', () => {
                modoBotoes.forEach(b => b.classList.remove('ativo'));
                btn.classList.add('ativo');
                numeroDeJogos = parseInt(btn.dataset.modo);
                init();
            });
        });
        statsBtn.addEventListener('click', exibirStats);
        closeStatsBtn.addEventListener('click', () => statsModal.style.display = 'none');
        window.addEventListener('click', (e) => {
            if (e.target == statsModal) statsModal.style.display = 'none';
        });
        usernameSaveBtn.addEventListener('click', salvarUsername);

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn, .tab-content').forEach(el => el.classList.remove('ativo'));
                btn.classList.add('ativo');
                document.getElementById(btn.dataset.tab).classList.add('ativo');
            });
        });
    }

    function adicionarListenersDeJogo() {
        document.addEventListener('keydown', handleKeyPress);
        tecladoContainer.addEventListener('click', (e) => {
            if (e.target.dataset.key) handleKeyPress({ key: e.target.dataset.key });
        });
    }

    function handleKeyPress(e) {
        if (jogoPausado) return;
        const key = e.key.toLowerCase();
        if (key === 'enter') submeterTentativa();
        else if (key === 'backspace') apagarLetra();
        else if (key.length === 1 && key >= 'a' && key <= 'z') adicionarLetra(key);
    }
    
    function adicionarLetra(letra) {
        if (letraAtual < TAMANHO_PALAVRA) {
            palpiteAtual[letraAtual] = letra;
            for (let i = 0; i < numeroDeJogos; i++) {
                if (!jogosFinalizados[i]) {
                    const celula = document.getElementById(`letra-${i}-${tentativaAtual}-${letraAtual}`);
                    if(celula) celula.querySelector('.frente').textContent = letra;
                }
            }
            letraAtual++;
            atualizarCelulaAtiva();
        }
    }

    function apagarLetra() {
        if (letraAtual > 0) {
            letraAtual--;
            palpiteAtual[letraAtual] = '';
            for (let i = 0; i < numeroDeJogos; i++) {
                if (!jogosFinalizados[i]) {
                    const celula = document.getElementById(`letra-${i}-${tentativaAtual}-${letraAtual}`);
                     if(celula) celula.querySelector('.frente').textContent = '';
                }
            }
            atualizarCelulaAtiva();
        }
    }
    
    function atualizarCelulaAtiva() {
        document.querySelectorAll('.letra.ativa').forEach(c => c.classList.remove('ativa'));
        if (letraAtual < TAMANHO_PALAVRA && !jogoPausado) {
            for (let i = 0; i < numeroDeJogos; i++) {
                if (!jogosFinalizados[i]) {
                    const celula = document.getElementById(`letra-${i}-${tentativaAtual}-${letraAtual}`);
                    if (celula) celula.classList.add('ativa');
                }
            }
        }
    }
    
    function submeterTentativa() {
        if (letraAtual < TAMANHO_PALAVRA) return mostrarNotificacao("Palavra incompleta!");
        const palpiteStr = palpiteAtual.join('');
        if (!DICIONARIO.includes(palpiteStr)) return mostrarNotificacao("Palavra não existe!");
        
        jogoPausado = true;
        verificarPalpite(palpiteStr);
    }

    function verificarPalpite(palpiteStr) {
        const corTeclado = {};
        for (let i = 0; i < numeroDeJogos; i++) {
            if (jogosFinalizados[i]) continue;
            const palavraSecreta = palavrasSecretas[i];
            const resultados = Array(TAMANHO_PALAVRA).fill('');
            const contagem = {};
            for (const letra of palavraSecreta) contagem[letra] = (contagem[letra] || 0) + 1;
            for (let j = 0; j < TAMANHO_PALAVRA; j++) { if (palpiteStr[j] === palavraSecreta[j]) { resultados[j] = 'certo'; contagem[palpiteStr[j]]--; } }
            for (let j = 0; j < TAMANHO_PALAVRA; j++) { if (resultados[j]) continue; if (palavraSecreta.includes(palpiteStr[j]) && contagem[palpiteStr[j]] > 0) { resultados[j] = 'lugar-errado'; contagem[palpiteStr[j]]--; } else { resultados[j] = 'nao-existe'; } }
            for (let j = 0; j < TAMANHO_PALAVRA; j++) {
                setTimeout(() => {
                    const celula = document.getElementById(`letra-${i}-${tentativaAtual}-${j}`);
                    if (celula) {
                        celula.classList.add('revelada', resultados[j]);
                        celula.querySelector('.verso').textContent = palpiteStr[j];
                    }
                }, j * 250);
                const statusAtual = corTeclado[palpiteStr[j]];
                if (!statusAtual || statusAtual !== 'certo') corTeclado[palpiteStr[j]] = resultados[j];
            }
            if (palpiteStr === palavraSecreta) jogosFinalizados[i] = true;
        }

        setTimeout(() => {
            const vitoria = jogosFinalizados.every(v => v);
            const derrota = !vitoria && tentativaAtual === numTentativas - 1;
            atualizarTeclado(corTeclado);

            if (vitoria || derrota) {
                atualizarStats(vitoria);
                jogoPausado = true;
                if(vitoria) {
                    mostrarNotificacao("Você venceu!", 2000);
                    submeterPontuacaoOnline(tentativaAtual + 1);
                } else {
                    const palavrasNaoAdivinhadas = palavrasSecretas.filter((_, i) => !jogosFinalizados[i]).join(', ').toUpperCase();
                    mostrarNotificacao(`Perdeu! Palavras: ${palavrasNaoAdivinhadas}`, 10000);
                }
                setTimeout(exibirStats, 2000);
            } else {
                tentativaAtual++;
                letraAtual = 0;
                palpiteAtual.fill('');
                jogoPausado = false;
                atualizarCelulaAtiva();
            }
        }, TAMANHO_PALAVRA * 250);
    }
    
    function atualizarTeclado(cores) { for (const [letra, status] of Object.entries(cores)) { const tecla = document.querySelector(`.tecla[data-key="${letra}"]`); if (tecla) { tecla.classList.remove('certo', 'lugar-errado', 'nao-existe'); tecla.classList.add(status); } } }
    function mostrarNotificacao(mensagem, duracao = 2000) { const n = document.createElement('div'); n.className = 'notificacao'; n.textContent = mensagem; notificacaoContainer.innerHTML = ''; notificacaoContainer.appendChild(n); setTimeout(() => n.remove(), duracao); }

    function checarUsername() {
        username = localStorage.getItem('termoUsername');
        if (!username) {
            usernameModal.style.display = 'flex';
        } else {
            init();
        }
    }

    function salvarUsername() {
        const nomeInput = usernameInput.value.trim();
        if (nomeInput && nomeInput.length >= 3) {
            username = nomeInput;
            localStorage.setItem('termoUsername', username);
            usernameModal.style.display = 'none';
            init();
        } else {
            mostrarNotificacao("Nome inválido (mín. 3 letras)");
        }
    }

    function carregarStats() {
        const statsJSON = localStorage.getItem('termoStats');
        stats = statsJSON ? JSON.parse(statsJSON) : {};
    }

    function salvarStats() {
        localStorage.setItem('termoStats', JSON.stringify(stats));
    }

    function getStatsAtuais() {
        if (!stats[numeroDeJogos]) {
            stats[numeroDeJogos] = { jogados: 0, vitorias: 0, seqAtual: 0, melhorSeq: 0, distribuicao: {} };
        }
        return stats[numeroDeJogos];
    }

    function atualizarStats(vitoria) {
        const s = getStatsAtuais();
        s.jogados++;
        if (vitoria) {
            s.vitorias++;
            s.seqAtual++;
            s.melhorSeq = Math.max(s.melhorSeq, s.seqAtual);
            const linhaVitoria = tentativaAtual + 1;
            s.distribuicao[linhaVitoria] = (s.distribuicao[linhaVitoria] || 0) + 1;
        } else {
            s.seqAtual = 0;
        }
        salvarStats();
    }
    
    function exibirStats() {
        const s = getStatsAtuais();
        document.getElementById('username-display').textContent = username;
        document.getElementById('stat-jogados').textContent = s.jogados;
        const percVitorias = s.jogados > 0 ? Math.round((s.vitorias / s.jogados) * 100) : 0;
        document.getElementById('stat-vitorias').textContent = `${percVitorias}%`;
        document.getElementById('stat-sequencia').textContent = s.seqAtual;
        document.getElementById('stat-melhor-seq').textContent = s.melhorSeq;
        
        const containerDist = document.getElementById('distribuicao-container');
        containerDist.innerHTML = '';
        const maxVitoriasDist = Math.max(...Object.values(s.distribuicao), 0);
        
        for (let i = 1; i <= numTentativas; i++) {
            const vitorias = s.distribuicao[i] || 0;
            const perc = maxVitoriasDist > 0 ? (vitorias / maxVitoriasDist) * 100 : 0;
            containerDist.innerHTML += `<div class="dist-linha"><div class="dist-label">${i}</div><div class="dist-barra" style="width: ${perc || 5}%;">${vitorias}</div></div>`;
        }
        buscarRankingOnline();
        statsModal.style.display = 'flex';
    }

    async function buscarRankingOnline() {
        const container = document.getElementById('ranking-online-container');
        container.innerHTML = '<p>Carregando ranking...</p>';
        try {
            const response = await fetch(`${API_URL}?modo=${numeroDeJogos}`);
            if (!response.ok) throw new Error('Erro ao buscar ranking do servidor.');
            const ranking = await response.json();
            
            if (ranking.length === 0) {
                container.innerHTML = '<p>Nenhuma pontuação registrada. Seja o primeiro!</p>';
                return;
            }

            let rankingHTML = '<table><tr><th>#</th><th>Nome</th><th>Tentativas</th></tr>';
            ranking.forEach((item, index) => {
                rankingHTML += `<tr><td>${index + 1}</td><td>${item.nome}</td><td>${item.tentativas}</td></tr>`;
            });
            rankingHTML += '</table>';
            container.innerHTML = rankingHTML;

        } catch (error) {
            container.innerHTML = `<p style="color: #ff8a80;">Não foi possível carregar o ranking.</p><p style="font-size: 0.8rem; color: #818384;">${error.message}</p>`;
        }
    }

    async function submeterPontuacaoOnline(tentativas) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome: username,
                    modo: numeroDeJogos,
                    tentativas: tentativas
                })
            });
            if (!response.ok) throw new Error('Erro ao enviar pontuação.');
            console.log('Pontuação enviada!');
        } catch (error) {
            console.error(error.message);
        }
    }
    
    // --- INÍCIO DO JOGO ---
    carregarStats();
    adicionarListenersGerais();
    checarUsername();
});