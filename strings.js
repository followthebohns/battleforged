// strings.js — Frases e utilitários de formatação dos esculachos
(function (global) {
  "use strict";

  // ======= VARIANTES VIBRANTES (para CRIT e EXPLOSÃO) =======
  const VIBRANT_STYLES = [
    [
      "color:#e11d48", // vibrante (rose)
      "background:linear-gradient(90deg, rgba(255,235,59,0.22), rgba(244,67,54,0.18), rgba(156,39,176,0.14))",
      "padding:0 .25rem",
      "border-radius:.25rem",
      "text-shadow:0 0 6px rgba(225,29,72,.45)"
    ].join(";"),
    [
      "color:#22d3ee",
      "background:linear-gradient(90deg, rgba(34,211,238,0.28), rgba(59,130,246,0.22), rgba(168,85,247,0.18))",
      "padding:0 .25rem","border-radius:.25rem","text-shadow:0 0 6px rgba(34,211,238,.45)"
    ].join(";"),
    [
      "color:#f97316",
      "background:linear-gradient(90deg, rgba(249,115,22,0.30), rgba(239,68,68,0.22), rgba(250,204,21,0.18))",
      "padding:0 .25rem","border-radius:.25rem","text-shadow:0 0 6px rgba(249,115,22,.45)"
    ].join(";"),
    [
      "color:#84cc16",
      "background:linear-gradient(90deg, rgba(132,204,22,0.28), rgba(34,197,94,0.20), rgba(16,185,129,0.16))",
      "padding:0 .25rem","border-radius:.25rem","text-shadow:0 0 6px rgba(132,204,22,.45)"
    ].join(";"),
    [
      "color:#8b5cf6",
      "background:linear-gradient(90deg, rgba(139,92,246,0.30), rgba(59,130,246,0.20), rgba(236,72,153,0.18))",
      "padding:0 .25rem","border-radius:.25rem","text-shadow:0 0 6px rgba(139,92,246,.45)"
    ].join(";"),
    [
      "color:#ef4444",
      "background:linear-gradient(90deg, rgba(239,68,68,0.32), rgba(244,63,94,0.24), rgba(251,146,60,0.18))",
      "padding:0 .25rem","border-radius:.25rem","text-shadow:0 0 6px rgba(239,68,68,.48)"
    ].join(";"),
    [
      "color:#f43f5e",
      "background:linear-gradient(90deg, rgba(244,63,94,0.32), rgba(244,114,182,0.22), rgba(99,102,241,0.16))",
      "padding:0 .25rem","border-radius:.25rem","text-shadow:0 0 6px rgba(244,63,94,.5)"
    ].join(";"),
    [
      "color:#14b8a6",
      "background:linear-gradient(90deg, rgba(20,184,166,0.30), rgba(34,197,94,0.20), rgba(59,130,246,0.18))",
      "padding:0 .25rem","border-radius:.25rem","text-shadow:0 0 6px rgba(20,184,166,.45)"
    ].join(";"),
  ];

  // ======= VARIANTES SUAVES (para acertos NORMAIS) =======
  const MUTED_STYLES = [
    [
      "color:#9ca3af",
      "background:linear-gradient(90deg, rgba(156,163,175,0.16), rgba(75,85,99,0.10), rgba(55,65,81,0.08))",
      "padding:0 .25rem","border-radius:.25rem","text-shadow:0 0 3px rgba(148,163,184,.25)"
    ].join(";"),
    [
      "color:#93c5fd",
      "background:linear-gradient(90deg, rgba(147,197,253,0.16), rgba(59,130,246,0.10), rgba(30,64,175,0.08))",
      "padding:0 .25rem","border-radius:.25rem","text-shadow:0 0 3px rgba(147,197,253,.25)"
    ].join(";"),
    [
      "color:#a7f3d0",
      "background:linear-gradient(90deg, rgba(167,243,208,0.16), rgba(16,185,129,0.10), rgba(5,150,105,0.08))",
      "padding:0 .25rem","border-radius:.25rem","text-shadow:0 0 3px rgba(167,243,208,.22)"
    ].join(";"),
    [
      "color:#fcd34d",
      "background:linear-gradient(90deg, rgba(252,211,77,0.14), rgba(245,158,11,0.10), rgba(217,119,6,0.08))",
      "padding:0 .25rem","border-radius:.25rem","text-shadow:0 0 3px rgba(252,211,77,.22)"
    ].join(";"),
    [
      "color:#c7d2fe",
      "background:linear-gradient(90deg, rgba(199,210,254,0.16), rgba(129,140,248,0.10), rgba(99,102,241,0.08))",
      "padding:0 .25rem","border-radius:.25rem","text-shadow:0 0 3px rgba(199,210,254,.22)"
    ].join(";"),
    [
      "color:#ddd6fe",
      "background:linear-gradient(90deg, rgba(221,214,254,0.16), rgba(167,139,250,0.10), rgba(124,58,237,0.08))",
      "padding:0 .25rem","border-radius:.25rem","text-shadow:0 0 3px rgba(221,214,254,.22)"
    ].join(";"),
    [
      "color:#fecaca",
      "background:linear-gradient(90deg, rgba(254,202,202,0.16), rgba(248,113,113,0.10), rgba(127,29,29,0.08))",
      "padding:0 .25rem","border-radius:.25rem","text-shadow:0 0 3px rgba(254,202,202,.22)"
    ].join(";"),
    [
      "color:#a5b4fc",
      "background:linear-gradient(90deg, rgba(165,180,252,0.16), rgba(99,102,241,0.10), rgba(79,70,229,0.08))",
      "padding:0 .25rem","border-radius:.25rem","text-shadow:0 0 3px rgba(165,180,252,.22)"
    ].join(";"),
  ];

  // --- utils ---
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /**
   * Converte [TEXTO] -> "<strong>[</strong><strong style="...">TEXTO</strong><strong>]</strong>"
   * Os colchetes ficam em negrito neutro (sem cor) e o texto interno recebe o estilo.
   * kind:
   *  - "normal" (padrão) -> usa MUTED_STYLES
   *  - "crit" / "explosion" -> usa VIBRANT_STYLES
   */
  function decorateEsculacho(str, kind = "normal") {
    if (!str) return str;
    const palette = (kind === "crit" || kind === "explosion") ? VIBRANT_STYLES : MUTED_STYLES;
    return str.replace(/\[([^\]]+)\]/g, (_, inner) => {
      const style = pick(palette);
      return `<strong>[</strong><strong style="${style}">${inner}</strong><strong>]</strong>`;
    });
  }

  /** Template simples {CHAVE} -> valor */
  function tpl(text, map) {
    if (!map) return text;
    return text.replace(/\{(\w+)\}/g, (_, k) => (map[k] ?? `{${k}}`));
  }

  /** Render final com intensidade */
  function render(text, map, kind = "normal") {
    return decorateEsculacho(tpl(text, map), kind);
  }

  // ================== LISTAS DE FRASES (restauradas) ==================
  const NORMAL_LINES = [
    "{ATACANTE} com {ARMA} [ACERTA] {ALVO}. {DANO} de dano.",
    "{ATACANTE} dispara {ARMA} e [IMPACTA] {ALVO}. {DANO} de dano.",
    "{ATACANTE} usa {ARMA} e [ABALA] {ALVO}. {DANO} de dano.",
    "{ATACANTE} com {ARMA} [PRESSIONA] {ALVO}. {DANO} de dano.",
    "{ATACANTE} com {ARMA} [ESTILHAÇA] a carcaça de {ALVO}. {DANO} de dano.",
    "{ATACANTE} com {ARMA} [TRINCA] a blindagem de {ALVO}. {DANO} de dano.",
    "{ATACANTE} com {ARMA} [MARCA] {ALVO}. {DANO} de dano.",
    "{ATACANTE} com {ARMA} [ARRANHA] {ALVO}. {DANO} de dano.",
    "{ATACANTE} com {ARMA} [CHACOALHA] {ALVO}. {DANO} de dano.",
    "{ATACANTE} com {ARMA} [RESPINGA FAÍSCAS] em {ALVO}. {DANO} de dano.",
    "{ATACANTE} usa {ARMA} e [DESESTABILIZA] {ALVO}. {DANO} de dano.",
    "{ATACANTE} com {ARMA} [ACERTA EM CHEIO] {ALVO}. {DANO} de dano.",
    "{ATACANTE} dispara {ARMA} e [VARRE] {ALVO}. {DANO} de dano.",
    "{ATACANTE} golpeia com {ARMA} e [ABRE FRESTAS] em {ALVO}. {DANO} de dano.",
    "{ATACANTE} com {ARMA} [FUSTIGA] {ALVO}. {DANO} de dano.",
    "{ATACANTE} com {ARMA} [RASPA] {ALVO}. {DANO} de dano.",
    "{ATACANTE} com {ARMA} [ATORDOA] {ALVO}. {DANO} de dano.",
    "{ATACANTE} com {ARMA} [DESBALANCEIA] {ALVO}. {DANO} de dano.",
    "{ATACANTE} com {ARMA} [TREME] {ALVO}. {DANO} de dano.",
    "{ATACANTE} com {ARMA} [CORROE] as defesas de {ALVO}. {DANO} de dano."
  ];

  const CRIT_LINES = [
    "{ATACANTE} com {ARMA} [OBLITERA] {ALVO}! {DANO} de dano!",
    "{ATACANTE} com {ARMA} [ARREGAÇA] {ALVO}! {DANO} de dano!",
    "{ATACANTE} com {ARMA} [DESTROÇA] {ALVO}! {DANO} de dano!",
    "{ATACANTE} com {ARMA} [TRITURA] {ALVO}! {DANO} de dano!",
    "{ATACANTE} com {ARMA} [ESMAGA] {ALVO}! {DANO} de dano!",
    "{ATACANTE} com {ARMA} [REDUZ A SUCATA] {ALVO}! {DANO} de dano!",
    "{ATACANTE} com {ARMA} [DESINTEGRA] {ALVO}! {DANO} de dano!",
    "{ATACANTE} com {ARMA} [DILACERA] {ALVO}! {DANO} de dano!",
    "{ATACANTE} com {ARMA} [ANULA] {ALVO}! {DANO} de dano!",
    "{ATACANTE} com {ARMA} [PASSA O TRATOR] em {ALVO}! {DANO} de dano!",
    "{ATACANTE} com {ARMA} [MOE NO ÓDIO] {ALVO}! {DANO} de dano!",
    "{ATACANTE} com {ARMA} [ARRANCA O COBRE] de {ALVO}! {DANO} de dano!",
    "{ATACANTE} com {ARMA} [FODE] {ALVO}! {DANO} de dano!",
    "{ATACANTE} com {ARMA} [BOTA PRA MAMAR] {ALVO}! {DANO} de dano!",
    "{ATACANTE} com {ARMA} [ABRE EM CANAL] {ALVO}! {DANO} de dano!",
    "{ATACANTE} com {ARMA} [ESFACELA] {ALVO}! {DANO} de dano!",
    "{ATACANTE} com {ARMA} [DESPEDEÇA] {ALVO}! {DANO} de dano!",
    "{ATACANTE} com {ARMA} [ARRASA] {ALVO}! {DANO} de dano!",
    "{ATACANTE} com {ARMA} [ARREBENTA] {ALVO}! {DANO} de dano!",
    "{ATACANTE} com {ARMA} [CARIMBA HUMILHAÇÃO] em {ALVO}! {DANO} de dano!",
    "{ATACANTE} com {ARMA} [PASSA O ROLO COMPRESSOR] em {ALVO}! {DANO} de dano!",
    "{ATACANTE} com {ARMA} [CANCELA O FUTURO] de {ALVO}! {DANO} de dano!",
    "{ATACANTE} com {ARMA} [APAGA O SORRISO] de {ALVO}! {DANO} de dano!",
    "{ATACANTE} com {ARMA} [ESMAGA A ALMA MECÂNICA] de {ALVO}! {DANO} de dano!",
    "{ATACANTE} com {ARMA} [ENTORTA O CHASSI] de {ALVO}! {DANO} de dano!"
  ];

  const EXPLOSION_LINES_STRONG = [
    "O dano da explosão [CARBONIZA] {ALVO}! -60 HP",
    "O dano da explosão [DERRETE] {ALVO}! -60 HP",
    "O dano da explosão [TRITURA] {ALVO}! -60 HP",
    "O dano da explosão [DESPEDAÇA] {ALVO}! -60 HP",
    "O dano da explosão [DIZIMA] {ALVO}! -60 HP",
    "O dano da explosão [ARRASA] {ALVO}! -60 HP",
    "O dano da explosão [REDUZ A CINZAS] {ALVO}! -60 HP",
    "O dano da explosão [ROMPE PLACAS] de {ALVO}! -60 HP",
    "O dano da explosão [TORRA CIRCUITOS] de {ALVO}! -60 HP",
    "O dano da explosão [RASGA BLINDAGEM] de {ALVO}! -60 HP"
  ];

  const EXPLOSION_LINES_BRUTAL = [
    "O dano da explosão [MASSACRA] {ALVO}! -60 HP",
    "O dano da explosão [DESOSSA] {ALVO}! -60 HP",
    "O dano da explosão [GUILHOTINA] {ALVO}! -60 HP",
    "O dano da explosão [EVAPORA] {ALVO}! -60 HP",
    "O dano da explosão [ESMIÚÇA] {ALVO}! -60 HP",
    "O dano da explosão [ARRANCA O CHASSI] de {ALVO}! -60 HP",
    "O dano da explosão [ESMAGA] {ALVO}! -60 HP",
    "O dano da explosão [ANIQUILA] {ALVO}! -60 HP",
    "O dano da explosão [PASSA O TRATOR] em {ALVO}! -60 HP",
    "O dano da explosão [CARIMBA HUMILHAÇÃO] em {ALVO}! -60 HP"
  ];

  // Exporta/atualiza o objeto global
  global.TextLines = {
    NORMAL_LINES,
    CRIT_LINES,
    EXPLOSION_LINES_STRONG,
    EXPLOSION_LINES_BRUTAL,
    decorateEsculacho, // colchetes em negrito, sem cor
    render,            // render(text, map, kind)
    tpl,
    pick,
  };
})(window);
