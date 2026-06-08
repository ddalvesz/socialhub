/* ============================================================
   LIVES DATA (rewrite p/ schema real)
   - 1 live por dia, com até 2 cupons (merchan1/nominal1/receita1 + 2)
   - Merchan = TIPO de cupom (não produto). Flags: ativo, forte, sempre_sozinho
   - Cores derivadas do nome (hash → hue OKLCH)
   - ~510 lives jan/2025 → mai/2026, Black Friday peak 28/11/2025
   - UTM/alcance quase sempre 0 (campo secundário/condicional)
   ============================================================ */

/* ----------- COLOR FROM NAME (hash → hue) ----------- */
function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function colorFromName(name) {
  const h = hashStr(name) % 360;
  return `oklch(0.66 0.15 ${h})`;
}
function shortLabel(name) {
  // Heuristic: collapse "DESCONTO + FRETE GRÁTIS" → "D+FG", "3X SEM JUROS" → "3X", etc.
  const map = [
    ['DESCONTO + FRETE GRÁTIS + 3X SEM JUROS', 'D+FG+3X'],
    ['DESCONTO + FRETE GRÁTIS + MIMO', 'D+FG+M'],
    ['DESCONTO + FRETE GRÁTIS', 'D+FG'],
    ['DESCONTO + 3X SEM JUROS', 'D+3X'],
    ['DESCONTO + MIMO', 'D+M'],
    ['FRETE GRÁTIS + 3X SEM JUROS', 'FG+3X'],
    ['FRETE GRÁTIS + MIMO', 'FG+M'],
    ['3X SEM JUROS + MIMO', '3X+M'],
    ['DESCONTO SURPRESA + MIMO', 'DS+M'],
    ['R$20 OFF EM COMPRAS A PARTIR DE R$150', 'R$20 / R$150'],
    ['10% OFF EM COMPRAS A PARTIR DE R$99 VÁLIDO POR TRÊS HORAS', '10% / R$99 · 3h'],
    ['10% OFF EM COMPRAS A PARTIR DE R$99', '10% / R$99'],
    ['ESCOLHA SEU MIMO', 'Escolha mimo'],
    ['MIMO FIXO', 'Mimo fixo'],
    ['2 MIMOS', '2 mimos'],
    ['APENAS LINK UTM', 'Só UTM'],
  ];
  for (const [k, v] of map) if (name === k) return v;
  // Fallback: pegar as iniciais maiores de cada palavra significativa
  return name.split(/\s+/).slice(0, 3).map(w => w[0]).join('');
}

/* ----------- MERCHANS CATALOG (real list) ----------- */
const MERCHANS_RAW = [
  { name: 'DESCONTO + FRETE GRÁTIS',                                       ativo: true,  forte: false, sempreSozinho: false },
  { name: 'DESCONTO + 3X SEM JUROS',                                       ativo: true,  forte: false, sempreSozinho: false },
  { name: 'DESCONTO + MIMO',                                               ativo: true,  forte: false, sempreSozinho: false },
  { name: 'FRETE GRÁTIS + MIMO',                                           ativo: true,  forte: false, sempreSozinho: false },
  { name: 'FRETE GRÁTIS + 3X SEM JUROS',                                   ativo: true,  forte: false, sempreSozinho: false },
  { name: '3X SEM JUROS + MIMO',                                           ativo: true,  forte: false, sempreSozinho: false },
  { name: 'DESCONTO + FRETE GRÁTIS + 3X SEM JUROS',                        ativo: true,  forte: true,  sempreSozinho: true  },
  { name: 'DESCONTO + FRETE GRÁTIS + MIMO',                                ativo: true,  forte: true,  sempreSozinho: true  },
  { name: 'R$20 OFF EM COMPRAS A PARTIR DE R$150',                         ativo: true,  forte: true,  sempreSozinho: true  },
  { name: '10% OFF EM COMPRAS A PARTIR DE R$99',                           ativo: true,  forte: false, sempreSozinho: false },
  { name: '2 MIMOS',                                                       ativo: true,  forte: false, sempreSozinho: false },
  { name: 'DESCONTO SURPRESA + MIMO',                                      ativo: true,  forte: false, sempreSozinho: false },
  { name: 'ESCOLHA SEU MIMO',                                              ativo: true,  forte: false, sempreSozinho: false },
  { name: 'MIMO FIXO',                                                     ativo: true,  forte: false, sempreSozinho: false },
  { name: 'APENAS LINK UTM',                                               ativo: true,  forte: false, sempreSozinho: false },
  { name: '10% OFF EM COMPRAS A PARTIR DE R$99 VÁLIDO POR TRÊS HORAS',     ativo: false, forte: false, sempreSozinho: false },
];
const MERCHANS_INITIAL = MERCHANS_RAW.map(m => ({
  id: 'm-' + hashStr(m.name).toString(36),
  ...m,
  color: colorFromName(m.name),
  short: shortLabel(m.name),
}));
const MERCHANS_BY_NAME = Object.fromEntries(MERCHANS_INITIAL.map(m => [m.name, m]));

