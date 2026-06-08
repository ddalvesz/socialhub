// ============ MAIN APP ============
const { useState } = React;
const { parseISO, MONTHS, startOfWeekISO, addDaysISO, pad } = window;

function days7(weekStart) { return Array.from({length:7}, (_,i)=>addDaysISO(weekStart, i)); }

function App() {
  const [view, setView] = useState("calendar");
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(4); // May
  const [calendarMode, setCalendarMode] = useState("month"); // month | week
  const [weekStart, setWeekStart] = useState("2026-05-10"); // Sunday of current week
  const [platformFilter, setPlatformFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState(SH_DATA.POSTS);
  const [activePost, setActivePost] = useState(null);
  const [duplicateFor, setDuplicateFor] = useState(null);
  const [linkedCampaign, setLinkedCampaign] = useState(null);
  const [profileId, setProfileId] = useState("Lu");
  const [photos, setPhotos] = useState({});
  window.SH_PHOTOS = photos;

  const monthPosts = posts.filter((p) => {
    const d = parseISO(p.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  const brandingCount = posts.filter((p) => p.tags?.includes("branding")).length;
  const mhCount = posts.filter((p) => p.tags?.includes("mh")).length;

  let shownPosts = posts;
  if (view === "branding") shownPosts = posts.filter((p) => p.tags?.includes("branding"));
  if (view === "mh") shownPosts = posts.filter((p) => p.tags?.includes("mh"));
  if (platformFilter !== "all") shownPosts = shownPosts.filter((p) => p.platform === platformFilter);
  if (tagFilter !== "all") shownPosts = shownPosts.filter((p) => p.tags?.includes(tagFilter));
  if (search.trim()) shownPosts = shownPosts.filter((p) =>
  p.title.toLowerCase().includes(search.toLowerCase()) ||
  p.owner.toLowerCase().includes(search.toLowerCase()));

  const goPrev = () => {
    if (calendarMode === "week") { setWeekStart(addDaysISO(weekStart, -7)); return; }
    if (month === 0) {setMonth(11);setYear((y) => y - 1);} else
    setMonth((m) => m - 1);
  };
  const goNext = () => {
    if (calendarMode === "week") { setWeekStart(addDaysISO(weekStart, 7)); return; }
    if (month === 11) {setMonth(0);setYear((y) => y + 1);} else
    setMonth((m) => m + 1);
  };
  const goToday = () => {
    setYear(2026); setMonth(4);
    setWeekStart(startOfWeekISO(window.TODAY_STR));
  };

  // Week navigation label
  const weekLabel = (() => {
    if (calendarMode !== "week") return null;
    const start = parseISO(weekStart);
    const end = parseISO(addDaysISO(weekStart, 6));
    const sameMonth = start.getMonth() === end.getMonth();
    if (sameMonth) {
      return `${start.getDate()} – ${end.getDate()} ${MONTHS[start.getMonth()]} ${start.getFullYear()}`;
    }
    return `${start.getDate()} ${MONTHS[start.getMonth()].slice(0,3)} – ${end.getDate()} ${MONTHS[end.getMonth()].slice(0,3)} ${end.getFullYear()}`;
  })();

  const savePost = (p) => setPosts((arr) => arr.map((x) => x.id === p.id ? p : x));
  const deletePost = (p) => setPosts((arr) => arr.filter((x) => x.id !== p.id));
  const duplicateToPlatform = (newPlatform) => {
    if (!duplicateFor) return;
    const newId = Math.max(...posts.map((p) => p.id)) + 1;
    const newPost = { ...duplicateFor, id: newId, platform: newPlatform, status: "prod" };
    // Adjust type if platform changes
    if (newPlatform === "ig" && !SH_DATA.CONTENT_TYPES_IG.includes(newPost.type)) newPost.type = "Reels";
    if (newPlatform !== "ig" && !SH_DATA.CONTENT_TYPES_OTHER.includes(newPost.type)) newPost.type = "Vídeo";
    setPosts((arr) => [...arr, newPost]);
    setDuplicateFor(null);
    setActivePost(newPost);
  };

  const viewTitles = {
    calendar: { title: "Calendário", sub: "Todos os canais" },
    branding: { title: "Branding", sub: "Posts com tag Branding" },
    mh: { title: "Máquina de Hits", sub: "Posts MH" },
    comemorativas: { title: "Datas comemorativas", sub: "Pauta anual" },
    futebol: { title: "Futebol 2026", sub: "Calendário esportivo" },
    campaigns: { title: "Campanhas", sub: "Controle e cronograma" },
    profile: { title: "Perfil", sub: profileId === "Lu" ? "Seu perfil" : "Equipe" }
  };
  const vt = viewTitles[view];

  const NavItem = ({ id, label, icon, count }) =>
  <button className={`sb-item ${view === id ? "active" : ""}`} onClick={() => setView(id)}>
      {icon} <span>{label}</span>
      {count !== undefined && <span className="sb-count">{count}</span>}
    </button>;


  const isCalendarView = view === "calendar" || view === "branding" || view === "mh";

  return (
    <div className="app">
      {/* ============ SIDEBAR ============ */}
      <aside className="sidebar">
        <div className="sb-brand">
          <span className="wordmark">SocialHub</span>
          <span className="dot">.</span>
        </div>

        <div className="sb-section">
          <div className="sb-label">Calendários</div>
          <NavItem id="calendar" label="Calendário do mês" icon={<Icon.cal />} count={monthPosts.length} />
          <NavItem id="branding" label="Branding" icon={<Icon.branding />} count={brandingCount} />
          <NavItem id="mh" label="Máquina de Hits" icon={<Icon.mh />} count={mhCount} />
        </div>

        <div className="sb-section">
          <div className="sb-label">Planejamento</div>
          <NavItem id="comemorativas" label="Datas comemorativas" icon={<Icon.events />} />
          <NavItem id="futebol" label="Futebol 2026" icon={<Icon.ball />} />
          <NavItem id="campaigns" label="Campanhas" icon={<Icon.campaign />} count={SH_DATA.CAMPAIGNS_LIST.length} />
        </div>

        <div className={`sb-user ${view === "profile" ? "active" : ""}`} onClick={() => { setView("profile"); setProfileId("Lu"); }} title="Abrir meu perfil">
          {photos["Lu"] ? (
            <img src={photos["Lu"]} alt="Lu Reis" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <div className="sb-avatar">L</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: "-0.01em" }}>Lu Reis</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>Social Lead</div>
          </div>
        </div>
      </aside>

      {/* ============ MAIN ============ */}
      <main className="main">
        <div className="topbar">
          <div className="tb-title">{vt.title}</div>
          <div className="tb-sub">{vt.sub}</div>

          {isCalendarView &&
          <>
              <div className="month-nav" style={{ marginLeft: 8 }}>
                <button onClick={goPrev} title={calendarMode === "week" ? "Semana anterior" : "Mês anterior"}><Icon.chevL /></button>
                <div className="label">
                  {calendarMode === "week" ? weekLabel : `${MONTHS[month]} ${year}`}
                </div>
                <button onClick={goNext} title={calendarMode === "week" ? "Próxima semana" : "Próximo mês"}><Icon.chevR /></button>
              </div>
              <button className="today-btn" onClick={goToday}>Hoje</button>
              <div className="view-toggle" style={{ marginLeft: 4 }}>
                <button className={calendarMode === "month" ? "active" : ""} onClick={() => setCalendarMode("month")}>Mês</button>
                <button className={calendarMode === "week" ? "active" : ""} onClick={() => setCalendarMode("week")}>Semana</button>
              </div>
            </>
          }

          <div className="tb-spacer"></div>

          {isCalendarView &&
          <div className="search-box">
              <Icon.search />
              <input placeholder="Buscar posts..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          }
          <button className="btn btn-accent"><Icon.plus /> Novo post</button>
        </div>

        {isCalendarView &&
        <div className="filter-bar">
            <button className={`platform-pill ${platformFilter === "all" ? "active" : ""}`} onClick={() => setPlatformFilter("all")}>
              Todas as redes
            </button>
            {SH_DATA.PLATFORMS.map((p) =>
          <button key={p.id} className={`platform-pill ${platformFilter === p.id ? "active" : ""}`} onClick={() => setPlatformFilter(p.id)}>
                <span style={{ width: 14, height: 14, borderRadius: 4, background: p.color, display: "grid", placeItems: "center" }}>
                  <PlatformIcon platform={p.id} size={9} color="white" />
                </span>
                {p.label}
              </button>
          )}

            {view === "calendar" &&
          <>
                <div style={{ width: 1, height: 18, background: "var(--line)", margin: "0 8px" }}></div>
                <button className={`tag-chip ${tagFilter === "all" ? "active" : ""}`} onClick={() => setTagFilter("all")}>Todas tags</button>
                {SH_DATA.TAGS.map((t) =>
            <button key={t.id} className={`tag-chip ${tagFilter === t.id ? "active" : ""}`} onClick={() => setTagFilter(t.id)}>{t.label}</button>
            )}
              </>
          }

            {view === "mh" &&
          <span style={{ fontSize: 11.5, color: "var(--ink-3)", marginLeft: 4 }}>
                Inclui produto + duplicação entre redes
              </span>
          }

            <div style={{ flex: 1 }}></div>
            <span className="count-pill">
              {calendarMode === "week" ? (
                `${shownPosts.filter(p => { const i = days7(weekStart).indexOf(p.date); return i >= 0; }).length} posts esta semana`
              ) : (
                `${shownPosts.filter((p) => { const d = parseISO(p.date); return d.getFullYear() === year && d.getMonth() === month; }).length} posts neste mês`
              )}
            </span>
          </div>
        }

        {isCalendarView &&
        <div className="cal-wrap">
            {calendarMode === "month" ? (
              <CalendarGrid
              year={year} month={month}
              posts={shownPosts}
              events={view === "calendar" ?
              [...SH_DATA.COMEMORATIVAS, ...SH_DATA.FUTEBOL_2026] :
              []}
              onPostClick={(p) => setActivePost(p)} />
            ) : (
              <WeekView
                weekStart={weekStart}
                posts={shownPosts}
                onPostClick={(p) => setActivePost(p)}
              />
            )}
          </div>
        }

        {view === "comemorativas" && <ComemorativasView />}
        {view === "futebol" && <FutebolView />}
        {view === "campaigns" && <CampaignsView onShowLinkedPosts={setLinkedCampaign} />}
        {view === "profile" && (
          <ProfileView
            posts={posts}
            profileId={profileId}
            onSelectProfile={setProfileId}
            onPostClick={(p) => setActivePost(p)}
            photos={photos}
            onSetPhoto={(id, dataUrl) => setPhotos(prev => ({ ...prev, [id]: dataUrl }))}
          />
        )}
      </main>

      {/* Modal */}
      {activePost &&
      <PostModal
        post={activePost}
        onClose={() => setActivePost(null)}
        onSave={savePost}
        onDelete={deletePost}
        onDuplicate={(p) => setDuplicateFor(p)}
        showProduct={view === "mh" || activePost.product !== undefined} />

      }

      {/* Duplicate menu */}
      {duplicateFor &&
      <DuplicateMenu
        post={duplicateFor}
        onClose={() => setDuplicateFor(null)}
        onDuplicate={duplicateToPlatform} />

      }

      {/* Linked posts drawer */}
      {linkedCampaign &&
      <LinkedPostsDrawer
        campaign={linkedCampaign}
        posts={posts}
        onClose={() => setLinkedCampaign(null)}
        onPostClick={(p) => {setLinkedCampaign(null);setActivePost(p);}} />

      }
    </div>);

}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);