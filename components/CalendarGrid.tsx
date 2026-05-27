'use client'

import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { PlatformIcon } from './Icons'
import {
  Post, buildMonthGrid, WEEKDAYS, todayISO,
  parseISO, toISO, EventDate, FutebolEvent, fmtBR,
} from '@/lib/types'
import { EVENT_TYPES, FUT_TYPES } from '@/lib/data'

interface Props {
  year: number
  month: number
  posts: Post[]
  events?: (EventDate | FutebolEvent)[]
  onPostClick: (post: Post) => void
  onNewPost?: (date: string) => void
  onPostDrop?: (postId: string, date: string) => void
  maxPerCell?: number
}

function PostCard({ post, onClick }: { post: Post; onClick: () => void }) {
  return (
    <button
      className={`post-card plat-${post.platform} status-${post.status}`}
      draggable
      onDragStart={e => { e.stopPropagation(); e.dataTransfer.setData('postId', String(post.id)) }}
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

function DayPopover({ date, posts, onPostClick, onClose }: {
  date: string
  posts: Post[]
  onPostClick: (p: Post) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div ref={ref} style={{
      position: 'absolute', zIndex: 50, top: '100%', left: 0,
      background: 'var(--surface)', border: '1px solid var(--line)',
      borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.12)',
      padding: '10px 8px', minWidth: 240, maxWidth: 300,
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', letterSpacing: '.04em', padding: '0 4px 4px' }}>
        {fmtBR(date)} — {posts.length} posts
      </div>
      {posts.map(p => (
        <button
          key={p.id}
          className={`post-card plat-${p.platform} status-${p.status}`}
          style={{ width: '100%' }}
          onClick={() => { onPostClick(p); onClose() }}
        >
          <span className={`pc-icon plat-${p.platform}`}>
            <PlatformIcon platform={p.platform} size={9} color="white" />
          </span>
          <span className="pc-time">{p.time}</span>
          <span className="pc-title">{p.title}</span>
        </button>
      ))}
    </div>
  )
}

export default function CalendarGrid({
  year, month, posts, events = [], onPostClick, onNewPost, onPostDrop, maxPerCell = 3,
}: Props) {
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month])
  const today = todayISO()
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [dragOverDay, setDragOverDay] = useState<string | null>(null)

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
            style={{ position: 'relative', outline: dragOverDay === c.iso ? '2px solid var(--accent)' : undefined, outlineOffset: '-2px' }}
            onClick={() => !c.other && onNewPost?.(c.iso)}
            onDragOver={e => { e.preventDefault(); setDragOverDay(c.iso) }}
            onDragLeave={() => setDragOverDay(null)}
            onDrop={e => {
              e.preventDefault()
              setDragOverDay(null)
              const postId = e.dataTransfer.getData('postId')
              if (postId && !c.other) onPostDrop?.(postId, c.iso)
            }}
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
              <div
                className="cal-more"
                onClick={e => { e.stopPropagation(); setExpandedDay(c.iso === expandedDay ? null : c.iso) }}
                style={{ cursor: 'pointer' }}
              >
                +{more} mais
              </div>
            )}
            {expandedDay === c.iso && (
              <DayPopover
                date={c.iso}
                posts={dayPosts}
                onPostClick={onPostClick}
                onClose={() => setExpandedDay(null)}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
