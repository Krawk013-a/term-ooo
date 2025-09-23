document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DO DOM ---
    const tabuleirosContainer = document.getElementById('tabuleiros-container');
    const tecladoContainer = document.getElementById('teclado-container');
    const notificacaoContainer = document.getElementById('notificacao-container');
    const modoBotoes = document.querySelectorAll('.modo-btn');
    const statsModal = document.getElementById('stats-modal');
    const statsBtn = document.getElementById('stats-btn');
    const closeStatsBtn = document.getElementById('close-stats-btn');

    // --- CONSTANTES ---
    const TAMANHO_PALAVRA = 5;

    // --- ESTADO GLOBAL DO JOGO ---
    let numeroDeJogos = 1;
    let numTentativas = 6;
    let palavrasSecretas = [];
    let jogosFinalizados = [];
    let tentativaAtual = 0;
    let letraAtual = 0;
    let jogoPausado = false;
    let palpiteAtual = Array(TAMANHO_PALAVRA).fill('');
    let stats = {}; // Objeto para guardar as estatísticas

    // --- INICIALIZAÇÃO ---
    function init() {
        limparEstado();
        configurarModo();
        selecionarPalavras();
        criarEstruturaUI();
        adicionarListeners();
    }

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

    function selecionarPalavras() {
        let disponiveis = [...RESPOSTAS];
        for (let i = 0; i < numeroDeJogos; i++) {
            const index = Math.floor(Math.random() * disponiveis.length);
            palavrasSecretas.push(disponiveis.splice(index, 1)[0]);
        }
    }

    function criarEstruturaUI() {
        tabuleirosContainer.className = `modo-${numeroDeJogos}`;
        for (let i = 0; i < numeroDeJogos; i++) {
            criarTabuleiro(i);
        }
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
                linha.innerHTML += `<div class="letra" id="letra-${index}-${i}-${j}"><div class="frente"></div><div class="verso"></div></div>`;
            }
            tabuleiro.appendChild(linha);
        }
        tabuleirosContainer.appendChild(tabuleiro);
    }

    function criarTeclado() {
        const layout = [
            'q w e r t y u i o p', 'a s d f g h j k l', 'enter z x c v b n m backspace'
        ];
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

    // --- EVENTOS E INPUT ---
    function adicionarListeners() {
        document.addEventListener('keydown', handleKeyPress);
        tecladoContainer.addEventListener('click', (e) => {
            if (e.target.dataset.key) handleKeyPress({ key: e.target.dataset.key });
        });
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
    }

    function handleKeyPress({ key }) {
        if (jogoPausado) return;
        const keyLower = key.toLowerCase();
        if (keyLower === 'enter') submeterTentativa();
        else if (keyLower === 'backspace') apagarLetra();
        else if (keyLower.length === 1 && keyLower >= 'a' && keyLower <= 'z') adicionarLetra(keyLower);
    }

    function adicionarLetra(letra) {
        if (letraAtual < TAMANHO_PALAVRA) {
            palpiteAtual[letraAtual] = letra;
            for (let i = 0; i < numeroDeJogos; i++) {
                if (!jogosFinalizados[i]) {
                    const celula = document.getElementById(`letra-${i}-${tentativaAtual}-${letraAtual}`);
                    celula.querySelector('.frente').textContent = letra;
                    celula.classList.add('ativa');
                }
            }
            letraAtual++;
        }
    }

    function apagarLetra() {
        if (letraAtual > 0) {
            letraAtual--;
            palpiteAtual[letraAtual] = '';
            for (let i = 0; i < numeroDeJogos; i++) {
                if (!jogosFinalizados[i]) {
                    const celula = document.getElementById(`letra-${i}-${tentativaAtual}-${letraAtual}`);
                    celula.querySelector('.frente').textContent = '';
                    celula.classList.remove('ativa');
                }
            }
        }
    }

    // --- LÓGICA DO JOGO ---
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
            
            for (let j = 0; j < TAMANHO_PALAVRA; j++) {
                if (palpiteStr[j] === palavraSecreta[j]) {
                    resultados[j] = 'certo';
                    contagem[palpiteStr[j]]--;
                }
            }
            for (let j = 0; j < TAMANHO_PALAVRA; j++) {
                if (resultados[j]) continue;
                if (palavraSecreta.includes(palpiteStr[j]) && contagem[palpiteStr[j]] > 0) {
                    resultados[j] = 'lugar-errado';
                    contagem[palpiteStr[j]]--;
                } else {
                    resultados[j] = 'nao-existe';
                }
            }
            
            for (let j = 0; j < TAMANHO_PALAVRA; j++) {
                setTimeout(() => {
                    const celula = document.getElementById(`letra-${i}-${tentativaAtual}-${j}`);
                    celula.classList.remove('ativa');
                    celula.classList.add('revelada', resultados[j]);
                    celula.querySelector('.verso').textContent = palpiteStr[j];
                }, j * 250);

                const statusAtual = corTeclado[palpiteStr[j]];
                if (!statusAtual || statusAtual !== 'certo') corTeclado[palpiteStr[j]] = resultados[j];
            }

            if (palpiteStr === palavraSecreta) jogosFinalizados[i] = true;
        }

        setTimeout(() => {
            atualizarTeclado(corTeclado);
            const vitoria = jogosFinalizados.every(v => v);
            const derrota = !vitoria && tentativaAtual === numTentativas - 1;

            if (vitoria || derrota) {
                atualizarStats(vitoria);
                jogoPausado = true;
                if(vitoria) mostrarNotificacao("Você venceu!", 5000);
                else mostrarNotificacao(`Perdeu! Palavras: ${palavrasSecretas.join(', ').toUpperCase()}`, 10000);
                setTimeout(exibirStats, 2000); // Mostra stats após 2s
            } else {
                tentativaAtual++;
                letraAtual = 0;
                palpiteAtual.fill('');
                jogoPausado = false;
            }
        }, TAMANHO_PALAVRA * 250);
    }

    function atualizarTeclado(cores) {
        for (const [letra, status] of Object.entries(cores)) {
            const tecla = document.querySelector(`.tecla[data-key="${letra}"]`);
            if (tecla) {
                tecla.classList.remove('certo', 'lugar-errado', 'nao-existe');
                tecla.classList.add(status);
            }
        }
    }

    function mostrarNotificacao(mensagem, duracao = 2000) {
        const notificacao = document.createElement('div');
        notificacao.className = 'notificacao';
        notificacao.textContent = mensagem;
        notificacaoContainer.innerHTML = '';
        notificacaoContainer.appendChild(notificacao);
        setTimeout(() => notificacao.remove(), duracao);
    }

    // --- LÓGICA DE ESTATÍSTICAS ---
    function carregarStats() {
        const statsJSON = localStorage.getItem('termoStats');
        stats = statsJSON ? JSON.parse(statsJSON) : {};
    }

    function salvarStats() {
        localStorage.setItem('termoStats', JSON.stringify(stats));
    }

    function getStatsAtuais() {
        if (!stats[numeroDeJogos]) { // Se não existe stats para o modo atual, cria
            stats[numeroDeJogos] = {
                jogados: 0,
                vitorias: 0,
                seqAtual: 0,
                melhorSeq: 0,
                distribuicao: {}
            };
        }
        return stats[numeroDeJogos];
    }

    function atualizarStats(vitoria) {
        const statsAtuais = getStatsAtuais();
        statsAtuais.jogados++;
        if (vitoria) {
            statsAtuais.vitorias++;
            statsAtuais.seqAtual++;
            statsAtuais.melhorSeq = Math.max(statsAtuais.melhorSeq, statsAtuais.seqAtual);
            const linhaVitoria = tentativaAtual + 1;
            statsAtuais.distribuicao[linhaVitoria] = (statsAtuais.distribuicao[linhaVitoria] || 0) + 1;
        } else {
            statsAtuais.seqAtual = 0;
        }
        salvarStats();
    }
    
    function exibirStats() {
        const statsAtuais = getStatsAtuais();
        document.getElementById('stat-jogados').textContent = statsAtuais.jogados;
        const percVitorias = statsAtuais.jogados > 0 ? Math.round((statsAtuais.vitorias / statsAtuais.jogados) * 100) : 0;
        document.getElementById('stat-vitorias').textContent = `${percVitorias}%`;
        document.getElementById('stat-sequencia').textContent = statsAtuais.seqAtual;
        document.getElementById('stat-melhor-seq').textContent = statsAtuais.melhorSeq;
        
        const containerDist = document.getElementById('distribuicao-container');
        containerDist.innerHTML = '';
        const maxVitoriasDist = Math.max(...Object.values(statsAtuais.distribuicao), 0);
        
        for (let i = 1; i <= numTentativas; i++) {
            const vitorias = statsAtuais.distribuicao[i] || 0;
            const perc = maxVitoriasDist > 0 ? (vitorias / maxVitoriasDist) * 100 : 0;
            const linhaHTML = `
                <div class="dist-linha">
                    <div class="dist-label">${i}</div>
                    <div class="dist-barra" style="width: ${perc}%;">
                        ${vitorias}
                    </div>
                </div>
            `;
            containerDist.innerHTML += linhaHTML;
        }
        statsModal.style.display = 'flex';
    }

    // --- INÍCIO DO JOGO ---
    carregarStats();
    init();
});
