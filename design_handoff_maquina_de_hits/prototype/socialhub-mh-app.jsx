/* ============================================================
   SocialHubAppMH — MH-aware shell
   Same structure as SocialHubApp + Creators sidebar section,
   Pautas view, creator profile, and MH-specific calendar/modal.
   ============================================================ */
const { useState: useStateAM } = React;

function SocialHubAppMH() {
  const meId = 'Eduarda';
  const ownerName = 'Eduarda';
  const userName = 'Eduarda Alves';

  const [posts, setPosts] = useStateAM(INITIAL_POSTS_MH);
  const [collections, setCollections] = useStateAM(COLLECTIONS_LIST);
  const [campaigns, setCampaigns] = useStateAM(CAMPAIGNS_LIST);
  const [view, setView] = useStateAM('mh');  // default to MH for prototype
  const [mhMode, setMhMode] = useStateAM('pautas');  // 'month' | 'pautas'
  const [creatorFilter, setCreatorFilter] = useStateAM('all');
  const [activeCreator, setActiveCreator] = useStateAM(null);

  const today = todayISO();
  const todayDate = parseISO(today);
  const [year, setYear] = useStateAM(todayDate.getFullYear());
  const [month, setMonth] = useStateAM(todayDate.getMonth());
  const [calMode, setCalMode] = useStateAM('month');
  const [weekStart, setWeekStart] = useStateAM(() => startOfWeekISO(today));

  const [platformFilter, setPlatformFilter] = useStateAM('all');
  const [tagFilter, setTagFilter] = useStateAM('all');
  const [search, setSearch] = useStateAM('');

  const [activePost, setActivePost] = useStateAM(null);
  const [duplicateFor, setDuplicateFor] = useStateAM(null);
  const [profileId, setProfileId] = useStateAM(meId);
  const [photos, setPhotos] = useStateAM({});

  /* Batch pauta modal state + last simulated sync result */
  const [batchOpen, setBatchOpen] = useStateAM(false);
  const [lastSyncResult, setLastSyncResult] = useStateAM(null);

  let shownPosts = posts;
  if (view === 'branding') shownPosts = posts.filter(p => p.tags?.includes('branding'));
  if (view === 'mh') {
    shownPosts = posts.filter(p => p.tags?.includes('mh'));
    if (creatorFilter !== 'all') {
      shownPosts = shownPosts.filter(p => p.mh?.creator === creatorFilter);
    }
  }
  if (platformFilter !== 'all') shownPosts = shownPosts.filter(p => p.platform === platformFilter);
  if (tagFilter !== 'all') shownPosts = shownPosts.filter(p => p.tags?.includes(tagFilter));
  if (search.trim()) {
    const q = search.toLowerCase();
    shownPosts = shownPosts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.owner.toLowerCase().includes(q) ||
      (p.product || '').toLowerCase().includes(q)
    );
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
    return `${s.getDate()} ${MONTHS[s.getMonth()].slice(0, 3)} – ${e.getDate()} ${MONTHS[e.getMonth()].slice(0, 3)} ${e.getFullYear()}`;
  })();

  const savePost = (p) => setPosts(arr => arr.map(x => x.id === p.id ? p : x));
  const deletePost = (p) => setPosts(arr => arr.filter(x => x.id !== p.id));

  const createPost = (defaults) => {
    const nextId = posts.reduce((m, p) => Math.max(m, p.id), 0) + 1;
    const isMH = view === 'mh';
    const newPost = {
      id: nextId, title: '', owner: ownerName, platform: 'ig',
      date: defaults.date ?? today, time: '12:00', status: isMH ? 'pauta' : 'prod',
      complexity: 2, type: 'Reels', tags: isMH ? ['mh'] : [], linha: 'trends',
      campanha: null, product: '', link: '', ref: '', notes: '',
      ...defaults
    };
    if (isMH) {
      const cId = 'CARINA';
      newPost.mh = {
        creator: cId,
        semanaCreator: CREATORS_BY_ID[cId].semanaAtual,
        numVideo: 1,
        audio: '',
        prazo: today,
        dropboxLink: '',
        briefingFile: `/Creators/${CREATORS_BY_ID[cId].name}/pautas-semana-${CREATORS_BY_ID[cId].semanaAtual}.txt`,
        repostTT: null,
      };
    }
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

  /* Batch pauta creation + simulated Dropbox sync (Fases 6 + 7 + 8) */
  const handleBatchCreated = (newPosts, meta) => {
    setPosts(arr => [...arr, ...newPosts]);
    // In a real implementation the briefing .txt would be uploaded to Dropbox.
    // Here we just log it for inspection.
    console.log('[MH] briefing escrito em', meta.briefingPath);
    console.log(meta.briefingTxt);
  };

  const handleSimulateSync = () => {
    // Find MH posts currently "Em pauta" with a prazo in the past or today;
    // pretend the Dropbox sync detected their files and flips them to "Entregue".
    const todayIso = todayISO();
    let flipped = 0;
    setPosts(arr => arr.map(p => {
      if (!p.mh) return p;
      if (p.status !== 'pauta') return p;
      if ((p.mh.prazo || '9999') <= todayIso) {
        flipped++;
        return {
          ...p,
          status: 'entregue',
          mh: { ...p.mh, dropboxLink: p.mh.dropboxLink || `${CREATORS_BY_ID[p.mh.creator].dropboxPath}/SEMANA ${p.mh.semanaCreator}/` }
        };
      }
      return p;
    }));
    setLastSyncResult({ found: flipped });
    setTimeout(() => setLastSyncResult(null), 6000);
  };

  /* Coleções × Campanhas linking (untouched) */
  const linkColCamp = (collectionId, campaignId) => {
    setCollections(arr => arr.map(c => {
      if (c.id === collectionId) return { ...c, campaignId };
      if (c.campaignId === campaignId) return { ...c, campaignId: null };
      return c;
    }));
    setCampaigns(arr => arr.map(c => {
      if (c.id === campaignId) return { ...c, colecaoId: collectionId };
      if (c.colecaoId === collectionId) return { ...c, colecaoId: null };
      return c;
    }));
  };
  const unlinkColCamp = (collectionId, campaignId) => {
    setCollections(arr => arr.map(c => c.id === collectionId ? { ...c, campaignId: null } : c));
    setCampaigns(arr => arr.map(c => c.id === campaignId ? { ...c, colecaoId: null } : c));
  };
  const setCollectionLaunched = (id, launched) => {
    setCollections(arr => arr.map(c => c.id === id ? { ...c, launched } : c));
  };
  const setCampaignLaunched = (id, launched) => {
    setCampaigns(arr => arr.map(c => c.id === id ? { ...c, launched } : c));
  };
  const linking = {
    collections, campaigns, setCollections, setCampaigns,
    linkColCamp, unlinkColCamp,
    createCampaignFromCollection: () => null,
    createCollectionFromCampaign: () => null,
    setCollectionLaunched, setCampaignLaunched
  };

  const meProfile = TEAM_PROFILES.find(p => p.id === meId);
  const meInitial = meProfile?.initial ?? ownerName.charAt(0).toUpperCase();

  const viewTitles = {
    calendar: { title: 'Calendário', sub: 'Todos os canais' },
    stories: { title: 'Stories', sub: 'Calendário · Lista · Performance' },
    branding: { title: 'Branding', sub: 'Posts com tag Branding' },
    mh: { title: 'Máquina de Hits', sub: mhMode === 'pautas' ? 'Pautas por semana do creator' : 'Calendário · IG + TikTok' },
    comemorativas: { title: 'Datas comemorativas', sub: 'Pauta anual' },
    futebol: { title: 'Futebol 2026', sub: 'Calendário esportivo' },
    campaigns: { title: 'Campanhas', sub: 'Controle e cronograma' },
    collections: { title: 'Coleções', sub: 'Ilustra · Marketing' },
    profile: { title: 'Perfil', sub: profileId === meId ? 'Seu perfil' : 'Equipe' },
    creator: { title: CREATORS_BY_ID[activeCreator]?.name || 'Creator', sub: 'Creator contratada · MH' }
  };
  const { title, sub } = viewTitles[view] || { title: '', sub: '' };
  const isCalView = (view === 'calendar' || view === 'branding') ||
                    (view === 'mh' && mhMode === 'month');
  const calEvents = view === 'calendar' ? [...COMEMORATIVAS, ...FUTEBOL_2026] : [];
  const navLabel = calMode === 'week' ? weekLabel : `${MONTHS[month]} ${year}`;

  // Modal selection: use MH modal for MH posts (has .mh payload)
  const showMHModal = activePost?.mh;

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
            { id: 'branding', label: 'Branding', icon: <Icon.branding />, count: posts.filter(p => p.tags?.includes('branding')).length },
            { id: 'mh', label: 'Máquina de Hits', icon: <Icon.mh />, count: posts.filter(p => p.tags?.includes('mh')).length }
          ].map(item => (
            <button
              key={item.id}
              className={`sb-item ${view === item.id ? 'active' : ''}`}
              onClick={() => { setView(item.id); setActiveCreator(null); }}>
              {item.icon} <span>{item.label}</span>
              {'count' in item && <span className="sb-count" style={{ width: 21, height: 19 }}>{item.count}</span>}
            </button>
          ))}
        </div>

        <div className="sb-section">
          <div className="sb-label">Creators</div>
          {CREATORS.map(c => {
            const isActive = view === 'creator' && activeCreator === c.id;
            return (
              <button
                key={c.id}
                className={`sb-creator ${isActive ? 'active' : ''}`}
                onClick={() => { setView('creator'); setActiveCreator(c.id); }}>
                <span className="sb-creator-avatar" style={{ background: c.color }}>{c.initial}</span>
                <span>{c.name}</span>
                <span className="sb-creator-sem">{semanaLabel(c.semanaAtual)}</span>
              </button>
            );
          })}
        </div>

        <div className="sb-section">
          <div className="sb-label">Planejamento</div>
          {[
            { id: 'comemorativas', label: 'Datas comemorativas', icon: <Icon.events /> },
            { id: 'futebol', label: 'Futebol 2026', icon: <Icon.ball /> },
            { id: 'campaigns', label: 'Campanhas', icon: <Icon.campaign />, count: campaigns.length },
            { id: 'collections', label: 'Coleções', icon: <Icon.collections />, count: collections.length }
          ].map(item => (
            <button
              key={item.id}
              className={`sb-item ${view === item.id ? 'active' : ''}`}
              onClick={() => { setView(item.id); setActiveCreator(null); }}>
              {item.icon} <span>{item.label}</span>
              {'count' in item && <span className="sb-count">{item.count}</span>}
            </button>
          ))}
        </div>

        <div
          className={`sb-user ${view === 'profile' ? 'active' : ''}`}
          onClick={() => { setView('profile'); setProfileId(meId); setActiveCreator(null); }}
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

          {/* Calendar nav controls for normal calendar views */}
          {isCalView && (
            <React.Fragment>
              <div className="month-nav" style={{ marginLeft: 8 }}>
                <button onClick={goPrev}><Icon.chevL /></button>
                <div className="label">{navLabel}</div>
                <button onClick={goNext}><Icon.chevR /></button>
              </div>
              <button className="today-btn" onClick={goToday}>Hoje</button>
              {view !== 'mh' && (
                <div className="view-toggle" style={{ marginLeft: 4 }}>
                  <button className={calMode === 'month' ? 'active' : ''} onClick={() => setCalMode('month')}>Mês</button>
                  <button className={calMode === 'week' ? 'active' : ''} onClick={() => setCalMode('week')}>Semana</button>
                </div>
              )}
            </React.Fragment>
          )}

          {/* MH-specific mode toggle: Pautas | Calendário */}
          {view === 'mh' && (
            <div className="view-toggle" style={{ marginLeft: 8 }}>
              <button className={mhMode === 'pautas' ? 'active' : ''} onClick={() => setMhMode('pautas')}>Pautas</button>
              <button className={mhMode === 'month' ? 'active' : ''} onClick={() => setMhMode('month')}>Calendário</button>
            </div>
          )}

          <div className="tb-spacer" />

          {(isCalView || view === 'mh') && (
            <div className="search-box">
              <Icon.search />
              <input placeholder={view === 'mh' ? 'Buscar pauta...' : 'Buscar posts...'} value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          )}

          {view !== 'stories' && view !== 'creator' && (
            <button className="btn btn-accent" onClick={() => createPost({})}>
              <Icon.plus /> {view === 'mh' ? 'Novo vídeo MH' : 'Novo post'}
            </button>
          )}

          <button className="btn btn-ghost" title="Sair" style={{ padding: '9px 12px' }}>
            <Icon.logout />
          </button>
        </div>

        {/* Filter bar — only for regular calendar views */}
        {isCalView && view !== 'mh' && (
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

        {/* Calendar bodies */}
        {isCalView && view !== 'mh' && (
          <div className="cal-wrap">
            {calMode === 'month' ? (
              <CalendarGrid
                year={year} month={month} posts={shownPosts}
                events={calEvents} onPostClick={setActivePost}
                onNewPost={date => createPost({ date })} />
            ) : (
              <WeekView weekStart={weekStart} posts={shownPosts} onPostClick={setActivePost} />
            )}
          </div>
        )}

        {/* MH views */}
        {view === 'mh' && mhMode === 'pautas' && (
          <PautasView
            posts={shownPosts}
            onPostClick={setActivePost}
            creatorFilter={creatorFilter}
            onCreatorFilterChange={setCreatorFilter}
            onSelectCreator={cId => { setView('creator'); setActiveCreator(cId); }}
            onCreatePauta={() => setBatchOpen(true)}
            onSimulateSync={handleSimulateSync}
            lastSyncResult={lastSyncResult} />
        )}
        {view === 'mh' && mhMode === 'month' && (
          <div className="cal-wrap">
            <MHCalendarGrid
              year={year} month={month} posts={shownPosts}
              onPostClick={setActivePost}
              onNewPost={date => createPost({ date })} />
          </div>
        )}

        {/* Creator profile */}
        {view === 'creator' && activeCreator && (
          <CreatorProfileView
            creatorId={activeCreator}
            posts={posts}
            onBack={() => { setView('mh'); setMhMode('pautas'); }}
            onPostClick={setActivePost} />
        )}

        {/* Other untouched views */}
        {view === 'stories' && <StoriesView />}
        {view === 'comemorativas' && <ComemorativasView />}
        {view === 'futebol' && <FutebolView />}
        {view === 'campaigns' && (
          <CampaignsView
            posts={posts} onPostClick={setActivePost} linking={linking}
            onNavigateCollection={id => { setView('collections'); setTimeout(() => window.dispatchEvent(new CustomEvent('focusCollection', { detail: id })), 0); }} />
        )}
        {view === 'collections' && (
          <CollectionsView
            linking={linking}
            onNavigateCampaign={id => { setView('campaigns'); setTimeout(() => window.dispatchEvent(new CustomEvent('focusCampaign', { detail: id })), 0); }} />
        )}
        {view === 'profile' && (
          <ProfileView
            posts={posts} profileId={profileId} meId={meId}
            onSelectProfile={setProfileId} onPostClick={setActivePost}
            photos={photos}
            onSetPhoto={(id, url) => setPhotos(p => ({ ...p, [id]: url }))} />
        )}
      </main>

      {activePost && !showMHModal && (
        <PostModal
          post={activePost}
          onClose={() => setActivePost(null)}
          onSave={savePost}
          onDelete={deletePost}
          onDuplicate={p => setDuplicateFor(p)}
          showProduct={activePost.product !== undefined} />
      )}
      {activePost && showMHModal && (
        <PostModalMH
          post={activePost}
          onClose={() => setActivePost(null)}
          onSave={savePost}
          onDelete={deletePost}
          onDuplicate={p => setDuplicateFor(p)} />
      )}

      {duplicateFor && (
        <DuplicateMenu post={duplicateFor} onClose={() => setDuplicateFor(null)} onDuplicate={duplicateToPlatform} />
      )}

      <BatchPautaModal
        open={batchOpen}
        onClose={() => setBatchOpen(false)}
        onCreated={handleBatchCreated}
        initialCreator={creatorFilter !== 'all' ? creatorFilter : 'CARINA'} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<SocialHubAppMH />);
