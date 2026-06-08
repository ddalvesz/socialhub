// ============ PROFILE VIEW ============
const { useState, useRef } = React;
const { parseISO, fmtBR } = window;

const monthAbbrPt = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];

function ProfileAvatar({ profile, size = 80, photo, onPickPhoto, editable = false }) {
  const ref = useRef(null);
  return (
    <div className="profile-avatar-wrap" style={{ width: size, height: size }}>
      {photo ? (
        <img src={photo} alt={profile.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
      ) : (
        <div className="profile-avatar" style={{
          width: "100%", height: "100%",
          background: `linear-gradient(135deg, ${profile.color}, color-mix(in oklab, ${profile.color}, black 15%))`,
          fontSize: size * 0.4,
        }}>
          {profile.initial}
        </div>
      )}
      {editable && (
        <>
          <button className="profile-avatar-edit" onClick={() => ref.current?.click()} title="Trocar foto">
            <Icon.camera />
          </button>
          <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
            const f = e.target.files?.[0];
            if (!f) return;
            const reader = new FileReader();
            reader.onload = () => onPickPhoto(reader.result);
            reader.readAsDataURL(f);
          }} />
        </>
      )}
    </div>
  );
}

function ProfileStats({ posts, profile }) {
  const mine = posts.filter(p => p.owner === profile.id);
  const counts = {
    total: mine.length,
    prod: mine.filter(p => p.status === "prod").length,
    sched: mine.filter(p => p.status === "sched").length,
    pub: mine.filter(p => p.status === "pub").length,
  };
  return (
    <div className="profile-stats">
      <div className="stat">
        <div className="stat-n">{counts.total}</div>
        <div className="stat-l">Posts atribuídos</div>
      </div>
      <div className="stat">
        <div className="stat-n" style={{ color: "var(--s-prod)" }}>{counts.prod}</div>
        <div className="stat-l">Em produção</div>
      </div>
      <div className="stat">
        <div className="stat-n" style={{ color: "var(--s-sched)" }}>{counts.sched}</div>
        <div className="stat-l">Agendados</div>
      </div>
      <div className="stat">
        <div className="stat-n" style={{ color: "var(--s-pub)" }}>{counts.pub}</div>
        <div className="stat-l">Publicados</div>
      </div>
    </div>
  );
}

function ActivitiesList({ posts, profile, onPostClick }) {
  const [statusFilter, setStatusFilter] = useState("all");
  let mine = posts.filter(p => p.owner === profile.id);
  if (statusFilter !== "all") mine = mine.filter(p => p.status === statusFilter);
  mine.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        <button className={`tag-chip ${statusFilter === "all" ? "active" : ""}`} onClick={() => setStatusFilter("all")}>Todos</button>
        {SH_DATA.STATUSES.map(s => (
          <button key={s.id} className={`tag-chip ${statusFilter === s.id ? "active" : ""}`} onClick={() => setStatusFilter(s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      {mine.length === 0 ? (
        <div className="drawer-empty" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: 60 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink-2)", marginBottom: 4 }}>
            Nenhuma atividade aqui
          </div>
          <div style={{ fontSize: 13 }}>
            {profile.isMe ? "Você não tem posts" : `${profile.name} não tem posts`} com esse status.
          </div>
        </div>
      ) : (
        <div className="activity-list">
          {mine.map(p => {
            const plat = SH_DATA.PLATFORMS.find(x => x.id === p.platform);
            const status = SH_DATA.STATUSES.find(s => s.id === p.status);
            const d = parseISO(p.date);
            const isPast = p.date < window.TODAY_STR;
            return (
              <div key={p.id} className="activity-row" onClick={() => onPostClick(p)}>
                <div className="ar-date">
                  <div className="day">{d.getDate()}</div>
                  <div className="month">{monthAbbrPt[d.getMonth()]}</div>
                </div>
                <span className={`lp-platform plat-${p.platform}`} style={{ background: plat.color, width: 28, height: 28, flex: "0 0 28px", borderRadius: 8 }}>
                  <PlatformIcon platform={p.platform} size={14} color="white" />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ar-title">{p.title}</div>
                  <div className="ar-meta">
                    <span>{p.time}</span>
                    <span>·</span>
                    <span>{p.type}</span>
                    {p.campanha && (
                      <>
                        <span>·</span>
                        <span>{SH_DATA.CAMPANHAS.find(c => c.id === p.campanha)?.label || p.campanha}</span>
                      </>
                    )}
                  </div>
                </div>
                <span className={`status-pill ${status.className}`}>
                  <span className="sdot"></span>{status.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TeamGrid({ posts, profiles, onSelect, currentId }) {
  return (
    <div className="team-grid">
      {profiles.map(p => {
        const count = posts.filter(x => x.owner === p.id).length;
        const photo = window.SH_PHOTOS?.[p.id];
        return (
          <button key={p.id} className={`team-card ${p.id === currentId ? "current" : ""}`} onClick={() => onSelect(p.id)}>
            <ProfileAvatar profile={p} photo={photo} size={56} />
            <div style={{ marginTop: 14 }}>
              <div className="tc-name">{p.name}{p.isMe ? <span className="me-tag">você</span> : null}</div>
              <div className="tc-role">{p.role}</div>
            </div>
            <div className="tc-stat">
              <span className="n">{count}</span>
              <span>posts atribuídos</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ProfileView({ posts, profileId, onSelectProfile, onPostClick, photos, onSetPhoto }) {
  const profile = SH_DATA.TEAM_PROFILES.find(p => p.id === profileId) || SH_DATA.TEAM_PROFILES.find(p => p.isMe);
  const [tab, setTab] = useState("activities"); // activities | team
  const isMe = profile.isMe;
  const photo = photos[profile.id];

  return (
    <div className="profile-wrap">
      <div className="profile-hero">
        {!isMe && (
          <button className="btn btn-ghost" style={{ marginBottom: 16 }} onClick={() => onSelectProfile("Lu")}>
            <Icon.chevL /> Voltar ao meu perfil
          </button>
        )}
        <div className="profile-hero-card">
          <ProfileAvatar profile={profile} size={96} photo={photo} editable={isMe} onPickPhoto={(d) => onSetPhoto(profile.id, d)} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="ph-name">{profile.name}{isMe && <span className="me-tag">você</span>}</div>
            <div className="ph-role">{profile.role}</div>
            <div className="ph-meta">
              <span><Icon.mail /> {profile.email}</span>
              <span><Icon.cal /> Na equipe desde {fmtBR(profile.joined)}</span>
            </div>
          </div>
          {isMe && (
            <button className="btn btn-ghost">
              <Icon.settings /> Editar perfil
            </button>
          )}
        </div>

        <ProfileStats posts={posts} profile={profile} />
      </div>

      <div className="profile-tabs">
        <button className={tab === "activities" ? "active" : ""} onClick={() => setTab("activities")}>
          Atividades atribuídas
        </button>
        {isMe && (
          <button className={tab === "team" ? "active" : ""} onClick={() => setTab("team")}>
            Equipe
          </button>
        )}
      </div>

      <div className="profile-content">
        {tab === "activities" && (
          <ActivitiesList posts={posts} profile={profile} onPostClick={onPostClick} />
        )}
        {tab === "team" && isMe && (
          <TeamGrid posts={posts} profiles={SH_DATA.TEAM_PROFILES} onSelect={onSelectProfile} currentId={profile.id} />
        )}
      </div>
    </div>
  );
}

window.ProfileView = ProfileView;
window.ProfileAvatar = ProfileAvatar;
