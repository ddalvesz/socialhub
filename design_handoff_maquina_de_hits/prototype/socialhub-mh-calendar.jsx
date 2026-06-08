/* ============================================================
   MH Calendar — month grid that expands each MH post into 2 cards
   (IG on primary date + TT on repost date), with a small indicator
   showing the IG↔TT link and the creator initial.
   ============================================================ */
const { useMemo: useMemoMC } = React;

function MHPostCard({ post, onClick }) {
  const isMH = !!post.mh;
  const side = post._mhSide;  // 'ig' | 'tt'
  const c = post.mh ? CREATORS_BY_ID[post.mh.creator] : null;
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
      {c && (
        <span
          className="pc-mh-creator"
          style={{ color: c.color, fontWeight: 700 }}
          title={`${c.name} · ${semanaLabel(post.mh.semanaCreator)}`}>
          {c.initial}
        </span>
      )}
      {isMH && post._mhHasMate && (
        <span className={`pc-mh-side ${side === 'tt' ? 'tt' : ''}`} title="Mesmo vídeo em IG+TT">
          {side === 'ig' ? '↗TT' : 'IG↗'}
        </span>
      )}
    </button>
  );
}

function MHCalendarGrid({ year, month, posts, onPostClick, onNewPost, maxPerCell = 3 }) {
  const cells = useMemoMC(() => buildMonthGrid(year, month), [year, month]);
  const today = todayISO();

  // Expand MH posts before grouping by day
  const expanded = useMemoMC(() => expandMHForCalendar(posts), [posts]);

  const postsByDay = useMemoMC(() => {
    const map = {};
    expanded.forEach(p => { (map[p.date] = map[p.date] || []).push(p); });
    Object.keys(map).forEach(k => map[k].sort((a, b) => a.time.localeCompare(b.time)));
    return map;
  }, [expanded]);

  return (
    <div className="cal-grid">
      {WEEKDAYS.map(w => <div key={w} className="cal-head">{w}</div>)}
      {cells.map((c, i) => {
        const isToday = c.iso === today;
        const dayPosts = postsByDay[c.iso] || [];
        const visible = dayPosts.slice(0, maxPerCell);
        const more = dayPosts.length - visible.length;
        return (
          <div
            key={i}
            className={`cal-cell ${c.other ? 'other' : ''} ${isToday ? 'today' : ''}`}
            onClick={() => !c.other && onNewPost?.(c.iso)}>
            <div className="cal-num-row">
              <span className="cal-num-box">{c.day}</span>
            </div>
            {visible.map(p => {
              // For expanded TT-side posts, find the original post for the modal click
              const origPostId = p._origId !== undefined ? p._origId : p.id;
              return (
                <div key={p.id} onClick={e => e.stopPropagation()}>
                  <MHPostCard
                    post={p}
                    onClick={() => {
                      const orig = posts.find(x => x.id === origPostId) || p;
                      onPostClick(orig);
                    }} />
                </div>
              );
            })}
            {more > 0 && <div className="cal-more" onClick={e => e.stopPropagation()}>+{more} mais</div>}
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { MHCalendarGrid, MHPostCard });
