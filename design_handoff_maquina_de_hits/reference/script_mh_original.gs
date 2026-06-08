// ============================================================
// SCRIPT DE AUTOMAÇÃO DE PAUTAS + ENTREGAS — GOCASE  (v4)
// Mudanças nesta versão:
//   - verificarEntregas agora aceita filtros opcionais (creator, semana)
//   - Novo sidebar "Verificar entregas com filtros"
//   - Matching de arquivos robusto (ignora acento, normaliza separadores)
//   - Logs detalhados quando rodando em modo filtrado (diagnóstico)
// ============================================================

// ——— CONFIGURAÇÕES ——————————————————————————————————————————
var CONFIG = {
  PASTA_DOCS_ID: "1fT7sV7JYMcCtGQ5dMDAvOzkf_jzRTqGc",
  ABA_PLANILHA: "MH",

  COLUNAS: {
    SEMANA:       "A",
    NUM_VIDEO:    "B",
    DONO:         "C",
    TAKE_INICIAL: "D",
    REFERENCIA:   "E",
    OBS:          "F",
    PRODUTO:      "G",
    STATUS:       "H",
    LINK_VIDEO:   "I",
    LINK_DOC:     "P"
  },

  CREATORS:      ["CARINA", "MARINA", "REBECA", "RECICLADO", "THA"],
  STATUS_OPCOES: ["Em pauta", "Entregue", "Agendado"],

  PASTAS_CREATORS: {
    "CARINA":  "1P0eeOHQeIGWAXUQlyEJST9IKy1QfeD6A",
    "MARINA":  "1E7anbfKyxl243VSGA84gI3ZZYCwiS58A",
    "REBECA":  "1ibvsg3yw3uV_yw1i5FTd7OuvuMAciWDU",
    "THA":     "1W6O9YlZyuJGZiyOrxt0sksvHCPKCoWcv"
  }
};
// ———————————————————————————————————————————————————————————


// ============================================================
// MENU PERSONALIZADO
// ============================================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🎬 Pautas")
    .addItem("Abrir formulário de nova pauta", "abrirFormulario")
    .addSeparator()
    .addItem("Verificar entregas agora (tudo)", "verificarEntregasManual")
    .addItem("Verificar entregas com filtros…", "abrirFormularioVerificacao")
    .addItem("Ativar verificação diária automática", "configurarGatilhoDiario")
    .addToUi();
}


