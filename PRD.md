# PRD – Aplicativo de Gestão Financeira com Módulo de Previsibilidade

## 0. Resumo Executivo

Este documento descreve o MVP de um aplicativo de **gestão financeira pessoal**, semelhante ao Mobills (controle de entradas/saídas, contas, cartões, categorias), com um **diferencial principal**:

> **Módulo de Previsibilidade de Saldo**: projeção de saldo mês a mês, considerando receitas, despesas, cartões, despesas recorrentes e parceladas, para responder “como estará meu dinheiro nos próximos meses?”.

O PRD está escrito para que **desenvolvedores, designers e stakeholders** consigam entender, modelar e implementar o sistema sem conhecimento prévio do projeto.

---

## 1. Visão Geral

### 1.1. Nome do Produto (provisório)

- Nome interno: **Finanças com Previsão** (pode ser alterado depois)

### 1.2. Objetivo do Produto

- Ajudar o usuário a **controlar o presente** (entradas, saídas, cartões, saldos)  
- E principalmente **planejar o futuro**, mostrando:
  - Projeção de saldo mês a mês.
  - Meses com risco de saldo negativo.
  - Impacto de compras parceladas e recorrentes.

### 1.3. Público-Alvo

- Pessoas de **20 a 40 anos**, com renda fixa ou mista (CLT, PJ, freelas).
- Já tentaram algum tipo de controle (app ou planilha), mas:
  - Não conseguem manter.
  - Não entendem o impacto dos parcelamentos.
  - Querem ver o **efeito futuro** dos hábitos atuais.

---

## 2. Escopo do MVP

### 2.1. Incluído no MVP

1. **Cadastro e autenticação básica de usuários**  
2. **Gestão de contas**  
   - Conta corrente, poupança, carteira, “cofrinhos”.
3. **Gestão de transações**
   - Entradas (receitas), saídas (despesas), transferências.
   - Transações recorrentes.
   - Transações parceladas.
4. **Gestão de cartões de crédito**
   - Cadastro de cartões, limites, fechamento e vencimento.
   - Compras à vista e parceladas.
   - Faturas mensais (atual e futuras).
5. **Categorias de receita e despesa**
6. **Relatórios básicos**
   - Listagem por período.
   - Total por categoria no mês.
7. **Módulo de Previsibilidade de Saldo**
   - Projeção de saldo mês a mês (mínimo 12 meses).
   - Visão em gráfico + tabela.
   - Alertas de meses com saldo negativo.
   - Simulação simples de cenários (“e se…”).
8. **Onboarding guiado**
   - Coletar saldo inicial, renda principal e algumas despesas fixas.

### 2.2. Fora de Escopo (MVP)

- Conexão automática com bancos (Open Finance).
- Investimentos avançados (renda variável, FIIs, etc.).
- Multiusuário familiar (contas compartilhadas).
- Versão para empresas / MEI.

---

## 3. Glossário

- **Conta**: qualquer origem/destino de dinheiro (corrente, carteira, poupança).
- **Transação**: registro de movimentação de dinheiro (entrada, saída, transferência).
- **Cartão de crédito**: meio de pagamento com faturas mensais.
- **Fatura**: agrupamento mensal das transações daquele cartão.
- **Transação recorrente**: transação repetida automaticamente em uma frequência (mensal, semanal, anual, etc.).
- **Transação parcelada**: um valor total dividido em N parcelas associadas a datas futuras.
- **Saldo atual**: saldo consolidado das contas nas datas reais (hoje).
- **Saldo projetado**: saldo estimado em datas futuras, considerando todas as transações previstas.
- **Módulo de Previsibilidade**: conjunto de telas e regras que calcula e exibe o saldo projetado.

---

## 4. Regras de Negócio

### 4.1. Saldo

- O **saldo por conta** é calculado como:
  - `Saldo da conta = Soma(entradas) - Soma(saídas) + Transferências recebidas - Transferências enviadas`.
- O **saldo consolidado** é a soma dos saldos de todas as contas do usuário.

### 4.2. Transações

- Uma transação sempre pertence a uma **conta** e a um **usuário**.
- Tipos de transação:
  - `INCOME` (entrada/receita)
  - `EXPENSE` (saída/despesa)
  - `TRANSFER` (transferência entre contas)
- `TRANSFER` gera **dois lançamentos**:
  - Saída da conta de origem.
  - Entrada na conta de destino.

### 4.3. Recorrências

