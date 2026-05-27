'use client'

import { useMemo, useState } from 'react'
import { PlatformIcon } from './Icons'
import { Post, addDaysISO, parseISO, toISO, WEEKDAYS_FULL, pad, todayISO, EventDate, FutebolEvent } from '@/lib/types'
import { EVENT_TYPES, FUT_TYPES } from '@/lib/data'

const WEEK_START_HOUR = 6
const POST_DURATION_MIN = 45 // assume cada post dura 45min para cálculo de sobreposição

function assignColumns(posts: Post[]): Map<string, { col: number; total: number }> {
  const result = new Map<string, { col: number; total: number }>()
  // cada post tem top em minutos
  const toMin = (time: string) => {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
  }
  // grupos de sobreposição
  const sorted = [...posts].sort((a, b) => a.time.localeCompare(b.time))
  const groups: Post[][] = []
  for (const p of sorted) {
    const pStart = toMin(p.time)
    const pEnd = pStart + POST_DURATION_MIN
    let placed = false
    for (const g of groups) {
      const overlaps = g.some(gp => {
        const gs = toMin(gp.time), ge = gs + POST_DURATION_MIN
        return pStart < ge && pEnd > gs
      })
      if (overlaps) { g.push(p); placed = true; break }
    }
    if (!placed) groups.push([p])
  }
  for (const g of groups) {
    const total = g.length
    g.forEach((p, col) => result.set(p.id, { col, total }))
  }
  return result
}
const WEEK_END_HOUR = 24
const HOUR_HEIGHT = 56

interface Props {
  weekStart: string
  posts: Post[]
  events?: (EventDate | FutebolEvent)[]
  onPostClick: (post: Post) => void
  onPostDrop?: (postId: string, date: string, time: string) => void
}

export default function WeekView({ weekStart, posts, events = [], onPostClick, onPostDrop }: Props) {
  const days = Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i))
  const hours = Array.from({ length: WEEK_END_HOUR - WEEK_START_HOUR }, (_, i) => WEEK_START_HOUR + i)
  const today = todayISO()

  const [dragOverDay, setDragOverDay] = useState<string | null>(null)

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

  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const nowOffset = ((nowMinutes / 60) - WEEK_START_HOUR) * HOUR_HEIGHT

  const postsByDay = useMemo(() => {
    const map: Record<string, Post[]> = {}
    days.forEach(d => { map[d] = [] })
    posts.forEach(p => { if (map[p.date] !== undefined) map[p.date].push(p) })
    Object.values(map).forEach(arr => arr.sort((a, b) => a.time.localeCompare(b.time)))
    return map
  }, [posts, weekStart])

  return (
    <div className="week-grid">
      <div className="week-head">
        <div className="week-tz">GMT-3</div>
        {days.map(d => {
          const dt = parseISO(d)
          const isToday = d === today
          const dayEvents = eventsByDay[d] || []
          return (
            <div key={d} className={`week-day-head ${isToday ? 'today' : ''}`}>
              <div className="wdh-dow">{WEEKDAYS_FULL[dt.getDay()]}</div>
              <div className="wdh-num">{dt.getDate()}</div>
              {dayEvents.map((ev, i) => {
                const color = FUT_TYPES.find(t => t.id === ev.type)?.color ||
                  EVENT_TYPES.find(t => t.id === ev.type)?.color || '#999'
                return (
                  <div key={i} className="cal-event-label" title={ev.name} style={{ borderLeftColor: color }}>
                    <span className="ev-name">{ev.name}</span>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      <div className="week-body" style={{ '--hour-h': `${HOUR_HEIGHT}px` } as React.CSSProperties}>
        <div className="week-time-col">
          {hours.map(h => (
            <div key={h} className="week-time-cell">
              {h === WEEK_START_HOUR ? '' : `${pad(h)}:00`}
            </div>
          ))}
        </div>

        {days.map(d => {
          const isToday = d === today
          const dayPosts = postsByDay[d] || []
          const colMap = assignColumns(dayPosts)
          return (
            <div
              key={d}
              className={`week-day-col ${isToday ? 'today' : ''}`}
              style={{ outline: dragOverDay === d ? '2px solid var(--accent)' : undefined, outlineOffset: '-2px' }}
              onDragOver={e => { e.preventDefault(); setDragOverDay(d) }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverDay(null) }}
              onDrop={e => {
                e.preventDefault()
                setDragOverDay(null)
                const postId = e.dataTransfer.getData('postId')
                if (!postId) return
                const rect = e.currentTarget.getBoundingClientRect()
                const relY = e.clientY - rect.top
                const totalHours = relY / HOUR_HEIGHT + WEEK_START_HOUR
                const h = Math.min(23, Math.max(0, Math.floor(totalHours)))
                const rawMin = Math.round(((totalHours - Math.floor(totalHours)) * 60) / 15) * 15
                const min = rawMin >= 60 ? 0 : rawMin
                const finalH = rawMin >= 60 ? Math.min(23, h + 1) : h
                onPostDrop?.(postId, d, `${pad(finalH)}:${pad(min)}`)
              }}
            >
              {hours.map(h => (
                <div key={h} className="week-hour-cell" />
              ))}
              {isToday && nowOffset >= 0 && (
                <div className="week-now-line" style={{ top: `${nowOffset}px` }} />
              )}
              {dayPosts.map(p => {
                const [hh, mm] = p.time.split(':').map(Number)
                const top = ((hh + mm / 60) - WEEK_START_HOUR) * HOUR_HEIGHT
                if (top < 0) return null
                const height = 66
                const { col, total } = colMap.get(p.id) ?? { col: 0, total: 1 }
                const width = `${100 / total}%`
                const left = `${(col / total) * 100}%`
                return (
                  <button
                    key={p.id}
                    className={`week-post plat-${p.platform} status-${p.status}`}
                    style={{ top: `${top}px`, height: `${height}px`, width, left, right: 'unset' }}
                    draggable
                    onDragStart={e => { e.stopPropagation(); e.dataTransfer.setData('postId', String(p.id)) }}
                    onClick={() => onPostClick(p)}
                    title={p.title}
                  >
                    <div className="wp-time">
                      <span className="wp-pic">
                        <PlatformIcon platform={p.platform} size={8} color="white" />
                      </span>
                      {p.time}
                    </div>
                    <div className="wp-title">{p.title}</div>
                    <div className="wp-meta">{p.format} · {p.owner}</div>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
