// ============ CALENDAR + MODAL ============
const { useState, useMemo, useEffect, useRef } = React;

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const TODAY_STR = "2026-05-13";

const pad = (n) => String(n).padStart(2, "0");
const toISO = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const parseISO = (s) => {const [y, m, d] = s.split("-").map(Number);return new Date(y, m - 1, d);};
const fmtBR = (iso) => {if (!iso || iso === "-") return "—";const d = parseISO(iso);return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;};

function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonth = new Date(year, month, 0);
  const daysInPrev = prevMonth.getDate();
  const cells = [];
  for (let i = startDow - 1; i >= 0; i--) {
    const d = daysInPrev - i;
    cells.push({ day: d, iso: toISO(prevMonth.getFullYear(), prevMonth.getMonth(), d), other: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, iso: toISO(year, month, d), other: false });
  }
  const next = new Date(year, month + 1, 1);
  let d = 1;
  while (cells.length < 42) {
    cells.push({ day: d, iso: toISO(next.getFullYear(), next.getMonth(), d), other: true });
    d++;
  }
  return cells;
}

// ============ POST CARD ============
function PostCard({ post, onClick }) {
  return (
    <button
      className={`post-card plat-${post.platform} status-${post.status}`}
      onClick={onClick}
      title={post.title}>
      
      <span className={`pc-icon plat-${post.platform}`}>
        <PlatformIcon platform={post.platform} size={9} color="white" />
      </span>
      <span className="pc-time">{post.time}</span>
      <span className="pc-title">{post.title}</span>
    </button>);

}

// ============ CALENDAR GRID ============
function CalendarGrid({ year, month, posts, events, onPostClick, maxPerCell = 3 }) {
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const postsByDay = useMemo(() => {
    const map = {};
    posts.forEach((p) => {(map[p.date] = map[p.date] || []).push(p);});
    Object.keys(map).forEach((k) => map[k].sort((a, b) => a.time.localeCompare(b.time)));
    return map;
  }, [posts]);

  const eventsByDay = useMemo(() => {
    const map = {};
    (events || []).forEach((e) => {
      const s = parseISO(e.start || e.date);
      const en = parseISO(e.end || e.date || e.start);
      for (let d = new Date(s); d <= en; d.setDate(d.getDate() + 1)) {
        const iso = toISO(d.getFullYear(), d.getMonth(), d.getDate());
        (map[iso] = map[iso] || []).push(e);
      }
    });
    return map;
  }, [events]);

  return (
    <div className="cal-grid">
      {WEEKDAYS.map((w) => <div key={w} className="cal-head">{w}</div>)}
      {cells.map((c, i) => {
        const isToday = c.iso === TODAY_STR;
        const dayPosts = postsByDay[c.iso] || [];
        const dayEvents = eventsByDay[c.iso] || [];
        const visible = dayPosts.slice(0, maxPerCell);
        const more = dayPosts.length - visible.length;

        // dedupe event colors (max 4 dots)
        const eventDots = [...new Set(dayEvents.map((e) => {
          const futType = SH_DATA.FUT_TYPES.find((t) => t.id === e.type);
          const evType = SH_DATA.EVENT_TYPES.find((t) => t.id === e.type);
          return (futType || evType)?.color;
        }).filter(Boolean))].slice(0, 4);
        const firstEvent = dayEvents[0];
        const firstEventColor = firstEvent ? (
          SH_DATA.FUT_TYPES.find(t => t.id === firstEvent.type)?.color ||
          SH_DATA.EVENT_TYPES.find(t => t.id === firstEvent.type)?.color || "#999"
        ) : null;

        return (
          <div key={i} className={`cal-cell ${c.other ? "other" : ""} ${isToday ? "today" : ""}`}>
            <div className="cal-num-row">
              <span className="cal-num-box">{c.day}</span>
              {firstEvent && (
                <span className="cal-event-label" title={dayEvents.map((e) => e.name).join(", ")}>
                  <span className="edot" style={{ background: firstEventColor }}></span>
                  <span className="ev-name">{firstEvent.name}</span>
                  {dayEvents.length > 1 && <span className="ev-more">+{dayEvents.length - 1}</span>}
                </span>
              )}
            </div>
            {visible.map((p) =>
            <PostCard key={p.id} post={p} onClick={() => onPostClick(p)} />
            )}
            {more > 0 && <div className="cal-more">+{more} mais</div>}
          </div>);

      })}
    </div>);

}

