'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Campaign, Post, MONTH_ABBR, PostSource } from '@/lib/types'
import { dbToCampaign, dbToPost } from '@/lib/supabase/mappers'
import { PlatformIcon, Icon } from './Icons'

const POST_TABLES: { table: string; source: PostSource }[] = [
  { table: 'mh_posts',       source: 'mh'       },
  { table: 'branding_posts', source: 'branding' },
  { table: 'tiktok_posts',   source: 'tiktok'   },
  { table: 'twitter_posts',  source: 'twitter'  },
  { table: 'canal_posts',    source: 'canal'    },
  { table: 'copa_posts',     source: 'copa'     },
]

export default function ArchivedView() {
  const supabase = createClient()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      const [{ data: campData }, ...postResults] = await Promise.all([
        supabase.from('campaigns').select('*').eq('archived', true).order('id', { ascending: false }),
        ...POST_TABLES.map(({ table }) =>
          supabase.from(table).select('*').eq('archived', true).order('date', { ascending: false })
        ),
      ])
      setCampaigns((campData ?? []).map(r => dbToCampaign(r as Record<string, unknown>)))
      const allPosts: Post[] = postResults.flatMap(({ data }, i) =>
        (data ?? []).map(r => dbToPost(r as Record<string, unknown>, POST_TABLES[i].source))
      ).sort((a, b) => b.date.localeCompare(a.date))
      setPosts(allPosts)
      setLoading(false)
    }
    fetchAll()
  }, [])

  const unarchiveCampaign = async (id: number) => {
    await supabase.from('campaigns').update({ archived: false }).eq('id', id)
    setCampaigns(arr => arr.filter(c => c.id !== id))
  }

  const unarchivePost = async (p: Post) => {
    const tableMap: Record<PostSource, string> = {
      mh: 'mh_posts', branding: 'branding_posts', tiktok: 'tiktok_posts',
      twitter: 'twitter_posts', canal: 'canal_posts', copa: 'copa_posts',
    }
    await supabase.from(tableMap[p.source]).update({ archived: false }).eq('id', p.id)
    setPosts(arr => arr.filter(x => x.id !== p.id))
  }

  const mesLabel = (mes: string) => {
    if (!mes) return '—'
    const parts = mes.split('-')
    if (parts.length === 2) {
      const m = parseInt(parts[1], 10) - 1
      return `${MONTH_ABBR[m] ?? mes} ${parts[0]}`
    }
    return mes
  }

  const total = campaigns.length + posts.length

  return (
    <div className="view-wrap" style={{ padding: '28px 32px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>Arquivados</div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 3 }}>Itens arquivados. Você pode restaurá-los a qualquer momento.</div>
      </div>

      {loading && <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>Carregando...</div>}

      {!loading && total === 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '60px 0', color: 'var(--ink-3)', gap: 10,
        }}>
          <Icon.trash className="icon-archived-empty" />
          <div style={{ fontSize: 14 }}>Nenhum item arquivado</div>
        </div>
      )}

      {!loading && campaigns.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', letterSpacing: '0.06em', marginBottom: 8 }}>CAMPANHAS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {campaigns.map(c => (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '12px 16px',
              }}>
                <span className={`event-pack ${c.pack.toLowerCase()}`}>{c.pack}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.nome}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                    {c.tipo} · {mesLabel(c.mes || c.previsao || '')}
                  </div>
                </div>
                <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 12px', whiteSpace: 'nowrap' }} onClick={() => unarchiveCampaign(c.id)}>
                  Desarquivar
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && posts.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', letterSpacing: '0.06em', marginBottom: 8 }}>POSTS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {posts.map(p => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '12px 16px',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7, display: 'grid', placeItems: 'center', flex: '0 0 28px',
                  background: p.platform === 'ig' ? '#E1306C' : p.platform === 'tiktok' ? '#111' : p.platform === 'youtube' ? '#FF0000' : p.platform === 'twitter' ? '#111' : '#666',
                }}>
                  <PlatformIcon platform={p.platform} size={14} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.title || '(sem título)'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                    {p.format} · {p.date}
                  </div>
                </div>
                <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 12px', whiteSpace: 'nowrap' }} onClick={() => unarchivePost(p)}>
                  Desarquivar
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