// ============================================================
// FORMULÁRIO LATERAL (SIDEBAR) — NOVA PAUTA
// (igual à versão anterior, sem mudanças)
// ============================================================
function abrirFormulario() {
  var htmlContent =
    '<!DOCTYPE html><html><head><base target="_top"><style>' +
    '* { box-sizing: border-box; font-family: Arial, sans-serif; }' +
    'body { padding: 16px; background: #fff; }' +
    'h2 { color: #e91e8c; font-size: 16px; margin-bottom: 16px; }' +
    'label { display: block; font-size: 12px; font-weight: bold; color: #444; margin-bottom: 4px; margin-top: 12px; }' +
    'input, select, textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; }' +
    'textarea { height: 72px; resize: vertical; }' +
    '.hint { font-size: 11px; color: #999; margin-top: 3px; }' +
    '.btn { width: 100%; margin-top: 18px; padding: 10px; background: #e91e8c; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: bold; cursor: pointer; }' +
    '.btn:hover { background: #c2185b; }' +
    '.btn-add { background: #f5f5f5; color: #333; margin-top: 8px; border: 1px solid #ddd; font-size: 13px; font-weight: normal; }' +
    '.btn-add:hover { background: #eee; }' +
    '.video-block { border: 1px solid #eee; border-radius: 8px; padding: 12px; margin-bottom: 12px; background: #fafafa; }' +
    '.video-title { font-weight: bold; color: #e91e8c; margin-bottom: 8px; font-size: 13px; }' +
    '.remove-btn { float: right; background: none; border: none; color: #999; cursor: pointer; font-size: 16px; }' +
    '.status { display: none; padding: 10px; border-radius: 6px; margin-top: 12px; font-size: 13px; }' +
    '.status.ok { display: block; background: #e8f5e9; color: #2e7d32; }' +
    '.status.err { display: block; background: #ffebee; color: #c62828; }' +
    '</style></head><body>' +
    '<h2>🎬 Nova pauta de vídeos</h2>' +
    '<label>Número da semana</label>' +
    '<input type="number" id="semana" placeholder="Ex: 85" />' +
    '<div class="hint">Será salvo como "SEMANA 85" — use o mesmo número na pasta do Drive</div>' +
    '<div id="videos-container" style="margin-top:16px"></div>' +
    '<button class="btn btn-add" onclick="adicionarVideo()">+ Adicionar vídeo</button>' +
    '<button class="btn" onclick="enviar()">Gerar docs e atualizar planilha</button>' +
    '<div id="status" class="status"></div>' +
    '<script>' +
    'var contador = 0;' +
    'var CREATORS = ["CARINA", "MARINA", "REBECA", "RECICLADO", "THA"];' +
    'function adicionarVideo() {' +
    '  contador++;' +
    '  var id = contador;' +
    '  var opts = CREATORS.map(function(c) { return "<option value=\'" + c + "\'>" + c + "</option>"; }).join("");' +
    '  var div = document.createElement("div");' +
    '  div.className = "video-block";' +
    '  div.id = "video-" + id;' +
    '  div.innerHTML = "<div class=\'video-title\'>Vídeo " + id + " <button class=\'remove-btn\' onclick=\'remover(" + id + ")\'>✕</button></div>"' +
    '    + "<label>Creator</label><select id=\'creator-" + id + "\'>" + opts + "</select>"' +
    '    + "<label>Hook / Take inicial</label><textarea id=\'hook-" + id + "\' placeholder=\'Ex: imagina isso num churrasco:\'></textarea>"' +
    '    + "<label>Link de referência</label><input type=\'url\' id=\'ref-" + id + "\' placeholder=\'https://www.instagram.com/reel/...\' />"' +
    '    + "<label>Produto foco</label><input type=\'text\' id=\'produto-" + id + "\' placeholder=\'Ex: copo térmico brasil\' />"' +
    '    + "<label>Áudio sugerido</label><input type=\'text\' id=\'audio-" + id + "\' placeholder=\'Ex: pagode / música br\' />"' +
    '    + "<label>Observações</label><textarea id=\'obs-" + id + "\' placeholder=\'Detalhes, adaptações...\'></textarea>"' +
    '    + "<label>Prazo de entrega</label><input type=\'text\' id=\'prazo-" + id + "\' placeholder=\'Ex: 28/04\' />";' +
    '  document.getElementById("videos-container").appendChild(div);' +
    '}' +
    'function remover(id) {' +
    '  var el = document.getElementById("video-" + id);' +
    '  if (el) el.remove();' +
    '}' +
    'function enviar() {' +
    '  var num = document.getElementById("semana").value.trim();' +
    '  if (!num) { mostrarStatus("Informe o número da semana.", "err"); return; }' +
    '  var blocos = document.querySelectorAll(".video-block");' +
    '  if (blocos.length === 0) { mostrarStatus("Adicione pelo menos um vídeo.", "err"); return; }' +
    '  var videos = [];' +
    '  for (var i = 0; i < blocos.length; i++) {' +
    '    var id = blocos[i].id.replace("video-", "");' +
    '    var get = function(field) { var el = document.getElementById(field + "-" + id); return el ? el.value : ""; };' +
    '    videos.push({ creator: get("creator"), hook: get("hook"), referencia: get("ref"), produto: get("produto"), audio: get("audio"), obs: get("obs"), prazo: get("prazo") });' +
    '  }' +
    '  mostrarStatus("Gerando documentos...", "ok");' +
    '  google.script.run' +
    '    .withSuccessHandler(function(msg) { mostrarStatus(msg, "ok"); })' +
    '    .withFailureHandler(function(err) { mostrarStatus("Erro: " + err.message, "err"); })' +
    '    .processarPautas({ semana: num, videos: videos });' +
    '}' +
    'function mostrarStatus(msg, tipo) {' +
    '  var el = document.getElementById("status");' +
    '  el.className = "status " + tipo;' +
    '  el.textContent = msg;' +
    '}' +
    'adicionarVideo();' +
    '<\/script></body></html>';

  SpreadsheetApp.getUi().showSidebar(
    HtmlService.createHtmlOutput(htmlContent).setTitle("Nova pauta").setWidth(380)
  );
}


