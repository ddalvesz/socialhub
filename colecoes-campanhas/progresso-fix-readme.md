# Fix: progresso de campanha sem coleção vinculada

## Contexto

Toda **campanha** precisa de uma **coleção** vinculada para ter progresso. O progresso da campanha é calculado a partir do progresso da coleção (`colProgress()`), não mais a partir do campo `progresso` manual armazenado na campanha.

Antes deste fix: campanha sem coleção caía no fallback `c.progresso` e mostrava um valor antigo (legado do slider manual), o que era enganoso.

Depois deste fix: campanha sem coleção mostra explicitamente que precisa ser vinculada.

## Comportamento

| Estado da campanha | Como renderiza o progresso |
|---|---|
| **Com coleção vinculada** | Barra com gradiente azul/roxo + ícone 🔗 + porcentagem calculada via `colProgress(colecao)` |
| **Sem coleção vinculada** | Chip âmbar tracejado **"Vincule uma coleção"** (clicável → expande a linha e abre o picker de coleções) |

## Mudanças necessárias

### 1. Na célula de progresso da linha (lista de campanhas)

Onde antes era um único bloco com `effProg` independente do estado de vínculo, agora condicionar:

```jsx
<div className="cell">
  {linkedColecao ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div className="progress from-link" style={{ flex: 1 }}>
        <div style={{ width: `${effProg}%` }} />
      </div>
      <span style={{ /* ... */ }}>
        {effProg}%
        <span className="link-icon-mini" title="Calculado pela coleção">
          <Icon.link />
        </span>
      </span>
    </div>
  ) : (
    <button
      className="progress-missing"
      onClick={(e) => {
        e.stopPropagation();
        setExpanded(c.id);     // abre a linha
        setPickerOpen(c.id);   // abre o picker de coleções
      }}
      title="Toda campanha precisa de uma coleção"
    >
      <span className="pm-dot" />
      <span>Vincule uma coleção</span>
    </button>
  )}
</div>
```

### 2. No "Conclusão" da linha expandida

```jsx
<div className="exp-cell">
  <label>
    Conclusão {linkedColecao && <span style={{ color: 'var(--accent-deep)' }}>· vem da coleção</span>}
  </label>
  {linkedColecao ? (
    <div className="v" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div className="progress from-link" style={{ flex: 1, maxWidth: 130 }}>
        <div style={{ width: `${effProg}%` }} />
      </div>
      <span style={{ fontSize: 11 }}>{effProg}%</span>
    </div>
  ) : (
    <div className="v" style={{ fontSize: 12.5, color: 'oklch(0.55 0.18 25)', fontWeight: 500 }}>
      Sem coleção vinculada
    </div>
  )}
</div>
```

### 3. CSS (adicionar no global stylesheet)

```css
.progress-missing {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 10px 5px 8px;
  background: color-mix(in oklab, oklch(0.62 0.13 75), white 92%);
  border: 1px dashed color-mix(in oklab, oklch(0.62 0.13 75), white 70%);
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 500;
  color: oklch(0.5 0.13 70);
  cursor: pointer;
  transition: background .15s, border-color .15s;
}
.progress-missing:hover {
  background: color-mix(in oklab, oklch(0.62 0.13 75), white 86%);
  border-style: solid;
}
.progress-missing .pm-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: oklch(0.62 0.13 75);
  flex: 0 0 7px;
}
```

## Pré-condições

Para esta mudança funcionar, o componente já precisa ter acesso a:

- `linkedColecao`: objeto coleção encontrado a partir de `c.colecaoId` (ou `null` se não houver)
- `effProg`: progresso efetivo, calculado como `linkedColecao ? colProgress(linkedColecao) : c.progresso`
- `setExpanded(id)`: setter de qual linha está expandida
- `setPickerOpen(id)`: setter de qual picker de coleções está aberto
- `Icon.link`: componente do ícone de elo

## Considerações

- O campo `c.progresso` armazenado na campanha vira **dead data** depois deste fix. Pode ser removido do modelo numa próxima limpeza, junto com o slider manual no modal de criação/edição de campanha.
- O onClick do chip "Vincule uma coleção" leva o usuário direto ao fluxo de vínculo (abre a linha e o picker). Sem isso, o chip viraria só um aviso passivo.
