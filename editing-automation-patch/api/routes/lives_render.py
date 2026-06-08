"""
Rotas dedicadas ao fluxo de Lives da Gocase: aplicar overlay HTML (template
+ variáveis) sobre vídeo do Meta Ads e subir pro Dropbox.

Endpoint principal:
    POST /lives/render-overlay

Pensado pra ser chamado pelo n8n no workflow semanal disparado pelo SocialHub.
"""

from __future__ import annotations

import logging
import os
import shutil
import tempfile
import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from api.services.html_render_service import render_overlay_png, list_templates
from api.services.dropbox_service import DropboxService
from utils.ffmpeg_operations import processar_video

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── Models ──────────────────────────────────────────────────────────────────

class RenderOverlayRequest(BaseModel):
    template: str = Field(..., description="Nome do template HTML em templates/lives/ (sem .html)")
    variables: Dict[str, str] = Field(..., description="Placeholders do template ({{ var }} → valor)")
    video_url: str = Field(..., description="URL pública do vídeo de entrada (Meta CDN, etc.)")
    dropbox_path: str = Field(..., description="Caminho final no Dropbox (ex: /MKT SOCIAL/LIVES/semana-2026-22/segunda.mp4)")
    output_name: Optional[str] = Field(None, description="Nome base do arquivo final. Default = derivado do template.")
    replace_audio: bool = Field(False, description="Se true, exige audio_url; substitui o áudio do vídeo.")
    audio_url: Optional[str] = Field(None, description="URL do áudio a substituir (opcional).")


class RenderOverlayResponse(BaseModel):
    success: bool
    dropbox_path: str
    duration_seconds: float
    output_filename: str
    message: str = ""


class TemplatesListResponse(BaseModel):
    templates: list[str]
    templates_dir: str


# ─── Helpers ─────────────────────────────────────────────────────────────────

async def _download_to(url: str, dest: Path, timeout: int = 120) -> None:
    """Baixa um arquivo remoto em stream pra `dest`."""
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        async with client.stream("GET", url) as resp:
            resp.raise_for_status()
            with dest.open("wb") as f:
                async for chunk in resp.aiter_bytes(chunk_size=1024 * 64):
                    f.write(chunk)


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.get("/templates", response_model=TemplatesListResponse)
async def get_templates():
    """Lista os templates HTML disponíveis para overlay de live."""
    from api.services.html_render_service import TEMPLATES_DIR
    return TemplatesListResponse(
        templates=list_templates(),
        templates_dir=str(TEMPLATES_DIR),
    )


@router.post("/render-overlay", response_model=RenderOverlayResponse)
async def render_overlay(request: RenderOverlayRequest):
    """
    Pipeline completo:
      1. Renderiza HTML → PNG (transparente, 1080x1920).
      2. Baixa o vídeo da `video_url`.
      3. (Opcional) Baixa áudio se `replace_audio=true`.
      4. FFmpeg overlay (reusa `processar_video` existente).
      5. Upload pro Dropbox em `dropbox_path`.
      6. Limpa temporários.

    Sincrono — ideal pra ser chamado num loop do n8n (1 vídeo por vez).
    Para batch async, use o fluxo /processing/trigger existente.
    """
    start = time.time()
    work_dir = Path(tempfile.mkdtemp(prefix="lives_render_"))
    try:
        # 1) Render overlay PNG
        logger.info(f"[lives_render] template={request.template} vars={list(request.variables.keys())}")
        overlay_png = await render_overlay_png(
            template_name=request.template,
            variables=request.variables,
            out_dir=str(work_dir),
        )

        # 2) Download vídeo
        video_path = work_dir / "input.mp4"
        logger.info(f"[lives_render] baixando vídeo de {request.video_url[:80]}...")
        try:
            await _download_to(request.video_url, video_path)
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"Falha baixando vídeo: {e}")

        # 3) Audio opcional
        audio_path: Optional[str] = None
        if request.replace_audio:
            if not request.audio_url:
                raise HTTPException(status_code=400, detail="replace_audio=true exige audio_url")
            audio_dest = work_dir / "audio.mp3"
            await _download_to(request.audio_url, audio_dest)
            audio_path = str(audio_dest)

        # 4) Processar com overlay
        output_dir = work_dir / "out"
        output_dir.mkdir(parents=True, exist_ok=True)
        nome_base = request.output_name or f"{request.template}_{uuid.uuid4().hex[:8]}"
        logger.info(f"[lives_render] aplicando overlay (ffmpeg)...")
        out_path = processar_video(
            input_path=str(video_path),
            overlay_path=overlay_png,
            audio_path=audio_path,
            output_dir=str(output_dir),
            nome_personalizado=nome_base,
            substituir_audio=bool(audio_path),
        )
        if not out_path or not Path(out_path).exists():
            raise HTTPException(status_code=500, detail="FFmpeg não produziu vídeo de saída")

        output_filename = Path(out_path).name

        # 5) Upload Dropbox
        logger.info(f"[lives_render] upload pra Dropbox: {request.dropbox_path}")
        dbx = DropboxService()
        ok = dbx.upload_file(local_path=out_path, remote_path=request.dropbox_path)
        if not ok:
            raise HTTPException(status_code=502, detail=f"Falha no upload pro Dropbox: {request.dropbox_path}")

        duration = round(time.time() - start, 2)
        return RenderOverlayResponse(
            success=True,
            dropbox_path=request.dropbox_path,
            duration_seconds=duration,
            output_filename=output_filename,
            message=f"OK em {duration}s",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("[lives_render] erro")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # 6) Cleanup
        try:
            shutil.rmtree(work_dir, ignore_errors=True)
        except Exception:
            pass
