/* ============================================================
   BatchPautaModal — create N MH posts at once for a single creator
   in a single click. Generates the briefing .txt and shows the preview
   with a (simulated) "Salvar no Dropbox" action.
   Phase 6 + 7 from the integration plan.
   ============================================================ */
const { useState: useStateB, useMemo: useMemoB } = React;

/* Format the briefing as plaintext — what the platform would write to Dropbox */
function formatBriefingTxt({ creator, semana, videos, generatedBy, generatedAt }) {
  const c = CREATORS_BY_ID[creator];
  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (iso) => {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };
  const gen = new Date(generatedAt);
  const genStr = `${pad(gen.getDate())}/${pad(gen.getMonth() + 1)}/${gen.getFullYear()} ${pad(gen.getHours())}:${pad(gen.getMinutes())}`;
  const head = `PAUTAS — ${c?.name?.toUpperCase() || creator} · ${semanaLabel(semana).replace('S', 'SEMANA ')}`;
  const div = '═'.repeat(60);
  const sub = '─'.repeat(60);

  let out = '';
  out += head + '\n';
  out += div + '\n';
  out += `Gerada em ${genStr} por ${generatedBy}\n\n\n`;

  videos.forEach((v, i) => {
    const num = pad(i + 1);
    out += `📹 VÍDEO ${num}\n`;
    out += sub + '\n';
    out += `HOOK / TAKE INICIAL\n  ${v.hook || '—'}\n\n`;
    out += `REFERÊNCIA\n  ${v.ref || '—'}\n\n`;
    out += `PRODUTO FOCO\n  ${v.product || '—'}\n\n`;
    out += `ÁUDIO SUGERIDO\n  ${v.audio || '—'}\n\n`;
    out += `PRAZO DE ENTREGA\n  ${fmt(v.prazo) || '—'}\n\n`;
    out += `OBSERVAÇÕES\n  ${v.notes || '—'}\n\n\n`;
  });

  out += div + '\n';
  out += `${videos.length} vídeo${videos.length === 1 ? '' : 's'} nesta semana · arquivo gerado automaticamente pelo SocialHub`;
  return out;
}

function emptyVideo(prazoDefault) {
  return {
    _id: Math.random().toString(36).slice(2),
    hook: '',
    ref: '',
    product: '',
    audio: '',
    notes: '',
    prazo: prazoDefault,
  };
}

