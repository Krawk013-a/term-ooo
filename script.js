document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DO DOM ---
    const tabuleirosContainer = document.getElementById('tabuleiros-container');
    const tecladoContainer = document.getElementById('teclado-container');
    const notificacaoContainer = document.getElementById('notificacao-container');
    const modoBotoes = document.querySelectorAll('.modo-btn');

    // --- CONSTANTES DO JOGO ---
    const TAMANHO_PALAVRA = 5;

    // --- ESTADO DO JOGO ---
    let numeroDeJogos = 1;
    let numTentativas = 6;
    let palavrasSecretas = [];
    let tabuleiroStates = []; // Armazena as letras de cada tabuleiro
    let jogosFinalizados = []; // Controla quais jogos já foram vencidos
    let tentativaAtual = 0;
    let letraAtual = 0;
    let jogoPausado = false; // Bloqueia input durante animações/fim de jogo

    // --- INICIALIZAÇÃO ---
    function init() {
        limparTudo();
        configurarModoDeJogo();
        selecionarPalavrasSecretas();

        tabuleirosContainer.className = `modo-${numeroDeJogos}`;

        for (let i = 0; i < numeroDeJogos; i++) {
            tabuleiroStates.push(Array(numTentativas).fill(null).map(() => Array(TAMANHO_PALAVRA).fill('')));
            jogosFinalizados.push(false);
            criarTabuleiro(i);
        }

        criarTeclado();
        adicionarListeners();
    }

    function limparTudo() {
        tentativaAtual = 0;
        letraAtual = 0;
        jogoPausado = false;
        palavrasSecretas = [];
        tabuleiroStates = [];
        jogosFinalizados = [];
        tabuleirosContainer.innerHTML = '';
        tecladoContainer.innerHTML = '';
        document.removeEventListener('keydown', handleKeyPress);
    }

    function configurarModoDeJogo() {
        if (numeroDeJogos === 2) numTentativas = 7;
        else if (numeroDeJogos === 4) numTentativas = 9;
        else numTentativas = 6;
    }

    function selecionarPalavrasSecretas() {
        let respostasDisponiveis = [...RESPOSTAS];
        for (let i = 0; i < numeroDeJogos; i++) {
            const index = Math.floor(Math.random() * respostasDisponiveis.length);
            palavrasSecretas.push(respostasDisponiveis.splice(index, 1)[0]);
        }
    }

    // --- CRIAÇÃO DA UI ---
    function criarTabuleiro(index) {
        const tabuleiroDiv = document.createElement('div');
        tabuleiroDiv.className = 'tabuleiro';
        tabuleiroDiv.style.gridTemplateRows = `repeat(${numTentativas}, 1fr)`;

        for (let i = 0; i < numTentativas; i++) {
            const linhaDiv = document.createElement('div');
            linhaDiv.className = 'linha';
            for (let j = 0; j < TAMANHO_PALAVRA; j++) {
                const letraDiv = document.createElement('div');
                letraDiv.className = 'letra';
                letraDiv.id = `letra-${index}-${i}-${j}`;
                letraDiv.innerHTML = `<div class="frente"></div><div class="verso"></div>`;
                linhaDiv.appendChild(letraDiv);
            }
            tabuleiroDiv.appendChild(linhaDiv);
        }
        tabuleirosContainer.appendChild(tabuleiroDiv);
    }

    function criarTeclado() {
        const layout = [
            ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
            ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
            ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace']
        ];
        layout.forEach(linha => {
            const linhaDiv = document.createElement('div');
            linhaDiv.className = 'linha-teclado';
            linha.forEach(key => {
                const tecla = document.createElement('button');
                tecla.className = 'tecla';
                tecla.textContent = key === 'backspace' ? '⌫' : key;
                tecla.dataset.key = key;
                if (key === 'enter' || key === 'backspace') tecla.classList.add('grande');
                linhaDiv.appendChild(tecla);
            });
            tecladoContainer.appendChild(linhaDiv);
        });
    }

    // --- EVENTOS E INPUT ---
    function adicionarListeners() {
        document.addEventListener('keydown', handleKeyPress);
        tecladoContainer.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                handleKeyPress({ key: e.target.dataset.key });
            }
        });
        modoBotoes.forEach(btn => {
            btn.addEventListener('click', () => {
                modoBotoes.forEach(b => b.classList.remove('ativo'));
                btn.classList.add('ativo');
                numeroDeJogos = parseInt(btn.dataset.modo);
                init();
            });
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
            for (let i = 0; i < numeroDeJogos; i++) {
                if (!jogosFinalizados[i]) {
                    tabuleiroStates[i][tentativaAtual][letraAtual] = letra;
                    const celula = document.getElementById(`letra-${i}-${tentativaAtual}-${letraAtual}`);
                    if (celula) celula.querySelector('.frente').textContent = letra;
                }
            }
            letraAtual++;
            atualizarCelulaAtiva();
        }
    }

    function apagarLetra() {
        if (letraAtual > 0) {
            letraAtual--;
            for (let i = 0; i < numeroDeJogos; i++) {
                if (!jogosFinalizados[i]) {
                    tabuleiroStates[i][tentativaAtual][letraAtual] = '';
                    const celula = document.getElementById(`letra-${i}-${tentativaAtual}-${letraAtual}`);
                    if (celula) celula.querySelector('.frente').textContent = '';
                }
            }
            atualizarCelulaAtiva();
        }
    }

    function atualizarCelulaAtiva() {
        document.querySelectorAll('.letra.ativa').forEach(c => c.classList.remove('ativa'));
        if (letraAtual < TAMANHO_PALAVRA) {
            for (let i = 0; i < numeroDeJogos; i++) {
                if (!jogosFinalizados[i]) {
                    const celula = document.getElementById(`letra-${i}-${tentativaAtual}-${letraAtual}`);
                    if (celula) celula.classList.add('ativa');
                }
            }
        }
    }

    // --- LÓGICA DO JOGO ---
    function submeterTentativa() {
        if (letraAtual < TAMANHO_PALAVRA) {
            mostrarNotificacao("Palavra incompleta!");
            return;
        }

        const palpite = tabuleiroStates[0][tentativaAtual].join('');
        if (!DICIONARIO.includes(palpite)) {
            mostrarNotificacao("Palavra não existe!");
            return;
        }

        jogoPausado = true;
        document.querySelectorAll('.letra.ativa').forEach(c => c.classList.remove('ativa'));
        verificarPalpite(palpite);
    }

    function verificarPalpite(palpite) {
        const corTeclado = {};

        for (let i = 0; i < numeroDeJogos; i++) {
            if (jogosFinalizados[i]) continue;

            const palavraSecreta = palavrasSecretas[i];
            const resultados = Array(TAMANHO_PALAVRA).fill('');
            const contagemLetras = {};
            for (const letra of palavraSecreta) contagemLetras[letra] = (contagemLetras[letra] || 0) + 1;
            
            // Passada 1: Letras corretas (verde)
            for (let j = 0; j < TAMANHO_PALAVRA; j++) {
                if (palpite[j] === palavraSecreta[j]) {
                    resultados[j] = 'certo';
                    contagemLetras[palpite[j]]--;
                }
            }
            // Passada 2: Letras no lugar errado (amarelo) e inexistentes (cinza)
            for (let j = 0; j < TAMANHO_PALAVRA; j++) {
                if (resultados[j]) continue;
                if (palavraSecreta.includes(palpite[j]) && contagemLetras[palpite[j]] > 0) {
                    resultados[j] = 'lugar-errado';
                    contagemLetras[palpite[j]]--;
                } else {
                    resultados[j] = 'nao-existe';
                }
            }
            
            // Animação e atualização visual
            const linhaDiv = document.querySelector(`#tabuleiros-container .tabuleiro:nth-child(${i+1}) .linha:nth-child(${tentativaAtual+1})`);
            for (let j = 0; j < TAMANHO_PALAVRA; j++) {
                setTimeout(() => {
                    const celula = linhaDiv.children[j];
                    celula.classList.add('revelada', resultados[j]);
                    celula.querySelector('.verso').textContent = palpite[j];
                }, j * 250);
                 // Atualiza cores do teclado (lógica de prioridade)
                const statusAtual = corTeclado[palpite[j]];
                const statusNovo = resultados[j];
                if (!statusAtual || statusNovo === 'certo' || (statusNovo === 'lugar-errado' && statusAtual !== 'certo')) {
                    corTeclado[palpite[j]] = statusNovo;
                }
            }

            if (palpite === palavraSecreta) jogosFinalizados[i] = true;
        }

        // --- LÓGICA DE FIM DE RODADA ---
        setTimeout(() => {
            atualizarTeclado(corTeclado);

            const vitoria = jogosFinalizados.every(finalizado => finalizado);
            const derrota = !vitoria && tentativaAtual === numTentativas - 1;

            if (vitoria) {
                mostrarNotificacao("Você venceu!", 5000);
                jogoPausado = true;
            } else if (derrota) {
                mostrarNotificacao(`Você perdeu! Palavras: ${palavrasSecretas.join(', ').toUpperCase()}`, 10000);
                jogoPausado = true;
            } else {
                tentativaAtual++;
                letraAtual = 0;
                jogoPausado = false;
                atualizarCelulaAtiva();
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
        const notificacaoExistente = notificacaoContainer.querySelector('.notificacao');
        if (notificacaoExistente) notificacaoExistente.remove();

        const notificacao = document.createElement('div');
        notificacao.className = 'notificacao';
        notificacao.textContent = mensagem;
        notificacaoContainer.appendChild(notificacao);
        setTimeout(() => notificacao.remove(), duracao);
    }

    // Inicia o jogo no modo padrão
    init();
});