// ============================================================
// FORMULÁRIO LATERAL — VERIFICAÇÃO COM FILTROS  (NOVO)
// ============================================================
function abrirFormularioVerificacao() {
  var creatorsOptions = CONFIG.CREATORS
    .map(function(c) { return '<option value="' + c + '">' + c + '</option>'; })
    .join("");

  var htmlContent =
    '<!DOCTYPE html><html><head><base target="_top"><style>' +
    '* { box-sizing: border-box; font-family: Arial, sans-serif; }' +
    'body { padding: 16px; background: #fff; }' +
    'h2 { color: #e91e8c; font-size: 16px; margin-bottom: 6px; }' +
    '.subtitle { font-size: 12px; color: #777; margin-bottom: 18px; }' +
    'label { display: block; font-size: 12px; font-weight: bold; color: #444; margin-bottom: 4px; margin-top: 12px; }' +
    'input, select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; }' +
    '.hint { font-size: 11px; color: #999; margin-top: 3px; }' +
    '.btn { width: 100%; margin-top: 20px; padding: 10px; background: #e91e8c; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: bold; cursor: pointer; }' +
    '.btn:hover { background: #c2185b; }' +
    '.btn:disabled { background: #ccc; cursor: wait; }' +
    '.status { display: none; padding: 10px; border-radius: 6px; margin-top: 14px; font-size: 13px; white-space: pre-wrap; }' +
    '.status.ok  { display: block; background: #e8f5e9; color: #2e7d32; }' +
    '.status.err { display: block; background: #ffebee; color: #c62828; }' +
    '.status.info { display: block; background: #e3f2fd; color: #1565c0; }' +
    '.log-box { display: none; margin-top: 14px; padding: 10px; background: #263238; color: #aed581; border-radius: 6px; font-family: monospace; font-size: 11px; max-height: 300px; overflow-y: auto; white-space: pre-wrap; }' +
    '</style></head><body>' +
    '<h2>🔍 Verificar entregas</h2>' +
    '<div class="subtitle">Deixe em branco para verificar tudo, ou filtre por creator/semana.</div>' +
    '<label>Creator</label>' +
    '<select id="creator">' +
    '  <option value="">— Todas —</option>' +
    creatorsOptions +
    '</select>' +
    '<label>Semana</label>' +
    '<input type="text" id="semana" placeholder="Ex: 85 (ou em branco para todas)" />' +
    '<div class="hint">Pode digitar só o número (85) ou "SEMANA 85".</div>' +
    '<button class="btn" id="btn-run" onclick="rodar()">Rodar verificação</button>' +
    '<div id="status" class="status"></div>' +
    '<div id="log" class="log-box"></div>' +
    '<script>' +
    'function rodar() {' +
    '  var btn = document.getElementById("btn-run");' +
    '  btn.disabled = true;' +
    '  btn.textContent = "Verificando...";' +
    '  var creator = document.getElementById("creator").value;' +
    '  var semana = document.getElementById("semana").value.trim();' +
    '  mostrarStatus("Rodando verificação...", "info");' +
    '  document.getElementById("log").style.display = "none";' +
    '  google.script.run' +
    '    .withSuccessHandler(function(res) {' +
    '      btn.disabled = false;' +
    '      btn.textContent = "Rodar verificação";' +
    '      var tipo = res.atualizacoes > 0 ? "ok" : "info";' +
    '      mostrarStatus(res.mensagem, tipo);' +
    '      if (res.logs && res.logs.length > 0) {' +
    '        var logEl = document.getElementById("log");' +
    '        logEl.textContent = res.logs.join("\\n");' +
    '        logEl.style.display = "block";' +
    '      }' +
    '    })' +
    '    .withFailureHandler(function(err) {' +
    '      btn.disabled = false;' +
    '      btn.textContent = "Rodar verificação";' +
    '      mostrarStatus("Erro: " + err.message, "err");' +
    '    })' +
    '    .verificarEntregasComFiltro({ creator: creator, semana: semana });' +
    '}' +
    'function mostrarStatus(msg, tipo) {' +
    '  var el = document.getElementById("status");' +
    '  el.className = "status " + tipo;' +
    '  el.textContent = msg;' +
    '}' +
    '<\/script></body></html>';

  SpreadsheetApp.getUi().showSidebar(
    HtmlService.createHtmlOutput(htmlContent).setTitle("Verificar entregas").setWidth(380)
  );
}