function BatchPautaModal({ open, onClose, onCreated, initialCreator = 'CARINA' }) {
  const [creatorId, setCreatorId] = useStateB(initialCreator);
  const creator = CREATORS_BY_ID[creatorId];
  const nextSemana = creator.semanaAtual + 1;

  // default prazo: +7 days from today
  const defaultPrazo = useMemoB(() => addDaysISO(todayISO(), 7), []);
  const [videos, setVideos] = useStateB([emptyVideo(defaultPrazo)]);
  const [step, setStep] = useStateB('form');  // 'form' | 'preview' | 'done'
  const [briefingTxt, setBriefingTxt] = useStateB('');
  const [savedToDropbox, setSavedToDropbox] = useStateB(false);

  if (!open) return null;

  const setVideo = (idx, k, v) => {
    setVideos((arr) => arr.map((vid, i) => i === idx ? { ...vid, [k]: v } : vid));
  };
  const addVideo = () => setVideos((arr) => [...arr, emptyVideo(defaultPrazo)]);
  const removeVideo = (idx) => setVideos((arr) => arr.filter((_, i) => i !== idx));

  const canGenerate = videos.length > 0 && videos.some((v) => (v.hook || '').trim().length > 0);

  const handleGenerate = () => {
    // Filter out blank-hook videos
    const filled = videos.filter((v) => (v.hook || '').trim().length > 0);
    const txt = formatBriefingTxt({
      creator: creatorId,
      semana: nextSemana,
      videos: filled,
      generatedBy: 'Eduarda Alves',
      generatedAt: Date.now(),
    });
    setBriefingTxt(txt);
    setStep('preview');
  };

  const handleConfirm = () => {
    // Create N posts and call onCreated with them
    const filled = videos.filter((v) => (v.hook || '').trim().length > 0);
    const today = todayISO();
    const newPosts = filled.map((v, i) => ({
      id: Date.now() + i,  // unique
      title: v.hook,
      owner: 'Eduarda',
      platform: 'ig',
      date: addDaysISO(today, 7 + i),  // staggered: 1 video per day starting next week
      time: '12:00',
      status: 'pauta',
      complexity: 2,
      type: 'Reels',
      tags: ['mh'],
      linha: 'trends',
      campanha: null,
      product: v.product,
      caption: '',
      link: '',
      coverLink: '',
      postLink: '',
      ref: v.ref || '',
      notes: v.notes || '',
      mh: {
        creator: creatorId,
        semanaCreator: nextSemana,
        numVideo: i + 1,
        audio: v.audio || '',
        prazo: v.prazo,
        dropboxLink: '',
        briefingFile: `${creator.dropboxPath}/pautas-semana-${nextSemana}.txt`,
        repostTT: null,
      },
    }));
    onCreated(newPosts, {
      briefingPath: `${creator.dropboxPath}/pautas-semana-${nextSemana}.txt`,
      briefingTxt,
    });
    setStep('done');
  };

  const reset = () => {
    setVideos([emptyVideo(defaultPrazo)]);
    setStep('form');
    setBriefingTxt('');
    setSavedToDropbox(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal batch-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-head">
          <div style={{ width: 44, height: 44, borderRadius: 11, background: 'oklch(0.55 0.12 280)', display: 'grid', placeItems: 'center', color: 'white', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, letterSpacing: '0.03em' }}>
            MH
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>
              {step === 'form'    && 'Nova pauta em lote'}
              {step === 'preview' && 'Prévia do briefing'}
              {step === 'done'    && 'Pauta criada'}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {step === 'form' &&
                <React.Fragment>
                  <span style={{ color: 'var(--ink)' }}>Criar pauta de </span>
                  <BMCreatorSelect value={creatorId} onChange={setCreatorId} />
                  <span style={{ color: 'var(--ink)' }}> · semana </span>
                  <span style={{ fontFamily: 'var(--font-mono)', background: 'var(--accent-soft)', color: 'var(--accent-deep)', padding: '2px 12px', borderRadius: 7, fontSize: 16 }}>
                    {semanaLabel(nextSemana)}
                  </span>
                </React.Fragment>
              }
              {step === 'preview' && (
                <span>{creator.name} · {semanaLabel(nextSemana)} · {videos.filter(v => v.hook.trim()).length} vídeos</span>
              )}
              {step === 'done' && (
                <span>✓ {videos.filter(v => v.hook.trim()).length} vídeos adicionados às pautas de {creator.name}</span>
              )}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><Icon.x /></button>
        </div>

        {/* Body */}
        {step === 'form' && (
          <div className="batch-body">
            <div className="batch-helper">
              A semana <strong>{semanaLabel(nextSemana)}</strong> é a próxima de <strong>{creator.name}</strong>
              {' '}(ela está na {semanaLabel(creator.semanaAtual)} no momento). Cada vídeo abaixo vira uma
              linha em <em>Pautas</em> com status <span className="pauta-status s-pauta"><span style={{ width: 5, height: 5, borderRadius: '50%', background: 'oklch(0.55 0.12 280)' }} /> Em pauta</span>.
            </div>

            {videos.map((v, i) => (
              <div className="batch-video" key={v._id}>
                <div className="batch-video-head">
                  <div className="batch-video-num">VÍDEO {String(i + 1).padStart(2, '0')}</div>
                  {videos.length > 1 && (
                    <button className="batch-video-remove" onClick={() => removeVideo(i)}>
                      <Icon.x /> remover
                    </button>
                  )}
                </div>

                <div className="batch-grid">
                  <div className="batch-field full">
                    <label>Hook / Take inicial</label>
                    <textarea
                      className="field"
                      rows={2}
                      placeholder='Ex: pov: aquela amiga que acha tudo aesthetic'
                      value={v.hook}
                      onChange={(e) => setVideo(i, 'hook', e.target.value)} />
                  </div>

                  <div className="batch-field full">
                    <label>Link de referência</label>
                    <input
                      className="field"
                      placeholder="https://www.instagram.com/reel/... ou TikTok"
                      value={v.ref}
                      onChange={(e) => setVideo(i, 'ref', e.target.value)} />
                  </div>

                  <div className="batch-field">
                    <label>Produto foco</label>
                    <input
                      className="field"
                      placeholder="Ex: Tote Puffer · Case"
                      value={v.product}
                      onChange={(e) => setVideo(i, 'product', e.target.value)} />
                  </div>

                  <div className="batch-field">
                    <label>Áudio sugerido</label>
                    <input
                      className="field"
                      placeholder="Ex: pop indie, trend BR..."
                      value={v.audio}
                      onChange={(e) => setVideo(i, 'audio', e.target.value)} />
                  </div>

                  <div className="batch-field">
                    <label>Prazo de entrega</label>
                    <input
                      className="field"
                      type="date"
                      value={v.prazo}
                      onChange={(e) => setVideo(i, 'prazo', e.target.value)} />
                  </div>

                  <div className="batch-field">
                    <label>Observações</label>
                    <input
                      className="field"
                      placeholder="Detalhes, adaptações..."
                      value={v.notes}
                      onChange={(e) => setVideo(i, 'notes', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}

            <button className="batch-add" onClick={addVideo}>
              <Icon.plus /> Adicionar vídeo
            </button>
          </div>
        )}

        {step === 'preview' && (
          <div className="batch-body" style={{ padding: '0 24px 24px' }}>
            <div className="briefing-meta">
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>
                  Arquivo será salvo em
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--ink)', letterSpacing: '0.02em' }}>
                  {creator.dropboxPath}/<strong>pautas-semana-{nextSemana}.txt</strong>
                </div>
              </div>
              <div className="briefing-tag">
                <span style={{ fontSize: 14 }}>📄</span> .txt · {Math.round(briefingTxt.length / 1024 * 10) / 10}KB
              </div>
            </div>

            <pre className="briefing-preview">{briefingTxt}</pre>

            <div className="briefing-warn">
              <strong>Heads-up:</strong> a integração real com a API do Dropbox não está implementada nesse protótipo. No backend real, esta etapa faria upload do arquivo direto na pasta da creator.
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="batch-body" style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, margin: '8px auto 16px',
              borderRadius: '50%',
              background: 'oklch(0.95 0.045 165)',
              color: 'oklch(0.45 0.14 165)',
              display: 'grid', placeItems: 'center',
              fontSize: 32, fontWeight: 700,
            }}>✓</div>
            <div style={{ fontSize: 17, color: 'var(--ink)', marginBottom: 6, fontWeight: 600 }}>
              {videos.filter(v => v.hook.trim()).length} vídeos foram criados
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 18 }}>
              Você pode editá-los individualmente na view Pautas. O briefing foi salvo em<br />
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, background: 'var(--surface-3)', padding: '2px 8px', borderRadius: 4 }}>
                {creator.dropboxPath}/pautas-semana-{nextSemana}.txt
              </code>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="modal-foot">
          {step === 'form' && (
            <React.Fragment>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                {videos.filter(v => v.hook.trim()).length} de {videos.length} preenchidos
              </div>
              <div style={{ flex: 1 }} />
              <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
              <button
                className="btn btn-accent"
                onClick={handleGenerate}
                disabled={!canGenerate}
                style={{ opacity: canGenerate ? 1 : 0.5, cursor: canGenerate ? 'pointer' : 'not-allowed' }}>
                Gerar briefing
              </button>
            </React.Fragment>
          )}
          {step === 'preview' && (
            <React.Fragment>
              <button className="btn btn-ghost" onClick={() => setStep('form')}>← Voltar e editar</button>
              <div style={{ flex: 1 }} />
              <button className="btn btn-accent" onClick={handleConfirm}>
                <Icon.check /> Criar pauta e salvar no Dropbox
              </button>
            </React.Fragment>
          )}
          {step === 'done' && (
            <React.Fragment>
              <button className="btn btn-ghost" onClick={() => { reset(); }}>Criar mais uma pauta</button>
              <div style={{ flex: 1 }} />
              <button className="btn btn-accent" onClick={onClose}>Concluir</button>
            </React.Fragment>
          )}
        </div>
      </div>
    </div>
  );
}

