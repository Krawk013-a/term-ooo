import unicodedata
import os

def remover_acentos(texto):
    """Remove acentos de uma string."""
    nfkd_form = unicodedata.normalize('NFKD', texto)
    return u"".join([c for c in nfkd_form if not unicodedata.combining(c)])

def preparar_listas():
    """
    Lê uma lista de palavras, filtra as de 5 letras, remove acentos
    e salva em dois arquivos JS.
    """
    palavras_validas = set()
    
    print("Lendo o arquivo de palavras...")
    try:
        with open('lista_palavras.txt', 'r', encoding='utf-8') as f:
            for linha in f:
                palavra = linha.strip().lower()
                if len(palavra) == 5 and palavra.isalpha():
                    palavra_sem_acento = remover_acentos(palavra)
                    palavras_validas.add(palavra_sem_acento)
    except FileNotFoundError:
        print("Erro: Arquivo 'lista_palavras.txt' não encontrado.")
        print("Por favor, baixe o dicionário e salve-o na mesma pasta.")
        return

    lista_ordenada = sorted(list(palavras_validas))
    
    # Criar o diretório se não existir
    if not os.path.exists('dicionario'):
        os.makedirs('dicionario')

    # Salva a lista completa para validação de chutes
    print(f"Encontradas {len(lista_ordenada)} palavras de 5 letras.")
    print("Salvando dicionario.js...")
    with open('dicionario/dicionario.js', 'w', encoding='utf-8') as f:
        f.write('const DICIONARIO = [\n')
        for palavra in lista_ordenada:
            f.write(f'  "{palavra}",\n')
        f.write('];\n')

    # Salva a mesma lista para ser usada como respostas.
    # Em um jogo real, você poderia ter uma lista menor e mais "comum" aqui.
    print("Salvando respostas.js...")
    with open('dicionario/respostas.js', 'w', encoding='utf-8') as f:
        f.write('const RESPOSTAS = [\n')
        for palavra in lista_ordenada:
            f.write(f'  "{palavra}",\n')
        f.write('];\n')
        
    print("Arquivos de dicionário criados com sucesso na pasta 'dicionario/'!")

# Executa a função
preparar_listas()