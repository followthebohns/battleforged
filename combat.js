// combat.js - Lógica de combate, cálculos, movimento e IA
(function (global) {
  "use strict";

  const weapons = ["Metralhadora", "Sniper", "Espada", "Fuzil"];
  const TL = global.TextLines || {};

  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function hitCalc(weapon, dist) {
    let hit = 0.8, crit = 0.10, damage = randInt(12, 22);

    switch (weapon) {
      case "Metralhadora":
        if (dist >= 1 && dist <= 3) { hit += 0.15; damage += 6; } else { hit -= 0.20; damage -= 4; }
        break;
      case "Fuzil":
        if (dist >= 4 && dist <= 6) { hit += 0.10; damage += 8; } else { hit -= 0.15; damage -= 4; }
        break;
      case "Sniper":
        if (dist >= 6) { hit += Math.min(0.25, (dist - 6) * 0.03); damage += Math.min(16, (dist - 6) * 2); }
        else { hit -= 0.25; damage -= 6; }
        break;
      case "Espada":
        if (dist === 0) { hit = 0.95; crit = 0.50; damage += 10; }
        else { hit = 0.10; crit = 0.05; damage -= 8; }
        break;
    }

    // Aumento global de crítico em +12%
    crit += 0.12;

    // Limites
    hit = Math.max(0.05, Math.min(0.98, hit));
    crit = Math.max(0.05, Math.min(0.60, crit));
    damage = Math.max(2, damage);

    return { hit, crit, damage };
  }

  function handleOverheat(entity, who, log) {
    if (entity.temp >= 100 && !entity.reactorExploded) {
      entity.reactorExploded = true;
      entity.overheatActive = true;
      entity.overheatDoT = 5;
      entity.hp = Math.max(0, entity.hp - 60);

      if (typeof log === "function") {
        const alvo = (who === "player") ? "você" : "o inimigo";
        if (who === "player") { log("SEU REATOR EXPLODIU"); }
        else { log("REATOR DO INIMIGO EXPLODIU"); }

        const brutal = entity.hp <= 60;
        const pool = brutal ? TL.EXPLOSION_LINES_BRUTAL : TL.EXPLOSION_LINES_STRONG;
        const line = (pool && pool.length) ? TL.pick(pool) : "O dano da explosão [ARRASA] {ALVO}! -60 HP";
        log(TL.render(line, { ALVO: alvo }, "explosion"));
      }
    }
  }

  function assignWeapons(state, log) {
    state.player.weapon = weapons[randInt(0, weapons.length - 1)];
    state.enemy.weapon  = weapons[randInt(0, weapons.length - 1)];
    if (typeof log === "function") {
      log(`⚔️ Sua arma inicial: ${state.player.weapon}`);
      log(`☠️ Arma do inimigo: ${state.enemy.weapon}`);
    }
  }

  function doAttack(state, attacker, log) {
    const isPlayer = attacker === "player";
    const atk = isPlayer ? state.player : state.enemy;
    const def = isPlayer ? state.enemy  : state.player;

    const { hit, crit, damage: baseDamage } = hitCalc(atk.weapon, state.distance);
    if (Math.random() > hit) {
      if (typeof log === "function") log(isPlayer ? "💥 Seu ataque falhou!" : "☠️ O inimigo errou o ataque!");
      return;
    }

    let dmg = baseDamage;
    const isCrit = Math.random() < crit;
    if (isCrit) dmg *= 2;

    def.hp = Math.max(0, def.hp - Math.max(0, Math.floor(dmg)));
    def.temp += isCrit ? 30 : randInt(1, 10);

    const ATACANTE = isPlayer ? "Você" : "Inimigo";
    const ALVO     = isPlayer ? "o inimigo" : "você";
    const map = { ATACANTE, ARMA: atk.weapon, ALVO, DANO: dmg };

    if (typeof log === "function") {
      if (isCrit) {
        // Mensagem “CRÍTICO!” em vermelho, negrito e micro-animação, com pausa de 1,5s
        const critMsg = `
<style>
@keyframes critPop{0%{transform:scale(.9);opacity:.4}60%{transform:scale(1.12);opacity:1}100%{transform:scale(1);}}
</style>
<span style="display:inline-block;animation:critPop 500ms ease;">
  <strong style="color:#ef4444;font-weight:900;letter-spacing:.5px;">CRÍTICO!</strong>
</span>`;
        log(critMsg, 1500);
        log(TL.render(TL.pick(TL.CRIT_LINES || []), map, "crit"));
      } else {
        log(TL.render(TL.pick(TL.NORMAL_LINES || []), map, "normal"));
      }
    }

    handleOverheat(def, isPlayer ? "enemy" : "player", log);
  }

  function move(state, who, dir, log) {
    const weapon  = (who === "player") ? state.player.weapon : state.enemy.weapon;
    const step    = (weapon === "Espada") ? 3 : 1;

    const oldDist = state.distance;

    // Bloqueia avanço quando já está a 0 sqm (sem aquecer, sem mover)
    if (who === "player" && dir === "avancar" && oldDist === 0) {
      if (typeof log === "function") log("Você já está a 0 sqm! Não é possível avançar!!!");
      return;
    }

    const delta   = (dir === "avancar") ? -step : +step;
    const newDist = Math.max(0, oldDist + delta);
    state.distance = newDist;
    const moved = Math.abs(newDist - oldDist);

    const mover = (who === "player") ? state.player : state.enemy;
    mover.temp += 20;

    if (typeof log === "function") {
      if (who === "player") {
        log(dir === "avancar"
          ? `➡️ Você avançou ${moved} sqm (distância: ${state.distance}).`
          : `⬅️ Você recuou ${moved} sqm (distância: ${state.distance}).`);
      } else {
        log(dir === "avancar"
          ? `☠️ O inimigo avançou ${moved} sqm (distância: ${state.distance}).`
          : `☠️ O inimigo recuou ${moved} sqm (distância: ${state.distance}).`);
      }
    }

    handleOverheat(mover, who, log);
  }

  function enemyTurn(state, updateUI, log, setTurn, checkVictory) {
    const e = state.enemy, dist = state.distance, w = e.weapon;

    if (e.temp >= 100) {
      log("🌡️ Inimigo resfriou o reator (-20°C)!");
      e.temp = Math.max(0, e.temp - 20);
    } else if (e.temp + 20 >= 100) {
      log("🌡️ Inimigo decidiu resfriar (-20°C) para não explodir!");
      e.temp = Math.max(0, e.temp - 20);
    } else if (w === "Espada" && dist > 0) {
      move(state, "enemy", "avancar", log);
    } else if (w === "Sniper" && dist < 6) {
      move(state, "enemy", "recuar", log);
    } else if (w === "Metralhadora" && (dist < 1 || dist > 3)) {
      move(state, "enemy", dist > 3 ? "avancar" : "recuar", log);
    } else if (w === "Fuzil" && (dist < 4 || dist > 6)) {
      move(state, "enemy", dist > 6 ? "avancar" : "recuar", log);
    } else {
      doAttack(state, "enemy", log);
    }

    if (typeof updateUI === "function") updateUI();
    if (typeof checkVictory === "function" && checkVictory()) return;
    if (typeof setTurn === "function") setTurn("player");
  }

  global.Combat = { weapons, randInt, hitCalc, assignWeapons, doAttack, move, enemyTurn, handleOverheat };
})(window);