- Exemplo: aluguel R$ 1.500 todo dia 05.
- A recorrência define:
  - Valor
  - Tipo (ENTRADA/SAÍDA)
  - Frequência (mensal/…)
  - Data de início
  - Data de término (ou “indefinido”).
- O sistema gera instâncias de transações futuras para:
  - Cálculo do saldo projetado.
  - Eventual exibição no calendário financeiro.

### 4.4. Parcelamentos

- Exemplo: compra de R$ 1.000 em 10x.
- O sistema deve:
  - Registrar o valor total.
  - Gerar **10 parcelas** associadas às datas definidas (geralmente faturas do cartão).
- Parcelas devem ser consideradas:
  - Na fatura do cartão (pelo valor da parcela).
  - No módulo de previsibilidade (como despesas futuras).

### 4.5. Cartões de Crédito

- Cada cartão têm:
  - Limite total
  - Dia de fechamento
  - Dia de vencimento
- **Regra básica de fatura:**
  - Compras realizadas entre o último fechamento e o próximo fechamento pertencem à fatura atual.
  - Compras parceladas geram parcelas nas faturas subsequentes.
- Ao **pagar uma fatura**:
  - Gera uma transação do tipo `EXPENSE` na conta de pagamento (ex.: conta corrente).
  - O valor é o total da fatura.
  - A fatura muda status para `PAID`.

### 4.6. Módulo de Previsibilidade

- Período padrão: **próximos 12 meses**.
- Para cada mês, o sistema calcula:

  - `Saldo inicial do mês`  
  - `+ Total de receitas do mês (incluindo recorrentes)`  
  - `- Total de despesas do mês (incluindo recorrentes)`  
  - `- Parcelas de cartão / carnês / boletos`  
  - `= Saldo final projetado do mês`

- **Saldo inicial do primeiro mês**:
  - É o saldo consolidado **atual** (na data de hoje).
- **Saldo inicial dos meses seguintes**:
  - É o saldo final projetado do mês anterior.

- A projeção considera:
  - Transações futuras já cadastradas (parceladas, recorrentes, faturas futuras).
  - Não considera:
    - Gastos futuros não registrados.
    - Entradas eventuais não cadastradas (ex.: “freela que pode acontecer”).

- **Alertas**:
  - Se o saldo projetado final de um mês < 0 → marcar mês como **crítico**.
  - Se a soma das faturas de cartão no mês > X% (configurado, ex.: 40%) da soma das receitas do mês → marcar mês como **risco de endividamento**.

---

## 5. Funcionalidades Detalhadas

### 5.1. Autenticação e Usuário

**User Story:**  
> Como pessoa usuária, quero criar uma conta para ter meus dados salvos com segurança.

**Requisitos:**
- Cadastro por e-mail e senha (MVP).
- Recuperação de senha por e-mail.
- Cada usuário só vê seus próprios dados.

### 5.2. Gestão de Contas

**User Stories:**
- Como usuário, quero cadastrar múltiplas contas (corrente, poupança, carteira) para separar meu dinheiro.
- Como usuário, quero ver o saldo de cada conta e o saldo total.

**Funcionalidades:**
- Criar/editar/excluir conta.
- Tipos de conta (enum):
  - `CHECKING`, `SAVINGS`, `CASH`, `OTHER`.
- Campo opcional: saldo inicial.

### 5.3. Gestão de Categorias

**User Story:**
> Como usuário, quero classificar meus gastos e ganhos em categorias para entender para onde o dinheiro vai.

**Funcionalidades:**
- Categorias padrão (Moradia, Alimentação, Transporte, Lazer, Saúde, Educação, etc.).
- Usuário pode criar categorias personalizadas.
- Cada categoria é marcada como:
  - `INCOME` ou `EXPENSE`.

### 5.4. Transações

**User Stories:**
- Como usuário, quero registrar entradas e saídas.
- Como usuário, quero registrar transferências entre contas.

**Campos principais da transação:**
- `user_id`
- `account_id` (para INCOME/EXPENSE)
- `from_account_id` e `to_account_id` (para TRANSFER)
- `type` (`INCOME` / `EXPENSE` / `TRANSFER`)
- `category_id` (quando aplicável)
- `amount`
- `date`
- `description` (opcional)
- `is_recurring_instance` (bool)
- `is_installment` (bool)
- `parent_recurring_id` / `parent_installment_id` (relacionamento opcional)

### 5.5. Recorrências

**User Story:**
> Como usuário, quero cadastrar despesas e receitas fixas para que o app preencha automaticamente meu futuro financeiro.

