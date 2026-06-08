/* Main SocialHubApp shell — ported from components/SocialHubApp.tsx */
const { useState: useStateA } = React;

function SocialHubApp() {
  const meId = 'Eduarda';
  const ownerName = 'Eduarda';
  const userName = 'Eduarda Alves';

  const [posts, setPosts] = useStateA(INITIAL_POSTS);
  const [view, setView] = useStateA('calendar');

  const today = todayISO();
  const todayDate = parseISO(today);

  const [year, setYear] = useStateA(todayDate.getFullYear());
  const [month, setMonth] = useStateA(todayDate.getMonth());
  const [calMode, setCalMode] = useStateA('month');
  const [weekStart, setWeekStart] = useStateA(() => startOfWeekISO(today));

  const [platformFilter, setPlatformFilter] = useStateA('all');
  const [tagFilter, setTagFilter] = useStateA('all');
  const [search, setSearch] = useStateA('');

  const [activePost, setActivePost] = useStateA(null);
  const [duplicateFor, setDuplicateFor] = useStateA(null);
  const [profileId, setProfileId] = useStateA(meId);
  const [photos, setPhotos] = useStateA({});

  let shownPosts = posts;
  if (view === 'branding') shownPosts = posts.filter(p => p.tags?.includes('branding'));
  if (view === 'mh')       shownPosts = posts.filter(p => p.tags?.includes('mh'));
  if (platformFilter !== 'all') shownPosts = shownPosts.filter(p => p.platform === platformFilter);
  if (tagFilter !== 'all')      shownPosts = shownPosts.filter(p => p.tags?.includes(tagFilter));
  if (search.trim()) {
    const q = search.toLowerCase();
    shownPosts = shownPosts.filter(p => p.title.toLowerCase().includes(q) || p.owner.toLowerCase().includes(q));
  }

  const monthPosts = posts.filter(p => {
    const d = parseISO(p.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const goPrev = () => {
    if (calMode === 'week') { setWeekStart(w => addDaysISO(w, -7)); return; }
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  };
  const goNext = () => {
    if (calMode === 'week') { setWeekStart(w => addDaysISO(w, 7)); return; }
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  };
  const goToday = () => {
    const t = parseISO(today);
    setYear(t.getFullYear()); setMonth(t.getMonth());
    setWeekStart(startOfWeekISO(today));
  };

  const weekLabel = (() => {
    if (calMode !== 'week') return null;
    const s = parseISO(weekStart);
    const e = parseISO(addDaysISO(weekStart, 6));
    if (s.getMonth() === e.getMonth())
      return `${s.getDate()} – ${e.getDate()} ${MONTHS[s.getMonth()]} ${s.getFullYear()}`;
    return `${s.getDate()} ${MONTHS[s.getMonth()].slice(0,3)} – ${e.getDate()} ${MONTHS[e.getMonth()].slice(0,3)} ${e.getFullYear()}`;
  })();

  const savePost = p => setPosts(arr => arr.map(x => x.id === p.id ? p : x));
  const deletePost = p => setPosts(arr => arr.filter(x => x.id !== p.id));

  const createPost = (defaults) => {
    const nextId = posts.reduce((m, p) => Math.max(m, p.id), 0) + 1;
    const newPost = {
      id: nextId, title: '', owner: ownerName, platform: 'ig',
      date: defaults.date ?? today, time: '12:00', status: 'prod',
      complexity: 3, type: 'Reels', tags: [], linha: 'produtos',
      campanha: null, link: '', ref: '', notes: '', ...defaults,
    };
    setPosts(arr => [...arr, newPost]);
    setActivePost(newPost);
  };

  const duplicateToPlatform = (newPlatform) => {
    if (!duplicateFor) return;
    const nextId = posts.reduce((m, p) => Math.max(m, p.id), 0) + 1;
    const newPost = { ...duplicateFor, id: nextId, platform: newPlatform, status: 'prod' };
    if (newPlatform === 'ig' && !CONTENT_TYPES_IG.includes(newPost.type)) newPost.type = 'Reels';
    if (newPlatform !== 'ig' && !CONTENT_TYPES_OTHER.includes(newPost.type)) newPost.type = 'Vídeo';
    setPosts(arr => [...arr, newPost]);
    setDuplicateFor(null);
    setActivePost(newPost);
  };

  const meProfile = TEAM_PROFILES.find(p => p.id === meId);
  const meInitial = meProfile?.initial ?? ownerName.charAt(0).toUpperCase();

  const viewTitles = {
    calendar:      { title: 'Calendário',         sub: 'Todos os canais' },
    branding:      { title: 'Branding',            sub: 'Posts com tag Branding' },
    mh:            { title: 'Máquina de Hits',     sub: 'Posts MH' },
    comemorativas: { title: 'Datas comemorativas', sub: 'Pauta anual' },
    futebol:       { title: 'Futebol 2026',        sub: 'Calendário esportivo' },
    campaigns:     { title: 'Campanhas',           sub: 'Controle e cronograma' },
    profile:       { title: 'Perfil',              sub: profileId === meId ? 'Seu perfil' : 'Equipe' },
  };
  const { title, sub } = viewTitles[view];
  const isCalView = view === 'calendar' || view === 'branding' || view === 'mh';
  const calEvents = view === 'calendar' ? [...COMEMORATIVAS, ...FUTEBOL_2026] : [];
  const navLabel = calMode === 'week' ? weekLabel : `${MONTHS[month]} ${year}`;

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sb-brand">
          <span className="wordmark">SocialHub</span>
          <span className="dot">.</span>
        </div>

        <div className="sb-section">
          <div className="sb-label">Calendários</div>
          {[
            { id: 'calendar', label: 'Calendário do mês', icon: <Icon.cal />, count: monthPosts.length },
            { id: 'branding', label: 'Branding',          icon: <Icon.branding />, count: posts.filter(p => p.tags?.includes('branding')).length },
            { id: 'mh',       label: 'Máquina de Hits',   icon: <Icon.mh />,       count: posts.filter(p => p.tags?.includes('mh')).length },
          ].map(item => (
            <button key={item.id} className={`sb-item ${view === item.id ? 'active' : ''}`} onClick={() => setView(item.id)}>
              {item.icon} <span>{item.label}</span>
              <span className="sb-count">{item.count}</span>
            </button>
          ))}
        </div>

        <div className="sb-section">
          <div className="sb-label">Planejamento</div>
          {[
            { id: 'comemorativas', label: 'Datas comemorativas', icon: <Icon.events /> },
            { id: 'futebol',       label: 'Futebol 2026',        icon: <Icon.ball />   },
            { id: 'campaigns',     label: 'Campanhas',           icon: <Icon.campaign />, count: CAMPAIGNS_LIST.length },
          ].map(item => (
            <button key={item.id} className={`sb-item ${view === item.id ? 'active' : ''}`} onClick={() => setView(item.id)}>
              {item.icon} <span>{item.label}</span>
              {'count' in item && <span className="sb-count">{item.count}</span>}
            </button>
          ))}
        </div>

        <div className={`sb-user ${view === 'profile' ? 'active' : ''}`}
          onClick={() => { setView('profile'); setProfileId(meId); }}
          title="Abrir meu perfil">
          {photos[meId] ? (
            <img src={photos[meId]} alt={userName} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flex: '0 0 34px' }} />
          ) : (
            <div className="sb-avatar">{meInitial}</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {meProfile?.name ?? userName}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{meProfile?.role ?? 'Social Media'}</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        <div className="topbar">
          <div className="tb-title">{title}</div>
          <div className="tb-sub">{sub}</div>

          {isCalView && (
            <React.Fragment>
              <div className="month-nav" style={{ marginLeft: 8 }}>
                <button onClick={goPrev}><Icon.chevL /></button>
                <div className="label">{navLabel}</div>
                <button onClick={goNext}><Icon.chevR /></button>
              </div>
              <button className="today-btn" onClick={goToday}>Hoje</button>
              <div className="view-toggle" style={{ marginLeft: 4 }}>
                <button className={calMode === 'month' ? 'active' : ''} onClick={() => setCalMode('month')}>Mês</button>
                <button className={calMode === 'week' ? 'active' : ''} onClick={() => setCalMode('week')}>Semana</button>
              </div>
            </React.Fragment>
          )}

          <div className="tb-spacer" />

          {isCalView && (
            <div className="search-box">
              <Icon.search />
              <input placeholder="Buscar posts..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          )}

          <button className="btn btn-accent" onClick={() => createPost({})}>
            <Icon.plus /> Novo post
          </button>

          <button className="btn btn-ghost" title="Sair" style={{ padding: '9px 12px' }}>
            <Icon.logout />
          </button>
        </div>

        {isCalView && (
          <div className="filter-bar">
            <button className={`platform-pill ${platformFilter === 'all' ? 'active' : ''}`} onClick={() => setPlatformFilter('all')}>
              Todas as redes
            </button>
            {PLATFORMS.map(p => (
              <button key={p.id} className={`platform-pill ${platformFilter === p.id ? 'active' : ''}`} onClick={() => setPlatformFilter(p.id)}>
                <span style={{ width: 14, height: 14, borderRadius: 4, background: p.color, display: 'grid', placeItems: 'center' }}>
                  <PlatformIcon platform={p.id} size={9} color="white" />
                </span>
                {p.label}
              </button>
            ))}

            {view === 'calendar' && (
              <React.Fragment>
                <div style={{ width: 1, height: 18, background: 'var(--line)', margin: '0 8px' }} />
                <button className={`tag-chip ${tagFilter === 'all' ? 'active' : ''}`} onClick={() => setTagFilter('all')}>Todas tags</button>
                {TAGS.map(t => (
                  <button key={t.id} className={`tag-chip ${tagFilter === t.id ? 'active' : ''}`} onClick={() => setTagFilter(t.id)}>{t.label}</button>
                ))}
              </React.Fragment>
            )}

            <div style={{ flex: 1 }} />
            <span className="count-pill">
              {shownPosts.filter(p => {
                const d = parseISO(p.date);
                return d.getFullYear() === year && d.getMonth() === month;
              }).length} posts neste mês
            </span>
          </div>
        )}

        {isCalView && (
          <div className="cal-wrap">
            {calMode === 'month' ? (
              <CalendarGrid year={year} month={month} posts={shownPosts}
                events={calEvents} onPostClick={setActivePost}
                onNewPost={date => createPost({ date })} />
            ) : (
              <WeekView weekStart={weekStart} posts={shownPosts} onPostClick={setActivePost} />
            )}
          </div>
        )}

        {view === 'comemorativas' && <ComemorativasView />}
        {view === 'futebol'       && <FutebolView />}
        {view === 'campaigns'     && <CampaignsView posts={posts} onPostClick={setActivePost} />}
        {view === 'profile' && (
          <ProfileView posts={posts} profileId={profileId} meId={meId}
            onSelectProfile={setProfileId} onPostClick={setActivePost}
            photos={photos}
            onSetPhoto={(id, url) => setPhotos(p => ({ ...p, [id]: url }))} />
        )}
      </main>

      {activePost && (
        <PostModal post={activePost} onClose={() => setActivePost(null)}
          onSave={savePost} onDelete={deletePost}
          onDuplicate={p => setDuplicateFor(p)}
          showProduct={view === 'mh' || activePost.product !== undefined} />
      )}

      {duplicateFor && (
        <DuplicateMenu post={duplicateFor} onClose={() => setDuplicateFor(null)} onDuplicate={duplicateToPlatform} />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<SocialHubApp />);
