// ============ EVENTS (Datas Comemorativas + Futebol) ============
const { useState } = React;
const { buildMonthGrid, parseISO, toISO, fmtBR, MONTHS, WEEKDAYS, TODAY_STR } = window;

function MiniEventCalendar({ events, year, month, getColor }) {
  const cells = buildMonthGrid(year, month);
  const byDay = {};
  events.forEach((e) => {
    const s = parseISO(e.date || e.start);
    const en = parseISO(e.end || e.date || e.start);
    for (let d = new Date(s); d <= en; d.setDate(d.getDate() + 1)) {
      const iso = toISO(d.getFullYear(), d.getMonth(), d.getDate());
      (byDay[iso] = byDay[iso] || []).push(e);
    }
  });

  return (
    <div className="cal-grid">
      {WEEKDAYS.map((w) => <div key={w} className="cal-head">{w}</div>)}
      {cells.map((c, i) => {
        const isToday = c.iso === TODAY_STR;
        const dayE = byDay[c.iso] || [];
        return (
          <div key={i} className={`cal-cell ${c.other ? "other" : ""} ${isToday ? "today" : ""}`}>
            <div className="cal-num-row">
              <span className="cal-num-box">{c.day}</span>
            </div>
            {dayE.slice(0, 3).map((e, k) => {
              const color = getColor(e);
              return (
                <div key={k} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "5px 8px",
                  borderRadius: 6,
                  background: `color-mix(in oklab, ${color}, white 88%)`,
                  color: `color-mix(in oklab, ${color}, black 25%)`,
                  fontSize: 11.5,
                  fontWeight: 500
                }}>
                  <span style={{
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    flex: 1
                  }}>{e.name}</span>
                  {e.pack && <span className={`event-pack ${e.pack.toLowerCase()}`} style={{ background: "rgba(255,255,255,.5)", border: "none" }}>{e.pack}</span>}
                </div>);

            })}
            {dayE.length > 3 && <div className="cal-more">+{dayE.length - 3}</div>}
          </div>);

      })}
    </div>);

}

function ViewToggle({ value, onChange }) {
  return (
    <div className="view-toggle">
      <button className={value === "list" ? "active" : ""} onClick={() => onChange("list")}>Lista</button>
      <button className={value === "calendar" ? "active" : ""} onClick={() => onChange("calendar")}>Calendário</button>
    </div>);

}