// ============ STARS ============
function Stars({ value, onChange }) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((n) =>
      <button key={n} className={n <= value ? "on" : ""} onClick={() => onChange(n)}>
          <Icon.star />
        </button>
      )}
    </div>);

}

// ============ POPOVER ============
function Popover({ open, onClose, anchor = "left", children }) {
  if (!open) return null;
  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 55 }} onClick={onClose}></div>
      <div className="popover" style={{ top: "100%", marginTop: 4, [anchor]: 0 }}>
        {children}
      </div>
    </>);

}

function StatusSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const cur = SH_DATA.STATUSES.find((s) => s.id === value);
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button className={`status-pill ${cur.className}`} onClick={() => setOpen((o) => !o)}>
        <span className="sdot"></span>
        {cur.label}
        <Icon.chevD />
      </button>
      <Popover open={open} onClose={() => setOpen(false)}>
        {SH_DATA.STATUSES.map((s) =>
        <button key={s.id} className="po-item" onClick={() => {onChange(s.id);setOpen(false);}}>
            <span className="pdot" style={{
            background: s.id === "prod" ? "oklch(0.62 0.13 75)" : s.id === "sched" ? "oklch(0.6 0.13 265)" : s.id === "pub" ? "oklch(0.6 0.13 150)" : "oklch(0.6 0.05 25)"
          }}></span>
            {s.label}
            {s.id === value && <span className="check"><Icon.check /></span>}
          </button>
        )}
      </Popover>
    </div>);

}

function PlatformSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const cur = SH_DATA.PLATFORMS.find((p) => p.id === value);
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button className="field" style={{ display: "inline-flex", alignItems: "center", gap: 9, paddingRight: 10, cursor: "pointer" }} onClick={() => setOpen((o) => !o)}>
        <span style={{ width: 18, height: 18, borderRadius: 5, background: cur.color, display: "grid", placeItems: "center" }}>
          <PlatformIcon platform={cur.id} size={11} color="white" />
        </span>
        {cur.label}
        <Icon.chevD />
      </button>
      <Popover open={open} onClose={() => setOpen(false)}>
        {SH_DATA.PLATFORMS.map((p) =>
        <button key={p.id} className="po-item" onClick={() => {onChange(p.id);setOpen(false);}}>
            <span style={{ width: 16, height: 16, borderRadius: 4, background: p.color, display: "grid", placeItems: "center" }}>
              <PlatformIcon platform={p.id} size={10} color="white" />
            </span>
            {p.label}
            {p.id === value && <span className="check"><Icon.check /></span>}
          </button>
        )}
      </Popover>
    </div>);

}

