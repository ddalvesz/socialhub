// ============================================================================
// POST /api/lives/trigger-render
//
// Dispara a automação semanal que renderiza os cupons da semana sobre os top
// vídeos do Meta Ads e sobe pro Dropbox. O trabalho pesado roda no n8n —
// esta rota só persiste o job em `render_jobs` e dá kick no webhook.
//
// Body:    { semana?: "YYYY-MM-DD" }   ← segunda da semana alvo; default = segunda da semana corrente
// Returns: { job_id, status: 'queued', semana, lives_count }
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ─── Helpers de data (UTC) ───────────────────────────────────────────────────

function parseIsoUTC(s: string): Date {
  return new Date(s + 'T00:00:00Z')
}
function toIsoUTC(d: Date): string {
  return d.toISOString().slice(0, 10)
}
function addDaysUTC(d: Date, n: number): Date {
  const r = new Date(d.getTime())
  r.setUTCDate(r.getUTCDate() + n)
  return r
}
// Segunda da semana corrente (se hoje for segunda → hoje; senão recua)
function segundaDaSemana(refIso: string): string {
  const d = parseIsoUTC(refIso)
  const dow = d.getUTCDay() // 0=dom, 1=seg…6=sáb
  const recuar = dow === 0 ? 6 : dow - 1
  return toIsoUTC(addDaysUTC(d, -recuar))
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // ── Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    // ── Semana alvo
    const body = await req.json().catch(() => ({})) as { semana?: string }
    const todayIso = toIsoUTC(new Date())
    const semanaIso = body.semana && /^\d{4}-\d{2}-\d{2}$/.test(body.semana)
      ? body.semana
      : segundaDaSemana(todayIso)

    const semana = parseIsoUTC(semanaIso)
    const fimSemanaIso = toIsoUTC(addDaysUTC(semana, 6))

    // ── Lê lives confirmadas da semana
    const { data: lives, error: livesErr } = await supabase
      .from('lives')
      .select('id, date, dia_semana, merchan1, nominal1, merchan2, nominal2, receita_extra, cupom_extra, status, origem')
      .eq('status', 'confirmada')
      .gte('date', semanaIso)
      .lte('date', fimSemanaIso)
      .order('date')

    if (livesErr) {
      return NextResponse.json({ error: livesErr.message }, { status: 500 })
    }
    if (!lives || lives.length === 0) {
      return NextResponse.json({
        error: `Nenhuma live com status 'confirmada' entre ${semanaIso} e ${fimSemanaIso}. Aprove a proposta antes de gerar vídeos.`,
      }, { status: 400 })
    }

    // ── Cria render_job em estado 'queued' com o payload completo
    const payload = {
      semana: semanaIso,
      semana_fim: fimSemanaIso,
      callback_email: user.email,
      callback_user_id: user.id,
      lives: lives.map(l => ({
        date:      l.date,
        dia_semana: l.dia_semana,
        merchan1:  l.merchan1,
        nominal1:  l.nominal1,
        merchan2:  l.merchan2,
        nominal2:  l.nominal2,
      })),
    }

    const { data: job, error: jobErr } = await supabase
      .from('render_jobs')
      .insert({
        semana_inicio: semanaIso,
        triggered_by:  user.id,
        status:        'queued',
        payload,
      })
      .select('id')
      .single()

    if (jobErr || !job) {
      return NextResponse.json({ error: jobErr?.message ?? 'failed to create render_job' }, { status: 500 })
    }

    // ── POST pro webhook do n8n (fire-and-forget — não bloqueia a resposta)
    const webhookUrl    = process.env.N8N_RENDER_WEBHOOK_URL
    const webhookSecret = process.env.N8N_WEBHOOK_SECRET

    if (!webhookUrl) {
      // Sem URL configurada: deixa em 'queued' e avisa. Útil em dev/staging.
      console.warn('[trigger-render] N8N_RENDER_WEBHOOK_URL não configurada — job criado mas n8n não foi chamado.')
      return NextResponse.json({
        job_id: job.id,
        status: 'queued',
        semana: semanaIso,
        lives_count: lives.length,
        warning: 'webhook não configurado',
      }, { status: 202 })
    }

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(webhookSecret ? { 'X-N8N-Secret': webhookSecret } : {}),
        },
        body: JSON.stringify({
          job_id: job.id,
          ...payload,
        }),
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        await supabase
          .from('render_jobs')
          .update({
            status: 'error',
            error_message: `n8n webhook respondeu ${res.status}: ${txt.slice(0, 500)}`,
            ended_at: new Date().toISOString(),
          })
          .eq('id', job.id)
        return NextResponse.json({
          error: `Falha ao chamar n8n (${res.status})`,
          job_id: job.id,
        }, { status: 502 })
      }
    } catch (fetchErr: unknown) {
      const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr)
      await supabase
        .from('render_jobs')
        .update({
          status: 'error',
          error_message: `Erro de rede ao chamar n8n: ${msg}`,
          ended_at: new Date().toISOString(),
        })
        .eq('id', job.id)
      return NextResponse.json({ error: msg, job_id: job.id }, { status: 502 })
    }

    return NextResponse.json({
      job_id: job.id,
      status: 'queued',
      semana: semanaIso,
      lives_count: lives.length,
    }, { status: 202 })

  } catch (err: unknown) {
    console.error('[lives/trigger-render]', err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