// ============ DATAS COMEMORATIVAS ============
function ComemorativasView() {
  const [view, setView] = useState("list");
  const [filter, setFilter] = useState("all");
  const [month, setMonth] = useState(4);
  const [year] = useState(2026);
  const [items, setItems] = useState(SH_DATA.COMEMORATIVAS);

  const filtered = filter === "all" ? items : items.filter((e) => e.type === filter);

  const toggleField = (id, field) => {
    setItems((arr) => arr.map((e) => e.id === id ? { ...e, [field]: !e[field] } : e));
  };

  return (
    <>
      <div className="filter-bar">
        <button className={`platform-pill ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
          Todas
        </button>
        {SH_DATA.EVENT_TYPES.map((t) =>
        <button key={t.id} className={`platform-pill ${filter === t.id ? "active" : ""}`} onClick={() => setFilter(t.id)}>
            <span className="dot" style={{ background: t.color }}></span> {t.label}
          </button>
        )}
        <div style={{ flex: 1 }}></div>
        <ViewToggle value={view} onChange={setView} />
        <button className="btn btn-accent"><Icon.plus /> Nova data</button>
      </div>

      <div className="list-wrap">
        {view === "list" ?
        <div className="list">
            <div className="list-row list-head" style={{ gridTemplateColumns: "40px 1.6fr 1.1fr 0.9fr 80px 90px 90px 1fr" }}>
              <div className="cell"></div>
              <div className="cell">Nome</div>
              <div className="cell">Período</div>
              <div className="cell">Tipo</div>
              <div className="cell">Pacote</div>
              <div className="cell">Potencial</div>
              <div className="cell">Postado</div>
              <div className="cell">Formato</div>
            </div>
            {filtered.map((e) => {
            const tp = SH_DATA.EVENT_TYPES.find((t) => t.id === e.type);
            return (
              <div key={e.id} className="list-row" style={{ gridTemplateColumns: "40px 1.6fr 1.1fr 0.9fr 80px 90px 90px 1fr" }}>
                  <div className="cell"><span className="dot" style={{ background: tp.color }}></span></div>
                  <div className="cell" style={{ letterSpacing: "-0.01em", fontFamily: "\"DM Sans\"", fontSize: "13px", fontWeight: "500" }}>{e.name}</div>
                  <div className="cell" style={{ fontSize: 13, color: "var(--ink-2)", fontVariantNumeric: "tabular-nums" }}>
                    {fmtBR(e.start)}{e.end !== e.start ? ` → ${fmtBR(e.end)}` : ""}
                  </div>
                  <div className="cell">
                    <span style={{
                    padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 500,
                    background: `color-mix(in oklab, ${tp.color}, white 88%)`,
                    color: tp.color
                  }}>{tp.label}</span>
                  </div>
                  <div className="cell"><span className={`event-pack ${e.pack.toLowerCase()}`}>{e.pack}</span></div>
                  <div className="cell">
                    <button className={`check-cell ${e.potencial ? "on" : ""}`} onClick={() => toggleField(e.id, "potencial")}>
                      {e.potencial && <Icon.check />}
                    </button>
                  </div>
                  <div className="cell">
                    <button className={`check-cell ${e.postado ? "on" : ""}`} onClick={() => toggleField(e.id, "postado")}>
                      {e.postado && <Icon.check />}
                    </button>
                  </div>
                  <div className="cell" style={{ color: "var(--ink-2)" }}>{e.format}</div>
                </div>);

          })}
          </div> :

        <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div className="month-nav">
                <button onClick={() => setMonth((m) => Math.max(0, m - 1))}><Icon.chevL /></button>
                <div className="label">{MONTHS[month]} {year}</div>
                <button onClick={() => setMonth((m) => Math.min(11, m + 1))}><Icon.chevR /></button>
              </div>
            </div>
            <MiniEventCalendar
            events={filtered}
            year={year} month={month}
            getColor={(e) => SH_DATA.EVENT_TYPES.find((t) => t.id === e.type)?.color || "#999"} />
          
          </div>
        }
      </div>
    </>);

}

// ============ FUTEBOL 2026 ============
function FutebolView() {
  const [view, setView] = useState("list");
  const [filter, setFilter] = useState("all");
  const [month, setMonth] = useState(4);
  const [year] = useState(2026);

  const items = SH_DATA.FUTEBOL_2026;
  const filtered = filter === "all" ? items : items.filter((e) => e.type === filter);
  const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <div className="filter-bar">
        <button className={`platform-pill ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>Todos</button>
        {SH_DATA.FUT_TYPES.map((t) =>
        <button key={t.id} className={`platform-pill ${filter === t.id ? "active" : ""}`} onClick={() => setFilter(t.id)}>
            <span className="dot" style={{ background: t.color }}></span> {t.label}
          </button>
        )}
        <div style={{ flex: 1 }}></div>
        <ViewToggle value={view} onChange={setView} />
        <button className="btn btn-accent"><Icon.plus /> Novo evento</button>
      </div>

      <div className="list-wrap">
        {view === "list" ?
        <div className="list">
            <div className="list-row list-head" style={{ gridTemplateColumns: "40px 1.1fr 2fr 160px" }}>
              <div className="cell"></div>
              <div className="cell">Tipo</div>
              <div className="cell">Nome</div>
              <div className="cell">Data</div>
            </div>
            {sorted.map((e) => {
            const tp = SH_DATA.FUT_TYPES.find((t) => t.id === e.type);
            const past = e.date < TODAY_STR;
            return (
              <div key={e.id} className="list-row" style={{ gridTemplateColumns: "40px 1.1fr 2fr 160px", opacity: past ? 0.5 : 1 }}>
                  <div className="cell"><span className="dot" style={{ background: tp.color }}></span></div>
                  <div className="cell">
                    <span style={{
                    padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 500,
                    background: `color-mix(in oklab, ${tp.color}, white 88%)`,
                    color: tp.color
                  }}>{tp.label}</span>
                  </div>
                  <div className="cell" style={{ fontFamily: "var(--font-serif)", fontSize: 17, letterSpacing: "-0.01em" }}>{e.name}</div>
                  <div className="cell" style={{ fontSize: 13, color: "var(--ink-2)", fontVariantNumeric: "tabular-nums" }}>
                    {fmtBR(e.date)}
                  </div>
                </div>);

          })}
          </div> :

        <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div className="month-nav">
                <button onClick={() => setMonth((m) => Math.max(0, m - 1))}><Icon.chevL /></button>
                <div className="label">{MONTHS[month]} {year}</div>
                <button onClick={() => setMonth((m) => Math.min(11, m + 1))}><Icon.chevR /></button>
              </div>
            </div>
            <MiniEventCalendar
            events={filtered}
            year={year} month={month}
            getColor={(e) => SH_DATA.FUT_TYPES.find((t) => t.id === e.type)?.color || "#999"} />
          
          </div>
        }
      </div>
    </>);

}

window.ComemorativasView = ComemorativasView;
window.FutebolView = FutebolView;