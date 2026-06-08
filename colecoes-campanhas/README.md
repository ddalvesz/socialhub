# Coleções × Campanhas — mudanças aplicadas

Este pacote documenta o que foi feito na adição da aba **Coleções** e na conexão dela com a aba **Campanhas**, ambas no SocialHub.

---

## 1. Aba Coleções (nova)

Aba colocada em **Planejamento**, ao lado de Campanhas. Pensada para ser usada pelos times de **Ilustra** e **Marketing**.

### Modelo de dados

Cada coleção tem:

| Campo | Descrição |
|---|---|
| `nome` | Nome da coleção |
| `tipo` | `licenciamento` · `autoral` · `sustentacao` · `artista` |
| `mes` | Mês alvo (texto livre, ex.: "Maio") |
| `dataSite` | Data de lançamento no site |
| `dataMarketing` | Data de início do marketing |
| `confirmado` | `ok` · `negociacao` · `cancelada` |
| `launched` | Está no site? (boolean) |
| `ilustra` | Sub-objeto com status + tarefas de ilustra |
| `marketing` | Sub-objeto com status + pacote + dono + tarefas de marketing |
| `campaignId` | ID da campanha vinculada (ou `null`) |

#### Sub-objeto `ilustra`

```js
{
  status: 'criacao' | 'aprovacao' | 'naoIniciada' | 'atrasada',
  criacao: false,         // criação das estampas (obrigatória)
  adaptacao: false,       // adaptação (obrigatória)
  aprovEnabled: false,    // se a coleção exige aprovação das estampas
  aprov: false,           // aprovação feita
  cadastro: false,        // cadastro feito (obrigatória)
}
```

#### Sub-objeto `marketing`

```js
{
  status: 'criacao' | 'aprovacao' | 'naoIniciada' | 'atrasada',
  pack: 'PP' | 'P' | 'M' | 'G',
  dono: 'Eduarda' | ...,
  banner: false,          // (obrigatória)
  // cada par xxxEnabled + xxx → etapa opcional
  pedidoEnabled, pedido,        // pedido de conteúdo
  loadingEnabled, loading,      // loading page
  postEnabled, post,            // post estático
  carrosselEnabled, carrossel,  // carrossel
  reelsEnabled, reels,          // reels
  trincaEnabled, trinca,        // trinca de conteúdo
  shootingEnabled, shooting,    // mini shooting
  storiesEnabled, stories,      // stories
  influsEnabled, influs,        // influs
}
```

#### Cálculo de progresso (`colProgress`)

Função pura em `socialhub-data.jsx`:

```js
function colProgress(c) {
  let total = 0, done = 0;
  // ilustra: conta tarefas obrigatórias + opcionais habilitadas
  ILUSTRA_TASKS.forEach(t => {
    const enabled = t.optional ? !!c.ilustra[`${t.key}Enabled`] : true;
    if (enabled) { total++; if (c.ilustra[t.key]) done++; }
  });
  // marketing: mesma lógica
  MKT_TASKS.forEach(t => { ... });
  return total === 0 ? 0 : Math.round((done / total) * 100);
}
```

→ **Progresso = (tarefas feitas) ÷ (obrigatórias + opcionais habilitadas)**, em %.

### UI da aba

- **Filtros**: Todas / Em andamento / Lançadas / Em negociação / Canceladas + filtro por tipo.
- **Lista** com 10 colunas: chevron, nome, tipo, mês, data site, início marketing, status Ilustra, status Marketing, confirmada, progresso.
  - Coleções canceladas aparecem com opacidade reduzida e nome riscado.
  - Coleções já no site recebem badge **NO SITE**.
- **Linha expandida** mostra:
  - Quick facts (datas, pacote, dono, % conclusão)
  - **Bloco "Campanha"** (ver seção 2)
  - **Dois painéis lado a lado**: Ilustra (acento lilás) e Marketing (acento azul).
    - Cada painel tem seu próprio **status pill** clicável no topo.
    - Marketing também mostra pacote (PP/P/M/G) e dono.
    - Cada tarefa é uma linha com:
      - Checkbox "feita" à esquerda (controla o progresso)
      - Nome da tarefa
      - Badge **OBRIGATÓRIA** ou **switch on/off** à direita (para etapas opcionais)
    - Tarefa desativada via switch fica riscada e não conta no progresso.
  - Ações no rodapé: editar, marcar como lançada, excluir.

---

## 2. Conexão Coleção ↔ Campanha

> **Regra**: toda campanha precisa de uma coleção. Coleções podem existir sem campanha.

### Modelo

Foram adicionados dois campos espelhados:

- `collection.campaignId` → ID da campanha vinculada (ou `null`)
- `campaign.colecaoId` → ID da coleção vinculada (ou `null`)

