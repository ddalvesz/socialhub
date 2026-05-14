'use client'

import { useMemo } from 'react'
import { PlatformIcon } from './Icons'
import {
  Post, buildMonthGrid, WEEKDAYS, todayISO,
  parseISO, toISO, EventDate, FutebolEvent,
} from '@/lib/types'
import { EVENT_TYPES, FUT_TYPES } from '@/lib/data'

interface Props {
  year: number
  month: number
  posts: Post[]
  events?: (EventDate | FutebolEvent)[]
  onPostClick: (post: Post) => void
  onNewPost?: (date: string) => void
  maxPerCell?: number
}

function PostCard({ post, onClick }: { post: Post; onClick: () => void }) {
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
  )
}

export default function CalendarGrid({
  year, month, posts, events = [], onPostClick, onNewPost, maxPerCell = 3,
}: Props) {
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month])
  const today = todayISO()

  const postsByDay = useMemo(() => {
    const map: Record<string, Post[]> = {}
    posts.forEach(p => { (map[p.date] = map[p.date] || []).push(p) })
    Object.keys(map).forEach(k => map[k].sort((a, b) => a.time.localeCompare(b.time)))
    return map
  }, [posts])

  const eventsByDay = useMemo(() => {
    const map: Record<string, (EventDate | FutebolEvent)[]> = {}
    events.forEach(e => {
      const start = 'start' in e ? e.start : e.date
      const end = 'end' in e ? e.end : e.date
      const s = parseISO(start)
      const en = parseISO(end)
      for (const d = new Date(s); d <= en; d.setDate(d.getDate() + 1)) {
        const iso = toISO(d.getFullYear(), d.getMonth(), d.getDate())
        ;(map[iso] = map[iso] || []).push(e)
      }
    })
    return map
  }, [events])

  return (
    <div className="cal-grid">
      {WEEKDAYS.map(w => (
        <div key={w} className="cal-head">{w}</div>
      ))}
      {cells.map((c, i) => {
        const isToday = c.iso === today
        const dayPosts = postsByDay[c.iso] || []
        const dayEvents = eventsByDay[c.iso] || []
        const visible = dayPosts.slice(0, maxPerCell)
        const more = dayPosts.length - visible.length

        const firstEvent = dayEvents[0]
        const firstEventColor = firstEvent
          ? (FUT_TYPES.find(t => t.id === firstEvent.type)?.color ||
             EVENT_TYPES.find(t => t.id === firstEvent.type)?.color || '#999')
          : null

        return (
          <div
            key={i}
            className={`cal-cell ${c.other ? 'other' : ''} ${isToday ? 'today' : ''}`}
            onClick={() => !c.other && onNewPost?.(c.iso)}
          >
            <div className="cal-num-row">
              <span className="cal-num-box">{c.day}</span>
              {firstEvent && (
                <span className="cal-event-label" title={dayEvents.map(e => e.name).join(', ')}>
                  <span className="edot" style={{ background: firstEventColor ?? undefined }} />
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
            {more > 0 && (
              <div className="cal-more" onClick={e => e.stopPropagation()}>+{more} mais</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