// ============================================================
// PROCESSAMENTO DE PAUTAS  (sem mudanças)
// ============================================================
function processarPautas(dados) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var aba   = ss.getSheetByName(CONFIG.ABA_PLANILHA);
  var pasta = DriveApp.getFolderById(CONFIG.PASTA_DOCS_ID);

  if (!aba)   throw new Error('Aba "' + CONFIG.ABA_PLANILHA + '" não encontrada.');
  if (!pasta) throw new Error("Pasta de docs não encontrada. Verifique o PASTA_DOCS_ID.");

  var semanaLabel = "SEMANA " + dados.semana;

  var porCreator = {};
  for (var i = 0; i < dados.videos.length; i++) {
    var v = dados.videos[i];
    if (!porCreator[v.creator]) porCreator[v.creator] = [];
    porCreator[v.creator].push(v);
  }

  var creatorsProcessadas = [];

  for (var creator in porCreator) {
    var videos = porCreator[creator];
    var urlDoc = atualizarDocMae(pasta, creator, semanaLabel, videos);
    creatorsProcessadas.push(creator);

    var existentes = contarVideosExistentes(aba, creator, semanaLabel);
    for (var j = 0; j < videos.length; j++) {
      adicionarLinhaPlanilha(aba, videos[j], semanaLabel, urlDoc, existentes + j + 1);
    }
  }

  return "✅ " + dados.videos.length + " vídeo(s) processados. Docs atualizados para: " + creatorsProcessadas.join(", ") + ".";
}

function contarVideosExistentes(aba, creator, semanaLabel) {
  var dados     = aba.getDataRange().getValues();
  var idxDono   = CONFIG.COLUNAS.DONO.charCodeAt(0)   - 65;
  var idxSemana = CONFIG.COLUNAS.SEMANA.charCodeAt(0) - 65;
  var count = 0;
  for (var i = 1; i < dados.length; i++) {
    var d = String(dados[i][idxDono]).trim().toUpperCase();
    var s = String(dados[i][idxSemana]).trim().toUpperCase();
    if (d === creator.toUpperCase() && s === semanaLabel.toUpperCase()) count++;
  }
  return count;
}


// ============================================================
// DOC MÃE  (sem mudanças — mantidas todas as funções)
// ============================================================
function atualizarDocMae(pasta, creator, semanaLabel, videos) {
  var nomeDoc = "Pautas " + creator;
  var doc     = null;
  var docNovo = false;

  var arquivos = pasta.getFilesByName(nomeDoc);
  if (arquivos.hasNext()) {
    doc = DocumentApp.openById(arquivos.next().getId());
  } else {
    doc     = DocumentApp.create(nomeDoc);
    docNovo = true;
  }

  var body  = doc.getBody();
  var docId = doc.getId();

  if (docNovo) {
    body.clear();
    var titulo = body.appendParagraph("PAUTAS DE CONTEÚDO — " + creator);
    titulo.setHeading(DocumentApp.ParagraphHeading.HEADING1);
    adicionarBlocoSemanaFim(body, semanaLabel, videos);
  } else {
    inserirBlocoSemanaInicio(body, semanaLabel, videos);
  }

  doc.saveAndClose();

  if (docNovo) {
    var arquivo = DriveApp.getFileById(docId);
    pasta.addFile(arquivo);
    DriveApp.getRootFolder().removeFile(arquivo);
  }

  return "https://docs.google.com/document/d/" + docId;
}

function adicionarBlocoSemanaFim(body, semanaLabel, videos) {
  var h2 = body.appendParagraph("📅 " + semanaLabel);
  h2.setHeading(DocumentApp.ParagraphHeading.HEADING2);

  for (var i = 0; i < videos.length; i++) {
    var video = videos[i];
    var num   = (i + 1) < 10 ? "0" + (i + 1) : String(i + 1);

    var h3 = body.appendParagraph("VÍDEO " + num);
    h3.setHeading(DocumentApp.ParagraphHeading.HEADING3);

    var tabela = body.appendTable([
      ["TÍTULO / HOOK",  video.hook       || "—"],
      ["REFERÊNCIA",     video.referencia || "—"],
      ["PRODUTO FOCO",   video.produto    || "—"],
      ["ÁUDIO",          video.audio      || "—"],
      ["OBSERVAÇÕES",    video.obs        || "—"],
      ["PRAZO",          video.prazo      || "—"]
    ]);
    formatarTabela(tabela);
    aplicarLinkNaReferencia(tabela, video.referencia);

    body.appendParagraph("");
  }
}