/* ----------- STATUS ----------- */
const LIVE_STATUSES = [
  { id: 'proposta',   label: 'Proposta',   className: 's-prop',  dot: 'oklch(0.72 0.16 55)'  },
  { id: 'confirmada', label: 'Confirmada', className: 's-conf',  dot: 'oklch(0.6 0.13 265)'  },
  { id: 'realizada',  label: 'Realizada',  className: 's-pub',   dot: 'oklch(0.6 0.13 150)'  },
];
const LIVE_STATUS_BY_ID = Object.fromEntries(LIVE_STATUSES.map(s => [s.id, s]));
const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const WEEKDAY_NOMES = ['domingo','segunda','terça','quarta','quinta','sexta','sábado'];

/* ----------- MOCK GENERATOR ----------- */
function buildInitialLives() {
  const today = typeof todayISO === 'function' ? todayISO() : '2026-05-27';
  const todayDate = new Date(today + 'T00:00:00');
  const startDate = new Date('2025-01-01T00:00:00');

  // Performance profile per merchan name (avg receita BRL + variance)
  const profile = {
    'DESCONTO + FRETE GRÁTIS':                            { avg: 78000, vary: 24000, share: 12 },
    'DESCONTO + 3X SEM JUROS':                            { avg: 92000, vary: 28000, share: 8  },
    'DESCONTO + MIMO':                                    { avg: 64000, vary: 20000, share: 11 },
    'FRETE GRÁTIS + MIMO':                                { avg: 48000, vary: 15000, share: 9  },
    'FRETE GRÁTIS + 3X SEM JUROS':                        { avg: 55000, vary: 18000, share: 7  },
    '3X SEM JUROS + MIMO':                                { avg: 42000, vary: 14000, share: 6  },
    'DESCONTO + FRETE GRÁTIS + 3X SEM JUROS':             { avg: 138000,vary: 42000, share: 5  },
    'DESCONTO + FRETE GRÁTIS + MIMO':                     { avg: 124000,vary: 38000, share: 4  },
    'R$20 OFF EM COMPRAS A PARTIR DE R$150':              { avg: 105000,vary: 32000, share: 6  },
    '10% OFF EM COMPRAS A PARTIR DE R$99':                { avg: 36000, vary: 12000, share: 8  },
    '2 MIMOS':                                            { avg: 28000, vary: 10000, share: 5  },
    'DESCONTO SURPRESA + MIMO':                           { avg: 52000, vary: 17000, share: 6  },
    'ESCOLHA SEU MIMO':                                   { avg: 31000, vary: 11000, share: 5  },
    'MIMO FIXO':                                          { avg: 18000, vary:  6500, share: 4  },
    'APENAS LINK UTM':                                    { avg: 12000, vary:  4500, share: 2  },
    '10% OFF EM COMPRAS A PARTIR DE R$99 VÁLIDO POR TRÊS HORAS': { avg: 22000, vary: 7000, share: 2 },
  };

  // Códigos de cupom (nominal) por merchan — palavras curtas/punchy
  const nominalPool = {
    'DESCONTO + FRETE GRÁTIS': ['SEXTATOP','SUPERSEX','PROMOFG','MEGAFRETE','LIVE10FG','DESCFG'],
    'DESCONTO + 3X SEM JUROS': ['PARCELA3','3SEMJURO','DESC3X','LIVE3X','TRINCA3','VIRADA3X'],
    'DESCONTO + MIMO': ['LIVEMIMO','DESCMIM','BRINDESC','MIMOON','MIMODESC'],
    'FRETE GRÁTIS + MIMO': ['LIVEFGM','GRATISMIMO','FRETEMIMO','FGM10','FGMIM'],
    'FRETE GRÁTIS + 3X SEM JUROS': ['FG3X','GRATIS3X','LIVEFG3','FGTRINCA'],
    '3X SEM JUROS + MIMO': ['MIMOTRES','3XMIMO','LIVE3MIM','TRESMIMO'],
    'DESCONTO + FRETE GRÁTIS + 3X SEM JUROS': ['TRIO','SUPERLIVE','MEGADROP','BIGLIVE','TRIOLIVE'],
    'DESCONTO + FRETE GRÁTIS + MIMO': ['TRIOMIMO','MEGAFGM','TUDOLIVE','SUPERMIM'],
    'R$20 OFF EM COMPRAS A PARTIR DE R$150': ['R20OFF','VINTE150','LIVE20','OFF150'],
    '10% OFF EM COMPRAS A PARTIR DE R$99': ['DEZOFF','LIVE10','10PROM','PROMO10'],
    '2 MIMOS': ['DUPLAMIM','2MIMOS','MIMODOIS','PAIRMIM'],
    'DESCONTO SURPRESA + MIMO': ['SURPRESA','MISTERIO','MIMOSUR','SURPMIM'],
    'ESCOLHA SEU MIMO': ['ESCOLHA','PICKMIM','SEUMIM','VOCEMIM'],
    'MIMO FIXO': ['FIXOMIM','MIMOLIVE','MIMOFIX'],
    'APENAS LINK UTM': ['LIVELINK','UTMLIVE','SOLINK'],
    '10% OFF EM COMPRAS A PARTIR DE R$99 VÁLIDO POR TRÊS HORAS': ['3HORAS','RELOGIO','10FAST'],
  };

  // Deterministic RNG
  let seed = 91;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

  // Weight pool: merchan share
  const wPool = MERCHANS_INITIAL.filter(m => m.ativo).map(m => ({ m, w: profile[m.name].share }));
  const totalW = wPool.reduce((s, e) => s + e.w, 0);
  const pickMerchan = () => {
    let r = rnd() * totalW;
    for (const e of wPool) { r -= e.w; if (r <= 0) return e.m; }
    return wPool[0].m;
  };

  const lives = [];
  let id = 1;

  // Walk every day from start to today
  for (let d = new Date(startDate); d <= todayDate; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    const dow = d.getDay();
    const isBF = iso === '2025-11-28';
    const isBFWeek = (d >= new Date('2025-11-24') && d <= new Date('2025-11-30'));
    const isCyberMon = iso === '2025-12-01';

    // Skip ~6% of days (sem live, feriado, etc) — mas nunca pula BF
    if (!isBF && !isBFWeek && rnd() < 0.06) continue;

    const m1 = pickMerchan();
    let m2 = null;
    // Only ~38% das lives têm CUPOM 2, e nunca se m1 for sempre_sozinho
    if (!m1.sempreSozinho && rnd() < 0.38) {
      let tries = 0;
      while (tries < 4) {
        const cand = pickMerchan();
        if (cand.id !== m1.id && !cand.sempreSozinho) { m2 = cand; break; }
        tries++;
      }
    }

    const p1 = profile[m1.name];
    let r1 = Math.max(8000, Math.round(p1.avg + (rnd() - 0.5) * 2 * p1.vary));
    let r2 = 0;
    if (m2) {
      const p2 = profile[m2.name];
      // CUPOM 2 tipicamente performa pior (40-70% do potencial)
      r2 = Math.max(3000, Math.round((p2.avg + (rnd() - 0.5) * 2 * p2.vary) * (0.4 + rnd() * 0.3)));
    }

    // Seasonal boosts
    const month = d.getMonth(); // 0..11
    let mult = 1;
    if (month === 4) mult = 1.15;       // mai (Dia das Mães)
    if (month === 5) mult = 1.05;
    if (month === 7) mult = 0.92;       // ago vendas mais fracas
    if (month === 10) mult = 1.4;       // nov (BF buildup)
    if (month === 11) mult = 1.25;      // dez
    // Black Friday week — picos sequenciais, BF dia 28 é o pico absoluto
    if (isBFWeek) mult *= 1.8;
    if (isBF) {
      mult = 1; // override; setamos receita manualmente
      r1 = 412000; r2 = m2 ? 140000 : 0;
    } else if (isCyberMon) {
      mult *= 1.3;
    }
    r1 = Math.round(r1 * mult);
    if (r2) r2 = Math.round(r2 * mult);

    // Slight upward trend over time (jan/2025 → mai/2026)
    const daysSinceStart = (d - startDate) / 86400000;
    const trend = 1 + (daysSinceStart / 500) * 0.12;
    r1 = Math.round(r1 * trend);
    if (r2) r2 = Math.round(r2 * trend);

    const total = r1 + r2;

    // UTM e alcance — quase sempre vazios. Só ~10% das lives recentes têm.
    const isRecent = d > new Date('2026-03-01');
    const hasMetrics = isRecent && rnd() < 0.25;
    const receitaUtm = hasMetrics ? Math.round(total * (0.5 + rnd() * 0.3)) : 0;
    const alcance = hasMetrics ? Math.round(3000 + total / 50 + rnd() * 4000) : 0;

    const nom1Pool = nominalPool[m1.name] || ['LIVE'];
    const nom2Pool = m2 ? (nominalPool[m2.name] || ['LIVE']) : null;

    lives.push({
      id: id++,
      date: iso,
      diaSemana: WEEKDAY_NOMES[dow],
      cupomLigado: true,
      criativo: rnd() < 0.6,
      merchan1: m1.name,
      nominal1: nom1Pool[Math.floor(rnd() * nom1Pool.length)],
      receita1: r1,
      merchan2: m2 ? m2.name : '',
      nominal2: m2 ? nom2Pool[Math.floor(rnd() * nom2Pool.length)] : '',
      receita2: r2,
      receitaTotal: total,
      receitaUtm,
      alcance,
      status: 'realizada',
      origem: rnd() < 0.7 ? 'import' : (rnd() < 0.5 ? 'skill' : 'manual'),
      notes: isBF ? 'Black Friday 2025 — pico histórico (~R$552k).' : '',
    });
  }

  // PROPOSTA DA SEMANA: 7 dias a partir de amanhã, todas com status='proposta', origem='skill'
  const upcoming = [];
  for (let k = 1; k <= 7; k++) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() + k);
    const dow = d.getDay();
    const m1 = pickMerchan();
    let m2 = null;
    if (!m1.sempreSozinho && rnd() < 0.5) {
      let t = 0;
      while (t < 4) {
        const c = pickMerchan();
        if (c.id !== m1.id && !c.sempreSozinho) { m2 = c; break; }
        t++;
      }
    }
    const nom1Pool = nominalPool[m1.name] || ['LIVE'];
    const nom2Pool = m2 ? (nominalPool[m2.name] || ['LIVE']) : null;
    upcoming.push({
      id: id++,
      date: d.toISOString().slice(0, 10),
      diaSemana: WEEKDAY_NOMES[dow],
      cupomLigado: true,
      criativo: rnd() < 0.5,
      merchan1: m1.name,
      nominal1: nom1Pool[Math.floor(rnd() * nom1Pool.length)],
      receita1: 0,
      merchan2: m2 ? m2.name : '',
      nominal2: m2 ? nom2Pool[Math.floor(rnd() * nom2Pool.length)] : '',
      receita2: 0,
      receitaTotal: 0,
      receitaUtm: 0,
      alcance: 0,
      status: 'proposta',
      origem: 'skill',
      notes: '',
    });
  }

  // 2 confirmadas dentro da próxima semana (analista já aprovou)
  for (let k = 0; k < 2; k++) {
    const idx = k === 0 ? 0 : 2;
    if (upcoming[idx]) upcoming[idx].status = 'confirmada';
  }

  // Concat & sort: by date desc
  const all = [...lives, ...upcoming];
  all.sort((a, b) => b.date.localeCompare(a.date));
  return all;
}
const INITIAL_LIVES = buildInitialLives();

