/* Main SocialHubApp shell — ported from components/SocialHubApp.tsx */
const { useState: useStateA } = React;

function SocialHubApp() {
  const meId = 'Eduarda';
  const ownerName = 'Eduarda';
  const userName = 'Eduarda Alves';

  const [posts, setPosts] = useStateA(INITIAL_POSTS);
  const [collections, setCollections] = useStateA(COLLECTIONS_LIST);
  const [campaigns, setCampaigns] = useStateA(CAMPAIGNS_LIST);
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
  if (view === 'branding') shownPosts = posts.filter((p) => p.tags?.includes('branding'));
  if (view === 'mh') shownPosts = posts.filter((p) => p.tags?.includes('mh'));
  if (platformFilter !== 'all') shownPosts = shownPosts.filter((p) => p.platform === platformFilter);
  if (tagFilter !== 'all') shownPosts = shownPosts.filter((p) => p.tags?.includes(tagFilter));
  if (search.trim()) {
    const q = search.toLowerCase();
    shownPosts = shownPosts.filter((p) => p.title.toLowerCase().includes(q) || p.owner.toLowerCase().includes(q));
  }

  const monthPosts = posts.filter((p) => {
    const d = parseISO(p.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const goPrev = () => {
    if (calMode === 'week') {setWeekStart((w) => addDaysISO(w, -7));return;}
    if (month === 0) {setMonth(11);setYear((y) => y - 1);} else setMonth((m) => m - 1);
  };
  const goNext = () => {
    if (calMode === 'week') {setWeekStart((w) => addDaysISO(w, 7));return;}
    if (month === 11) {setMonth(0);setYear((y) => y + 1);} else setMonth((m) => m + 1);
  };
  const goToday = () => {
    const t = parseISO(today);
    setYear(t.getFullYear());setMonth(t.getMonth());
    setWeekStart(startOfWeekISO(today));
  };

  const weekLabel = (() => {
    if (calMode !== 'week') return null;
    const s = parseISO(weekStart);
    const e = parseISO(addDaysISO(weekStart, 6));
    if (s.getMonth() === e.getMonth())
    return `${s.getDate()} – ${e.getDate()} ${MONTHS[s.getMonth()]} ${s.getFullYear()}`;
    return `${s.getDate()} ${MONTHS[s.getMonth()].slice(0, 3)} – ${e.getDate()} ${MONTHS[e.getMonth()].slice(0, 3)} ${e.getFullYear()}`;
  })();

  const savePost = (p) => setPosts((arr) => arr.map((x) => x.id === p.id ? p : x));
  const deletePost = (p) => setPosts((arr) => arr.filter((x) => x.id !== p.id));

  const createPost = (defaults) => {
    const nextId = posts.reduce((m, p) => Math.max(m, p.id), 0) + 1;
    const newPost = {
      id: nextId, title: '', owner: ownerName, platform: 'ig',
      date: defaults.date ?? today, time: '12:00', status: 'prod',
      complexity: 3, type: 'Reels', tags: [], linha: 'produtos',
      campanha: null, link: '', ref: '', notes: '', ...defaults
    };
    setPosts((arr) => [...arr, newPost]);
    setActivePost(newPost);
  };

  const duplicateToPlatform = (newPlatform) => {
    if (!duplicateFor) return;
    const nextId = posts.reduce((m, p) => Math.max(m, p.id), 0) + 1;
    const newPost = { ...duplicateFor, id: nextId, platform: newPlatform, status: 'prod' };
    if (newPlatform === 'ig' && !CONTENT_TYPES_IG.includes(newPost.type)) newPost.type = 'Reels';
    if (newPlatform !== 'ig' && !CONTENT_TYPES_OTHER.includes(newPost.type)) newPost.type = 'Vídeo';
    setPosts((arr) => [...arr, newPost]);
    setDuplicateFor(null);
    setActivePost(newPost);
  };

  /* ─── Coleções × Campanhas linking ─── */
  const linkColCamp = (collectionId, campaignId) => {
    setCollections((arr) => arr.map((c) => {
      if (c.id === collectionId) return { ...c, campaignId };
      if (c.campaignId === campaignId) return { ...c, campaignId: null };
      return c;
    }));
    setCampaigns((arr) => arr.map((c) => {
      if (c.id === campaignId) return { ...c, colecaoId: collectionId };
      if (c.colecaoId === collectionId) return { ...c, colecaoId: null };
      return c;
    }));
  };
  const unlinkColCamp = (collectionId, campaignId) => {
    setCollections((arr) => arr.map((c) => c.id === collectionId ? { ...c, campaignId: null } : c));
    setCampaigns((arr) => arr.map((c) => c.id === campaignId ? { ...c, colecaoId: null } : c));
  };

  const createCampaignFromCollection = (collection) => {
    const id = campaigns.reduce((m, c) => Math.max(m, c.id), 0) + 1;
    const slug = collection.nome.toLowerCase().
    normalize('NFD').replace(/[\u0300-\u036f]/g, '').
    replace(/[^a-z0-9]+/g, '-').slice(0, 20);
    const newCamp = {
      id, slug, nome: collection.nome,
      pack: collection.marketing.pack, dono: collection.marketing.dono,
      tipo: 'Coleção', mes: collection.mes || '',
      dataInsta: collection.dataMarketing || todayISO(),
      dataSite: collection.dataSite || '-',
      dataComercial: '-', dataFinal: '',
      previsao: collection.dataSite || todayISO(),
      launched: collection.launched, progresso: 0,
      brainstormDate: '', brainstormDone: false,
      aprovComercialDate: '', aprovComercialDone: false,
      shootingDate: '', shootingDone: false,
      colecaoId: collection.id
    };
    setCampaigns((arr) => [...arr, newCamp]);
    setCollections((arr) => arr.map((c) => c.id === collection.id ? { ...c, campaignId: id } : c));
    return newCamp;
  };

  const createCollectionFromCampaign = (campaign) => {
    const id = collections.reduce((m, c) => Math.max(m, c.id), 0) + 1;
    const newCol = {
      id, nome: campaign.nome,
      tipo: campaign.tipo === 'Coleção' ? 'autoral' : 'autoral',
      mes: campaign.mes || '',
      dataSite: campaign.dataSite && campaign.dataSite !== '-' ? campaign.dataSite : campaign.previsao || todayISO(),
      dataMarketing: campaign.dataInsta || todayISO(),
      confirmado: 'ok', launched: campaign.launched,
      ilustra: { status: 'naoIniciada', criacao: false, adaptacao: false, aprovEnabled: false, aprov: false, cadastro: false },
      marketing: { status: 'naoIniciada', pack: campaign.pack, dono: campaign.dono,
        banner: false,
        pedidoEnabled: false, pedido: false,
        loadingEnabled: false, loading: false,
        postEnabled: false, post: false,
        carrosselEnabled: false, carrossel: false,
        reelsEnabled: false, reels: false,
        trincaEnabled: false, trinca: false,
        shootingEnabled: false, shooting: false,
        storiesEnabled: false, stories: false,
        influsEnabled: false, influs: false },
      campaignId: campaign.id
    };
    setCollections((arr) => [...arr, newCol]);
    setCampaigns((arr) => arr.map((c) => c.id === campaign.id ? { ...c, colecaoId: id } : c));
    return newCol;
  };

  /* Shared "launched" — toggling either side mirrors */
  const setCollectionLaunched = (collectionId, launched) => {
    const col = collections.find((c) => c.id === collectionId);
    setCollections((arr) => arr.map((c) => c.id === collectionId ? { ...c, launched } : c));
    if (col?.campaignId != null) {
      setCampaigns((arr) => arr.map((c) => c.id === col.campaignId ? { ...c, launched } : c));
    }
  };
  const setCampaignLaunched = (campaignId, launched) => {
    const cmp = campaigns.find((c) => c.id === campaignId);
    setCampaigns((arr) => arr.map((c) => c.id === campaignId ? { ...c, launched } : c));
    if (cmp?.colecaoId != null) {
      setCollections((arr) => arr.map((c) => c.id === cmp.colecaoId ? { ...c, launched } : c));
    }
  };

  const linking = {
    collections, campaigns, setCollections, setCampaigns,
    linkColCamp, unlinkColCamp,
    createCampaignFromCollection, createCollectionFromCampaign,
    setCollectionLaunched, setCampaignLaunched
  };

  const meProfile = TEAM_PROFILES.find((p) => p.id === meId);
  const meInitial = meProfile?.initial ?? ownerName.charAt(0).toUpperCase();

  const viewTitles = {
    calendar: { title: 'Calendário', sub: 'Todos os canais' },
    stories: { title: 'Stories', sub: 'Calendário · Lista · Performance' },
    branding: { title: 'Branding', sub: 'Posts com tag Branding' },
    mh: { title: 'Máquina de Hits', sub: 'Posts MH' },
    comemorativas: { title: 'Datas comemorativas', sub: 'Pauta anual' },
    futebol: { title: 'Futebol 2026', sub: 'Calendário esportivo' },
    campaigns: { title: 'Campanhas', sub: 'Controle e cronograma' },
    collections: { title: 'Coleções', sub: 'Ilustra · Marketing' },
    profile: { title: 'Perfil', sub: profileId === meId ? 'Seu perfil' : 'Equipe' }
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
          <img src="brand-header.svg" alt="SocialHub" className="sb-brand-logo" style={{ objectFit: "cover", padding: "0px", height: "47px", width: "200px" }} />
        </div>

        <div className="sb-section">
          <div className="sb-label">Calendários</div>
          {[
          { id: 'calendar', label: 'Calendário do mês', icon: <Icon.cal />, count: monthPosts.length },
          { id: 'stories', label: 'Stories', icon: <Icon.stories /> },
          { id: 'branding', label: 'Branding', icon: <Icon.branding />, count: posts.filter((p) => p.tags?.includes('branding')).length },
          { id: 'mh', label: 'Máquina de Hits', icon: <Icon.mh />, count: posts.filter((p) => p.tags?.includes('mh')).length }].
          map((item) =>
          <button key={item.id} className={`sb-item ${view === item.id ? 'active' : ''}`} onClick={() => setView(item.id)}>
              {item.icon} <span>{item.label}</span>
              <span className="sb-count" style={{ width: "21px", height: "19px" }}>{item.count}</span>
            </button>
          )}
        </div>

        <div className="sb-section">
          <div className="sb-label">Planejamento</div>
          {[
          { id: 'comemorativas', label: 'Datas comemorativas', icon: <Icon.events /> },
          { id: 'futebol', label: 'Futebol 2026', icon: <Icon.ball /> },
          { id: 'campaigns', label: 'Campanhas', icon: <Icon.campaign />, count: campaigns.length },
          { id: 'collections', label: 'Coleções', icon: <Icon.collections />, count: collections.length }].
          map((item) =>
          <button key={item.id} className={`sb-item ${view === item.id ? 'active' : ''}`} onClick={() => setView(item.id)}>
              {item.icon} <span>{item.label}</span>
              {'count' in item && <span className="sb-count">{item.count}</span>}
            </button>
          )}
        </div>

        <div className={`sb-user ${view === 'profile' ? 'active' : ''}`}
        onClick={() => {setView('profile');setProfileId(meId);}}
        title="Abrir meu perfil">
          {photos[meId] ?
          <img src={photos[meId]} alt={userName} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flex: '0 0 34px' }} /> :

          <div className="sb-avatar">{meInitial}</div>
          }
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

          {isCalView &&
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
          }

          <div className="tb-spacer" />

          {isCalView &&
          <div className="search-box">
              <Icon.search />
              <input placeholder="Buscar posts..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          }

          {view !== 'stories' &&
          <button className="btn btn-accent" onClick={() => createPost({})}>
            <Icon.plus /> Novo post
          </button>
          }

          <button className="btn btn-ghost" title="Sair" style={{ padding: '9px 12px' }}>
            <Icon.logout />
          </button>
        </div>

        {isCalView &&
        <div className="filter-bar">
            <button className={`platform-pill ${platformFilter === 'all' ? 'active' : ''}`} onClick={() => setPlatformFilter('all')}>
              Todas as redes
            </button>
            {PLATFORMS.map((p) =>
          <button key={p.id} className={`platform-pill ${platformFilter === p.id ? 'active' : ''}`} onClick={() => setPlatformFilter(p.id)}>
                <span style={{ width: 14, height: 14, borderRadius: 4, background: p.color, display: 'grid', placeItems: 'center' }}>
                  <PlatformIcon platform={p.id} size={9} color="white" />
                </span>
                {p.label}
              </button>
          )}

            {view === 'calendar' &&
          <React.Fragment>
                <div style={{ width: 1, height: 18, background: 'var(--line)', margin: '0 8px' }} />
                <button className={`tag-chip ${tagFilter === 'all' ? 'active' : ''}`} onClick={() => setTagFilter('all')}>Todas tags</button>
                {TAGS.map((t) =>
            <button key={t.id} className={`tag-chip ${tagFilter === t.id ? 'active' : ''}`} onClick={() => setTagFilter(t.id)}>{t.label}</button>
            )}
              </React.Fragment>
          }

            <div style={{ flex: 1 }} />
            <span className="count-pill">
              {shownPosts.filter((p) => {
              const d = parseISO(p.date);
              return d.getFullYear() === year && d.getMonth() === month;
            }).length} posts neste mês
            </span>
          </div>
        }

        {isCalView &&
        <div className="cal-wrap">
            {calMode === 'month' ?
          <CalendarGrid year={year} month={month} posts={shownPosts}
          events={calEvents} onPostClick={setActivePost}
          onNewPost={(date) => createPost({ date })} /> :

          <WeekView weekStart={weekStart} posts={shownPosts} onPostClick={setActivePost} />
          }
          </div>
        }

        {view === 'stories' && <StoriesView />}
        {view === 'comemorativas' && <ComemorativasView />}
        {view === 'futebol' && <FutebolView />}
        {view === 'campaigns' && <CampaignsView posts={posts} onPostClick={setActivePost} linking={linking} onNavigateCollection={(id) => {setView('collections');setTimeout(() => window.dispatchEvent(new CustomEvent('focusCollection', { detail: id })), 0);}} />}
        {view === 'collections' && <CollectionsView linking={linking} onNavigateCampaign={(id) => {setView('campaigns');setTimeout(() => window.dispatchEvent(new CustomEvent('focusCampaign', { detail: id })), 0);}} />}
        {view === 'profile' &&
        <ProfileView posts={posts} profileId={profileId} meId={meId}
        onSelectProfile={setProfileId} onPostClick={setActivePost}
        photos={photos}
        onSetPhoto={(id, url) => setPhotos((p) => ({ ...p, [id]: url }))} />
        }
      </main>

      {activePost &&
      <PostModal post={activePost} onClose={() => setActivePost(null)}
      onSave={savePost} onDelete={deletePost}
      onDuplicate={(p) => setDuplicateFor(p)}
      showProduct={view === 'mh' || activePost.product !== undefined} />
      }

      {duplicateFor &&
      <DuplicateMenu post={duplicateFor} onClose={() => setDuplicateFor(null)} onDuplicate={duplicateToPlatform} />
      }
    </div>);

}

ReactDOM.createRoot(document.getElementById('root')).render(<SocialHubApp />);