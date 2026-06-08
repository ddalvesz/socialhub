/* ============================================================
   PautasView — list of MH posts grouped by creator + semana
   Shows weekly groups sorted by recency, with a quick-actions header
   and a CTA to create a new pauta in batch.
   ============================================================ */
const { useState: useStateP, useMemo: useMemoP } = React;

function CreatorChip({ id, size = 'md', onClick }) {
  const c = CREATORS_BY_ID[id];
  if (!c) return null;
  return (
    <span
      className={`creator-chip ${size === 'sm' ? 'size-sm' : ''}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <span className="cc-av" style={{ background: c.color }}>{c.initial}</span>
      {c.name}
    </span>
  );
}

function PautaStatusBadge({ status }) {
  const s = STATUSES_MH.find(x => x.id === status);
  if (!s) return null;
  return (
    <span className={`pauta-status ${s.className}`}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
      {s.label}
    </span>
  );
}

function PautaPlatformPair({ post }) {
  const igStatus = post.status;
  const tt = post.mh?.repostTT;
  const igPublished = igStatus === 'pub';
  const ttPublished = tt?.status === 'pub';
  return (
    <div className="platforms">
      <div className="pauta-plat ig" title={`Instagram · ${fmtBR(post.date)} ${post.time}`}>
        IG
        {igPublished && <span className="tick" />}
      </div>
      {tt ? (
        <div className="pauta-plat tt" title={`TikTok · ${fmtBR(tt.date)} ${tt.time}`}>
          TT
          {ttPublished && <span className="tick" />}
        </div>
      ) : (
        <div className="pauta-plat muted" title="Sem repostagem TikTok">TT</div>
      )}
    </div>
  );
}

function PautaRow({ post, onClick }) {
  const prazo = post.mh?.prazo;
  const isLate = prazo && prazo < todayISO() && (post.status === 'pauta' || post.status === 'entregue');
  return (
    <div className="pauta-row" onClick={() => onClick(post)}>
      <div className="num">{videoLabel(post.mh.numVideo)}</div>
      <div>
        <div className="hook">{post.title}</div>
        {post.product && <div className="product">{post.product}</div>}
      </div>
      <div>
        <CreatorChip id={post.mh.creator} size="sm" />
      </div>
      <PautaPlatformPair post={post} />
      <div>
        <PautaStatusBadge status={post.status} />
      </div>
      <div className={`pauta-prazo ${isLate ? 'late' : ''}`}>
        <span className="lbl">Prazo</span>
        {prazo ? fmtBR(prazo) : '—'}
      </div>
    </div>
  );
}

function PautasView({ posts, onPostClick, onSelectCreator, creatorFilter, onCreatorFilterChange, onCreatePauta, onSimulateSync, lastSyncResult }) {
  // 1. only MH posts
  // 2. filter by creator if active
  // 3. group by (creator, semanaCreator), most recent semana first
  const filtered = useMemoP(() => {
    let arr = posts.filter(p => p.mh);
    if (creatorFilter && creatorFilter !== 'all') {
      arr = arr.filter(p => p.mh.creator === creatorFilter);
    }
    return arr;
  }, [posts, creatorFilter]);

  const grouped = useMemoP(() => {
    const map = new Map();
    for (const p of filtered) {
      const key = `${p.mh.creator}::${p.mh.semanaCreator}`;
      if (!map.has(key)) {
        map.set(key, {
          creator: p.mh.creator,
          semana: p.mh.semanaCreator,
          posts: [],
        });
      }
      map.get(key).posts.push(p);
    }
    // sort each group's posts by numVideo asc
    for (const g of map.values()) {
      g.posts.sort((a, b) => a.mh.numVideo - b.mh.numVideo);
    }
    // sort groups: most-recent semana first (within a creator), then by creator order
    const creatorOrder = Object.fromEntries(CREATORS.map((c, i) => [c.id, i]));
    return Array.from(map.values()).sort((a, b) => {
      if (b.semana !== a.semana) return b.semana - a.semana;
      return creatorOrder[a.creator] - creatorOrder[b.creator];
    });
  }, [filtered]);

  return (
    <div className="pautas-view">
      {/* Dropbox sync banner (Fase 8 stub) */}
      <div className="dropbox-sync-banner">
        <div className="left">
          <div className="dropbox-sync-icon">☰</div>
          <div>
            {lastSyncResult ? (
              <React.Fragment>
                <strong>{lastSyncResult.found} entrega{lastSyncResult.found === 1 ? '' : 's'} detectada{lastSyncResult.found === 1 ? '' : 's'} no Dropbox</strong>
                {' '}· última sincronização agora
              </React.Fragment>
            ) : (
              <React.Fragment>
                <strong>Verificação automática Dropbox</strong> · próxima sync amanhã 09:00
                <span style={{ display: 'block', fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>
                  Olha as pastas SEMANA N de cada creator e vira <em>Em pauta</em> → <em>Entregue</em> automaticamente
                </span>
              </React.Fragment>
            )}
          </div>
        </div>
        <span className="dropbox-sync-tag">Backlog · Fase 8</span>
        <button className="dropbox-sync-btn" onClick={onSimulateSync}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>
          Simular sync agora
        </button>
      </div>

      {/* Filter bar — creator pills */}
      <div className="pautas-filter">
        <span className="label">Creator:</span>
        <button
          className={`creator-filter-pill all ${creatorFilter === 'all' ? 'active' : ''}`}
          onClick={() => onCreatorFilterChange('all')}>
          Todos
        </button>
        {CREATORS.map(c => (
          <button
            key={c.id}
            className={`creator-filter-pill ${creatorFilter === c.id ? 'active' : ''}`}
            onClick={() => onCreatorFilterChange(c.id)}>
            <span className="cfp-av" style={{ background: c.color }}>{c.initial}</span>
            {c.name}
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 10.5,
              color: creatorFilter === c.id ? 'rgba(255,255,255,.7)' : 'var(--ink-3)',
              marginLeft: 4
            }}>
              {semanaLabel(c.semanaAtual)}
            </span>
          </button>
        ))}
      </div>

      {/* CTA */}
      <div className="pauta-cta">
        <div>
          Criação em lote por creator: adiciona N vídeos de uma vez e gera o <strong>briefing .txt</strong> na pasta dela no Dropbox.
        </div>
        <button className="pauta-cta-btn" onClick={onCreatePauta}>
          <Icon.plus /> Nova pauta da semana
        </button>
      </div>

      {/* Groups */}
      {grouped.map(g => {
        const c = CREATORS_BY_ID[g.creator];
        const counts = {
          pauta:    g.posts.filter(p => p.status === 'pauta').length,
          entregue: g.posts.filter(p => p.status === 'entregue').length,
          sched:    g.posts.filter(p => p.status === 'sched').length,
          pub:      g.posts.filter(p => p.status === 'pub').length,
        };
        const isCurrent = g.semana === c.semanaAtual;
        return (
          <div className="pauta-group" key={`${g.creator}-${g.semana}`}>
            <div className="pauta-group-head">
              <div className="pauta-group-left">
                <div className="pauta-group-creator" onClick={() => onSelectCreator?.(g.creator)} style={{ cursor: 'pointer' }}>
                  <div className="pauta-group-avatar" style={{ background: c.color }}>{c.initial}</div>
                  <div>
                    <div className="pauta-group-name">{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                      {isCurrent ? 'semana atual' : `há ${c.semanaAtual - g.semana} semana${c.semanaAtual - g.semana === 1 ? '' : 's'}`}
                    </div>
                  </div>
                </div>
                <div className="pauta-group-semana">{semanaLabel(g.semana)}</div>
              </div>
              <div className="pauta-group-counts">
                {counts.pauta > 0    && <span className="cnt"><strong>{counts.pauta}</strong>em pauta</span>}
                {counts.entregue > 0 && <span className="cnt"><strong>{counts.entregue}</strong>entregues</span>}
                {counts.sched > 0    && <span className="cnt"><strong>{counts.sched}</strong>agendados</span>}
                {counts.pub > 0      && <span className="cnt"><strong>{counts.pub}</strong>publicados</span>}
              </div>
            </div>
            {g.posts.map(p => (
              <PautaRow key={p.id} post={p} onClick={onPostClick} />
            ))}
          </div>
        );
      })}

      {grouped.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--ink-3)' }}>
          Nenhuma pauta encontrada para este creator.
        </div>
      )}
    </div>
  );
}

Object.assign(window, { PautasView, CreatorChip });