**Funcionalidades:**
- Criar recorrência com:
  - Tipo (entrada/saída).
  - Valor.
  - Categoria.
  - Conta.
  - Frequência (`MONTHLY`, `WEEKLY`, `YEARLY`).
  - Data de início.
  - Data de término (ou “sem término”).
- O sistema deve:
  - Gerar instâncias mensais para o cálculo da projeção.
  - (Implementação a critério da equipe: gerar “on the fly” ou salvar em tabela de instâncias.)

### 5.6. Parcelamentos

**User Story:**
> Como usuário, quero registrar uma compra parcelada para ver o impacto futuro no meu orçamento.

**Funcionalidades:**
- Criar uma compra com:
  - Valor total.
  - Número de parcelas.
  - Data da primeira parcela.
  - Associar a uma conta ou a um cartão.
- O sistema:
  - Divide o valor total pelo número de parcelas.
  - Cria registros de parcelas futuras (mesmo valor, salvo ajustes de centavos).

### 5.7. Cartões de Crédito

**User Stories:**
- Como usuário, quero cadastrar meu cartão de crédito com datas de fechamento/vencimento.
- Como usuário, quero ver a fatura atual e as próximas faturas.
- Como usuário, quero saber quanto do meu limite está comprometido.

**Campos do cartão:**
- `user_id`
- `name` (ex.: “Nubank”, “Visa Itaú”)
- `limit_amount`
- `closing_day` (dia do fechamento)
- `due_day` (dia do vencimento)
- `brand` (opcional)

**Funcionalidades:**
- Associar compras ao cartão (à vista ou parceladas).
- Gerar faturas:
  - Tabela `card_invoices` com:
    - `card_id`
    - `month_year` (ex.: 2025-10)
    - `status` (`OPEN`, `CLOSED`, `PAID`)
    - `amount_total`
- Pagar fatura:
  - Usuário escolhe a conta para pagamento.
  - Gera transação de saída na conta.
  - Atualiza status da fatura.

### 5.8. Relatórios básicos

**User Stories:**
- Como usuário, quero ver quanto gastei por categoria no mês atual.
- Como usuário, quero ver uma lista de todas as transações em um período.

**Funcionalidades:**
- Filtro por:
  - Período (mês/ano).
  - Tipo (entrada, saída).
  - Categoria.
- Exibir:
  - Soma de entradas/saídas.
  - Gráfico de pizza por categoria (opcional no MVP, se houver tempo).

### 5.9. Módulo de Previsibilidade de Saldo

#### 5.9.1. Visão Geral

**User Stories:**
- Como usuário, quero ver como ficará meu saldo nos próximos meses para planejar melhor.
- Como usuário, quero saber em qual mês meu saldo ficará negativo, se isso for acontecer.
- Como usuário, quero simular cenários para entender o impacto de novas despesas ou economias.

#### 5.9.2. Cálculo da Projeção

**Premissas:**
- Horizonte padrão: 12 meses a partir do mês atual.
- Usa:
  - Saldo consolidado atual.
  - Todas as transações futuras conhecidas:
    - Recorrentes
    - Parceladas
    - Faturas futuras de cartão
    - Outras transações já agendadas (se implementadas).

**Fórmula (por mês):**

1. **Mês 1 (mês atual ou próximo):**
   - `SaldoInicial_M1 = SaldoConsolidadoAtual`
2. **Para cada mês M (de 1 a 12):**
   - `Receitas_M = soma das entradas previstas em M`
   - `Despesas_M = soma das saídas previstas em M (inclui parcelas e recorrentes)`
   - `SaldoFinal_M = SaldoInicial_M + Receitas_M - Despesas_M`
3. **Para o mês seguinte:**
   - `SaldoInicial_M+1 = SaldoFinal_M`

#### 5.9.3. Interface de Projeção

**Tela de projeção:**
- Gráfico de linha com:
  - Eixo X: meses (ex.: Out/2025, Nov/2025, …).
  - Eixo Y: saldo projetado.
- Abaixo, lista em formato tabela:
  - Mês / Saldo inicial / Receitas / Despesas / Resultado do mês / Saldo final.

**Alertas visuais:**
- Mês com saldo final < 0 → destacar em vermelho.
- Fatura de cartão > X% da renda do mês → ícone de alerta.

#### 5.9.4. Simulações (“E se…?”) – Versão Simples

**Funcionalidades de MVP:**
- Permitir criar uma simulação básica:
  - Exemplo 1: “Adicionar despesa de R$ 500/mês durante 6 meses a partir de [data]”.
  - Exemplo 2: “Adicionar um parcelamento de R$ 2.000 em 10x”.
