/* Calendar grid + Week view ported from components/CalendarGrid.tsx + WeekView.tsx */
const { useMemo } = React;

function PostCard({ post, onClick }) {
  return (
    <button
      className={`post-card plat-${post.platform} status-${post.status}`}
      onClick={onClick}
      title={post.title}
    >
      <span className={`pc-icon plat-${post.platform}`}>
        <PlatformIcon platform={post.platform} size={9} color="white" />
      </span>
      <span className="pc-time">{post.time}</span>
      <span className="pc-title">{post.title}</span>
    </button>
  );
}

function CalendarGrid({ year, month, posts, events = [], onPostClick, onNewPost, maxPerCell = 3 }) {
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const today = todayISO();

  const postsByDay = useMemo(() => {
    const map = {};
    posts.forEach(p => { (map[p.date] = map[p.date] || []).push(p); });
    Object.keys(map).forEach(k => map[k].sort((a, b) => a.time.localeCompare(b.time)));
    return map;
  }, [posts]);

  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach(e => {
      const start = 'start' in e ? e.start : e.date;
      const end = 'end' in e ? e.end : e.date;
      const s = parseISO(start);
      const en = parseISO(end);
      for (const d = new Date(s); d <= en; d.setDate(d.getDate() + 1)) {
        const iso = toISO(d.getFullYear(), d.getMonth(), d.getDate());
        (map[iso] = map[iso] || []).push(e);
      }
    });
    return map;
  }, [events]);

  return (
    <div className="cal-grid">
      {WEEKDAYS.map(w => <div key={w} className="cal-head">{w}</div>)}
      {cells.map((c, i) => {
        const isToday = c.iso === today;
        const dayPosts = postsByDay[c.iso] || [];
        const dayEvents = eventsByDay[c.iso] || [];
        const visible = dayPosts.slice(0, maxPerCell);
        const more = dayPosts.length - visible.length;
        const firstEvent = dayEvents[0];
        const firstEventColor = firstEvent
          ? (FUT_TYPES.find(t => t.id === firstEvent.type)?.color ||
             EVENT_TYPES.find(t => t.id === firstEvent.type)?.color || '#999')
          : null;
        return (
          <div key={i}
            className={`cal-cell ${c.other ? 'other' : ''} ${isToday ? 'today' : ''}`}
            onClick={() => !c.other && onNewPost?.(c.iso)}
          >
            <div className="cal-num-row">
              <span className="cal-num-box">{c.day}</span>
              {firstEvent && (
                <span className="cal-event-label" title={dayEvents.map(e => e.name).join(', ')}>
                  <span className="edot" style={{ background: firstEventColor }} />
                  <span className="ev-name">{firstEvent.name}</span>
                  {dayEvents.length > 1 && <span className="ev-more">+{dayEvents.length - 1}</span>}
                </span>
              )}
            </div>
            {visible.map(p => (
              <div key={p.id} onClick={e => e.stopPropagation()}>
                <PostCard post={p} onClick={() => onPostClick(p)} />
              </div>
            ))}
            {more > 0 && <div className="cal-more" onClick={e => e.stopPropagation()}>+{more} mais</div>}
          </div>
        );
      })}
    </div>
  );
}

const WEEK_START_HOUR = 6;
const WEEK_END_HOUR = 24;
const HOUR_HEIGHT = 56;

function WeekView({ weekStart, posts, onPostClick }) {
  const days = Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i));
  const hours = Array.from({ length: WEEK_END_HOUR - WEEK_START_HOUR }, (_, i) => WEEK_START_HOUR + i);
  const today = todayISO();
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowOffset = ((nowMinutes / 60) - WEEK_START_HOUR) * HOUR_HEIGHT;

  const postsByDay = useMemo(() => {
    const map = {};
    days.forEach(d => { map[d] = []; });
    posts.forEach(p => { if (map[p.date] !== undefined) map[p.date].push(p); });
    Object.values(map).forEach(arr => arr.sort((a, b) => a.time.localeCompare(b.time)));
    return map;
  }, [posts, weekStart]);

  return (
    <div className="week-grid">
      <div className="week-head">
        <div className="week-tz">GMT-3</div>
        {days.map(d => {
          const dt = parseISO(d);
          const isToday = d === today;
          return (
            <div key={d} className={`week-day-head ${isToday ? 'today' : ''}`}>
              <div className="wdh-dow">{WEEKDAYS_FULL[dt.getDay()]}</div>
              <div className="wdh-num">{dt.getDate()}</div>
            </div>
          );
        })}
      </div>
      <div className="week-body" style={{ '--hour-h': `${HOUR_HEIGHT}px` }}>
        <div className="week-time-col">
          {hours.map(h => (
            <div key={h} className="week-time-cell">
              {h === WEEK_START_HOUR ? '' : `${pad(h)}:00`}
            </div>
          ))}
        </div>
        {days.map(d => {
          const isToday = d === today;
          const dayPosts = postsByDay[d] || [];
          return (
            <div key={d} className={`week-day-col ${isToday ? 'today' : ''}`}>
              {hours.map(h => <div key={h} className="week-hour-cell" />)}
              {isToday && nowOffset >= 0 && (
                <div className="week-now-line" style={{ top: `${nowOffset}px` }} />
              )}
              {dayPosts.map(p => {
                const [hh, mm] = p.time.split(':').map(Number);
                const top = ((hh + mm / 60) - WEEK_START_HOUR) * HOUR_HEIGHT;
                if (top < 0) return null;
                const height = Math.max(50, 40 + (p.complexity || 1) * 6);
                return (
                  <button key={p.id}
                    className={`week-post plat-${p.platform} status-${p.status}`}
                    style={{ top: `${top}px`, height: `${height}px` }}
                    onClick={() => onPostClick(p)}
                    title={p.title}
                  >
                    <div className="wp-time">
                      <span className="wp-pic"><PlatformIcon platform={p.platform} size={8} color="white" /></span>
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

Object.assign(window, { CalendarGrid, WeekView, PostCard });
