/* ============================================================
   LivesView — rewrite p/ schema real (cupons + propostas)
   ============================================================ */
const { useState: useStateLV, useMemo: useMemoLV } = React;

/* ---- Chart palette derivada dos tokens de socialhub.css ---- */
const LIVES_AXIS = 'oklch(0.62 0.012 300)';
const LIVES_GRID = 'oklch(0.94 0.01 300)';
const LIVES_INK = 'oklch(0.22 0.02 300)';
const LIVES_ACCENT = 'oklch(0.72 0.16 55)';
const LIVES_ACCENT_DEEP = 'oklch(0.62 0.18 50)';
const LIVES_INK_3 = 'oklch(0.62 0.012 300)';   // --ink-3 (linha tracejada do período anterior)

const PERIODS = [
  { id: 7,    label: '7 dias' },
  { id: 30,   label: '30 dias' },
  { id: 90,   label: '90 dias' },
  { id: 365,  label: '12 meses' },
  { id: 'all',label: 'Tudo' },
];

/* ============ TOOLTIPS ============ */
function MerchanTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="live-tip">
      <div className="live-tip-name">
        <span className="dot" style={{ background: d.color }} />
        {d.name}
      </div>
      <div className="live-tip-row"><span>Receita média / cupom</span><strong>{fmtBRL(d.avg)}</strong></div>
      <div className="live-tip-row"><span>Total no período</span><strong>{fmtBRL(d.total)}</strong></div>
      <div className="live-tip-row"><span>Observações</span><strong>{d.count}</strong></div>
      <div className="live-tip-row"><span>Como cupom 1</span><strong>{fmtPct(d.slot1Pct)}</strong></div>
      {(d.forte || d.sempreSozinho) && (
        <div className="live-tip-tags">
          {d.forte && <span className="merchan-flag-tag forte">forte</span>}
          {d.sempreSozinho && <span className="merchan-flag-tag solo">só sozinho</span>}
        </div>
      )}
    </div>
  );
}
function WeekTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="live-tip">
      <div className="live-tip-name">Semana {label}</div>
      <div className="live-tip-row"><span>Receita</span><strong>{fmtBRL(d.total)}</strong></div>
      <div className="live-tip-row"><span>Lives</span><strong>{d.count}</strong></div>
      <div className="live-tip-row"><span>Média</span><strong>{fmtBRL(d.count > 0 ? d.total / d.count : 0)}</strong></div>
    </div>
  );
}
function CompareTooltip({ active, payload, label, curLabel, prevLabel }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div className="live-tip">
      <div className="live-tip-name">{label}</div>
      <div className="live-tip-row">
        <span><span className="cmp-swatch cur" />{curLabel}</span>
        <strong>{p.cur == null ? '—' : fmtBRLk(p.cur)}</strong>
      </div>
      <div className="live-tip-row">
        <span><span className="cmp-swatch prev" />{prevLabel}</span>
        <strong>{fmtBRLk(p.prev)}</strong>
      </div>
    </div>
  );
}

/* ============ KPI CARD + DASH CARD ============ */
function KpiCard({ label, value, sub, accent, dim }) {
  return (
    <div className={`live-kpi ${dim ? 'dim' : ''}`}>
      <div className="live-kpi-l">{label}</div>
      <div className="live-kpi-v" style={accent ? { color: accent } : null}>{value}</div>
      {sub && <div className="live-kpi-s">{sub}</div>}
    </div>
  );
}
function DashCard({ title, hint, action, children, full, className }) {
  return (
    <div className={`live-card ${full ? 'full' : ''} ${className || ''}`}>
      {(title || action) && (
        <div className="live-card-head">
          <div style={{ minWidth: 0, flex: 1 }}>
            {title && <div className="live-card-title">{title}</div>}
            {hint && <div className="live-card-hint">{hint}</div>}
          </div>
          {action}
        </div>
      )}
      <div className="live-card-body">{children}</div>
    </div>
  );
}