function GenericSelect({ value, options, onChange, placeholder = "Selecionar...", allowCreate = true, width = 200 }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const filtered = options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()));
  const cur = options.find((o) => o.id === value);
  return (
    <div style={{ position: "relative", display: "inline-block", width }}>
      <button className="field" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", width: "100%" }} onClick={() => setOpen((o) => !o)}>
        <span style={{ color: cur ? "var(--ink)" : "var(--ink-3)" }}>{cur ? cur.label : placeholder}</span>
        <Icon.chevD />
      </button>
      <Popover open={open} onClose={() => {setOpen(false);setQ("");}}>
        {allowCreate &&
        <input className="po-input" placeholder="Buscar ou criar..." value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
        }
        <div style={{ maxHeight: 240, overflowY: "auto", marginTop: allowCreate ? 4 : 0 }}>
          {filtered.map((o) =>
          <button key={o.id} className="po-item" onClick={() => {onChange(o.id);setOpen(false);setQ("");}}>
              {o.label}
              {o.id === value && <span className="check"><Icon.check /></span>}
            </button>
          )}
          {allowCreate && q && !filtered.find((o) => o.label.toLowerCase() === q.toLowerCase()) &&
          <>
              <div className="po-divider"></div>
              <button className="po-item" onClick={() => {onChange("new:" + q);setOpen(false);setQ("");}}>
                <Icon.plus /> Criar "{q}"
              </button>
            </>
          }
        </div>
      </Popover>
    </div>);

}

function TagsField({ tags, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const all = SH_DATA.TAGS;
  const filtered = all.filter((t) => t.label.toLowerCase().includes(q.toLowerCase()));
  const toggle = (id) => {
    if (tags.includes(id)) onChange(tags.filter((t) => t !== id));else
    onChange([...tags, id]);
  };
  return (
    <div className="modal-tags" style={{ position: "relative" }}>
      {tags.map((t) => {
        const tag = all.find((x) => x.id === t) || { label: t.replace("new:", "") };
        return (
          <span key={t} className="modal-tag">
            {tag.label}
            <span className="x" onClick={() => onChange(tags.filter((x) => x !== t))}><Icon.x /></span>
          </span>);

      })}
      <button className="modal-tag-add" onClick={() => setOpen(true)}>+ Tag</button>
      <Popover open={open} onClose={() => {setOpen(false);setQ("");}}>
        <input className="po-input" placeholder="Buscar ou criar tag..." value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
        <div style={{ marginTop: 4 }}>
          {filtered.map((t) =>
          <button key={t.id} className="po-item" onClick={() => toggle(t.id)}>
              {t.label}
              {tags.includes(t.id) && <span className="check"><Icon.check /></span>}
            </button>
          )}
          {q && !filtered.find((t) => t.label.toLowerCase() === q.toLowerCase()) &&
          <>
              <div className="po-divider"></div>
              <button className="po-item" onClick={() => {onChange([...tags, "new:" + q]);setOpen(false);setQ("");}}>
                <Icon.plus /> Criar "{q}"
              </button>
            </>
          }
        </div>
      </Popover>
    </div>);

}

// ============ MODAL ============
function PostModal({ post, onClose, onSave, onDelete, onDuplicate, showProduct }) {
  const [draft, setDraft] = useState(post);
  useEffect(() => {setDraft(post);}, [post?.id]);
  if (!draft) return null;
  const plat = SH_DATA.PLATFORMS.find((p) => p.id === draft.platform);
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const types = draft.platform === "ig" ? SH_DATA.CONTENT_TYPES_IG : SH_DATA.CONTENT_TYPES_OTHER;

  const handleSave = () => {onSave(draft);onClose();};

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head" style={{ fontFamily: "\"DM Sans\"" }}>
          <div className={`platform-mark plat-${plat.id}`}>
            <PlatformIcon platform={plat.id} size={20} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <input className="modal-title" value={draft.title} onChange={(e) => set("title", e.target.value)} placeholder="Título do post" />
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6 }}>
              <StatusSelect value={draft.status} onChange={(v) => set("status", v)} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>
                #{String(draft.id).padStart(4, "0")}
              </span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><Icon.x /></button>
        </div>

        <div className="modal-body">
          <div className="modal-grid">
            <label>Dono</label>
            <div>
              <GenericSelect value={draft.owner} options={SH_DATA.TEAM.map((t) => ({ id: t, label: t }))} onChange={(v) => set("owner", v)} allowCreate={false} width={180} />
            </div>

            <label>Plataforma</label>
            <div className="field-inline">
              <PlatformSelect value={draft.platform} onChange={(v) => set("platform", v)} />
            </div>

            <label>Data e horário</label>
            <div className="field-inline">
              <input className="field" type="date" value={draft.date} onChange={(e) => set("date", e.target.value)} style={{ width: 180 }} />
              <input className="field" type="time" value={draft.time} onChange={(e) => set("time", e.target.value)} style={{ width: 120 }} />
            </div>

            <label>Tipo de conteúdo</label>
            <div>
              <GenericSelect value={draft.type} options={types.map((t) => ({ id: t, label: t }))} onChange={(v) => set("type", v)} allowCreate={false} />
            </div>

            <label>Complexidade</label>
            <div className="field-inline">
              <Stars value={draft.complexity} onChange={(v) => set("complexity", v)} />
              <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{draft.complexity}/5</span>
            </div>

            {showProduct &&
            <>
                <label>Produto</label>
                <input className="field" placeholder="ex: Carteira Care, Caderno A5..." value={draft.product || ""} onChange={(e) => set("product", e.target.value)} />
              </>
            }

            <label>Tags</label>
            <TagsField tags={draft.tags || []} onChange={(v) => set("tags", v)} />

            <label>Linha editorial</label>
            <div>
              <GenericSelect value={draft.linha} options={SH_DATA.LINHAS_ED} onChange={(v) => set("linha", v)} />
            </div>

            <label>Campanha</label>
            <div>
              <GenericSelect value={draft.campanha} options={SH_DATA.CAMPANHAS} onChange={(v) => set("campanha", v)} placeholder="Sem campanha" />
            </div>

            <label>Link do conteúdo</label>
            <input className="field" placeholder="https://..." value={draft.link} onChange={(e) => set("link", e.target.value)} />

            <label>Link da referência</label>
            <input className="field" placeholder="https://..." value={draft.ref} onChange={(e) => set("ref", e.target.value)} />

            <label style={{ alignSelf: "flex-start", paddingTop: 10 }}>Observações</label>
            <textarea className="field" rows={3} placeholder="Comentários, observações da equipe..." value={draft.notes} onChange={(e) => set("notes", e.target.value)}></textarea>
          </div>
        </div>

        <div className="modal-foot">
          <button className="danger" onClick={() => {onDelete(draft);onClose();}}>
            <Icon.trash /> Excluir
          </button>
          <button className="btn btn-ghost" onClick={() => {onDuplicate(draft);}}>
            <Icon.copy /> Duplicar
          </button>
          <div style={{ flex: 1 }}></div>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-accent" onClick={handleSave}>Salvar alterações</button>
        </div>
      </div>
    </div>);

}