function inserirBlocoSemanaInicio(body, semanaLabel, videos) {
  var idx = 1;

  var sep = body.insertParagraph(idx, "─────────────────────────────────────────");
  sep.setForegroundColor("#cccccc");
  sep.setSpacingBefore(16);
  sep.setSpacingAfter(16);

  for (var i = videos.length - 1; i >= 0; i--) {
    var video = videos[i];
    var num   = (i + 1) < 10 ? "0" + (i + 1) : String(i + 1);

    body.insertParagraph(idx, "");

    var tabela = body.insertTable(idx, [
      ["TÍTULO / HOOK",  video.hook       || "—"],
      ["REFERÊNCIA",     video.referencia || "—"],
      ["PRODUTO FOCO",   video.produto    || "—"],
      ["ÁUDIO",          video.audio      || "—"],
      ["OBSERVAÇÕES",    video.obs        || "—"],
      ["PRAZO",          video.prazo      || "—"]
    ]);
    formatarTabela(tabela);
    aplicarLinkNaReferencia(tabela, video.referencia);

    var h3 = body.insertParagraph(idx, "VÍDEO " + num);
    h3.setHeading(DocumentApp.ParagraphHeading.HEADING3);
  }

  var h2 = body.insertParagraph(idx, "📅 " + semanaLabel);
  h2.setHeading(DocumentApp.ParagraphHeading.HEADING2);
  h2.setSpacingBefore(8);
}

function formatarTabela(tabela) {
  tabela.setBorderWidth(1);
  tabela.setBorderColor("#dddddd");
  for (var r = 0; r < tabela.getNumRows(); r++) {
    var celula = tabela.getRow(r).getCell(0);
    celula.setBackgroundColor("#fce4ec");
    celula.getChild(0).asParagraph().editAsText().setBold(true);
    celula.setWidth(130);
  }
}

function aplicarLinkNaReferencia(tabela, url) {
  if (!url || url === "—" || url.indexOf("http") !== 0) return;
  var celula = tabela.getRow(1).getCell(1);
  celula.clear();
  var texto = celula.editAsText();
  texto.setText(url + "\t");
  texto.setLinkUrl(0, url.length - 1, url);
}


// ============================================================
// ADICIONAR LINHA NA PLANILHA  (sem mudanças)
// ============================================================
function adicionarLinhaPlanilha(aba, video, semanaLabel, urlDoc, numVideo) {
  var col       = CONFIG.COLUNAS;
  var novaLinha = aba.getLastRow() + 1;

  var mapa = {};
  mapa[col.TAKE_INICIAL] = video.hook;
  mapa[col.REFERENCIA]   = video.referencia;
  mapa[col.OBS]          = video.obs;
  mapa[col.PRODUTO]      = video.produto;
  mapa[col.DONO]         = video.creator;
  mapa[col.STATUS]       = "Em pauta";
  mapa[col.SEMANA]       = semanaLabel;
  mapa[col.LINK_DOC]     = urlDoc;
  mapa[col.LINK_VIDEO]   = "";
  mapa[col.NUM_VIDEO]    = "vídeo " + numVideo;

  for (var colLetra in mapa) {
    var colIndex = colLetra.charCodeAt(0) - 64;
    aba.getRange(novaLinha, colIndex).setValue(mapa[colLetra] || "");
  }

  aba.getRange(novaLinha, col.TAKE_INICIAL.charCodeAt(0) - 64)
    .setHorizontalAlignment("left");

  aba.getRange(novaLinha, col.DONO.charCodeAt(0) - 64)
    .setDataValidation(
      SpreadsheetApp.newDataValidation()
        .requireValueInList(CONFIG.CREATORS, true).build()
    );

  aba.getRange(novaLinha, col.STATUS.charCodeAt(0) - 64)
    .setDataValidation(
      SpreadsheetApp.newDataValidation()
        .requireValueInList(CONFIG.STATUS_OPCOES, true).build()
    )
    .setBackground("#fff3cd")
    .setFontColor("#856404");
}