/* ============================================================
   AGGREGATION HELPERS
   - Cada live é flatten-ed em até 2 "cupom observations" para análise por merchan
   ============================================================ */

function flattenCupons(lives) {
  const out = [];
  for (const l of lives) {
    if (l.merchan1 && l.receita1 > 0) {
      out.push({ live: l, merchan: l.merchan1, nominal: l.nominal1, receita: l.receita1, slot: 1 });
    }
    if (l.merchan2 && l.receita2 > 0) {
      out.push({ live: l, merchan: l.merchan2, nominal: l.nominal2, receita: l.receita2, slot: 2 });
    }
  }
  return out;
}

function inPeriod(iso, periodDays, todayIso) {
  if (periodDays === 'all') return true;
  const a = new Date(iso + 'T00:00:00');
  const b = new Date(todayIso + 'T00:00:00');
  const diff = (b - a) / 86400000;
  return diff >= 0 && diff <= periodDays;
}

function liveKpis(lives) {
  const real = lives.filter(l => l.status === 'realizada');
  if (real.length === 0) {
    return { count: 0, total: 0, avg: 0, best: null, alcanceCount: 0, alcanceTotal: 0, utmCount: 0, utmShareTotal: 0, utmShareSum: 0 };
  }
  const total = real.reduce((s, l) => s + l.receitaTotal, 0);
  const best = real.reduce((m, l) => l.receitaTotal > (m?.receitaTotal ?? -1) ? l : m, null);
  // UTM/alcance — só lives que TÊM dado
  const withUtm = real.filter(l => l.receitaUtm > 0);
  const withAlcance = real.filter(l => l.alcance > 0);
  const utmShareTotal = withUtm.reduce((s, l) => s + l.receitaUtm, 0);
  const utmShareSum = withUtm.reduce((s, l) => s + l.receitaTotal, 0);
  return {
    count: real.length,
    total,
    avg: total / real.length,
    best,
    alcanceCount: withAlcance.length,
    alcanceTotal: withAlcance.reduce((s, l) => s + l.alcance, 0),
    utmCount: withUtm.length,
    utmShareTotal,
    utmShareSum,
  };
}