- A simulação:
  - **Não altera** os dados reais.
  - Só recalcula o gráfico e a tabela considerando estes itens adicionais.
- Usuário pode limpar a simulação e voltar à projeção real.

---

## 6. Fluxos de UX (Resumo em Passos)

### 6.1. Fluxo de Onboarding

1. Tela de Boas-vindas.
2. Cadastro (e-mail, senha).
3. Perguntas:
   - Qual o saldo atual da sua conta principal?
   - Você tem cartão de crédito? (Sim/Não)
   - Qual sua renda mensal aproximada?
4. O sistema:
   - Cria uma conta padrão (ex.: “Conta Principal”).
   - Registra o saldo inicial.
   - Se tiver cartão, permite cadastrar rapidamente.
   - Gera a **primeira projeção** com base nisso.
5. Tela final: mostra um preview da projeção e sugere continuar cadastrando despesas fixas.

### 6.2. Fluxo diário – Registro de transação

1. Usuário entra no app.
2. Tela inicial:
   - Saldo atual consolidado.
   - Atalhos: “+ Entrada”, “+ Despesa”, “+ Transferência”, “Ver Projeção”.
3. Ao clicar em “+ Despesa”:
   - Seleciona conta
   - Coloca valor, data, categoria, descrição.
   - Marca se é:
     - Despesa única.
     - Recorrente.
     - Parcelada.
4. Salva transação e atualiza saldos.

### 6.3. Fluxo – Cartão de crédito e fatura

1. Usuário cadastra cartão com limite, fechamento e vencimento.
2. Ao lançar compra no cartão:
   - Seleciona cartão.
   - Define valor e se é parcelado.
3. Sistema distribui parcela nas faturas corretas.
4. Na tela de cartão:
   - Mostrar fatura atual, próxima fatura e futuras (lista).
5. Ao pagar fatura:
   - Usuário escolhe conta de débito.
   - App cria transação de saída e marca fatura como paga.

### 6.4. Fluxo – Projeção de saldo

1. Usuário acessa o menu/tela “Projeção”.
2. Escolhe o horizonte (ex.: 12 meses – default).
3. App calcula e exibe:
   - Gráfico de saldo.
   - Tabela mensal.
4. Usuário identifica meses críticos (negativo).
5. Usuário pode clicar em “Simular Cenário”:
   - Adiciona uma despesa ou parcelamento hipotético.
   - App recalcula projeção.
6. Usuário pode salvar ou descartar a simulação (MVP pode apenas descartar, sem salvar cenários).

---

## 7. Modelo de Dados (Sugestão Relacional)

> Observação: os tipos são sugestão genérica (pode ser adaptado para SQL específico ou NoSQL).

### 7.1. Tabela `users`

| Campo        | Tipo        | Descrição                       |
|--------------|-------------|---------------------------------|
| id           | UUID        | Identificador do usuário        |
| name         | string      | Nome                            |
| email        | string      | E-mail (único)                  |
| password_hash| string      | Senha criptografada             |
| created_at   | datetime    | Data de criação                 |

### 7.2. Tabela `accounts`

| Campo       | Tipo     | Descrição                                       |
|-------------|----------|-------------------------------------------------|
| id          | UUID     | ID da conta                                    |
| user_id     | UUID     | Dono da conta                                  |
| name        | string   | Nome da conta (ex.: “Conta Nubank”)            |
| type        | enum     | `CHECKING`, `SAVINGS`, `CASH`, `OTHER`         |
| initial_balance | decimal | Saldo inicial                               |
| created_at  | datetime | Data de criação                                |

### 7.3. Tabela `categories`

| Campo       | Tipo     | Descrição                             |
|-------------|----------|---------------------------------------|
| id          | UUID     | ID da categoria                       |
| user_id     | UUID     | Usuário (pode haver categorias globais) |
| name        | string   | Nome                                  |
| operation   | enum     | `INCOME` ou `EXPENSE`                 |

### 7.4. Tabela `transactions`

