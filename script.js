document.addEventListener('DOMContentLoaded', () => {
    // Pega uma palavra aleatória da nossa lista de respostas
    const palavraSecreta = RESPOSTAS[Math.floor(Math.random() * RESPOSTAS.length)];
    const NUM_TENTATIVAS = 6;
    const TAMANHO_PALAVRA = 5;

    let tentativaAtual = 0;
    let letraAtual = 0;
    let tabuleiroState = Array(NUM_TENTATIVAS).fill(null).map(() => Array(TAMANHO_PALAVRA).fill(''));

    const tabuleiroDiv = document.getElementById('tabuleiro');
    const tecladoDiv = document.getElementById('teclado-container');
    const notificacaoDiv = document.getElementById('notificacao-container');

    // Inicializa o jogo
    function init() {
        criarTabuleiro();
        criarTeclado();
        ouvirEventos();
        console.log("Palavra secreta (não espie!):", palavraSecreta);
    }

    // Cria a grade 6x5 na tela
    function criarTabuleiro() {
        for (let i = 0; i < NUM_TENTATIVAS; i++) {
            const linhaDiv = document.createElement('div');
            linhaDiv.className = 'linha';
            linhaDiv.id = `linha-${i}`;
            for (let j = 0; j < TAMANHO_PALAVRA; j++) {
                const letraDiv = document.createElement('div');
                letraDiv.className = 'letra';
                letraDiv.id = `letra-${i}-${j}`;
                
                // Estrutura para animação de virar
                const frente = document.createElement('div');
                frente.className = 'frente';
                const verso = document.createElement('div');
                verso.className = 'verso';
                
                letraDiv.appendChild(frente);
                letraDiv.appendChild(verso);
                
                linhaDiv.appendChild(letraDiv);
            }
            tabuleiroDiv.appendChild(linhaDiv);
        }
    }

    // Cria o teclado virtual
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

    function ouvirEventos() {
        // Event listener para o teclado físico
        document.addEventListener('keydown', handleKeyPress);
        // Event listener para o teclado virtual
        tecladoDiv.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                const key = e.target.getAttribute('data-key');
                handleKeyPress({ key });
            }
        });
    }

    function handleKeyPress(e) {
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
            tabuleiroState[tentativaAtual][letraAtual] = letra;
            const celula = document.getElementById(`letra-${tentativaAtual}-${letraAtual}`).firstChild;
            celula.textContent = letra;
            letraAtual++;
        }
    }

    function apagarLetra() {
        if (letraAtual > 0) {
            letraAtual--;
            tabuleiroState[tentativaAtual][letraAtual] = '';
            const celula = document.getElementById(`letra-${tentativaAtual}-${letraAtual}`).firstChild;
            celula.textContent = '';
        }
    }

    function submeterTentativa() {
        if (letraAtual !== TAMANHO_PALAVRA) {
            mostrarNotificacao("Palavra incompleta!");
            return;
        }

        const palpite = tabuleiroState[tentativaAtual].join('');

        if (!DICIONARIO.includes(palpite)) {
            mostrarNotificacao("Palavra não existe!");
            return;
        }

        verificarPalpite(palpite);
    }
    
    function verificarPalpite(palpite) {
        const contagemLetrasSecretas = {};
        for (const letra of palavraSecreta) {
            contagemLetrasSecretas[letra] = (contagemLetrasSecretas[letra] || 0) + 1;
        }

        const linhaDiv = document.getElementById(`linha-${tentativaAtual}`);
        const celulas = linhaDiv.children;
        const resultados = Array(TAMANHO_PALAVRA).fill(null);

        // 1ª Passada: Verificar letras corretas (verdes)
        for (let i = 0; i < TAMANHO_PALAVRA; i++) {
            if (palpite[i] === palavraSecreta[i]) {
                resultados[i] = 'certo';
                contagemLetrasSecretas[palpite[i]]--;
            }
        }

        // 2ª Passada: Verificar letras no lugar errado (amarelas) e inexistentes (cinzas)
        for (let i = 0; i < TAMANHO_PALAVRA; i++) {
            if (resultados[i] === null) {
                if (palavraSecreta.includes(palpite[i]) && contagemLetrasSecretas[palpite[i]] > 0) {
                    resultados[i] = 'lugar-errado';
                    contagemLetrasSecretas[palpite[i]]--;
                } else {
                    resultados[i] = 'nao-existe';
                }
            }
        }
        
        // Aplicar animação e cores
        for (let i = 0; i < TAMANHO_PALAVRA; i++) {
            setTimeout(() => {
                const celula = celulas[i];
                celula.classList.add('revelada');
                celula.classList.add(resultados[i]);
                celula.querySelector('.frente').textContent = palpite[i];
                celula.querySelector('.verso').textContent = palpite[i];
                
                // Atualizar cor do teclado
                const tecla = document.querySelector(`.tecla[data-key="${palpite[i]}"]`);
                // Não sobrescrever uma tecla verde
                if (!tecla.classList.contains('certo')) {
                    tecla.classList.remove('lugar-errado', 'nao-existe'); // Limpa antes de adicionar
                    tecla.classList.add(resultados[i]);
                }

            }, i * 300); // Atraso para efeito cascata
        }

        // Checar vitória ou derrota
        setTimeout(() => {
            if (palpite === palavraSecreta) {
                mostrarNotificacao("Você venceu!", 5000);
                document.removeEventListener('keydown', handleKeyPress); // Trava o jogo
            } else if (tentativaAtual === NUM_TENTATIVAS - 1) {
                mostrarNotificacao(`Você perdeu! A palavra era: ${palavraSecreta.toUpperCase()}`, 10000);
                document.removeEventListener('keydown', handleKeyPress); // Trava o jogo
            } else {
                tentativaAtual++;
                letraAtual = 0;
            }
        }, TAMANHO_PALAVRA * 300);
    }

    function mostrarNotificacao(mensagem, duracao = 2000) {
        const notificacao = document.createElement('div');
        notificacao.className = 'notificacao';
        notificacao.textContent = mensagem;
        
        notificacaoDiv.appendChild(notificacao);

        setTimeout(() => {
            notificacao.remove();
        }, duracao);
    }

    // Inicia o jogo
    init();
});