function BMCreatorSelect({ value, onChange }) {
  const [open, setOpen] = useStateB(false);
  const c = CREATORS_BY_ID[value];
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '4px 12px 4px 5px',
          borderRadius: 8,
          border: '1.5px solid var(--accent-soft)',
          background: 'var(--accent-softer)',
          cursor: 'pointer',
          fontSize: 16,
          fontWeight: 700,
          color: 'var(--ink)',
          letterSpacing: '-0.015em',
        }}>
        <span style={{
          width: 24, height: 24, borderRadius: '50%',
          background: c.color, color: 'white',
          display: 'grid', placeItems: 'center',
          fontSize: 11, fontWeight: 700,
        }}>{c.initial}</span>
        {c.name}
        <Icon.chevD />
      </button>
      {open && (
        <React.Fragment>
          <div style={{ position: 'fixed', inset: 0, zIndex: 55 }} onClick={() => setOpen(false)} />
          <div className="popover" style={{ top: '100%', marginTop: 4, left: 0, minWidth: 220 }}>
            {CREATORS.map((cc) => (
              <button
                key={cc.id}
                className="po-item"
                onClick={() => { onChange(cc.id); setOpen(false); }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: cc.color, color: 'white', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, marginRight: 4 }}>{cc.initial}</span>
                {cc.name}
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>{semanaLabel(cc.semanaAtual + 1)}</span>
                {cc.id === value && <span className="check"><Icon.check /></span>}
              </button>
            ))}
          </div>
        </React.Fragment>
      )}
    </span>
  );
}

Object.assign(window, { BatchPautaModal, formatBriefingTxt });