| Campo               | Tipo     | Descrição                                           |
|---------------------|----------|-----------------------------------------------------|
| id                  | UUID     | ID da transação                                    |
| user_id             | UUID     | Dono                                               |
| account_id          | UUID     | Conta (para INCOME/EXPENSE)                        |
| from_account_id     | UUID?    | Conta origem (para TRANSFER)                       |
| to_account_id       | UUID?    | Conta destino (para TRANSFER)                      |
| type                | enum     | `INCOME`, `EXPENSE`, `TRANSFER`                    |
| category_id         | UUID?    | Categoria (quando aplicável)                       |
| amount              | decimal  | Valor                                              |
| date                | date     | Data efetiva                                       |
| description         | string?  | Observação                                         |
| is_recurring_instance | bool   | Se é instância de recorrência                      |
| recurring_id        | UUID?    | Referência à recorrência (se houver)               |
| is_installment      | bool     | Se faz parte de parcelas                           |
| installment_id      | UUID?    | ID do agrupador de parcelamento                    |
| installment_number  | int?     | Nº da parcela                                      |
| total_installments  | int?     | Número total de parcelas                           |
| created_at          | datetime | Data de criação                                    |

### 7.5. Tabela `recurrings`

| Campo          | Tipo     | Descrição                                      |
|----------------|----------|-----------------------------------------------|
| id             | UUID     | ID da recorrência                             |
| user_id        | UUID     | Dono                                          |
| account_id     | UUID     | Conta                                         |
| category_id    | UUID     | Categoria                                     |
| type           | enum     | `INCOME` ou `EXPENSE`                         |
| amount         | decimal  | Valor                                         |
| frequency      | enum     | `MONTHLY`, `WEEKLY`, `YEARLY`                 |
| start_date     | date     | Início                                        |
| end_date       | date?    | Fim (nulo se indefinido)                      |
| created_at     | datetime | Data de criação                               |

### 7.6. Tabela `cards`

| Campo        | Tipo     | Descrição                       |
|--------------|----------|---------------------------------|
| id           | UUID     | ID do cartão                    |
| user_id      | UUID     | Dono                            |
| name         | string   | Nome (Nubank, Visa Itaú…)      |
| limit_amount | decimal  | Limite                          |
| closing_day  | int      | Dia de fechamento               |
| due_day      | int      | Dia de vencimento               |
| created_at   | datetime | Data de criação                 |

### 7.7. Tabela `card_invoices`

| Campo        | Tipo     | Descrição                                  |
|--------------|----------|--------------------------------------------|
| id           | UUID     | ID da fatura                               |
| card_id      | UUID     | Cartão                                     |
| month_year   | string   | Ex.: “2025-10”                             |
| amount_total | decimal  | Valor total da fatura                      |
| status       | enum     | `OPEN`, `CLOSED`, `PAID`                   |
| due_date     | date     | Data real de vencimento                    |

### 7.8. Tabela `card_transactions` (ligação com transações)

| Campo          | Tipo     | Descrição                            |
|----------------|----------|--------------------------------------|
| id             | UUID     | ID                                  |
| card_id        | UUID     | Cartão                              |
| invoice_id     | UUID     | Fatura                              |
| transaction_id | UUID     | Referência na tabela `transactions` |

---

## 8. APIs (Sugestão de Estrutura REST)

> Rotas e exemplos genéricos, podem ser adaptados.

### 8.1. Autenticação

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/forgot-password`

### 8.2. Contas

- `GET /accounts`
- `POST /accounts`
- `PUT /accounts/:id`
- `DELETE /accounts/:id`

### 8.3. Categorias

- `GET /categories`
- `POST /categories`
- `PUT /categories/:id`
- `DELETE /categories/:id`

### 8.4. Transações

- `GET /transactions?start_date=&end_date=&type=&category_id=`
- `POST /transactions`
- `PUT /transactions/:id`
- `DELETE /transactions/:id`

### 8.5. Recorrências

- `GET /recurrings`
- `POST /recurrings`
- `PUT /recurrings/:id`
- `DELETE /recurrings/:id`

### 8.6. Cartões e Faturas

- `GET /cards`
- `POST /cards`
- `PUT /cards/:id`
- `DELETE /cards/:id`

- `GET /cards/:id/invoices`  
- `POST /cards/:id/pay-invoice` (paga fatura atual, informando conta de débito)

### 8.7. Projeção de Saldo

- `GET /forecast?months=12`

**Resposta esperada (exemplo):**
```json
[
  {
    "month": "2025-10",
    "starting_balance": 2500.00,
    "total_incomes": 4000.00,
    "total_expenses": 3500.00,
    "result": 500.00,
    "ending_balance": 3000.00,
    "has_negative": false,
    "card_invoices_sum": 1800.00,
    "card_risk": false
  },
  {
    "month": "2025-11",
    "starting_balance": 3000.00,
    "total_incomes": 4000.00,
    "total_expenses": 4500.00,
    "result": -500.00,
    "ending_balance": 2500.00,
    "has_negative": false,
    "card_invoices_sum": 2500.00,
    "card_risk": true
  }
]
