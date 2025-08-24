// game.js — Estado, UI, logs, turnos e integração com Combat
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // Containers / elementos principais
  const logsEl =
    document.getElementById("logsContainer") ||
    document.getElementById("combatLog") ||
    document.getElementById("log");

  const playerStatusBtn   = document.getElementById("playerStatusBtn");
  const enemyStatusBtn    = document.getElementById("enemyStatusBtn");
  const playerHealthBadge = document.getElementById("playerHealthValue");
  const enemyHealthBadge  = document.getElementById("enemyHealthValue");

  const playerPanel       = document.getElementById("playerPanel");
  const enemyPanel        = document.getElementById("enemyPanel");
  const closePlayerPanel  = document.getElementById("closePlayerPanel");
  const closeEnemyPanel   = document.getElementById("closeEnemyPanel");
  const overlay           = document.getElementById("overlay");

  const mainAttackBtn     = document.getElementById("mainAttackBtn");
  const actionButtons     = document.querySelectorAll(".action-btn");

  // Timings
  const TYPE_SPEED_MS        = 28;
  const DEFAULT_LOG_GAP_MS   = 150;
  const INITIAL_LOG_GAP_MS   = 100;
  const IA_THINK_MS          = 2000;

  // Estado do jogo
  const state = {
    player: { hp: 200, maxHp: 200, temp: 0, weapon: null, reactorExploded: false, overheatActive: false, overheatDoT: 0 },
    enemy:  { hp: 200, maxHp: 200, temp: 0, weapon: null, reactorExploded: false, overheatActive: false, overheatDoT: 0 },
    distance: 5,
    turn: null,
    lock: true
  };

  // Controle para exibir modal de fim de jogo apenas uma vez
  let endDialogScheduled = false;

  if (logsEl) logsEl.style.setProperty("scroll-behavior", "auto", "important");

  // Badges de temperatura sob os status-buttons
  function ensureTempBadges() {
    function insertTempBadge(btn, id) {
      if (!btn) return;
      if (document.getElementById(id)) return;
      const label = btn.querySelector(".status-label");
      const badge = document.createElement("div");
      badge.id = id;
      badge.className = "status-temp-badge";
      badge.textContent = "0°C";
      if (label && label.parentNode) label.parentNode.insertBefore(badge, label.nextSibling);
      else btn.appendChild(badge);
    }
    insertTempBadge(playerStatusBtn, "playerTempBadge");
    insertTempBadge(enemyStatusBtn,  "enemyTempBadge");
  }
  ensureTempBadges();

  function wait(ms) { return new Promise(res => setTimeout(res, ms)); }

  // Digitação com SUPORTE A HTML
  async function typeHTML(targetEl, html, speed = TYPE_SPEED_MS) {
    if (!targetEl) return;
    const container = document.createElement("div");
    container.innerHTML = html;
    async function walk(srcNode, dstParent) {
      for (const node of Array.from(srcNode.childNodes)) {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.nodeValue || "";
          const textNode = document.createTextNode("");
          dstParent.appendChild(textNode);
          for (let i = 0; i < text.length; i++) {
            textNode.nodeValue += text.charAt(i);
            if (logsEl) logsEl.scrollTop = logsEl.scrollHeight;
            await wait(speed);
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const clone = node.cloneNode(false);
          dstParent.appendChild(clone);
          if (node.tagName === "STYLE" || node.tagName === "SCRIPT") {
            clone.textContent = node.textContent || "";
          } else {
            await walk(node, clone);
          }
        }
      }
    }
    await walk(container, targetEl);
  }

  let logQueue = Promise.resolve();

  // Log com digitação que respeita HTML
  function logMessage(text, gapAfter = DEFAULT_LOG_GAP_MS) {
    const TL = window.TextLines || {};
    const hasHTML = /<[^>]+>/.test(text);
    const html = hasHTML
      ? text
      : (typeof TL.decorateEsculacho === "function" ? TL.decorateEsculacho(text, "normal") : text);

    logQueue = logQueue.then(async () => {
      if (!logsEl) return;
      const entry = document.createElement("div");
      entry.className = "log-entry";
      logsEl.appendChild(entry);
      await typeHTML(entry, html, TYPE_SPEED_MS);
      if (logsEl) logsEl.scrollTop = logsEl.scrollHeight;
      await wait(gapAfter);
    });
    return logQueue;
  }

  function setBarColor(el, kind, value, max = 100) {
    if (!el) return;
    let level;
    if (kind === "hp") {
      const pct = (value / max) * 100;
      level = pct >= 80 ? "green" : (pct >= 30 ? "yellow" : "red");
    } else if (kind === "temp") {
      level = value < 30 ? "green" : (value < 80) ? "yellow" : "red";
    }
    el.style.backgroundColor =
      level === "green" ? "#2ecc71" :
      level === "yellow" ? "#f1c40f" :
      "#e74c3c";
  }

  function updateUI() {
    const pHPSpan   = document.getElementById("playerHP");
    const pHPBar    = document.getElementById("playerHPBar");
    const pTempSpan = document.getElementById("playerTemp");
    const pTempBar  = document.getElementById("playerTempBar");
    const pWeap     = document.getElementById("playerWeapon");
    const pPos      = document.getElementById("playerPos");

    const eHPSpan   = document.getElementById("enemyHP");
    const eHPBar    = document.getElementById("enemyHPBar");
    const eTempSpan = document.getElementById("enemyTemp");
    const eTempBar  = document.getElementById("enemyTempBar");
    const eWeap     = document.getElementById("enemyWeapon");
    const ePos      = document.getElementById("enemyPos");

    if (pHPSpan)   pHPSpan.textContent   = state.player.hp;
    if (eHPSpan)   eHPSpan.textContent   = state.enemy.hp;
    if (pTempSpan) pTempSpan.textContent = state.player.temp;
    if (eTempSpan) eTempSpan.textContent = state.enemy.temp;
    if (pWeap)     pWeap.textContent     = state.player.weapon ?? "-";
    if (eWeap)     eWeap.textContent     = state.enemy.weapon ?? "-";
    if (pPos)      pPos.textContent      = state.distance;
    if (ePos)      ePos.textContent      = state.distance;

    if (pHPBar) {
      pHPBar.style.width = `${(state.player.hp / state.player.maxHp) * 100}%`;
      setBarColor(pHPBar, "hp", state.player.hp, state.player.maxHp);
    }
    if (eHPBar) {
      eHPBar.style.width = `${(state.enemy.hp / state.enemy.maxHp) * 100}%`;
      setBarColor(eHPBar, "hp", state.enemy.hp, state.enemy.maxHp);
    }
    if (pTempBar) {
      pTempBar.style.width = `${Math.max(0, Math.min(100, state.player.temp))}%`;
      setBarColor(pTempBar, "temp", state.player.temp);
    }
    if (eTempBar) {
      eTempBar.style.width = `${Math.max(0, Math.min(100, state.enemy.temp))}%`;
      setBarColor(eTempBar, "temp", state.enemy.temp);
    }

    if (playerHealthBadge) playerHealthBadge.textContent = `${state.player.hp}/${state.player.maxHp}`;
    if (enemyHealthBadge)  enemyHealthBadge.textContent  = `${state.enemy.hp}/${state.enemy.maxHp}`;

    const pTempBadge = document.getElementById("playerTempBadge");
    const eTempBadge = document.getElementById("enemyTempBadge");
    if (pTempBadge) pTempBadge.textContent = `${state.player.temp}°C`;
    if (eTempBadge) eTempBadge.textContent = `${state.enemy.temp}°C`;
  }

  // ===== DoT de superaquecimento =====
  function applyOverheatDOT(who) {
    const ent = (who === "player") ? state.player : state.enemy;
    if (!ent.reactorExploded) return false;

    if (ent.temp >= 100) {
      if (!ent.overheatActive) { ent.overheatActive = true; ent.overheatDoT = 5; }
      const dmg = Math.max(1, Math.ceil(ent.overheatDoT));
      ent.hp = Math.max(0, ent.hp - dmg);

      if (who === "player") {
        logMessage(`🔥 Superaquecimento: -${dmg} HP (abaixe sua temperatura)!!`, 800);
      } else {
        logMessage(`🔥 Superaquecimento: -${dmg} HP (inimigo queimando)!!`, 800);
      }

      ent.overheatDoT = Math.ceil(ent.overheatDoT * 1.5);
      updateUI();
      return ent.hp <= 0;
    } else {
      ent.overheatActive = false;
      ent.overheatDoT = 0;
      return false;
    }
  }

  const isAlive = (e) => e.hp > 0;

  // agenda o modal DEPOIS que o último log terminar de ser escrito
  function scheduleEndDialogAfterLog(delayMs = 3000) {
    if (endDialogScheduled) return;
    endDialogScheduled = true;
    // encadeia após a fila de logs concluir (inclui a mensagem de vitória/derrota)
    logQueue = logQueue.then(async () => {
      await wait(delayMs);
      showEndDialog();
    });
  }

  function showEndDialog() {
    if (document.getElementById("endgameBackdrop")) return;

    const backdrop = document.createElement("div");
    backdrop.id = "endgameBackdrop";
    backdrop.className = "endgame-backdrop";
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");

    const modal = document.createElement("div");
    modal.className = "endgame-modal";

    // Botão fechar (X)
    const closeBtn = document.createElement("button");
    closeBtn.className = "endgame-close";
    closeBtn.setAttribute("aria-label", "Fechar");
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", () => {
      backdrop.remove();
    });

    const title = document.createElement("div");
    title.className = "endgame-title";
    title.textContent = isAlive(state.player) ? "🏆 Vitória" : "💀 Derrota";

    const sub = document.createElement("div");
    sub.className = "endgame-sub";
    sub.textContent = "O que deseja fazer?";

    const actions = document.createElement("div");
    actions.className = "endgame-actions";

    const btnNew = document.createElement("button");
    btnNew.className = "endgame-btn primary";
    btnNew.textContent = "Novo Jogo";
    // Caso seja Combate Custom (chaves presentes), mantém as armas (não removemos as chaves).
    // Se for Combate Rápido, não há chaves — reload mantém o sorteio normal.
    btnNew.addEventListener("click", () => { location.reload(); });

    const btnMenu = document.createElement("button");
    btnMenu.className = "endgame-btn";
    btnMenu.textContent = "Menu";
    // Ao ir para o menu, limpamos as chaves do custom para não afetar Combate Rápido
    btnMenu.addEventListener("click", () => {
      sessionStorage.removeItem('customPlayerWeapon');
      sessionStorage.removeItem('customEnemyWeapon');
      location.href = "index.html";
    });

    actions.appendChild(btnNew);
    actions.appendChild(btnMenu);

    modal.appendChild(closeBtn);
    modal.appendChild(title);
    modal.appendChild(sub);
    modal.appendChild(actions);

    backdrop.appendChild(modal);

    // Fechar ao clicar fora do modal
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) backdrop.remove();
    });

    // Fechar com ESC
    document.addEventListener("keydown", onEscClose, { once: true });
    function onEscClose(ev) {
      if (ev.key === "Escape") {
        backdrop.remove();
      }
    }

    document.body.appendChild(backdrop);
  }

  function checkVictory() {
    if (!isAlive(state.player)) {
      logMessage("💀 Você foi derrotado!");
      state.lock = true;
      scheduleEndDialogAfterLog(3000); // 3s depois do log terminar
      return true;
    }
    if (!isAlive(state.enemy))  {
      logMessage("🏆 Vitória!");
      state.lock = true;
      scheduleEndDialogAfterLog(3000); // 3s depois do log terminar
      return true;
    }
    return false;
  }

  async function setTurn(who) {
    state.turn = who;
    updateUI();

    // DoT no início do turno
    if (applyOverheatDOT(who)) { checkVictory(); return; }

    if (who === "player") {
      await logMessage("➡️ Sua vez");
      state.lock = false;
    } else {
      await wait(IA_THINK_MS);
      window.Combat.enemyTurn(state, updateUI, logMessage, setTurn, checkVictory);
    }
  }

  // Fila de logs
  function onPlayerAttack() {
    if (state.lock) return;
    state.lock = true;
    window.Combat.doAttack(state, "player", logMessage);
    updateUI();
    if (checkVictory()) return;
    setTurn("enemy");
  }

  function onPlayerCommand(cmd) {
    if (state.lock) return;

    if (cmd === "avancar") {
      state.lock = true;
      window.Combat.move(state, "player", "avancar", logMessage);
      updateUI();
      if (checkVictory()) return;
      setTurn("enemy");
    } else if (cmd === "recuar") {
      state.lock = true;
      window.Combat.move(state, "player", "recuar", logMessage);
      updateUI();
      if (checkVictory()) return;
      setTurn("enemy");
    } else if (cmd === "temperatura") {
      state.lock = true;
      state.player.temp = Math.max(0, state.player.temp - 20);
      logMessage("🧊 Você resfriou o reator (-20°C).");
      updateUI();
      if (checkVictory()) return;
      setTurn("enemy");
    } else if (cmd === "habilidade") {
      state.lock = true;
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + 30);
      logMessage("✨ Habilidade ativada: +30 HP!");
      updateUI();
      if (checkVictory()) return;
      setTurn("enemy");
    }
  }

  function wirePanels() {
    if (playerStatusBtn && playerPanel && overlay) {
      playerStatusBtn.addEventListener("click", () => {
        playerPanel.classList.add("active"); overlay.classList.add("active");
      });
    }
    if (enemyStatusBtn && enemyPanel && overlay) {
      enemyStatusBtn.addEventListener("click", () => {
        enemyPanel.classList.add("active"); overlay.classList.add("active");
      });
    }
    if (closePlayerPanel && playerPanel && overlay) {
      closePlayerPanel.addEventListener("click", () => {
        playerPanel.classList.remove("active"); overlay.classList.remove("active");
      });
    }
    if (closeEnemyPanel && enemyPanel && overlay) {
      closeEnemyPanel.addEventListener("click", () => {
        enemyPanel.classList.remove("active"); overlay.classList.remove("active");
      });
    }
    if (overlay) {
      overlay.addEventListener("click", () => {
        playerPanel?.classList.remove("active");
        enemyPanel?.classList.remove("active");
        overlay?.classList.remove("active");
      });
    }
  }

  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("light");
    });
  }

  function wireControls() {
    if (mainAttackBtn) mainAttackBtn.addEventListener("click", onPlayerAttack);
    actionButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const cmd = btn.getAttribute("data-command");
        onPlayerCommand(cmd);
        btn.classList.add("pulse"); setTimeout(() => btn.classList.remove("pulse"), 400);
      });
    });
  }

  async function startGame() {
    // Mensagens iniciais
    await logMessage("Iniciando sistema...", INITIAL_LOG_GAP_MS);
    await logMessage("Sistema inicializado. Bem-vindo, piloto!", INITIAL_LOG_GAP_MS);
    await logMessage("Prepare-se! Combate iniciando!", INITIAL_LOG_GAP_MS);

    // Lê escolhas do Combate Custom; se não houver, sorteia normalmente
    const customP = sessionStorage.getItem('customPlayerWeapon');
    const customE = sessionStorage.getItem('customEnemyWeapon');
    if (customP && customE) {
      state.player.weapon = customP;
      state.enemy.weapon  = customE;
      logMessage(`⚔️ Sua arma escolhida: ${state.player.weapon}`);
      logMessage(`☠️ Arma do inimigo: ${state.enemy.weapon}`);
      // IMPORTANTE: NÃO remover as chaves aqui — assim "Novo Jogo" mantém as escolhas.
      // sessionStorage.removeItem('customPlayerWeapon');
      // sessionStorage.removeItem('customEnemyWeapon');
    } else {
      window.Combat.assignWeapons(state, logMessage);
    }

    updateUI();
    if (Math.random() < 0.5) setTurn("player"); else setTurn("enemy");
  }

  wirePanels();
  wireControls();
  startGame();
});
