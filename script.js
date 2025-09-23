document.addEventListener('DOMContentLoaded', () => {
    // --- VARIÁVEIS GLOBAIS ---
    const tecladoDiv = document.getElementById('teclado-container');
    const notificacaoDiv = document.getElementById('notificacao-container');
    const tabuleirosContainer = document.getElementById('tabuleiros-container');
    const modoBotoes = document.querySelectorAll('.modo-btn');

    let numeroDeJogos = 1; // Modo padrão
    let palavrasSecretas = [];
    let NUM_TENTATIVAS = 6;
    const TAMANHO_PALAVRA = 5;

    let tentativaAtual = 0;
    let letraAtual = 0;
    let tabuleiroStates = [];
    let jogosAtivos = [];
    let jogoFinalizado = false;

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
        console.log("Palavras secretas:", palavrasSecretas);
    }
    
    function limparEstadoAnterior() {
        tentativaAtual = 0;
        letraAtual = 0;
        jogoFinalizado = false;
        palavrasSecretas = [];
        tabuleiroStates = [];
        jogosAtivos = [];
        tabuleirosContainer.innerHTML = '';
        tecladoDiv.innerHTML = '';
        notificacaoDiv.innerHTML = '';
        document.removeEventListener('keydown', handleKeyPress);
    }

    function configurarModoDeJogo() {
        switch (numeroDeJogos) {
            case 2: // Dueto
                NUM_TENTATIVAS = 7;
                break;
            case 4: // Quarteto
                NUM_TENTATIVAS = 9;
                break;
            default: // Clássico
                NUM_TENTATIVAS = 6;
                break;
        }
    }

    function selecionarPalavrasSecretas() {
        let respostasDisponiveis = [...RESPOSTAS];
        for (let i = 0; i < numeroDeJogos; i++) {
            const randomIndex = Math.floor(Math.random() * respostasDisponiveis.length);
            palavrasSecretas.push(respostasDisponiveis[randomIndex]);
            respostasDisponiveis.splice(randomIndex, 1);
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
        tabuleiroDiv.id = `tabuleiro-${index}`;

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
                
                // Adiciona listener para poder clicar e mover o cursor
                letraDiv.addEventListener('click', () => selecionarCelula(i, j));

                linhaDiv.appendChild(letraDiv);
            }
            tabuleiroDiv.appendChild(linhaDiv);
        }
        tabuleirosContainer.appendChild(tabuleiroDiv);
    }

    function criarTeclado() {
        const layoutTeclado = [
            ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
            ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
            ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace']
        ];

        layoutTeclado.forEach(linha => {
            const linhaDiv = document.createElement('div');
            linhaDiv.className = 'linha-teclado';
            linha.forEach(key => {
                const tecla = document.createElement('button');
                tecla.className = 'tecla';
                tecla.textContent = key === 'backspace' ? '⌫' : key;
                tecla.setAttribute('data-key', key);
                if (key === 'enter' || key === 'backspace') {
                    tecla.classList.add('grande');
                }
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
                const key = e.target.getAttribute('data-key');
                handleKeyPress({ key });
            }
        });
    }

    function handleKeyPress(e) {
        if (jogoFinalizado) return;

        const key = e.key.toLowerCase();

        if (key === 'enter') {
            submeterTentativa();
        } else if (key === 'backspace') {
            apagarLetra();
        } else if (key.length === 1 && key >= 'a' && key <= 'z') {
            adicionarLetra(key);
        }
    }

    function adicionarLetra(letra) {
        if (letraAtual < TAMANHO_PALAVRA) {
            for (let i = 0; i < numeroDeJogos; i++) {
                if (jogosAtivos[i]) {
                    tabuleiroStates[i][tentativaAtual][letraAtual] = letra;
                    const celula = document.getElementById(`letra-${i}-${tentativaAtual}-${letraAtual}`);
                    // CORREÇÃO APLICADA AQUI
                    if (celula) {
                        const frente = celula.querySelector('.frente');
                        if (frente) {
                            frente.textContent = letra;
                        }
                    }
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
                    tabuleiroStates[i][tentativaAtual][letraAtual] = '';
                    const celula = document.getElementById(`letra-${i}-${tentativaAtual}-${letraAtual}`);
                    // CORREÇÃO APLICADA AQUI
                    if (celula) {
                        const frente = celula.querySelector('.frente');
                        if (frente) {
                            frente.textContent = '';
                        }
                    }
                }
            }
            atualizarCelulaAtiva();
        }
    }
    
    function selecionarCelula(linha, coluna) {
        // Permite mover o cursor clicando na linha atual
        if (!jogoFinalizado && linha === tentativaAtual) {
            letraAtual = coluna;
            atualizarCelulaAtiva();
        }
    }

    function atualizarCelulaAtiva() {
        document.querySelectorAll('.letra.ativa').forEach(celula => celula.classList.remove('ativa'));
        if (!jogoFinalizado && letraAtual < TAMANHO_PALAVRA) {
            for (let i = 0; i < numeroDeJogos; i++) {
                if(jogosAtivos[i]) {
                    const celulaAtual = document.getElementById(`letra-${i}-${tentativaAtual}-${letraAtual}`);
                    if (celulaAtual) {
                        celulaAtual.classList.add('ativa');
                    }
                }
            }
        }
    }
    
    // --- LÓGICA DE VERIFICAÇÃO E SUBMISSÃO ---

    function submeterTentativa() {
        // Pega o estado do primeiro jogo ativo para validação
        const indicePrimeiroJogoAtivo = jogosAtivos.findIndex(ativo => ativo === true);
        if (indicePrimeiroJogoAtivo === -1) return; // Nenhum jogo ativo

        const palpiteArray = tabuleiroStates[indicePrimeiroJogoAtivo][tentativaAtual];

        if (palpiteArray.some(letra => letra === '')) {
            mostrarNotificacao("Palavra incompleta!");
            return;
        }

        const palpite = palpiteArray.join('');
        if (!DICIONARIO.includes(palpite)) {
            mostrarNotificacao("Palavra não existe!");
            return;
        }

        jogoFinalizado = true; // Pausa o input durante a animação
        verificarPalpite(palpite);
    }

    function verificarPalpite(palpite) {
        const coresTecladoGeral = {};

        for (let i = 0; i < numeroDeJogos; i++) {
            if (!jogosAtivos[i]) continue;

            const palavraSecreta = palavrasSecretas[i];
            const contagemLetras = {};
            for (const letra of palavraSecreta) {
                contagemLetras[letra] = (contagemLetras[letra] || 0) + 1;
            }

            const resultados = Array(TAMANHO_PALAVRA).fill(null);
            
            // 1ª Passada: Verdes
            for (let j = 0; j < TAMANHO_PALAVRA; j++) {
                if (palpite[j] === palavraSecreta[j]) {
                    resultados[j] = 'certo';
                    contagemLetras[palpite[j]]--;
                }
            }

            // 2ª Passada: Amarelas e Cinzas
            for (let j = 0; j < TAMANHO_PALAVRA; j++) {
                if (resultados[j] === null) {
                    if (palavraSecreta.includes(palpite[j]) && contagemLetras[palpite[j]] > 0) {
                        resultados[j] = 'lugar-errado';
                        contagemLetras[palpite[j]]--;
                    } else {
                        resultados[j] = 'nao-existe';
                    }
                }
            }
            
            // Aplica animações e cores no tabuleiro
            const linhaDiv = document.getElementById(`linha-${i}-${tentativaAtual}`);
            const celulas = linhaDiv.children;
            for (let j = 0; j < TAMANHO_PALAVRA; j++) {
                setTimeout(() => {
                    const celula = celulas[j];
                    celula.classList.add('revelada', resultados[j]);
                    celula.querySelector('.verso').textContent = palpite[j];
                }, j * 300);
            }

            // Consolida cores para o teclado
            for(let j=0; j< TAMANHO_PALAVRA; j++){
                const letra = palpite[j];
                const status = resultados[j];
                const statusAtual = coresTecladoGeral[letra];

                // Prioridade: Certo > Lugar Errado > Não Existe
                if (!statusAtual || status === 'certo' || (status === 'lugar-errado' && statusAtual !== 'certo')) {
                    coresTecladoGeral[letra] = status;
                }
            }

            if (palpite === palavraSecreta) {
                jogosAtivos[i] = false;
            }
        }

        // --- ATUALIZAÇÃO PÓS-TENTATIVA ---
        setTimeout(() => {
            atualizarTeclado(coresTecladoGeral);
            
            const todosJogosVencidos = jogosAtivos.every(status => status === false);

            if (todosJogosVencidos) {
                mostrarNotificacao("Você venceu!", 5000);
                jogoFinalizado = true;
            } else if (tentativaAtual === NUM_TENTATIVAS - 1) {
                const palavrasNaoAdivinhadas = palavrasSecretas.filter((_, index) => jogosAtivos[index]).join(', ').toUpperCase();
                mostrarNotificacao(`Você perdeu! Palavras: ${palavrasNaoAdivinhadas}`, 10000);
                jogoFinalizado = true;
            } else {
                jogoFinalizado = false;
                tentativaAtual++;
                letraAtual = 0;
                atualizarCelulaAtiva();
            }
        }, TAMANHO_PALAVRA * 300);
    }

    function atualizarTeclado(coresTeclado) {
        for (const [letra, status] of Object.entries(coresTeclado)) {
            const tecla = document.querySelector(`.tecla[data-key="${letra}"]`);
            if (tecla) {
                // Remove classes anteriores para garantir a prioridade correta
                tecla.classList.remove('certo', 'lugar-errado', 'nao-existe');
                if (status) tecla.classList.add(status);
            }
        }
    }

    function mostrarNotificacao(mensagem, duracao = 2000) {
        notificacaoDiv.innerHTML = '';
        const notificacao = document.createElement('div');
        notificacao.className = 'notificacao';
        notificacao.textContent = mensagem;
        notificacaoDiv.appendChild(notificacao);
        setTimeout(() => notificacao.remove(), duracao);
    }

    // Inicia o jogo no modo padrão (Clássico)
    initGame();
});
