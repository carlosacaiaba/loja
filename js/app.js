/**
 * SISTEMA DE CONTROLE DE ESTOQUE - LOGICA INTEGRADA
 * Controla a navegação, CRUD com localStorage, validações e relatórios simples.
 */

// --- 1. CONTROLE DE NAVEGAÇÃO E TELAS (SPA) ---
function alternarTela(telaAlvo) {
    // Localiza todas as seções de tela
    const telas = document.querySelectorAll('.tela-secao');
    telas.forEach(tela => tela.classList.add('oculto-tela'));

    // Mostra apenas a tela selecionada
    const telaAtiva = document.getElementById(`tela-${telaAlvo}`);
    if (telaAtiva) {
        telaAtiva.classList.remove('oculto-tela');
    }

    // Se for para a tela de início ou de listagem, atualiza os dados visuais
    if (telaAlvo === 'inicio') {
        atualizarDashboard();
    } else if (telaAlvo === 'listagem') {
        renderizarTabela();
    }
}

// --- 2. EXIBIÇÃO DE MENSAGENS DE FEEDBACK (SUCESSO / ERRO) ---
function exibirMensagem(texto, tipo) {
    const divMensagem = document.getElementById('mensagem');
    divMensagem.innerText = texto;
    divMensagem.className = `mensagem-alerta alert-${tipo}`; // Muda a cor via CSS (ex: alert-sucesso ou alert-erro)
    divMensagem.classList.remove('oculto-tela');

    // Remove a mensagem da tela após 4 segundos automaticamente
    setTimeout(() => {
        divMensagem.classList.add('oculto-tela');
    }, 4000);
}

// --- 3. PERSISTÊNCIA DE DADOS (LOCALSTORAGE) ---
function obterProdutos() {
    return JSON.parse(localStorage.getItem('produtos')) || [];
}

function salvarListaProdutos(lista) {
    localStorage.setItem('produtos', JSON.stringify(lista));
}

// --- 4. DASHBOARD DA TELA INICIAL ---
function atualizarDashboard() {
    const produtos = obterProdutos();
    // Soma o total acumulado de todas as unidades de mercadorias no estoque
    const totalItens = produtos.reduce((acumulador, item) => acumulador + Number(item.quantidade), 0);
    
    const dashTotal = document.getElementById('dash-total');
    if (dashTotal) {
        dashTotal.innerText = totalItens;
    }
}

// --- 5. OPERAÇÃO: SALVAR (CADASTRAR OU ALTERAR) ---
function salvarProduto(event) {
    event.preventDefault(); // Impede o recarregamento da página

    // Captura os valores dos inputs
    const idHidden = document.getElementById('produto-id').value;
    const nome = document.getElementById('nome').value.trim();
    const quantidade = parseInt(document.getElementById('quantidade').value);
    const preco = parseFloat(document.getElementById('preco').value);

    // Validação estrita de dados
    if (!nome || isNaN(quantidade) || quantidade <= 0 || isNaN(preco) || preco <= 0) {
        exibirMensagem("Erro: Por favor, preencha todos os campos com valores válidos acima de zero.", "erro");
        return;
    }

    let listaProdutos = obterProdutos();

    if (idHidden) {
        // MODO ALTERAÇÃO: Atualiza o registro existente
        listaProdutos = listaProdutos.map(produto => {
            if (produto.id === Number(idHidden)) {
                return { id: produto.id, nome, quantidade, preco };
            }
            return produto;
        });
        exibirMensagem("Sucesso: Produto atualizado com sucesso!", "sucesso");
    } else {
        // MODO CADASTRO: Cria um novo registro
        const novoId = Date.now(); // Gera ID único com base no timestamp
        listaProdutos.push({ id: novoId, nome, quantidade, preco });
        exibirMensagem("Sucesso: Produto cadastrado com sucesso!", "sucesso");
    }

    salvarListaProdutos(listaProdutos);
    limparFormulario();
    alternarTela('listagem'); // Redireciona o usuário para ver a tabela
}

