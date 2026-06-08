// ============ CAMPAIGNS ============
const { useState } = React;
const { fmtBR } = window;

const tipoColors = {
  "Institucional": "oklch(0.55 0.13 265)",
  "Coleção": "oklch(0.55 0.13 25)",
  "Produto": "oklch(0.5 0.12 150)",
  "Data Comemorativa": "oklch(0.55 0.13 320)"
};

function CampaignsView({ onShowLinkedPosts, onOpenCampaign }) {
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [items] = useState(SH_DATA.CAMPAIGNS_LIST);

  const filtered = filter === "all" ? items :
  filter === "launched" ? items.filter((i) => i.launched) :
  filter === "pending" ? items.filter((i) => !i.launched) :
  items.filter((i) => i.tipo === filter);

  return (
    <>
      <div className="filter-bar">
        <button className={`platform-pill ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
          Todas
        </button>
        <button className={`platform-pill ${filter === "pending" ? "active" : ""}`} onClick={() => setFilter("pending")}>
          <span className="dot" style={{ background: "oklch(0.62 0.13 75)" }}></span> Aguardando
        </button>
        <button className={`platform-pill ${filter === "launched" ? "active" : ""}`} onClick={() => setFilter("launched")}>
          <span className="dot" style={{ background: "oklch(0.6 0.13 150)" }}></span> Lançadas
        </button>
        <div style={{ width: 1, height: 18, background: "var(--line)", margin: "0 6px" }}></div>
        {SH_DATA.CAMP_TIPOS.map((t) =>
        <button key={t} className={`platform-pill ${filter === t ? "active" : ""}`} onClick={() => setFilter(t)}>
            <span className="dot" style={{ background: tipoColors[t] }}></span> {t}
          </button>
        )}
        <div style={{ flex: 1 }}></div>
        <span className="count-pill">{filtered.length} {filtered.length === 1 ? "campanha" : "campanhas"}</span>
        <button className="btn btn-accent"><Icon.plus /> Nova campanha</button>
      </div>

      <div className="list-wrap">
        <div className="list">
          <div className="list-row list-head" style={{ gridTemplateColumns: "40px 2.2fr 70px 1.1fr 1.2fr 0.9fr 1.1fr 110px 130px" }}>
            <div className="cell"></div>
            <div className="cell">Campanha</div>
            <div className="cell">Pacote</div>
            <div className="cell">Dono</div>
            <div className="cell">Tipo</div>
            <div className="cell">Mês</div>
            <div className="cell">Data Insta</div>
            <div className="cell">Status</div>
            <div className="cell">Progresso</div>
          </div>
          {filtered.map((c) => {
            const isOpen = expanded === c.id;
            const ownerInitial = c.dono.charAt(0).toUpperCase();
            return (
              <React.Fragment key={c.id}>
                <div
                  className={`list-row expandable ${isOpen ? "expanded" : ""}`}
                  style={{ gridTemplateColumns: "40px 2.2fr 70px 1.1fr 1.2fr 0.9fr 1.1fr 110px 130px" }}
                  onClick={() => setExpanded(isOpen ? null : c.id)}>
                  
                  <div className="cell" style={{ padding: "14px 0 14px 16px" }}>
                    <span style={{
                      display: "inline-grid", placeItems: "center",
                      width: 24, height: 24, borderRadius: 999,
                      color: "var(--ink-3)",
                      transition: "transform .2s",
                      transform: isOpen ? "rotate(0)" : "rotate(-90deg)"
                    }}><Icon.chevD /></span>
                  </div>
                  <div className="cell" style={{ fontWeight: 500, letterSpacing: "-0.01em", fontFamily: "\"DM Sans\"", fontSize: "13px" }}>{c.nome}</div>
                  <div className="cell"><span className={`event-pack ${c.pack.toLowerCase()}`}>{c.pack}</span></div>
                  <div className="cell">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span className="sb-avatar" style={{ width: 24, height: 24, fontSize: 13 }}>{ownerInitial}</span>
                      {c.dono}
                    </span>
                  </div>
                  <div className="cell">
                    <span style={{
                      padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 500,
                      background: `color-mix(in oklab, ${tipoColors[c.tipo]}, white 88%)`,
                      color: tipoColors[c.tipo]
                    }}>{c.tipo}</span>
                  </div>
                  <div className="cell" style={{ color: "var(--ink-2)" }}>{c.mes}</div>
                  <div className="cell" style={{ fontSize: 13, color: "var(--ink-2)", fontVariantNumeric: "tabular-nums" }}>{fmtBR(c.dataInsta)}</div>
                  <div className="cell">
                    {c.launched ?
                    <span className="status-pill s-pub"><span className="sdot"></span>Lançado</span> :

                    <span className="status-pill s-prod"><span className="sdot"></span>Aguardando</span>
                    }
                  </div>
                  <div className="cell">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="progress" style={{ flex: 1 }}>
                        <div style={{ width: c.progresso + "%" }}></div>
                      </div>
                      <span style={{ fontSize: 11, color: "var(--ink-3)", minWidth: 30, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {c.progresso}%
                      </span>
                    </div>
                  </div>
                </div>

                {isOpen &&
                <div className="list-expansion">
                    <div className="exp-grid">
                      <div className="exp-cell">
                        <label>Previsão de lançamento</label>
                        <div className="v">{fmtBR(c.previsao)}</div>
                      </div>
                      <div className="exp-cell">
                        <label>Data site</label>
                        <div className="v">{fmtBR(c.dataSite)}</div>
                      </div>
                      <div className="exp-cell">
                        <label>Data Instagram</label>
                        <div className="v">{fmtBR(c.dataInsta)}</div>
                      </div>
                      <div className="exp-cell">
                        <label>Data comercial</label>
                        <div className="v">{fmtBR(c.dataComercial)}</div>
                      </div>
                      <div className="exp-cell">
                        <label>Data final</label>
                        <div className="v">{fmtBR(c.dataFinal)}</div>
                      </div>
                      <div className="exp-cell">
                        <label>Mês foco</label>
                        <div className="v">{c.mes}</div>
                      </div>
                      <div className="exp-cell">
                        <label>Pacote</label>
                        <div className="v"><span className={`event-pack ${c.pack.toLowerCase()}`}>{c.pack}</span></div>
                      </div>
                      <div className="exp-cell">
                        <label>Conclusão</label>
                        <div className="v" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className="progress" style={{ flex: 1, maxWidth: 130 }}>
                            <div style={{ width: c.progresso + "%" }}></div>
                          </div>
                          <span style={{ fontSize: 11 }}>{c.progresso}%</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
                      <button className="btn btn-accent" onClick={(e) => {e.stopPropagation();onShowLinkedPosts(c);}}>
                        <Icon.link /> Ver posts vinculados
                      </button>
                      <button className="btn btn-ghost">Editar campanha</button>
                      <div style={{ flex: 1 }}></div>
                      <button className="btn btn-ghost" style={{ color: "var(--ink-3)" }}>
                        <Icon.trash /> Excluir
                      </button>
                    </div>
                  </div>
                }
              </React.Fragment>);

          })}
        </div>
      </div>
    </>);

}

// ============ LINKED POSTS DRAWER ============
function LinkedPostsDrawer({ campaign, posts, onClose, onPostClick }) {
  if (!campaign) return null;
  const linked = posts.filter((p) => p.campanha === campaign.slug);
  linked.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const monthAbbr = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose}></div>
      <div className="drawer">
        <div className="drawer-head">
          <div style={{ flex: 1 }}>
            <div className="label">CAMPANHA</div>
            <div className="title">{campaign.nome}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
              <span className={`event-pack ${campaign.pack.toLowerCase()}`}>{campaign.pack}</span>
              <span style={{
                padding: "3px 10px", borderRadius: 999, fontSize: 11.5, fontWeight: 500,
                background: `color-mix(in oklab, ${tipoColors[campaign.tipo]}, white 88%)`,
                color: tipoColors[campaign.tipo]
              }}>{campaign.tipo}</span>
              <span style={{ fontSize: 12, color: "var(--ink-3)" }}>· {linked.length} {linked.length === 1 ? "post" : "posts"}</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><Icon.x /></button>
        </div>
        <div className="drawer-body">
          {linked.length === 0 ?
          <div className="drawer-empty">
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 18, color: "var(--ink-2)", marginBottom: 6 }}>
                Sem posts vinculados ainda
              </div>
              <div style={{ fontSize: 13 }}>
                Crie um post e selecione "{campaign.nome}" como campanha.
              </div>
            </div> :

          linked.map((p) => {
            const plat = SH_DATA.PLATFORMS.find((x) => x.id === p.platform);
            const d = parseISO(p.date);
            return (
              <div key={p.id} className="linked-post" onClick={() => onPostClick(p)}>
                  <div className="lp-date">
                    {d.getDate()}
                    <span className="month">{monthAbbr[d.getMonth()]}</span>
                  </div>
                  <div className="lp-main">
                    <div className="lp-title">{p.title}</div>
                    <div className="lp-meta">
                      <span>{p.time}</span>
                      <span>·</span>
                      <span>{p.type}</span>
                      <span>·</span>
                      <span>{p.owner}</span>
                    </div>
                  </div>
                  <span className={`lp-platform plat-${p.platform}`} style={{ background: plat.color }}>
                    <PlatformIcon platform={p.platform} size={12} color="white" />
                  </span>
                </div>);

          })
          }
        </div>
      </div>
    </>);

}

window.CampaignsView = CampaignsView;
window.LinkedPostsDrawer = LinkedPostsDrawer;