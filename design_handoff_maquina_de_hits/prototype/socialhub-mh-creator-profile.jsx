/* ============================================================
   CreatorProfileView — page for an individual creator
   Header with avatar + on-time %, stats grid, 12-week histogram,
   and list of recent pautas filtered to this creator.
   ============================================================ */

function CreatorProfileView({ creatorId, posts, onBack, onPostClick }) {
  const c = CREATORS_BY_ID[creatorId];
  const metrics = creatorMetrics(creatorId, posts);
  if (!c || !metrics) return null;

  const maxBar = Math.max(...metrics.histogram.map(h => h.count), 1);

  // Last 6 posts (any status) for this creator
  const recentPosts = metrics.posts
    .slice()
    .sort((a, b) =>
      (b.mh.semanaCreator - a.mh.semanaCreator) ||
      (b.mh.numVideo - a.mh.numVideo)
    )
    .slice(0, 8);

  return (
    <div className="cp-wrap">
      {/* Back link */}
      <div style={{ marginBottom: 12 }}>
        <button
          onClick={onBack}
          style={{
            background: 'transparent', border: 'none',
            color: 'var(--ink-3)', cursor: 'pointer',
            fontSize: 12.5, padding: '4px 0',
            display: 'inline-flex', alignItems: 'center', gap: 4
          }}>
          ← Voltar
        </button>
      </div>

      {/* Header */}
      <div className="cp-header">
        <div className="cp-avatar" style={{ background: c.color }}>
          {c.initial}
        </div>
        <div className="cp-id">
          <div className="cp-name">{c.name}</div>
          <div className="cp-meta">
            <span>Creator contratad{c.name.endsWith('a') ? 'a' : 'o'}</span>
            <span>·</span>
            <span>Desde {fmtBR(c.dataEntrada)}</span>
            <span>·</span>
            <span><strong>{semanaLabel(c.semanaAtual)}</strong> · {c.semanaAtual} semanas no time</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', marginTop: 8, letterSpacing: '0.03em' }}>
            📁 {c.dropboxPath}
          </div>
        </div>
        <div className="cp-headline">
          <div className="cp-onTime">Entregas no prazo</div>
          <div className="cp-onTime-val">{metrics.noPrazoPct}%</div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="cp-stats">
        <div className="cp-stat">
          <div className="cp-stat-label">Vídeos totais</div>
          <div className="cp-stat-val">{metrics.total}</div>
          <div className="cp-stat-sub">desde a entrada</div>
        </div>
        <div className="cp-stat">
          <div className="cp-stat-label">Esta semana</div>
          <div className="cp-stat-val">{metrics.thisWeek}</div>
          <div className="cp-stat-sub">{semanaLabel(c.semanaAtual)}</div>
        </div>
        <div className="cp-stat">
          <div className="cp-stat-label">Em pauta agora</div>
          <div className="cp-stat-val">{metrics.emPauta}</div>
          <div className="cp-stat-sub">aguardando entrega</div>
        </div>
        <div className="cp-stat">
          <div className="cp-stat-label">Média / semana</div>
          <div className="cp-stat-val">{metrics.avgPerWeek}</div>
          <div className="cp-stat-sub">vídeos por semana</div>
        </div>
      </div>

      {/* Histogram */}
      <div className="cp-histogram">
        <div className="cp-histogram-title">
          <span>Últimas 12 semanas</span>
          <span className="helper">passe o mouse para ver o número</span>
        </div>
        <div className="cp-bars" style={{ paddingBottom: 18, marginBottom: 4 }}>
          {metrics.histogram.map((h, i) => (
            <div
              key={i}
              className={`cp-bar ${h.isCurrent ? 'current' : ''}`}
              style={{ height: `${(h.count / maxBar) * 100}%` }}
              title={`${semanaLabel(h.semana)}: ${h.count} vídeos`}>
              <div className="cp-bar-val">{h.count}</div>
              <div className="cp-bar-label">{h.semana}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent pautas list */}
      <div className="cp-section-title">Pautas recentes</div>
      {recentPosts.length === 0 ? (
        <div style={{ color: 'var(--ink-3)', fontSize: 13, padding: '20px 0' }}>
          Nenhuma pauta cadastrada ainda.
        </div>
      ) : (
        <div className="pauta-group" style={{ marginBottom: 0 }}>
          {recentPosts.map(p => {
            const prazo = p.mh?.prazo;
            const isLate = prazo && prazo < todayISO() && (p.status === 'pauta' || p.status === 'entregue');
            return (
              <div key={p.id} className="pauta-row" onClick={() => onPostClick(p)}>
                <div className="num">{semanaLabel(p.mh.semanaCreator)} · {videoLabel(p.mh.numVideo)}</div>
                <div>
                  <div className="hook">{p.title}</div>
                  {p.product && <div className="product">{p.product}</div>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                  IG {fmtBR(p.date)}
                </div>
                <div className="platforms">
                  <div className="pauta-plat ig">IG{p.status === 'pub' && <span className="tick" />}</div>
                  {p.mh.repostTT ? (
                    <div className="pauta-plat tt">TT{p.mh.repostTT.status === 'pub' && <span className="tick" />}</div>
                  ) : (
                    <div className="pauta-plat muted">TT</div>
                  )}
                </div>
                <div>
                  <PautaStatusBadge status={p.status} />
                </div>
                <div className={`pauta-prazo ${isLate ? 'late' : ''}`}>
                  <span className="lbl">Prazo</span>
                  {prazo ? fmtBR(prazo) : '—'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { CreatorProfileView });
