"""
HTML → PNG render service para overlays de live (Gocase).

Os templates HTML (1080x1920, fundo transparente) ficam em `templates/lives/`
no root do projeto. Usa Playwright (headless Chromium) pra renderizar com
Google Fonts e CSS avançado fielmente.

Uso:
    from api.services.html_render_service import render_overlay_png

    png_path = await render_overlay_png(
        template_name="use_e_ganhe_regra",
        variables={"cupom": "SEXTATOP", "merchan": "DESCONTO + FRETE GRÁTIS",
                   "regra": "Válido para pedidos a partir de R$99"},
        out_dir="/tmp/overlays",
    )
"""

from __future__ import annotations

import logging
import os
import re
import tempfile
import uuid
from pathlib import Path
from typing import Mapping

logger = logging.getLogger(__name__)

# ─── Localização dos templates ───────────────────────────────────────────────

# Os HTMLs vivem em <repo_root>/templates/lives/<name>.html
TEMPLATES_DIR = Path(__file__).resolve().parent.parent.parent / "templates" / "lives"

# Render padrão: stories vertical Instagram (mesma resolução dos templates).
DEFAULT_VIEWPORT = {"width": 1080, "height": 1920}


# ─── Substituição segura de placeholders ─────────────────────────────────────

_PLACEHOLDER_RE = re.compile(r"\{\{\s*([a-zA-Z0-9_]+)\s*\}\}")


def _render_template(html: str, variables: Mapping[str, str]) -> str:
    """Substitui `{{ var_name }}` por valores em `variables`.

    Variáveis ausentes viram string vazia (não levanta exceção — assim um
    template novo aceita props opcionais sem quebrar).
    """
    def repl(match: re.Match[str]) -> str:
        key = match.group(1)
        val = variables.get(key, "")
        # escape básico de HTML (texto vai dentro de <span>, evita injection)
        return (
            str(val)
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
        )
    return _PLACEHOLDER_RE.sub(repl, html)


def list_templates() -> list[str]:
    """Lista templates disponíveis (sem extensão)."""
    if not TEMPLATES_DIR.exists():
        return []
    return sorted(p.stem for p in TEMPLATES_DIR.glob("*.html"))


# ─── Render via Playwright ───────────────────────────────────────────────────

async def render_overlay_png(
    template_name: str,
    variables: Mapping[str, str],
    out_dir: str | None = None,
    viewport: dict | None = None,
) -> str:
    """Renderiza o template em PNG com fundo transparente.

    Args:
        template_name: nome do arquivo sem extensão (ex: "use_e_ganhe_regra").
        variables: dict de placeholders ({{ nome }} → valor).
        out_dir: pasta onde gravar o PNG. Default = tempdir do sistema.
        viewport: override do tamanho (default 1080x1920).

    Returns:
        Caminho absoluto do PNG gerado.

    Raises:
        FileNotFoundError: template não existe.
        RuntimeError: erro do Playwright.
    """
    template_path = TEMPLATES_DIR / f"{template_name}.html"
    if not template_path.exists():
        available = list_templates()
        raise FileNotFoundError(
            f"Template '{template_name}' não encontrado em {TEMPLATES_DIR}. "
            f"Disponíveis: {available}"
        )

    html = template_path.read_text(encoding="utf-8")
    rendered_html = _render_template(html, variables)

    # Salva HTML temporário (Playwright precisa de URL file://)
    tmp_html = Path(tempfile.gettempdir()) / f"overlay_{uuid.uuid4().hex}.html"
    tmp_html.write_text(rendered_html, encoding="utf-8")

    out_dir_path = Path(out_dir) if out_dir else Path(tempfile.gettempdir())
    out_dir_path.mkdir(parents=True, exist_ok=True)
    out_png = out_dir_path / f"overlay_{uuid.uuid4().hex}.png"

    vp = viewport or DEFAULT_VIEWPORT

    try:
        from playwright.async_api import async_playwright
    except ImportError as e:
        raise RuntimeError(
            "Playwright não instalado. Rode: "
            "`pip install playwright && playwright install chromium`"
        ) from e

    async with async_playwright() as p:
        browser = await p.chromium.launch(args=["--no-sandbox", "--disable-dev-shm-usage"])
        try:
            ctx = await browser.new_context(
                viewport=vp,
                device_scale_factor=1,
            )
            page = await ctx.new_page()
            await page.goto(tmp_html.as_uri(), wait_until="networkidle")
            # Espera fontes carregarem (Google Fonts é remoto).
            try:
                await page.evaluate("document.fonts.ready")
            except Exception:
                pass
            await page.screenshot(
                path=str(out_png),
                full_page=False,
                omit_background=True,  # ← gera PNG com transparência
                type="png",
            )
        finally:
            await browser.close()

    try:
        tmp_html.unlink()
    except OSError:
        pass

    logger.info(f"Overlay PNG gerado: {out_png}")
    return str(out_png)