// --- 6. OPERAÇÃO: LISTAGEM ---
function renderizarTabela(produtosFiltrados = null) {
    const corpoTabela = document.getElementById('tabela-corpo');
    const mensagemVazio = document.getElementById('mensagem-vazio');
    
    // Usa os produtos filtrados pela pesquisa ou carrega a lista completa
    const lista = produtosFiltrados || obterProdutos();

    corpoTabela.innerHTML = '';

    if (lista.length === 0) {
        mensagemVazio.style.display = 'block';
        return;
    } else {
        mensagemVazio.style.display = 'none';
    }

    lista.forEach(produto => {
        const linha = document.createElement('tr');
        const totalEstoque = produto.quantidade * produto.preco;

        linha.innerHTML = `
            <td>#${produto.id.toString().slice(-4)}</td> <!-- Mostra só os 4 últimos dígitos do ID para ficar elegante -->
            <td><strong>${produto.nome}</strong></td>
            <td>${produto.quantidade} un.</td>
            <td>R$ ${produto.preco.toFixed(2)}</td>
            <td>R$ ${totalEstoque.toFixed(2)}</td>
            <td>
                <button class="btn-tabela btn-editar" onclick="prepararAlteracao(${produto.id})">Alterar</button>
                <button class="btn-tabela btn-deletar" onclick="excluirProduto(${produto.id})">Excluir</button>
            </td>
        `;
        corpoTabela.appendChild(linha);
    });
}

// --- 7. OPERAÇÃO: PESQUISA (FILTRO) ---
function pesquisarProdutos() {
    const termoPesquisa = document.getElementById('campo-pesquisa').value.toLowerCase().trim();
    const todosProdutos = obterProdutos();

    // Filtra os produtos cujo nome contém o texto digitado pelo usuário
    const resultadoFiltro = todosProdutos.filter(produto => 
        produto.nome.toLowerCase().includes(termoPesquisa)
    );

    renderizarTabela(resultadoFiltro);
}

// --- 8. OPERAÇÃO: PREPARAR ALTERAÇÃO ---
function prepararAlteracao(id) {
    const produtos = obterProdutos();
    const produtoEncontrado = produtos.find(p => p.id === id);

    if (produtoEncontrado) {
        // Preenche o formulário com os dados atuais do produto para edição
        document.getElementById('produto-id').value = produtoEncontrado.id;
        document.getElementById('nome').value = produtoEncontrado.nome;
        document.getElementById('quantidade').value = produtoEncontrado.quantidade;
        document.getElementById('preco').value = produtoEncontrado.preco;

        // Modifica os títulos visuais para o modo de Edição
        document.getElementById('titulo-form').innerText = "Alterar Dados do Produto";
        
        // Direciona o usuário para a tela de cadastro (que agora atua como edição)
        alternarTela('cadastro');
    }
}

// --- 9. OPERAÇÃO: EXCLUSÃO ---
function excluirProduto(id) {
    if (confirm("Tem certeza de que deseja excluir este produto do estoque?")) {
        const produtos = obterProdutos();
        // Filtra a lista removendo o item selecionado
        const listaAtualizada = produtos.filter(p => p.id !== id);
        
        salvarListaProdutos(listaAtualizada);
        exibirMensagem("Sucesso: Produto removido do estoque.", "sucesso");
        renderizarTabela(); // Atualiza a tabela na tela
    }
}

// --- 10. LIMPEZA DE AUXÍLIO ---
function limparFormulario() {
    document.getElementById('form-produto').reset();
    document.getElementById('produto-id').value = ''; // Limpa o ID oculto
    document.getElementById('titulo-form').innerText = "Cadastrar Novo Produto"; // Reseta o título da tela
}

// Inicialização automática ao abrir a aplicação
document.addEventListener('DOMContentLoaded', () => {
    atualizarDashboard();
});
