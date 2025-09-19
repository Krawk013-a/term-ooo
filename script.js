document.addEventListener('DOMContentLoaded', () => {
    // Pega uma palavra aleatória da nossa lista de respostas
    const palavraSecreta = RESPOSTAS[Math.floor(Math.random() * RESPOSTAS.length)];
    const NUM_TENTATIVAS = 6;
    const TAMANHO_PALAVRA = 5;

    let tentativaAtual = 0;
    let letraAtual = 0; // Este é o nosso "cursor", indicando a coluna (0-4)
    let tabuleiroState = Array(NUM_TENTATIVAS).fill(null).map(() => Array(TAMANHO_PALAVRA).fill(''));
    let jogoAtivo = true; // Variável para controlar se o jogo pode receber input

    const tabuleiroDiv = document.getElementById('tabuleiro');
    const tecladoDiv = document.getElementById('teclado-container');
    const notificacaoDiv = document.getElementById('notificacao-container');

    // Inicializa o jogo
    function init() {
        criarTabuleiro();
        criarTeclado();
        ouvirEventos();
        atualizarCelulaAtiva(); // Define a primeira célula como ativa ao iniciar
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
                
                const frente = document.createElement('div');
                frente.className = 'frente';
                const verso = document.createElement('div');
                verso.className = 'verso';
                
                letraDiv.appendChild(frente);
                letraDiv.appendChild(verso);
                
                // Adiciona listener para selecionar a célula
                letraDiv.addEventListener('click', () => selecionarCelula(i, j));
                
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
        if (!jogoAtivo) return; // Se o jogo acabou, não faz nada

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
            letraAtual++; // Move o cursor para a próxima posição
            atualizarCelulaAtiva();
        }
    }

    function apagarLetra() {
        if (letraAtual > 0) {
            letraAtual--; // Move o cursor para a posição a ser apagada
            tabuleiroState[tentativaAtual][letraAtual] = '';
            const celula = document.getElementById(`letra-${tentativaAtual}-${letraAtual}`).firstChild;
            celula.textContent = '';
            atualizarCelulaAtiva();
        }
    }

    function atualizarCelulaAtiva() {
        // Remove a classe 'ativa' de todas as células
        document.querySelectorAll('.letra.ativa').forEach(celula => celula.classList.remove('ativa'));
        
        // Adiciona a classe 'ativa' à célula atual se o jogo estiver rolando
        if (jogoAtivo && letraAtual < TAMANHO_PALAVRA) {
            const celulaAtualElement = document.getElementById(`letra-${tentativaAtual}-${letraAtual}`);
            if (celulaAtualElement) {
                celulaAtualElement.classList.add('ativa');
            }
        }
    }

    function selecionarCelula(linha, coluna) {
        if (jogoAtivo && linha === tentativaAtual) { // Só permite seleção na linha atual
            letraAtual = coluna;
            atualizarCelulaAtiva();
        }
    }
    
    function submeterTentativa() {
        const palpiteArray = tabuleiroState[tentativaAtual];
        
        if (palpiteArray.some(letra => letra === '')) {
            mostrarNotificacao("Palavra incompleta!");
            return;
        }

        const palpite = palpiteArray.join('');

        if (!DICIONARIO.includes(palpite)) {
            mostrarNotificacao("Palavra não existe!");
            return;
        }

        verificarPalpite(palpite);
    }
    
    function verificarPalpite(palpite) {
        jogoAtivo = false; // Desabilita o input durante a animação
        document.querySelectorAll('.letra.ativa').forEach(celula => celula.classList.remove('ativa'));

        const contagemLetrasSecretas = {};
        for (const letra of palavraSecreta) {
            contagemLetrasSecretas[letra] = (contagemLetrasSecretas[letra] || 0) + 1;
        }

        const linhaDiv = document.getElementById(`linha-${tentativaAtual}`);
        const celulas = linhaDiv.children;
        const resultados = Array(TAMANHO_PALAVRA).fill(null);
        const corTeclado = {};

        // 1ª Passada: Verificar letras corretas (verdes)
        for (let i = 0; i < TAMANHO_PALAVRA; i++) {
            if (palpite[i] === palavraSecreta[i]) {
                resultados[i] = 'certo';
                corTeclado[palpite[i]] = 'certo';
                contagemLetrasSecretas[palpite[i]]--;
            }
        }

        // 2ª Passada: Verificar letras no lugar errado (amarelas) e inexistentes (cinzas)
        for (let i = 0; i < TAMANHO_PALAVRA; i++) {
            if (resultados[i] === null) {
                if (palavraSecreta.includes(palpite[i]) && contagemLetrasSecretas[palpite[i]] > 0) {
                    resultados[i] = 'lugar-errado';
                    if (corTeclado[palpite[i]] !== 'certo') {
                        corTeclado[palpite[i]] = 'lugar-errado';
                    }
                    contagemLetrasSecretas[palpite[i]]--;
                } else {
                    resultados[i] = 'nao-existe';
                    if (corTeclado[palpite[i]] !== 'certo' && corTeclado[palpite[i]] !== 'lugar-errado') {
                         corTeclado[palpite[i]] = 'nao-existe';
                    }
                }
            }
        }
        
        // Aplicar animação e cores
        for (let i = 0; i < TAMANHO_PALAVRA; i++) {
            setTimeout(() => {
                const celula = celulas[i];
                celula.classList.add('revelada');
                celula.classList.add(resultados[i]);
                celula.querySelector('.verso').textContent = palpite[i];
            }, i * 300);
        }
        
        // Atualizar o teclado após a animação
        setTimeout(() => {
            for (const [letra, status] of Object.entries(corTeclado)) {
                const tecla = document.querySelector(`.tecla[data-key="${letra}"]`);
                if (tecla) {
                    tecla.classList.add(status);
                }
            }
            
            // Checar vitória ou derrota
            if (palpite === palavraSecreta) {
                mostrarNotificacao("Você venceu!", 5000);
                // jogoAtivo continua false para travar o jogo
            } else if (tentativaAtual === NUM_TENTATIVAS - 1) {
                mostrarNotificacao(`Você perdeu! A palavra era: ${palavraSecreta.toUpperCase()}`, 10000);
                // jogoAtivo continua false para travar o jogo
            } else {
                // Prepara para a próxima tentativa
                jogoAtivo = true;
                tentativaAtual++;
                letraAtual = 0; 
                atualizarCelulaAtiva();
            }
        }, TAMANHO_PALAVRA * 300);
    }

    function mostrarNotificacao(mensagem, duracao = 2000) {
        notificacaoDiv.innerHTML = ''; 

        const notificacao = document.createElement('div');
        notificacao.className = 'notificacao';
        notificacao.textContent = mensagem;
        
        notificacaoDiv.appendChild(notificacao);

        setTimeout(() => {
            notificacao.remove();
        }, duracao);
    }

    init();
});