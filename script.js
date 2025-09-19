document.addEventListener('DOMContentLoaded', () => {
    const palavraSecreta = RESPOSTAS[Math.floor(Math.random() * RESPOSTAS.length)];
    const NUM_TENTATIVAS = 6;
    const TAMANHO_PALAVRA = 5;

    let tentativaAtual = 0;
    let letraAtual = 0; // Índice da coluna ativa dentro da linha atual
    let tabuleiroState = Array(NUM_TENTATIVAS).fill(null).map(() => Array(TAMANHO_PALAVRA).fill(''));

    const tabuleiroDiv = document.getElementById('tabuleiro');
    const tecladoDiv = document.getElementById('teclado-container');
    const notificacaoDiv = document.getElementById('notificacao-container');

    function init() {
        criarTabuleiro();
        criarTeclado();
        ouvirEventos();
        atualizarCelulaAtiva(); // Define a primeira célula como ativa ao iniciar
        console.log("Palavra secreta (não espie!):", palavraSecreta);
    }

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
                
                // Adiciona listener para selecionar a célula
                if (i === tentativaAtual) { // Só permite seleção na linha atual
                    letraDiv.addEventListener('click', () => selecionarCelula(j));
                }
                
                linhaDiv.appendChild(letraDiv);
            }
            tabuleiroDiv.appendChild(linhaDiv);
        }
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

    function ouvirEventos() {
        document.addEventListener('keydown', handleKeyPress);
        tecladoDiv.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                const key = e.target.getAttribute('data-key');
                handleKeyPress({ key });
            }
        });
    }

    function atualizarCelulaAtiva() {
        // Remove a classe 'ativa' de todas as células
        document.querySelectorAll('.letra.ativa').forEach(celula => celula.classList.remove('ativa'));
        
        // Adiciona a classe 'ativa' à célula atual se estiver dentro dos limites
        if (letraAtual < TAMANHO_PALAVRA) {
            const celulaAtualElement = document.getElementById(`letra-${tentativaAtual}-${letraAtual}`);
            if (celulaAtualElement) {
                celulaAtualElement.classList.add('ativa');
            }
        }
    }

    function selecionarCelula(coluna) {
        if (tentativaAtual < NUM_TENTATIVAS) { // Só pode selecionar na linha atual
             // Se a célula já tiver uma letra, mantemos ela
            if (tabuleiroState[tentativaAtual][coluna] === '') {
                letraAtual = coluna;
                atualizarCelulaAtiva();
            } else { // Se a célula tiver uma letra, vamos para a próxima vazia
                let proximaVazia = -1;
                for (let i = coluna + 1; i < TAMANHO_PALAVRA; i++) {
                    if (tabuleiroState[tentativaAtual][i] === '') {
                        proximaVazia = i;
                        break;
                    }
                }
                if (proximaVazia === -1) { // Se não houver vazia depois, busca antes
                    for (let i = coluna - 1; i >= 0; i--) {
                        if (tabuleiroState[tentativaAtual][i] === '') {
                            proximaVazia = i;
                            break;
                        }
                    }
                }
                if (proximaVazia !== -1) {
                    letraAtual = proximaVazia;
                    atualizarCelulaAtiva();
                } else { // Se não houver nenhuma célula vazia, mantém a célula clicada
                    letraAtual = coluna;
                    atualizarCelulaAtiva();
                }
            }
        }
    }
    

    function adicionarLetra(letra) {
        // Encontra a próxima célula vazia para adicionar a letra
        let celulaParaAdicionar = -1;
        for (let i = 0; i < TAMANHO_PALAVRA; i++) {
            if (tabuleiroState[tentativaAtual][i] === '') {
                celulaParaAdicionar = i;
                break;
            }
        }

        if (celulaParaAdicionar !== -1) {
            tabuleiroState[tentativaAtual][celulaParaAdicionar] = letra;
            const celulaElement = document.getElementById(`letra-${tentativaAtual}-${celulaParaAdicionar}`).firstChild;
            celulaElement.textContent = letra;
            
            // Move a 'letraAtual' para a próxima célula vazia, se houver
            letraAtual = celulaParaAdicionar;
            let proximaVazia = -1;
            for (let i = letraAtual + 1; i < TAMANHO_PALAVRA; i++) {
                if (tabuleiroState[tentativaAtual][i] === '') {
                    proximaVazia = i;
                    break;
                }
            }
            if (proximaVazia !== -1) {
                letraAtual = proximaVazia;
            } else { // Se não houver mais vazias, fica na última preenchida
                letraAtual = celulaParaAdicionar;
            }
            atualizarCelulaAtiva();
        } else {
            // Se todas as células estiverem preenchidas, não faz nada ou dá feedback
            mostrarNotificacao("Todas as letras já foram preenchidas!");
        }
    }

    function apagarLetra() {
        // Procura a última célula preenchida para apagar
        let celulaParaApagar = -1;
        for (let i = TAMANHO_PALAVRA - 1; i >= 0; i--) {
            if (tabuleiroState[tentativaAtual][i] !== '') {
                celulaParaApagar = i;
                break;
            }
        }

        if (celulaParaApagar !== -1) {
            letraAtual = celulaParaApagar; // Move o foco para a célula que será apagada
            tabuleiroState[tentativaAtual][celulaParaApagar] = '';
            const celulaElement = document.getElementById(`letra-${tentativaAtual}-${celulaParaApagar}`).firstChild;
            celulaElement.textContent = '';
            atualizarCelulaAtiva(); // Atualiza o visual do cursor
        } else {
             mostrarNotificacao("Não há letras para apagar!");
        }
    }

    function submeterTentativa() {
        const palpite = tabuleiroState[tentativaAtual].join('');

        if (palpite.length !== TAMANHO_PALAVRA || palpite.includes('')) {
            mostrarNotificacao("Palavra incompleta!");
            return;
        }

        if (!DICIONARIO.includes(palpite)) {
            mostrarNotificacao("Palavra não existe!");
            return;
        }

        verificarPalpite(palpite);
    }
    
    function verificarPalpite(palpite) {
        // Desabilita o teclado enquanto a animação ocorre
        document.removeEventListener('keydown', handleKeyPress);
        tecladoDiv.removeEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                const key = e.target.getAttribute('data-key');
                handleKeyPress({ key });
            }
        });
        
        // Remove o cursor da célula ativa
        document.querySelectorAll('.letra.ativa').forEach(celula => celula.classList.remove('ativa'));

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
                // Garante que o texto já está no verso para aparecer na virada
                celula.querySelector('.verso').textContent = palpite[i];
                
                // Atualizar cor do teclado
                const tecla = document.querySelector(`.tecla[data-key="${palpite[i]}"]`);
                if (tecla) { // Verifica se a tecla existe
                    // Prioridade: certo > lugar-errado > nao-existe
                    if (resultados[i] === 'certo') {
                        tecla.classList.remove('lugar-errado', 'nao-existe');
                        tecla.classList.add('certo');
                    } else if (resultados[i] === 'lugar-errado' && !tecla.classList.contains('certo')) {
                        tecla.classList.remove('nao-existe');
                        tecla.classList.add('lugar-errado');
                    } else if (resultados[i] === 'nao-existe' && !tecla.classList.contains('certo') && !tecla.classList.contains('lugar-errado')) {
                        tecla.classList.add('nao-existe');
                    }
                }

            }, i * 300); // Atraso para efeito cascata
        }

        // Checar vitória ou derrota
        setTimeout(() => {
            if (palpite === palavraSecreta) {
                mostrarNotificacao("Você venceu!", 5000);
                document.removeEventListener('keydown', handleKeyPress); // Trava o jogo
                tecladoDiv.removeEventListener('click', (e) => {}); // Remove o listener de teclado virtual
            } else if (tentativaAtual === NUM_TENTATIVAS - 1) {
                mostrarNotificacao(`Você perdeu! A palavra era: ${palavraSecreta.toUpperCase()}`, 10000);
                document.removeEventListener('keydown', handleKeyPress); // Trava o jogo
                tecladoDiv.removeEventListener('click', (e) => {}); // Remove o listener de teclado virtual
            } else {
                tentativaAtual++;
                letraAtual = 0; // Reseta para a primeira célula da próxima linha
                // Re-adiciona os event listeners para a próxima tentativa
                ouvirEventos(); 
                atualizarCelulaAtiva(); // Ativa a primeira célula da próxima linha
                
                // Adiciona listeners para seleção de célula na nova linha
                const novaLinhaDiv = document.getElementById(`linha-${tentativaAtual}`);
                if(novaLinhaDiv) {
                    Array.from(novaLinhaDiv.children).forEach((celula, j) => {
                        celula.addEventListener('click', () => selecionarCelula(j));
                    });
                }
            }
        }, TAMANHO_PALAVRA * 300 + 500); // Espera a animação terminar + um pequeno delay
    }

    function mostrarNotificacao(mensagem, duracao = 2000) {
        // Limpa notificações anteriores para não acumular
        notificacaoDiv.innerHTML = ''; 

        const notificacao = document.createElement('div');
        notificacao.className = 'notificacao';
        notificacao.textContent = mensagem;
        
        notificacaoDiv.appendChild(notificacao);

        setTimeout(() => {
            // Adiciona uma classe para animar o desaparecimento, se desejar
            // notificacao.classList.add('fade-out');
            notificacao.remove();
        }, duracao);
    }

    init();
});