function perMerchanMetrics(lives, merchans) {
  const real = lives.filter(l => l.status === 'realizada');
  const obs = flattenCupons(real);
  return merchans.map(m => {
    const mine = obs.filter(o => o.merchan === m.name);
    const slot1 = mine.filter(o => o.slot === 1);
    const slot2 = mine.filter(o => o.slot === 2);
    const total = mine.reduce((s, o) => s + o.receita, 0);
    return {
      merchanId: m.id,
      name: m.name,
      short: m.short,
      color: m.color,
      forte: m.forte,
      sempreSozinho: m.sempreSozinho,
      count: mine.length,
      countSlot1: slot1.length,
      countSlot2: slot2.length,
      total,
      avg: mine.length > 0 ? total / mine.length : 0,
      // % das vezes que essa receita veio como cupom 1
      slot1Pct: mine.length > 0 ? slot1.length / mine.length : 0,
    };
  }).filter(x => x.count > 0).sort((a, b) => b.avg - a.avg);
}

function weekKey(iso) {
  const d = new Date(iso + 'T00:00:00');
  const day = d.getDay() || 7;
  d.setDate(d.getDate() + (4 - day));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return { year: d.getFullYear(), week, key: `${d.getFullYear()}-W${String(week).padStart(2, '0')}` };
}
function weeklyTrend(lives) {
  const real = lives.filter(l => l.status === 'realizada');
  const map = new Map();
  for (const l of real) {
    const k = weekKey(l.date);
    if (!map.has(k.key)) map.set(k.key, { key: k.key, year: k.year, week: k.week, total: 0, count: 0 });
    const e = map.get(k.key);
    e.total += l.receitaTotal;
    e.count += 1;
  }
  return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
}