/* ============ PROPOSTA DA SEMANA ============ */
function PropostaPanel({ propostas, merchans, onApprove, onApproveAll, onDiscard, onEdit }) {
  if (propostas.length === 0) return null;
  const byDate = [...propostas].sort((a, b) => a.date.localeCompare(b.date));
  const pendentes = byDate.filter(p => p.status === 'proposta').length;
  return (
    <div className="proposta-panel">
      <div className="proposta-head">
        <div>
          <div className="proposta-title">
            <span className="proposta-badge">🤖 skill</span>
            Proposta da próxima semana
          </div>
          <div className="proposta-sub">
            {pendentes > 0
              ? <React.Fragment><strong>{pendentes}</strong> dia{pendentes === 1 ? '' : 's'} aguardando sua aprovação · {byDate.length - pendentes} já confirmado{byDate.length - pendentes === 1 ? '' : 's'}</React.Fragment>
              : 'Todos os dias confirmados.'
            }
          </div>
        </div>
        {pendentes > 0 && (
          <button className="btn btn-accent" onClick={onApproveAll}>
            <Icon.check /> Aprovar tudo
          </button>
        )}
      </div>
      <div className="proposta-grid">
        {byDate.map(p => {
          const d = new Date(p.date + 'T00:00:00');
          const m1 = merchans.find(m => m.name === p.merchan1);
          const m2 = merchans.find(m => m.name === p.merchan2);
          const confirmed = p.status === 'confirmada';
          return (
            <div key={p.id} className={`proposta-day ${confirmed ? 'confirmed' : ''}`} onClick={() => onEdit(p)}>
              <div className="proposta-day-head">
                <div className="proposta-day-date">
                  <span className="num">{d.getDate()}</span>
                  <span className="dow">{WEEKDAY_LABELS[d.getDay()]}</span>
                </div>
                {confirmed
                  ? <span className="status-pill s-conf"><span className="sdot" />confirmada</span>
                  : <span className="status-pill s-prop"><span className="sdot" />proposta</span>}
              </div>
              <div className="proposta-cupom proposta-cupom-1">
                {m1 && <span className="dot" style={{ background: m1.color }} />}
                <div className="cm-text">
                  <div className="cm-merchan" title={p.merchan1}>{m1?.short || p.merchan1}</div>
                  <div className="cm-nominal">{p.nominal1}</div>
                </div>
              </div>
              {m2 && (
                <div className="proposta-cupom proposta-cupom-2">
                  <span className="dot" style={{ background: m2.color }} />
                  <div className="cm-text">
                    <div className="cm-merchan" title={p.merchan2}>{m2?.short || p.merchan2}</div>
                    <div className="cm-nominal">{p.nominal2}</div>
                  </div>
                </div>
              )}
              <div className="proposta-actions" onClick={e => e.stopPropagation()}>
                {!confirmed && (
                  <button className="btn btn-mini btn-accent" onClick={() => onApprove(p)}>
                    <Icon.check /> aprovar
                  </button>
                )}
                <button className="btn btn-mini btn-ghost danger" onClick={() => onDiscard(p)}>
                  descartar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============ MERCHAN BARS (horizontal, com long names) ============ */
function MerchanBars({ data }) {
  const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, LabelList } = window.Recharts;
  // Y axis usa nome curto; full name vai no tooltip
  const chartData = data.map(d => ({ ...d, yLabel: d.short }));
  const height = Math.max(180, 28 + data.length * 36);

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 80, left: 8, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke={LIVES_GRID} />
          <XAxis
            type="number"
            tickFormatter={fmtBRLk}
            stroke={LIVES_AXIS}
            tick={{ fontSize: 11, fill: LIVES_AXIS }}
            axisLine={false}
            tickLine={false} />
          <YAxis
            type="category"
            dataKey="yLabel"
            stroke={LIVES_AXIS}
            tick={{ fontSize: 11.5, fill: LIVES_INK, fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
            width={92} />
          <Tooltip content={<MerchanTooltip />} cursor={{ fill: 'oklch(0.985 0.012 300)' }} />
          <Bar dataKey="avg" radius={[0, 6, 6, 0]} barSize={18}>
            {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
            <LabelList
              dataKey="avg"
              position="right"
              formatter={(v) => fmtBRLk(v)}
              style={{ fontSize: 10.5, fill: LIVES_INK, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ============ SCATTER ============ */
function MerchanScatter({ data }) {
  const { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, ReferenceLine, LabelList } = window.Recharts;
  const counts = data.map(d => d.count).sort((a, b) => a - b);
  const avgs = data.map(d => d.avg).sort((a, b) => a - b);
  const medCount = counts[Math.floor(counts.length / 2)] || 0;
  const medAvg = avgs[Math.floor(avgs.length / 2)] || 0;
  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 16, right: 32, left: 8, bottom: 38 }}>
          <CartesianGrid stroke={LIVES_GRID} />
          <XAxis
            type="number" dataKey="count" name="Uso (cupons no período)"
            stroke={LIVES_AXIS}
            tick={{ fontSize: 11, fill: LIVES_AXIS }}
            axisLine={false} tickLine={false}
            label={{ value: 'Uso (vezes que apareceu) →', position: 'insideBottom', offset: -8, fill: LIVES_AXIS, fontSize: 11 }} />
          <YAxis
            type="number" dataKey="avg" name="Receita média"
            stroke={LIVES_AXIS}
            tick={{ fontSize: 11, fill: LIVES_AXIS }}
            tickFormatter={fmtBRLk}
            axisLine={false} tickLine={false}
            width={70}
            label={{ value: 'R$ médio', angle: -90, position: 'insideLeft', offset: 16, fill: LIVES_AXIS, fontSize: 11 }} />
          <ZAxis dataKey="total" range={[80, 480]} />
          <ReferenceLine x={medCount} stroke={LIVES_GRID} strokeDasharray="3 3" />
          <ReferenceLine y={medAvg} stroke={LIVES_GRID} strokeDasharray="3 3" />
          <Tooltip content={<MerchanTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={data}>
            {data.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.85} stroke={d.color} />)}
            <LabelList
              dataKey="short"
              position="top"
              offset={8}
              style={{ fontSize: 9.5, fill: LIVES_INK, fontFamily: 'var(--font-mono)', fontWeight: 600 }} />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ============ WEEKLY TREND ============ */
function WeeklyTrend({ data }) {
  const { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = window.Recharts;
  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 24, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="liveAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={LIVES_ACCENT} stopOpacity={0.28} />
              <stop offset="95%" stopColor={LIVES_ACCENT} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={LIVES_GRID} vertical={false} />
          <XAxis
            dataKey="label"
            stroke={LIVES_AXIS}
            tick={{ fontSize: 11, fill: LIVES_AXIS }}
            axisLine={false} tickLine={false}
            interval="preserveStartEnd"
            minTickGap={32} />
          <YAxis
            stroke={LIVES_AXIS}
            tick={{ fontSize: 11, fill: LIVES_AXIS }}
            tickFormatter={fmtBRLk}
            axisLine={false} tickLine={false}
            width={64} />
          <Tooltip content={<WeekTooltip />} cursor={{ stroke: LIVES_ACCENT_DEEP, strokeWidth: 1, strokeDasharray: '3 3' }} />
          <Area
            type="monotone"
            dataKey="total"
            stroke={LIVES_ACCENT_DEEP}
            strokeWidth={2}
            fill="url(#liveAreaGrad)"
            dot={false}
            activeDot={{ r: 5, fill: LIVES_ACCENT_DEEP }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ============ COMPARAÇÃO DE PERÍODOS (atual vs anterior) ============ */
function CmpBadge({ delta }) {
  if (delta == null) return null;
  const pct = Math.round(delta * 100);
  const up = pct >= 0;
  return (
    <span className={`cmp-badge ${up ? 'up' : 'down'}`}>
      {up ? '+' : '−'}{Math.abs(pct)}%
    </span>
  );
}
function PeriodComparison({ cmp }) {
  const { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = window.Recharts;
  return (
    <div>
      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer>
          <ComposedChart data={cmp.points} margin={{ top: 10, right: 22, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="cmpAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={LIVES_ACCENT} stopOpacity={0.22} />
                <stop offset="100%" stopColor={LIVES_ACCENT} stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={LIVES_GRID} vertical={false} />
            <XAxis
              dataKey="x"
              stroke={LIVES_AXIS}
              tick={{ fontSize: 11, fill: LIVES_AXIS }}
              axisLine={false} tickLine={false}
              interval="preserveStartEnd"
              minTickGap={18} />
            <YAxis
              stroke={LIVES_AXIS}
              tick={{ fontSize: 11, fill: LIVES_AXIS }}
              tickFormatter={fmtBRLk}
              axisLine={false} tickLine={false}
              width={58} />
            <Tooltip
              content={<CompareTooltip curLabel={cmp.curLabel} prevLabel={cmp.prevLabel} />}
              cursor={{ stroke: LIVES_ACCENT_DEEP, strokeWidth: 1, strokeDasharray: '3 3' }} />
            {/* Período atual — área accent + linha sólida 2px */}
            <Area
              type="monotone"
              dataKey="cur"
              stroke={LIVES_ACCENT}
              strokeWidth={2}
              fill="url(#cmpAreaGrad)"
              dot={false}
              activeDot={{ r: 5, fill: LIVES_ACCENT, stroke: 'white', strokeWidth: 1.5 }}
              connectNulls={false} />
            {/* Período anterior — linha tracejada 1.5px --ink-3, sem preenchimento */}
            <Line
              type="monotone"
              dataKey="prev"
              stroke={LIVES_INK_3}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              activeDot={{ r: 4, fill: LIVES_INK_3, stroke: 'white', strokeWidth: 1.5 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="cmp-legend">
        <span className="cmp-legend-item"><span className="cmp-swatch cur" />{cmp.curLabel}</span>
        <span className="cmp-legend-item"><span className="cmp-swatch prev" />Período anterior</span>
      </div>
    </div>
  );
}

/* ============ FALLBACK — receita semana a semana (sem comparação) ============ */
function WeeklyBars({ data }) {
  const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = window.Recharts;
  return (
    <div style={{ width: '100%', height: 200 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 22, left: 8, bottom: 0 }}>
          <CartesianGrid stroke={LIVES_GRID} vertical={false} />
          <XAxis
            dataKey="label"
            stroke={LIVES_AXIS}
            tick={{ fontSize: 11, fill: LIVES_AXIS }}
            axisLine={false} tickLine={false}
            interval="preserveStartEnd"
            minTickGap={28} />
          <YAxis
            stroke={LIVES_AXIS}
            tick={{ fontSize: 11, fill: LIVES_AXIS }}
            tickFormatter={fmtBRLk}
            axisLine={false} tickLine={false}
            width={58} />
          <Tooltip content={<WeekTooltip />} cursor={{ fill: 'oklch(0.985 0.012 300)' }} />
          <Bar dataKey="total" radius={[4, 4, 0, 0]} fill={LIVES_ACCENT} barSize={13} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ============ MONTH VS PREV (parcial vs parcial) ============ */
function MonthVsPrev({ mvp, today }) {
  const todayDate = new Date(today + 'T00:00:00');
  const monthNames = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const curMonth = monthNames[todayDate.getMonth()];
  const prevMonth = monthNames[(todayDate.getMonth() + 11) % 12];
  const hasComp = mvp.prev > 0;
  const up = mvp.delta >= 0;
  const absDiff = Math.abs(mvp.diff);
  return (
    <div className="live-mvp">
      <div className="live-mvp-cur">
        <div className="lbl">{curMonth} · 1–{mvp.dayOfMonth}</div>
        <div className="val">{fmtBRLk(mvp.cur)}</div>
      </div>
      {hasComp ? (
        <div className={`live-mvp-delta ${up ? 'up' : 'down'}`}>
          {up ? '▲' : '▼'} {Math.abs(mvp.delta * 100).toFixed(0)}%
        </div>
      ) : (
        <div className="live-mvp-delta neutral">—</div>
      )}
      <div className="live-mvp-prev">
        <div className="lbl">{prevMonth} · 1–{mvp.endDayPrev} <span className="lbl-sub">(mesmo período)</span></div>
        <div className="val">{hasComp ? fmtBRLk(mvp.prev) : '—'}</div>
      </div>
      <div className="live-mvp-foot">
        {hasComp
          ? (up
              ? `+${fmtBRLk(absDiff)} ante o mesmo período do mês passado`
              : `−${fmtBRLk(absDiff)} ante o mesmo período do mês passado`)
          : 'Sem receita registrada no mesmo período do mês passado.'}
      </div>
    </div>
  );
}

/* ============ HEATMAP (scroll horizontal, rotated labels) ============ */
function Heatmap({ matrix, max, merchans }) {
  const cellBg = (avg) => {
    if (!avg) return 'var(--surface-2)';
    const t = Math.min(1, avg / max);
    const L = 0.97 - t * 0.32;
    const C = 0.02 + t * 0.16;
    return `oklch(${L.toFixed(3)} ${C.toFixed(3)} 50)`;
  };
  const cellFg = (avg) => {
    if (!avg) return 'var(--ink-4)';
    const t = Math.min(1, avg / max);
    return t > 0.55 ? 'white' : 'var(--ink)';
  };
  // grid template: row label + N columns (each min 70px)
  const colsTemplate = `48px repeat(${merchans.length}, minmax(74px, 1fr))`;

  return (
    <div className="live-heat-scroll">
      <div className="live-heat" style={{ minWidth: 48 + merchans.length * 74 + 20 }}>
        <div className="live-heat-row live-heat-header" style={{ gridTemplateColumns: colsTemplate }}>
          <div className="live-heat-corner" />
          {merchans.map(m => (
            <div key={m.id} className="live-heat-col-label" title={m.name}>
              <span className="dot" style={{ background: m.color }} />
              <span className="lbl-text">{m.short}</span>
            </div>
          ))}
        </div>
        {matrix.map(row => (
          <div className="live-heat-row" key={row.weekday} style={{ gridTemplateColumns: colsTemplate }}>
            <div className="live-heat-row-label">{WEEKDAY_LABELS[row.weekday]}</div>
            {row.cells.map(c => (
              <div
                key={c.merchan}
                className={`live-heat-cell ${c.count === 0 ? 'empty' : ''}`}
                style={{ background: cellBg(c.avg), color: cellFg(c.avg) }}
                title={`${WEEKDAY_LABELS[row.weekday]} · ${c.merchan} — ${c.count} cupom${c.count === 1 ? '' : 's'}, média ${fmtBRL(c.avg)}`}>
                {c.count > 0 ? fmtBRLk(c.avg) : '—'}
                {c.count > 1 && <span className="cnt">{c.count}×</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============ TABLE ============ */
function LivesTable({ lives, merchans, onRowClick, limit }) {
  const shown = limit ? lives.slice(0, limit) : lives;
  const more = limit && lives.length > limit ? lives.length - limit : 0;
  return (
    <div className="live-table">
      <div className="live-table-head">
        <div>Data</div>
        <div>Cupom 1</div>
        <div>Cupom 2</div>
        <div>Status</div>
        <div className="num">Receita</div>
        <div className="num">UTM</div>
      </div>
      {shown.length === 0 && (
        <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--ink-3)' }}>
          Nenhuma live no período.
        </div>
      )}
      {shown.map(l => {
        const m1 = merchans.find(x => x.name === l.merchan1);
        const m2 = merchans.find(x => x.name === l.merchan2);
        const s = LIVE_STATUS_BY_ID[l.status] || LIVE_STATUSES[0];
        const utmPct = l.receitaTotal > 0 && l.receitaUtm > 0 ? l.receitaUtm / l.receitaTotal : 0;
        const d = new Date(l.date + 'T00:00:00');
        const day = d.getDate();
        const mon = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'][d.getMonth()];
        return (
          <div key={l.id} className="live-table-row" onClick={() => onRowClick(l)}>
            <div className="live-table-date">
              <span className="day">{day}</span>
              <span className="mon">{mon} {d.getFullYear().toString().slice(-2)}</span>
              <span className="time">{WEEKDAY_LABELS[d.getDay()]}</span>
            </div>
            <div className="live-cupom-cell">
              {m1 ? (
                <React.Fragment>
                  <span className="live-merchan-chip" title={m1.name}>
                    <span className="dot" style={{ background: m1.color }} />
                    {m1.short}
                  </span>
                  <span className="nominal-code">{l.nominal1}</span>
                </React.Fragment>
              ) : <span className="ink-4">—</span>}
            </div>
            <div className="live-cupom-cell">
              {m2 ? (
                <React.Fragment>
                  <span className="live-merchan-chip" title={m2.name}>
                    <span className="dot" style={{ background: m2.color }} />
                    {m2.short}
                  </span>
                  <span className="nominal-code">{l.nominal2}</span>
                </React.Fragment>
              ) : <span className="ink-4">só 1 cupom</span>}
            </div>
            <div>
              <span className={`status-pill ${s.className}`} style={{ pointerEvents: 'none' }}>
                <span className="sdot" />{s.label}
              </span>
            </div>
            <div className="num">
              {l.receitaTotal > 0 ? fmtBRL(l.receitaTotal) : '—'}
              {l.receitaTotal > 0 && l.receita2 > 0 && (
                <div className="num-split">{fmtBRLk(l.receita1)} + {fmtBRLk(l.receita2)}</div>
              )}
            </div>
            <div className="num">
              {utmPct > 0 ? (
                <React.Fragment>
                  {fmtBRLk(l.receitaUtm)}
                  <div className="num-split">{fmtPct(utmPct)}</div>
                </React.Fragment>
              ) : <span className="ink-4">—</span>}
            </div>
          </div>
        );
      })}
      {more > 0 && (
        <div className="live-table-more">
          + {more} live{more === 1 ? '' : 's'} (use filtros pra ver tudo)
        </div>
      )}
    </div>
  );
}

/* ============ MAIN VIEW ============ */
function LivesView({ lives, merchans, onLiveClick, onNewLive, onOpenMerchans, onApproveProposta, onApproveAll, onDiscardProposta }) {
  const today = todayISO();
  const [period, setPeriod] = useStateLV(90);
  const [search, setSearch] = useStateLV('');
  const [merchanFilter, setMerchanFilter] = useStateLV('all');
  const [statusFilter, setStatusFilter] = useStateLV('all');

  // Propostas + confirmadas pra exibir no painel topo (sempre, independente do período)
  const propostas = useMemoLV(
    () => lives.filter(l => l.status === 'proposta' || l.status === 'confirmada'),
    [lives]
  );

  const livesInPeriod = useMemoLV(
    () => lives.filter(l => inPeriod(l.date, period, today)),
    [lives, period, today]
  );

  const kpis = useMemoLV(() => liveKpis(livesInPeriod), [livesInPeriod]);
  const perMerchan = useMemoLV(() => perMerchanMetrics(livesInPeriod, merchans), [livesInPeriod, merchans]);

  // Heatmap: limitar aos top 10 merchans por uso (senão fica visualmente impossível)
  const heatMerchans = useMemoLV(() => {
    const sorted = [...perMerchan].sort((a, b) => b.count - a.count).slice(0, 10);
    return merchans.filter(m => sorted.some(x => x.merchanId === m.id))
      .sort((a, b) => {
        const ai = sorted.findIndex(x => x.merchanId === a.id);
        const bi = sorted.findIndex(x => x.merchanId === b.id);
        return ai - bi;
      });
  }, [perMerchan, merchans]);

  const weekly = useMemoLV(() => {
    const trend = weeklyTrend(livesInPeriod);
    return trend.map(t => ({ ...t, label: `${String(t.week).padStart(2, '0')}/${String(t.year).slice(-2)}` }));
  }, [livesInPeriod]);
  const heat = useMemoLV(() => heatmapMatrix(livesInPeriod, heatMerchans), [livesInPeriod, heatMerchans]);
  const mvp = useMemoLV(() => monthVsPrev(lives, today), [lives, today]);
  const cmp = useMemoLV(() => periodComparison(lives, period, today), [lives, period, today]);

  // Filtered table — lives no período + filtros
  const tableLives = useMemoLV(() => {
    let arr = livesInPeriod;
    if (merchanFilter !== 'all') {
      arr = arr.filter(l => l.merchan1 === merchanFilter || l.merchan2 === merchanFilter);
    }
    if (statusFilter !== 'all') arr = arr.filter(l => l.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(l =>
        (l.nominal1 || '').toLowerCase().includes(q) ||
        (l.nominal2 || '').toLowerCase().includes(q) ||
        (l.merchan1 || '').toLowerCase().includes(q) ||
        (l.merchan2 || '').toLowerCase().includes(q)
      );
    }
    return arr;
  }, [livesInPeriod, merchanFilter, statusFilter, search]);

  const deltaUp = mvp.delta >= 0;
  const showUtm = kpis.utmCount > 0;

  return (
    <div className="lives-wrap">
      {/* Proposta da semana — topo */}
      <PropostaPanel
        propostas={propostas}
        merchans={merchans}
        onApprove={onApproveProposta}
        onApproveAll={onApproveAll}
        onDiscard={onDiscardProposta}
        onEdit={onLiveClick} />

      {/* Period bar + manage merchans */}
      <div className="lives-period-bar">
        <div className="view-toggle">
          {PERIODS.map(p => (
            <button
              key={String(p.id)}
              className={period === p.id ? 'active' : ''}
              onClick={() => setPeriod(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
          {kpis.count} live{kpis.count === 1 ? '' : 's'} realizadas no período
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn btn-ghost" onClick={onOpenMerchans}>
          <Icon.settings /> Gerenciar merchans
        </button>
      </div>

      {/* KPI strip — receita first, UTM/alcance secundários */}
      <div className="lives-kpis lives-kpis-3">
        <KpiCard
          label="Receita total"
          value={fmtBRLk(kpis.total)}
          sub={`${kpis.count} live${kpis.count === 1 ? '' : 's'}`} />
        <KpiCard
          label="Média por live"
          value={fmtBRLk(kpis.avg)}
          sub="ticket médio" />
        <KpiCard
          label="Melhor live"
          value={kpis.best ? fmtBRLk(kpis.best.receitaTotal) : '—'}
          sub={kpis.best ? `${new Date(kpis.best.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })} · ${kpis.best.nominal1}` : ''} />
      </div>

      {/* Métricas secundárias (UTM/alcance) — só se tiver dado */}
      {(kpis.utmCount > 0 || kpis.alcanceCount > 0) && (
        <div className="lives-kpis-secondary">
          <span className="lks-label">Secundário</span>
          {kpis.utmCount > 0 && (
            <span className="lks-item">
              <strong>% UTM:</strong> {fmtPct(kpis.utmShareSum > 0 ? kpis.utmShareTotal / kpis.utmShareSum : 0)}
              <span className="lks-foot">({kpis.utmCount} de {kpis.count} lives com dado de UTM)</span>
            </span>
          )}
          {kpis.alcanceCount > 0 && (
            <span className="lks-item">
              <strong>Alcance:</strong> {(kpis.alcanceTotal / 1000).toFixed(0)}k
              <span className="lks-foot">({kpis.alcanceCount} de {kpis.count} lives com alcance)</span>
            </span>
          )}
        </div>
      )}

      {/* Análise temporal — primeira seção de análise, reage ao filtro de período */}
      <div className="lives-section-title">
        {cmp ? 'Comparação de períodos' : 'Tendência temporal'}
        <span className="sub">
          {cmp
            ? 'período atual vs período anterior · reage ao filtro acima'
            : 'receita semana a semana · selecione 7, 30 ou 90 dias para comparar períodos'}
        </span>
      </div>
      <DashCard
        title={cmp ? cmp.title : 'Receita semanal'}
        hint={cmp
          ? `${fmtBRLk(cmp.curTotal)} no período atual · ${fmtBRLk(cmp.prevTotal)} no anterior`
          : `período: ${period === 'all' ? 'jan/2025 → hoje' : `últimos ${period === 365 ? '12 meses' : period + ' dias'}`}`}
        action={cmp ? <CmpBadge delta={cmp.delta} /> : null}
        full>
        {cmp ? <PeriodComparison cmp={cmp} /> : <WeeklyBars data={weekly} />}
      </DashCard>

      {/* Performance por merchan */}
      <div className="lives-section-title">
        Performance por merchan
        <span className="sub">cada cupom (1 ou 2) conta como uma observação · descobre qual cupom realmente puxa receita</span>
      </div>
      <div className="lives-grid">
        <DashCard title="Receita média por cupom" hint={`${perMerchan.length} merchans usados no período · ordenado por R$ médio`}>
          <MerchanBars data={perMerchan} />
        </DashCard>
        <DashCard title="Uso × receita média" hint="quadrante superior direito = grande hit · inferior direito = popular-mas-fraco">
          <MerchanScatter data={perMerchan} />
          <div className="quadrant-legend">
            <div><span className="qchip qchip-up">↑→</span> hits</div>
            <div><span className="qchip">↓→</span> overfit (usa muito, rende pouco)</div>
            <div><span className="qchip qchip-up">↑←</span> subexplorado (rende, usa pouco)</div>
          </div>
        </DashCard>
      </div>

      <DashCard
        title="Heatmap — dia da semana × merchan"
        hint={`top ${heatMerchans.length} merchans por uso · scroll horizontal pra ver tudo · '—' = combinação não testada`}
        full>
        <Heatmap matrix={heat.matrix} max={heat.max} merchans={heatMerchans} />
      </DashCard>

      {/* Tabela */}
      <div className="lives-section-title">
        Histórico de lives
        <span className="sub">clica numa linha pra editar · {tableLives.length} no recorte atual</span>
      </div>
      <div className="live-table-filters">
        <div className="search-box" style={{ minWidth: 240 }}>
          <Icon.search />
          <input
            placeholder="Buscar código de cupom ou merchan..."
            value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-mini">
          <span className="lbl">Merchan</span>
          <select className="field" value={merchanFilter} onChange={e => setMerchanFilter(e.target.value)} style={{ minWidth: 180, maxWidth: 240 }}>
            <option value="all">Todos</option>
            {merchans.filter(m => m.ativo).map(m => <option key={m.id} value={m.name}>{m.short} — {m.name}</option>)}
          </select>
        </div>
        <div className="filter-mini">
          <span className="lbl">Status</span>
          <select className="field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ minWidth: 130 }}>
            <option value="all">Todos</option>
            {LIVE_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }} />
        <span className="count-pill">{tableLives.length} live{tableLives.length === 1 ? '' : 's'}</span>
      </div>
      <DashCard full>
        <LivesTable lives={tableLives} merchans={merchans} onRowClick={onLiveClick} limit={60} />
      </DashCard>
    </div>
  );
}

Object.assign(window, { LivesView });