// ============================================================
// HELPER: NORMALIZAR STRING (remove acento, lowercase, trim)
// ============================================================
function normalizar(str) {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // remove acentos
}


// ============================================================
// VERIFICAÇÃO DE ENTREGAS — VERSÃO COM FILTROS  (REFATORADA)
//
// Aceita filtros opcionais. Se filtros vazios → verifica tudo.
// Retorna { atualizacoes: N, mensagem: "...", logs: [...] }
// ============================================================
function verificarEntregasComFiltro(filtros) {
  filtros = filtros || {};
  var filtroCreator = filtros.creator ? String(filtros.creator).trim().toUpperCase() : "";
  var filtroSemana  = filtros.semana  ? String(filtros.semana).trim()  : "";

  // Normaliza filtro de semana: "85" → "SEMANA 85"
  if (filtroSemana && /^\d+$/.test(filtroSemana)) {
    filtroSemana = "SEMANA " + filtroSemana;
  }
  filtroSemana = filtroSemana.toUpperCase();

  var modoFiltrado = !!(filtroCreator || filtroSemana);
  var logs = [];

  function log(msg) {
    Logger.log(msg);
    if (modoFiltrado) logs.push(msg);
  }

  log("=== Iniciando verificação ===");
  if (filtroCreator) log("Filtro creator: " + filtroCreator);
  if (filtroSemana)  log("Filtro semana: " + filtroSemana);
  if (!modoFiltrado) log("Modo: verificar tudo");

  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var aba   = ss.getSheetByName(CONFIG.ABA_PLANILHA);
  var dados = aba.getDataRange().getValues();

  var col        = CONFIG.COLUNAS;
  var idxDono    = col.DONO.charCodeAt(0)       - 65;
  var idxStatus  = col.STATUS.charCodeAt(0)     - 65;
  var idxSemana  = col.SEMANA.charCodeAt(0)     - 65;
  var idxNumVid  = col.NUM_VIDEO.charCodeAt(0)  - 65;
  var idxLinkVid = col.LINK_VIDEO.charCodeAt(0) - 65;

  var atualizacoes = 0;
  var linhasInspecionadas = 0;

  for (var i = 1; i < dados.length; i++) {
    var linha   = dados[i];
    var status  = String(linha[idxStatus]).trim();
    if (status !== "Em pauta") continue;

    var creator = String(linha[idxDono]).trim().toUpperCase();
    var semana  = String(linha[idxSemana]).trim().toUpperCase();
    if (/^\d+$/.test(semana)) semana = "SEMANA " + semana;
    var numVideo = String(linha[idxNumVid]).trim().toLowerCase();

    if (!creator || !semana || !numVideo) continue;

    // Aplica filtros
    if (filtroCreator && creator !== filtroCreator) continue;
    if (filtroSemana  && semana  !== filtroSemana)  continue;

    linhasInspecionadas++;
    log("\n— Linha " + (i + 1) + " | " + creator + " | " + semana + " | " + numVideo);

    var pastaId = CONFIG.PASTAS_CREATORS[creator];
    if (!pastaId) {
      log("  ⏭️  Creator sem pasta mapeada — pulando.");
      continue;
    }

    try {
      var pastaCreator = DriveApp.getFolderById(pastaId);

      // Busca subpasta da semana — agora case-insensitive
      var semanaFolder = encontrarPastaSemana(pastaCreator, semana);
      if (!semanaFolder) {
        log("  ❌ Pasta '" + semana + "' não encontrada dentro de " + creator);
        continue;
      }
      log("  📁 Pasta encontrada: " + semanaFolder.getName());

      // Verifica os 3 arquivos do vídeo (matching robusto)
      var resultado = verificarArquivosDoVideo(semanaFolder, numVideo, log);

      var temAlgumArquivo = resultado.semTexto || resultado.comTexto || resultado.capa;

      if (temAlgumArquivo) {
        var linhaNum = i + 1;

        aba.getRange(linhaNum, idxStatus + 1)
          .setValue("Entregue")
          .setBackground("#d4edda")
          .setFontColor("#155724");

        aba.getRange(linhaNum, idxLinkVid + 1)
          .setValue(semanaFolder.getUrl());

        marcarCheckNoDoc(creator, semana, numVideo);

        atualizacoes++;
        log("  ✅ ENTREGUE — arquivos: " +
            (resultado.semTexto ? "sem texto " : "") +
            (resultado.comTexto ? "com texto " : "") +
            (resultado.capa     ? "capa"       : ""));
      } else {
        log("  ⏳ Nenhum arquivo encontrado para este vídeo na pasta.");
      }

    } catch(e) {
      log("  ⚠️  Erro: " + e.message);
    }
  }

  log("\n=== Fim ===");
  log("Linhas 'Em pauta' inspecionadas: " + linhasInspecionadas);
  log("Atualizações: " + atualizacoes);

  var mensagem = atualizacoes > 0
    ? "✅ " + atualizacoes + " entrega(s) atualizada(s) (" + linhasInspecionadas + " linha(s) verificada(s))."
    : "Nenhuma entrega nova. " + linhasInspecionadas + " linha(s) inspecionada(s).";

  return { atualizacoes: atualizacoes, mensagem: mensagem, logs: logs };
}