/* heatmap: weekday × merchan, value = avg receita do cupom dessa combinação */
function heatmapMatrix(lives, merchans) {
  const real = lives.filter(l => l.status === 'realizada');
  const obs = flattenCupons(real);
  const grid = {};
  for (const o of obs) {
    const wd = new Date(o.live.date + 'T00:00:00').getDay();
    const k = `${wd}::${o.merchan}`;
    if (!grid[k]) grid[k] = { sum: 0, n: 0 };
    grid[k].sum += o.receita;
    grid[k].n += 1;
  }
  let max = 0;
  const matrix = [];
  for (let wd = 0; wd < 7; wd++) {
    const row = { weekday: wd, cells: [] };
    for (const m of merchans) {
      const e = grid[`${wd}::${m.name}`];
      const avg = e ? e.sum / e.n : 0;
      if (avg > max) max = avg;
      row.cells.push({ merchan: m.name, avg, count: e ? e.n : 0 });
    }
    matrix.push(row);
  }
  return { matrix, max };
}

function monthVsPrev(lives, todayIso) {
  const today = new Date(todayIso + 'T00:00:00');
  const dayOfMonth = today.getDate();
  const startCur = new Date(today.getFullYear(), today.getMonth(), 1);
  const startPrev = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  // Mesmo nº de dias: do dia 1 ao "dayOfMonth" do mês anterior.
  // Se o mês anterior tem menos dias que dayOfMonth, usa o último dia daquele mês.
  const lastDayPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  const endDayPrev = Math.min(dayOfMonth, lastDayPrevMonth);
  const endPrev = new Date(today.getFullYear(), today.getMonth() - 1, endDayPrev);
  const real = lives.filter(l => l.status === 'realizada');
  const sumIn = (a, b) => real
    .filter(l => {
      const d = new Date(l.date + 'T00:00:00');
      return d >= a && d <= b;
    })
    .reduce((s, l) => s + l.receitaTotal, 0);
  const cur = sumIn(startCur, today);
  const prev = sumIn(startPrev, endPrev);
  return {
    cur,
    prev,
    delta: prev === 0 ? 0 : (cur - prev) / prev,
    diff: cur - prev,
    dayOfMonth,
    endDayPrev,
  };
}

/* ----------- FORMATTERS ----------- */
const fmtBRL = (n) => 'R$ ' + Math.round(n).toLocaleString('pt-BR');
const fmtBRLk = (n) => {
  if (Math.abs(n) >= 1_000_000) return 'R$ ' + (n / 1_000_000).toFixed(1).replace('.', ',') + 'M';
  if (Math.abs(n) >= 1000) return 'R$ ' + (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.', ',') + 'k';
  return 'R$ ' + Math.round(n).toLocaleString('pt-BR');
};
const fmtPct = (x) => (x * 100).toFixed(0) + '%';

Object.assign(window, {
  MERCHANS_INITIAL,
  MERCHANS_BY_NAME,
  LIVE_STATUSES,
  LIVE_STATUS_BY_ID,
  INITIAL_LIVES,
  hashStr, colorFromName, shortLabel,
  flattenCupons, inPeriod, liveKpis, perMerchanMetrics,
  weekKey, weeklyTrend, heatmapMatrix, monthVsPrev,
  fmtBRL, fmtBRLk, fmtPct,
  WEEKDAY_LABELS, WEEKDAY_NOMES,
});