// ============ DUPLICATE POPOVER ============
function DuplicateMenu({ post, onClose, onDuplicate }) {
  return (
    <div className="modal-backdrop" onClick={onClose} style={{ background: "rgba(30,20,50,.5)" }}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 420 }}>
        <div className="modal-head">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 500, letterSpacing: ".04em" }}>DUPLICAR POST</div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 20, marginTop: 4, lineHeight: 1.2 }}>
              Para qual plataforma?
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><Icon.x /></button>
        </div>
        <div className="modal-body" style={{ padding: "16px 20px 22px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {SH_DATA.PLATFORMS.filter((p) => p.id !== post.platform).map((p) =>
            <button
              key={p.id}
              className="po-item"
              style={{ padding: "14px", border: "1px solid var(--line)", borderRadius: 10, fontSize: 14 }}
              onClick={() => {onDuplicate(p.id);onClose();}}>
              
                <span style={{ width: 28, height: 28, borderRadius: 7, background: p.color, display: "grid", placeItems: "center" }}>
                  <PlatformIcon platform={p.id} size={14} color="white" />
                </span>
                {p.label}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>);

}

// ============ WEEK VIEW ============
const WEEKDAYS_FULL = ["Dom.", "Seg.", "Ter.", "Qua.", "Qui.", "Sex.", "Sáb."];
const WEEK_START_HOUR = 6;
const WEEK_END_HOUR = 24;
const HOUR_HEIGHT = 56;