// Busca a pasta da semana ignorando case e variações de acento
function encontrarPastaSemana(pastaCreator, semanaAlvo) {
  var alvo = normalizar(semanaAlvo);
  var subpastas = pastaCreator.getFolders();
  while (subpastas.hasNext()) {
    var p = subpastas.next();
    if (normalizar(p.getName()) === alvo) return p;
  }
  return null;
}

// Remove qualquer tipo de hífen/traço/espaço especial e deixa só alfanumérico + espaço simples
function normalizarAgressivo(str) {
  return normalizar(str)
    .replace(/[\u002D\u2010\u2011\u2012\u2013\u2014\u2015\u2212\uFE58\uFE63\uFF0D]/g, " ") // todos os tipos de hífen → espaço
    .replace(/\s+/g, " ") // múltiplos espaços → um
    .trim();
}

// Verifica se os 3 arquivos do vídeo existem na pasta (matching ultra-robusto)
function verificarArquivosDoVideo(semanaFolder, numVideo, log) {
  // numVideo vem como "vídeo 1" — extrai o número
  var match = numVideo.match(/(\d+)/);
  if (!match) return { semTexto: false, comTexto: false, capa: false };
  var num = parseInt(match[1], 10);

  var resultado = { semTexto: false, comTexto: false, capa: false };
  var arquivosEncontrados = [];

  var arquivos = semanaFolder.getFiles();
  while (arquivos.hasNext()) {
    var nome = arquivos.next().getName();
    arquivosEncontrados.push(nome);

    // Normalização agressiva: remove acentos, transforma todos os hífens em espaço,
    // colapsa espaços, lowercase → ex: "Vídeo 1 - Sem Texto.mp4" → "video 1  sem texto.mp4"
    var nomeNorm = normalizarAgressivo(nome);

    // Extrai o número que vem após "video " no nome do arquivo
    var mNum = nomeNorm.match(/^video\s+(\d+)\s/);
    if (!mNum) continue;

    var numArquivo = parseInt(mNum[1], 10);

    // O número deve bater EXATAMENTE (evita video 1 bater com video 10)
    if (numArquivo !== num) continue;

    // Tudo após "video N " é o tipo do arquivo
    var tipo = nomeNorm.replace(/^video\s+\d+\s+/, "").trim();

    if (tipo.indexOf("sem texto") === 0) resultado.semTexto = true;
    if (tipo.indexOf("com texto") === 0) resultado.comTexto = true;
    if (tipo.indexOf("capa")      === 0) resultado.capa     = true;

    if (log) log("  🔎 Arquivo: '" + nome + "' → normalizado: '" + nomeNorm + "' → tipo: '" + tipo + "'");
  }

  if (log && arquivosEncontrados.length > 0) {
    log("  📄 Arquivos na pasta: " + arquivosEncontrados.join(", "));
  } else if (log) {
    log("  📄 Pasta vazia.");
  }

  return resultado;
}


// ============================================================
// VERIFICAR ENTREGAS — função antiga (mantida pro gatilho diário)
// Agora apenas chama a versão refatorada sem filtros
// ============================================================
function verificarEntregas() {
  var res = verificarEntregasComFiltro({});
  return res.atualizacoes;
}