Os handlers garantem que o link é sempre simétrico — vincular A↔B atomicamente quebra qualquer link prévio dos dois lados.

### O que sincroniza

Quando uma coleção e uma campanha estão linkadas:

| Campo | Comportamento |
|---|---|
| **Progresso da campanha** | Substituído por `colProgress(coleção)`. O slider manual fica ignorado. |
| **Lançada?** | Compartilhado — marcar de um lado marca do outro automaticamente. |
| Demais campos (datas, milestones, pacote, dono, tipo) | Independentes. |

### Handlers (no `SocialHubApp`)

Centralizados em `socialhub-app.jsx` e passados como prop `linking` para as duas views:

```js
const linking = {
  collections, campaigns, setCollections, setCampaigns,
  linkColCamp,                     // vincular uma coleção a uma campanha (e quebrar outros vínculos)
  unlinkColCamp,                   // desvincular
  createCampaignFromCollection,    // cria campanha nova com dados da coleção, já linkada
  createCollectionFromCampaign,    // mesma coisa no sentido inverso
  setCollectionLaunched,           // setter de launched que espelha pra campanha linkada
  setCampaignLaunched,             // mesma coisa no sentido inverso
};
```

### UI da vinculação

#### Badges nas listas

- **Linha da coleção**: badge laranja **"Campanha"** ao lado do nome se estiver linkada.
- **Linha da campanha**: badge **"Coleção"** ao lado do nome.

#### Barra de progresso da campanha

Quando linkada:
- A barra ganha gradiente azul-roxo (em vez do laranja padrão), via classe `.progress.from-link`.
- Aparece um pequeno ícone 🔗 ao lado da porcentagem.
- Na expansão, o label fica **"Conclusão · vem da coleção"**.

#### Seção de vínculo (na expansão dos dois lados)

Componentes:

- `CampaignLinkSection` (em `socialhub-collections.jsx`) — aparece na expansão da coleção
- `CollectionLinkSection` (em `socialhub-views.jsx`) — aparece na expansão da campanha

Quando **não linkada**:
- Botão **"+ Marcar como campanha"** / **"+ Vincular coleção"**
- Ao clicar, abre um **picker** com:
  - Lista de candidatas disponíveis (apenas itens do outro lado sem vínculo)
  - CTA **"+ Criar nova ... a partir desta ..."** no rodapé do picker

Quando **linkada**:
- Chip clicável mostrando o item vinculado — clicar navega para a outra aba e abre o item correspondente.
- Botão **×** ao lado para desvincular.

#### Navegação cross-view

Quando o usuário clica no chip linkado, a view do outro lado é aberta e o item destacado pela seguinte mecânica:

1. O `onNavigate*` callback no `SocialHubApp` chama `setView('campaigns'/'collections')`.
2. Em seguida dispara um `CustomEvent('focusCampaign'/'focusCollection', { detail: id })`.
3. Cada view tem um `useEffect` ouvindo esse evento, que expande a linha correspondente.

---

## 3. Arquivos modificados/criados

| Arquivo | O que tem |
|---|---|
| `socialhub-collections.jsx` | **(novo)** View `CollectionsView`, formulário, painéis Ilustra/Marketing, `CampaignLinkSection` |
| `socialhub-data.jsx` | **(modificado)** `COLLECTIONS_LIST`, `COLECAO_TIPOS`, `COL_STATUS`, `COL_CONFIRMADO`, `ILUSTRA_TASKS`, `MKT_TASKS`, `colProgress()` + `colecaoId` na campanha 1 |
| `socialhub-views.jsx` | **(modificado)** `CampaignsView` agora recebe `linking` via prop, calcula progresso efetivo, renderiza `CollectionLinkSection` |
| `socialhub-app.jsx` | **(modificado)** Estado de coleções e campanhas elevado, todos os handlers de link, navegação cross-view |
| `socialhub-icons.jsx` | **(modificado)** Ícone `Icon.collections` |
| `socialhub.css` | **(modificado)** Estilos das seções: status pills, painéis Ilustra/Marketing, mini-switch, link badges, link chips, picker |
| `SocialHub.html` | **(modificado)** Inclui o novo `socialhub-collections.jsx` |

---

## 4. Exemplo seedado

A coleção `#9 "Linha Care — Verão"` já vem linkada com a campanha `#1 "Linha Care - Lançamento Verão"`. Abra qualquer um dos dois para ver:
- Badge de vínculo
- Barra de progresso da campanha azul/roxa com ícone 🔗
- Chip de "abrir o outro lado" na expansão

Para testar a criação de novos vínculos:
1. Abra a aba **Coleções**
2. Expanda **Disney 100 — Princesas**
3. Clique em **"+ Marcar como campanha"**
4. Escolha uma campanha existente OU **"+ Criar nova campanha a partir desta coleção"**
