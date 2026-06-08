# Patch: endpoint de render de Lives para `editing-automation`

Adiciona o endpoint **`POST /api/v1/lives/render-overlay`** à API existente
(`pedroRochaJ/editing-automation`). Reusa o que já existe (`processar_video`,
`DropboxService`) e adiciona apenas:

- **`api/services/html_render_service.py`** — renderiza HTML → PNG via Playwright
  (mantém fidelidade visual: Google Fonts, gradientes, dashed borders).
- **`api/routes/lives_render.py`** — orquestra: render PNG → download vídeo →
  FFmpeg overlay (função existente) → upload Dropbox.
- **`templates/lives/*.html`** — os 5 templates que já estão em
  `Templates de Live/` (copiados pra dentro do repo).

## Como aplicar

```bash
# Na raiz do clone do editing-automation:
cp -r <este-patch>/api/services/html_render_service.py  api/services/
cp -r <este-patch>/api/routes/lives_render.py           api/routes/
mkdir -p templates/lives
cp <este-patch>/templates/*.html                        templates/lives/

# Instalar Playwright (NOVA dependência) + Chromium headless:
pip install playwright httpx
playwright install chromium

# Adicionar httpx + playwright ao requirements.txt:
echo "playwright>=1.40" >> requirements.txt
echo "httpx>=0.27" >> requirements.txt
```

E **registrar a rota no `api/main.py`** — adicionar depois das outras
`include_router`:

```python
# api/main.py (linha ~131)
from api.routes.auth import router as auth_router
from api.routes.merge import router as merge_router
from api.routes.lives_render import router as lives_render_router   # ← NOVO

app.include_router(auth_router,  prefix="/api/v1/auth",  tags=["autenticação"])
app.include_router(merge_router, prefix="/api/v1/merge", tags=["merge"])
app.include_router(lives_render_router, prefix="/api/v1/lives", tags=["lives"])  # ← NOVO
```

## No Dockerfile (se o deploy é via Docker)

Adicionar antes de `CMD` ou `ENTRYPOINT`:

```dockerfile
# Playwright + Chromium headless
RUN pip install --no-cache-dir playwright httpx \
 && playwright install --with-deps chromium
```

Ou no `requirements.txt` + `RUN playwright install --with-deps chromium`.

## Contrato

```http
POST /api/v1/lives/render-overlay
Content-Type: application/json

{
  "template": "use_e_ganhe_regra",
  "variables": {
    "cupom":   "SEXTATOP",
    "merchan": "DESCONTO + FRETE GRÁTIS",
    "regra":   "Válido em pedidos a partir de R$99"
  },
  "video_url":    "https://video.fcrt1-1.fna.fbcdn.net/.../...mp4",
  "dropbox_path": "/MKT SOCIAL/LIVES/semana-2026-22/2026-05-25_sexta.mp4"
}

200 OK
{
  "success": true,
  "dropbox_path": "/MKT SOCIAL/LIVES/semana-2026-22/2026-05-25_sexta.mp4",
  "duration_seconds": 47.32,
  "output_filename": "use_e_ganhe_regra_a1b2c3d4.mp4",
  "message": "OK em 47.32s"
}
```

Tem também `GET /api/v1/lives/templates` que devolve a lista de templates
disponíveis (debug).

## Templates disponíveis e suas variáveis

| Template (sem `.html`) | Variáveis | Quando usar |
|---|---|---|
| `use_e_ganhe` | `cupom`, `merch_1`, `merch_2`, `merch_3` | **Triplo** (3 benefícios separados por `+` no nome do merchan) |
| `use_e_ganhe_regra` | `cupom`, `merchan`, `regra` | 1 cupom + 1 merchan + disclaimer (caso padrão azul) |
| `triplo` | `cupom`, `merchan` | 1 cupom + 1 merchan (variante de cor vinho) |
| `video_merchan_duplo` | `cupom`, `merchan_1`, `merchan_2` | 2 cupons (cupom1 + cupom2 na mesma live) |
| `desconto_com_regra` | `cupom`, `desconto`, `regra` | Cupons "X% OFF" ou "R$X OFF" (sempreSozinho) |

## Decisão de mapeamento (a fazer no n8n ou aqui)

Dado uma live com `merchan1, nominal1, merchan2, nominal2`:

```python
# Pseudo-código pra escolher template e variáveis:
def mapear_template(live):
    m1 = live["merchan1"] or ""
    m2 = live["merchan2"] or ""

    # Caso 1: cupom % ou R$ OFF (sempreSozinho)
    if "% OFF" in m1.upper() or "R$" in m1.upper() and "OFF" in m1.upper():
        return "desconto_com_regra", {
            "cupom": live["nominal1"],
            "desconto": extrair_desconto(m1),     # "R$20" ou "10%"
            "regra": extrair_regra(m1),            # "Em compras a partir de R$150"
        }

    # Caso 2: triplo (3 benefícios)
    partes = m1.split(" + ")
    if len(partes) >= 3:
        return "use_e_ganhe", {
            "cupom": live["nominal1"],
            "merch_1": partes[0],
            "merch_2": partes[1],
            "merch_3": partes[2],
        }

    # Caso 3: cupom 2 presente → 2 cupons
    if m2:
        return "video_merchan_duplo", {
            "cupom": live["nominal1"],
            "merchan_1": m1,
            "merchan_2": m2,
        }

    # Caso 4: padrão (1 cupom + 1 merchan, com disclaimer)
    return "use_e_ganhe_regra", {
        "cupom": live["nominal1"],
        "merchan": m1,
        "regra": "Promoção válida em pedidos acima de R$99",
    }
```

Esse mapeamento pode viver:
- **No n8n** (nó "Code") — mais fácil de iterar, mas espalha lógica
- **Aqui no endpoint** — recebe a `live` inteira e decide template; mais
  coeso. Recomendado.

Se preferir a 2ª opção, dá pra estender este endpoint pra aceitar um modo
"automático" que recebe `{live: {...}, video_url, dropbox_path}` e escolhe
template sozinho.

## Variáveis de ambiente necessárias (já existentes no servidor)

- `DROPBOX_ACCESS_TOKEN` — já configurado.
- (opcional) Limite de concorrência / timeout do Playwright, se quiser
  expor.

## Teste local

```bash
# Listar templates:
curl http://localhost:8000/api/v1/lives/templates

# Render + overlay + upload:
curl -X POST http://localhost:8000/api/v1/lives/render-overlay \
  -H "Content-Type: application/json" \
  -d '{
    "template": "use_e_ganhe_regra",
    "variables": {"cupom":"TESTE","merchan":"DESCONTO + FRETE GRÁTIS","regra":"teste"},
    "video_url": "https://exemplo.com/video.mp4",
    "dropbox_path": "/MKT SOCIAL/LIVES/teste/saida.mp4"
  }'
```