function startOfWeekISO(iso) {
  const d = parseISO(iso);
  d.setDate(d.getDate() - d.getDay());
  return toISO(d.getFullYear(), d.getMonth(), d.getDate());
}
function addDaysISO(iso, n) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d.getFullYear(), d.getMonth(), d.getDate());
}

function WeekView({ weekStart, posts, onPostClick }) {
  const days = Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i));
  const hours = [];
  for (let h = WEEK_START_HOUR; h < WEEK_END_HOUR; h++) hours.push(h);

  const postsByDay = useMemo(() => {
    const map = {};
    days.forEach(d => { map[d] = []; });
    posts.forEach(p => { if (map[p.date] !== undefined) map[p.date].push(p); });
    Object.values(map).forEach(arr => arr.sort((a, b) => a.time.localeCompare(b.time)));
    return map;
  }, [posts, weekStart]);

  // current time line for today (mock 14:25 of May 13, 2026 to show realism)
  const todayIdx = days.indexOf(TODAY_STR);
  const nowMinutes = 14 * 60 + 25; // mock current time
  const nowOffset = ((nowMinutes / 60) - WEEK_START_HOUR) * HOUR_HEIGHT;

  return (
    <div className="week-grid">
      <div className="week-head">
        <div className="week-tz">GMT-3</div>
        {days.map(d => {
          const dt = parseISO(d);
          const isToday = d === TODAY_STR;
          return (
            <div key={d} className={`week-day-head ${isToday ? "today" : ""}`}>
              <div className="wdh-dow">{WEEKDAYS_FULL[dt.getDay()]}</div>
              <div className="wdh-num">{dt.getDate()}</div>
            </div>
          );
        })}
      </div>
      <div className="week-body" style={{ "--hour-h": HOUR_HEIGHT + "px" }}>
        <div className="week-time-col">
          {hours.map(h => (
            <div key={h} className="week-time-cell">
              {h === WEEK_START_HOUR ? "" : `${pad(h)}:00`}
            </div>
          ))}
        </div>
        {days.map((d, dayIdx) => {
          const isToday = d === TODAY_STR;
          const dayPosts = postsByDay[d] || [];
          return (
            <div key={d} className={`week-day-col ${isToday ? "today" : ""}`}>
              {hours.map(h => (
                <div key={h} className="week-hour-cell"></div>
              ))}
              {isToday && (
                <div className="week-now-line" style={{ top: nowOffset + "px" }}></div>
              )}
              {dayPosts.map(p => {
                const [hh, mm] = p.time.split(":").map(Number);
                const top = ((hh + mm / 60) - WEEK_START_HOUR) * HOUR_HEIGHT;
                if (top < 0) return null;
                // Compute height by complexity (stand-in for duration); min 50px
                const height = Math.max(50, 40 + (p.complexity || 1) * 6);
                return (
                  <button
                    key={p.id}
                    className={`week-post plat-${p.platform} status-${p.status}`}
                    style={{ top: top + "px", height: height + "px" }}
                    onClick={() => onPostClick(p)}
                    title={p.title}
                  >
                    <div className="wp-time">
                      <span className="wp-pic">
                        <PlatformIcon platform={p.platform} size={8} color="white" />
                      </span>
                      {p.time}
                    </div>
                    <div className="wp-title">{p.title}</div>
                    {height >= 70 && <div className="wp-meta">{p.type} · {p.owner}</div>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, {
  CalendarGrid, WeekView, PostModal, DuplicateMenu,
  MONTHS, WEEKDAYS, WEEKDAYS_FULL, TODAY_STR,
  parseISO, toISO, fmtBR, buildMonthGrid, pad,
  startOfWeekISO, addDaysISO,
});