document.addEventListener('DOMContentLoaded', () => {
    // --- VARIÁVEIS GLOBAIS ---
    const tecladoDiv = document.getElementById('teclado-container');
    const notificacaoDiv = document.getElementById('notificacao-container');
    const tabuleirosContainer = document.getElementById('tabuleiros-container');
    const modoBotoes = document.querySelectorAll('.modo-btn');

    let numeroDeJogos = 1;
    let palavrasSecretas = [];
    let NUM_TENTATIVAS = 6;
    const TAMANHO_PALAVRA = 5;

    let tentativaAtual = 0;
    let letraAtual = 0;
    let tabuleiroStates = [];
    let jogosAtivos = [];
    let jogoPausado = false;

    // --- INICIALIZAÇÃO E CONTROLE DE MODO DE JOGO ---

    function initGame() {
        limparEstadoAnterior();
        configurarModoDeJogo();
        selecionarPalavrasSecretas();

        tabuleirosContainer.className = `modo-${numeroDeJogos}`;

        for (let i = 0; i < numeroDeJogos; i++) {
            tabuleiroStates.push(Array(NUM_TENTATIVAS).fill(null).map(() => Array(TAMANHO_PALAVRA).fill('')));
            jogosAtivos.push(true);
            criarTabuleiro(i);
        }

        criarTeclado();
        ouvirEventos();
        atualizarCelulaAtiva();
        console.log(`Modo: ${numeroDeJogos} | Tentativas: ${NUM_TENTATIVAS} | Palavras:`, palavrasSecretas);
    }
    
    function limparEstadoAnterior() {
        tentativaAtual = 0;
        letraAtual = 0;
        jogoPausado = false;
        palavrasSecretas = [];
        tabuleiroStates = [];
        jogosAtivos = [];
        tabuleirosContainer.innerHTML = '';
        tecladoDiv.innerHTML = '';
        notificacaoDiv.innerHTML = '';
        document.removeEventListener('keydown', handleKeyPress);
    }

    function configurarModoDeJogo() {
        if (numeroDeJogos === 2) NUM_TENTATIVAS = 7;
        else if (numeroDeJogos === 4) NUM_TENTATIVAS = 9;
        else NUM_TENTATIVAS = 6;
    }

    function selecionarPalavrasSecretas() {
        let respostasDisponiveis = [...RESPOSTAS];
        for (let i = 0; i < numeroDeJogos; i++) {
            const randomIndex = Math.floor(Math.random() * respostasDisponiveis.length);
            palavrasSecretas.push(respostasDisponiveis.splice(randomIndex, 1)[0]);
        }
    }

    modoBotoes.forEach(button => {
        button.addEventListener('click', () => {
            numeroDeJogos = parseInt(button.getAttribute('data-modo'));
            initGame();
        });
    });

    // --- CRIAÇÃO DO TABULEIRO E TECLADO ---

    function criarTabuleiro(index) {
        const tabuleiroDiv = document.createElement('div');
        tabuleiroDiv.className = 'tabuleiro';
        tabuleiroDiv.style.gridTemplateRows = `repeat(${NUM_TENTATIVAS}, 1fr)`;

        for (let i = 0; i < NUM_TENTATIVAS; i++) {
            const linhaDiv = document.createElement('div');
            linhaDiv.className = 'linha';
            linhaDiv.id = `linha-${index}-${i}`;
            for (let j = 0; j < TAMANHO_PALAVRA; j++) {
                const letraDiv = document.createElement('div');
                letraDiv.className = 'letra';
                letraDiv.id = `letra-${index}-${i}-${j}`;
                const frente = document.createElement('div');
                frente.className = 'frente';
                const verso = document.createElement('div');
                verso.className = 'verso';
                letraDiv.appendChild(frente);
                letraDiv.appendChild(verso);
                letraDiv.addEventListener('click', () => selecionarCelula(i, j));
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
                tecla.setAttribute('data-key', key);
                if (key === 'enter' || key === 'backspace') tecla.classList.add('grande');
                linhaDiv.appendChild(tecla);
            });
            tecladoDiv.appendChild(linhaDiv);
        });
    }

    // --- LÓGICA DE EVENTOS E INPUT ---

    function ouvirEventos() {
        document.addEventListener('keydown', handleKeyPress);
        tecladoDiv.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                handleKeyPress({ key: e.target.getAttribute('data-key') });
            }
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
                if (jogosAtivos[i]) {
                    // **A CORREÇÃO ESTÁ AQUI: SALVANDO NA MEMÓRIA**
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
                if (jogosAtivos[i]) {
                    // **A CORREÇÃO ESTÁ AQUI: LIMPANDO DA MEMÓRIA**
                    tabuleiroStates[i][tentativaAtual][letraAtual] = '';
                    const celula = document.getElementById(`letra-${i}-${tentativaAtual}-${letraAtual}`);
                    if (celula) celula.querySelector('.frente').textContent = '';
                }
            }
            atualizarCelulaAtiva();
        }
    }

    function selecionarCelula(linha, coluna) {
        if (!jogoPausado && linha === tentativaAtual) {
            letraAtual = coluna;
            atualizarCelulaAtiva();
        }
    }

    function atualizarCelulaAtiva() {
        document.querySelectorAll('.letra.ativa').forEach(c => c.classList.remove('ativa'));
        if (!jogoPausado && letraAtual < TAMANHO_PALAVRA) {
            for (let i = 0; i < numeroDeJogos; i++) {
                if (jogosAtivos[i]) {
                    const celula = document.getElementById(`letra-${i}-${tentativaAtual}-${letraAtual}`);
                    if (celula) celula.classList.add('ativa');
                }
            }
        }
    }

    // --- LÓGICA DE VERIFICAÇÃO E SUBMISSÃO ---

    function submeterTentativa() {
        if (letraAtual < TAMANHO_PALAVRA) {
            mostrarNotificacao("Palavra incompleta!");
            return;
        }

        const palpiteArray = tabuleiroStates[0][tentativaAtual];
        const palpite = palpiteArray.join('');

        if (!DICIONARIO.includes(palpite)) {
            mostrarNotificacao("Palavra não existe!");
            return;
        }

        jogoPausado = true;
        verificarPalpite(palpite);
    }

    function verificarPalpite(palpite) {
        const corTecladoAgregada = {};

        for (let i = 0; i < numeroDeJogos; i++) {
            if (!jogosAtivos[i]) continue;

            const palavraSecreta = palavrasSecretas[i];
            const resultados = Array(TAMANHO_PALAVRA).fill('');
            const contagemLetras = {};
            for (const letra of palavraSecreta) contagemLetras[letra] = (contagemLetras[letra] || 0) + 1;

            for (let j = 0; j < TAMANHO_PALAVRA; j++) {
                if (palpite[j] === palavraSecreta[j]) {
                    resultados[j] = 'certo';
                    contagemLetras[palpite[j]]--;
                }
            }

            for (let j = 0; j < TAMANHO_PALAVRA; j++) {
                if (resultados[j]) continue;
                if (palavraSecreta.includes(palpite[j]) && contagemLetras[palpite[j]] > 0) {
                    resultados[j] = 'lugar-errado';
                    contagemLetras[palpite[j]]--;
                } else {
                    resultados[j] = 'nao-existe';
                }
            }

            const linhaDiv = document.getElementById(`linha-${i}-${tentativaAtual}`);
            if (linhaDiv) {
                for (let j = 0; j < TAMANHO_PALAVRA; j++) {
                    setTimeout(() => {
                        const celula = linhaDiv.children[j];
                        celula.classList.add('revelada', resultados[j]);
                        celula.querySelector('.verso').textContent = palpite[j];
                    }, j * 250);
                }
            }

            for (let j = 0; j < TAMANHO_PALAVRA; j++) {
                const statusAtual = corTecladoAgregada[palpite[j]];
                const statusNovo = resultados[j];
                if (!statusAtual || statusNovo === 'certo' || (statusNovo === 'lugar-errado' && statusAtual !== 'certo')) {
                    corTecladoAgregada[palpite[j]] = statusNovo;
                }
            }

            if (palpite === palavraSecreta) jogosAtivos[i] = false;
        }

        setTimeout(() => {
            atualizarTeclado(corTecladoAgregada);

            const vitoria = jogosAtivos.every(ativo => !ativo);
            const derrota = !vitoria && tentativaAtual === NUM_TENTATIVAS - 1;

            if (vitoria) {
                mostrarNotificacao("Você venceu!", 5000);
                jogoPausado = true;
            } else if (derrota) {
                const naoAdivinhadas = palavrasSecretas.filter((_, idx) => jogosAtivos[idx]).join(', ').toUpperCase();
                mostrarNotificacao(`Você perdeu! Palavras: ${naoAdivinhadas}`, 10000);
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
                if (status) tecla.classList.add(status);
            }
        }
    }

    function mostrarNotificacao(mensagem, duracao = 2000) {
        const notificacaoExistente = notificacaoDiv.querySelector('.notificacao');
        if(notificacaoExistente) notificacaoExistente.remove();

        const notificacao = document.createElement('div');
        notificacao.className = 'notificacao';
        notificacao.textContent = mensagem;
        notificacaoDiv.appendChild(notificacao);
        setTimeout(() => {
            if(notificacao.parentNode) {
                notificacao.remove();
            }
        }, duracao);
    }

    initGame();
});