function verificarEntregasManual() {
  var res = verificarEntregasComFiltro({});
  var msg = res.atualizacoes > 0
    ? "✅ " + res.atualizacoes + " entrega(s) nova(s) detectada(s) e atualizada(s)!"
    : "Nenhuma entrega nova encontrada no momento.";
  SpreadsheetApp.getUi().alert(msg);
}


// ============================================================
// MARCAR ✅ NA TABELA DE CONTROLE DO DOC MÃE  (sem mudanças)
// ============================================================
function marcarCheckNoDoc(creator, semana, numVideo) {
  try {
    var pasta    = DriveApp.getFolderById(CONFIG.PASTA_DOCS_ID);
    var arquivos = pasta.getFilesByName("Pautas " + creator);
    if (!arquivos.hasNext()) return;

    var doc    = DocumentApp.openById(arquivos.next().getId());
    var body   = doc.getBody();
    var tables = body.getTables();

    var numStr     = numVideo.replace(/[^0-9]/g, "");
    var videoLabel = "VÍDEO " + (numStr.length === 1 ? "0" + numStr : numStr);

    for (var t = 0; t < tables.length; t++) {
      var tabela = tables[t];
      if (tabela.getNumRows() < 2 || tabela.getNumColumns() < 2) continue;

      var headerRow = tabela.getRow(0);
      var colSemana = -1;
      for (var c = 1; c < headerRow.getNumCells(); c++) {
        var header = headerRow.getCell(c).getText().trim().toUpperCase();
        if (header === semana) {
          colSemana = c;
          break;
        }
      }
      if (colSemana === -1) continue;

      for (var r = 1; r < tabela.getNumRows(); r++) {
        var rowLabel = tabela.getRow(r).getCell(0).getText().trim().toUpperCase();
        if (rowLabel === videoLabel) {
          var celula = tabela.getRow(r).getCell(colSemana);
          celula.clear();
          celula.appendParagraph("✅");
          break;
        }
      }
    }

    doc.saveAndClose();
    Logger.log("Check marcado no doc de " + creator + " — " + videoLabel + " / " + semana);

  } catch(e) {
    Logger.log("Erro ao marcar check no doc de " + creator + ": " + e.message);
  }
}


// ============================================================
// GATILHO DIÁRIO  (sem mudanças)
// ============================================================
function configurarGatilhoDiario() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "verificarEntregas") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  ScriptApp.newTrigger("verificarEntregas")
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();

  SpreadsheetApp.getUi().alert(
    "✅ Pronto!\n\nA verificação de entregas vai rodar automaticamente todo dia às 9h.\n\n" +
    "Você também pode acionar manualmente pelo menu:\n🎬 Pautas > Verificar entregas agora"
  );
}


// ============================================================
// AUXILIAR — PREENCHER COLUNA B  (sem mudanças)
// ============================================================
function preencherNumVideo() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var aba   = ss.getSheetByName(CONFIG.ABA_PLANILHA);
  var dados = aba.getDataRange().getValues();

  var idxNum    = CONFIG.COLUNAS.NUM_VIDEO.charCodeAt(0)    - 65;
  var idxDono   = CONFIG.COLUNAS.DONO.charCodeAt(0)         - 65;
  var idxSemana = CONFIG.COLUNAS.SEMANA.charCodeAt(0)       - 65;

  var contadores = {};
  var atualizados = 0;

  for (var i = 1; i < dados.length; i++) {
    var linha  = dados[i];
    var semana = String(linha[idxSemana]).trim();
    var dono   = String(linha[idxDono]).trim().toUpperCase();
    var numVid = String(linha[idxNum]).trim();

    if (numVid !== "" && numVid !== "0") continue;
    if (!semana || !dono || dono === "") continue;

    var chave = dono + "|" + semana;
    if (!contadores[chave]) contadores[chave] = 0;
    contadores[chave]++;

    var valorNovo = "vídeo " + contadores[chave];
    aba.getRange(i + 1, idxNum + 1).setValue(valorNovo);
    atualizados++;
  }

  SpreadsheetApp.getUi().alert(
    "✅ Coluna Nº Vídeo preenchida!\n\n" +
    atualizados + " linha(s) atualizada(s).\n\n" +
    "Agora rode o menu 🎬 Pautas > Verificar entregas agora."
  );
}