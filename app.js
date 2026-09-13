/* ==================================================================
   Pack a bag, Giulia — behaviour
   Flow: reveal → weekends → parameters → done (+ countdowns).
   Answers are emailed via FormSubmit and kept in localStorage so the
   same link shows her countdowns when she comes back.
   ================================================================== */
(() => {
  "use strict";

  const C = window.GIUGIU || {};
  const STORAGE_KEY = "giugiu:v1";
  const DAY = 864e5;
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const CHECK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.2 3L13 4.5"/></svg>';
  const PLUS = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 1v10M1 6h10"/></svg>';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- dates ---------- */

  // "YYYY-MM-DD" or "YYYY-MM-DDTHH:MM" → local Date (defaults to departureHour)
  function parseLocal(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(iso || "");
    if (!m) return null;
    const hour = m[4] != null ? +m[4] : (Number.isFinite(C.departureHour) ? C.departureHour : 8);
    const d = new Date(+m[1], +m[2] - 1, +m[3], hour, m[5] != null ? +m[5] : 0, 0, 0);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  function dateOnly(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function startOfToday() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }

  // "Sat 17 – Sun 18 Oct" (or "Sat 31 Oct – Sun 1 Nov")
  function weekendLabel(iso) {
    const sat = dateOnly(iso);
    if (!sat) return iso;
    const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
    if (sat.getMonth() === sun.getMonth()) {
      return `${DAYS[sat.getDay()]} ${sat.getDate()} – ${DAYS[sun.getDay()]} ${sun.getDate()} ${MONTHS[sat.getMonth()]}`;
    }
    return `${DAYS[sat.getDay()]} ${sat.getDate()} ${MONTHS[sat.getMonth()]} – ${DAYS[sun.getDay()]} ${sun.getDate()} ${MONTHS[sun.getMonth()]}`;
  }
  const shortDate = (d) => `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  const tinyDate = (iso) => { const d = dateOnly(iso); return d ? `${d.getDate()}\u00a0${MONTHS[d.getMonth()]}` : iso; };

  function relWeeks(iso) {
    const d = dateOnly(iso);
    if (!d) return "";
    const days = Math.round((d - startOfToday()) / DAY);
    if (days < 0) return "gone";
    if (days === 0) return "today";
    if (days < 14) return `in ${days} day${days === 1 ? "" : "s"}`;
    return `in ${Math.round(days / 7)} weeks`;
  }
  function relShort(ms) {
    const d = Math.floor(ms / DAY);
    if (d >= 1) return `${d} day${d === 1 ? "" : "s"}`;
    const h = Math.floor(ms / 36e5);
    if (h >= 1) return `${h} hr${h === 1 ? "" : "s"}`;
    const mi = Math.max(1, Math.floor(ms / 6e4));
    return `${mi} min`;
  }

  /* ---------- storage ---------- */

  function load() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; } catch { return null; } }
  function save(data) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* private mode: fine */ } }
  function wipe() { try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ } }

  /* ---------- state ---------- */

  const state = { weekends: [], direction: null, kind: null, vibe: null, avoid: "" };
  let pendingConfirmed = null; // a ?go= date seen before she has submitted
  let countdownTimer = null;
  let submitting = false;

  const screens = {
    reveal: $("#screen-reveal"),
    weekends: $("#screen-weekends"),
    params: $("#screen-params"),
    done: $("#screen-done"),
  };
  let current = null;
  let transitioning = false;

  function show(name, { instant = false } = {}) {
    if (transitioning || name === current) return;
    const next = screens[name];
    const prev = current ? screens[current] : null;
    const go = () => {
      Object.values(screens).forEach((s) => { if (s !== next) { s.hidden = true; s.classList.remove("is-leaving"); } });
      next.hidden = false;
      window.scrollTo(0, 0);
      current = name;
      transitioning = false;
      const heading = $("h1, h2", next);
      if (heading) { heading.setAttribute("tabindex", "-1"); heading.focus({ preventScroll: true }); }
    };
    if (prev && !instant && !reducedMotion) {
      transitioning = true;
      prev.classList.add("is-leaving");
      setTimeout(go, 170);
    } else {
      go();
    }
  }

  /* ---------- ticket ---------- */

  function ticketHTML({ done = false, whenText = "You tell us", stampText = "", wrapWhen = false } = {}) {
    return `
      <div class="ticket${done ? " ticket--done" : ""}">
        ${stampText ? `<span class="stamp${done ? " is-stamping" : ""}">${esc(stampText)}</span>` : ""}
        <div class="ticket__main">
          <div class="ticket__row"><span class="ticket__k">Passenger</span><span class="ticket__v">${esc(C.name)}</span></div>
          <div class="ticket__row"><span class="ticket__k">To</span><span class="ticket__v"><span class="ticket__redacted" role="img" aria-label="secret"></span></span></div>
          <div class="ticket__row"><span class="ticket__k">When</span><span class="ticket__v${wrapWhen ? " ticket__v--wrap" : ""}">${esc(whenText)}</span></div>
          <div class="ticket__row"><span class="ticket__k">Seat</span><span class="ticket__v">Next to us</span></div>
        </div>
        <div class="ticket__stub" aria-hidden="true"><span class="ticket__class">40</span><span class="ticket__barcode"></span></div>
      </div>`;
  }

  /* ---------- step 1: weekends ---------- */

  function renderWeekends() {
    $("#weekend-list").innerHTML = (C.weekends || []).map((iso, i) => `
      <li class="weekend">
        <input type="checkbox" id="wk-${i}" name="weekends" value="${esc(iso)}"${state.weekends.includes(iso) ? " checked" : ""}>
        <label class="weekend__card" for="wk-${i}">
          <span class="weekend__text">
            <span class="weekend__day">${esc(relWeeks(iso))}</span>
            <span class="weekend__date">${esc(weekendLabel(iso))}</span>
          </span>
          <span class="weekend__check" aria-hidden="true">${CHECK}</span>
        </label>
      </li>`).join("");
  }

  function updateCount() {
    const n = state.weekends.length;
    const el = $("#weekend-count");
    el.textContent = n === 0 ? "Nothing picked yet" : n === 1 ? "1 picked" : n === 2 ? "2 picked" : `${n} picked · lovely`;
    el.classList.toggle("is-on", n > 0);
    $("[data-action='to-params']").disabled = n === 0;
  }

  /* ---------- step 2: parameters ---------- */

  function renderChips(key, options) {
    $(`[data-chips="${key}"]`).innerHTML = (options || []).map((opt, i) => `
      <span class="chip">
        <input type="radio" id="${key}-${i}" name="${key}" value="${esc(opt)}"${state[key] === opt ? " checked" : ""}>
        <label class="chip__label" for="${key}-${i}">${esc(opt)}</label>
      </span>`).join("");
  }

  const ORDER = ["direction", "kind", "vibe", "avoid"];

  function revealNext(afterKey) {
    const nextKey = ORDER[ORDER.indexOf(afterKey) + 1];
    if (!nextKey) return;
    const q = $(`[data-q="${nextKey}"]`);
    if (!q || !q.hidden) return;
    q.hidden = false;
    requestAnimationFrame(() => q.scrollIntoView({ block: "end", behavior: reducedMotion ? "auto" : "smooth" }));
  }

  function updateSend() {
    $("#send").disabled = !(state.direction && state.kind && state.vibe);
  }

  function resetParams() {
    ["direction", "kind", "vibe"].forEach((k) => {
      state[k] = null;
      $$(`input[name="${k}"]`).forEach((i) => { i.checked = false; });
      const q = $(`[data-q="${k}"]`);
      if (k !== "direction") q.hidden = true;
    });
    state.avoid = "";
    $("#avoid").value = "";
    $('[data-q="avoid"]').hidden = true;
    updateSend();
  }

  /* ---------- delivery ---------- */

  const subject = () => `${C.name}'s answers · surprise weekend`;

  async function deliver(answers) {
    if (!C.email) return false;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    const payload = {
      _subject: subject(),
      _template: "table",
      _captcha: "false",
      name: C.name,
      weekends: answers.weekends.map(weekendLabel).join("  /  "),
      direction: answers.direction,
      kind_of_place: answers.kind,
      vibe: answers.vibe,
      countries_to_avoid: answers.avoid || "(none)",
      submitted: new Date().toString(),
    };
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${C.email}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      if (!res.ok) return false;
      const data = await res.json().catch(() => ({}));
      return !(data && String(data.success).toLowerCase() === "false");
    } catch {
      return false;
    } finally {
      clearTimeout(t);
    }
  }

  function mailtoHref(answers) {
    const body = [
      "Hi! Here are my answers.",
      "",
      `Weekends: ${answers.weekends.map(weekendLabel).join(", ")}`,
      `Direction: ${answers.direction}`,
      `Kind of place: ${answers.kind}`,
      `Vibe: ${answers.vibe}`,
      `Countries to avoid: ${answers.avoid || "none"}`,
      "",
      `${C.name} x`,
    ].join("\n");
    return `mailto:${C.email}?subject=${encodeURIComponent(subject())}&body=${encodeURIComponent(body)}`;
  }

  async function retryDelivery(record) {
    const ok = await deliver(record.answers);
    if (ok) {
      record.delivered = true;
      save(record);
      $("#delivery-notice").hidden = true;
    }
  }

  /* ---------- step 3: done + countdowns ---------- */

  function anchorFor(record) {
    if (record.confirmed) {
      const d = parseLocal(record.confirmed);
      if (d) return { date: d, confirmed: true };
    }
    const now = Date.now();
    const dates = (record.answers.weekends || []).map(parseLocal).filter(Boolean).sort((a, b) => a - b);
    const upcoming = dates.find((d) => d.getTime() + 2 * DAY > now) || dates[dates.length - 1];
    return upcoming ? { date: upcoming, confirmed: false } : null;
  }

  function renderHero(el, anchor, now, picks) {
    const diff = anchor.date - now;
    let num, unit = "", sub;
    if (diff <= 0) {
      num = "Today"; sub = "Bag by the door.";
    } else {
      const days = Math.floor(diff / DAY);
      const hours = Math.floor((diff % DAY) / 36e5);
      const mins = Math.floor((diff % 36e5) / 6e4);
      if (days >= 1) { num = days; unit = days === 1 ? "day" : "days"; sub = hours ? `and ${hours} hour${hours === 1 ? "" : "s"}` : "and counting"; }
      else if (hours >= 1) { num = hours; unit = hours === 1 ? "hour" : "hours"; sub = `and ${mins} minute${mins === 1 ? "" : "s"}`; }
      else { num = Math.max(1, mins); unit = "min"; sub = "Almost."; }
    }
    const tag = anchor.confirmed
      ? `Departure <span class="pill">Confirmed</span>`
      : `Earliest departure`;
    const date = anchor.confirmed
      ? shortDate(anchor.date)
      : `${shortDate(anchor.date)} · ${picks} weekend${picks === 1 ? "" : "s"} in play`;
    el.innerHTML = `
      <p class="hero-count__tag">${tag}</p>
      <p class="hero-count__num">${esc(num)}${unit ? `<small>${unit}</small>` : ""}</p>
      <p class="hero-count__sub">${esc(sub)}</p>
      <p class="hero-count__date">${esc(date)}</p>`;
  }

  function stopCountdowns() { if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; } }

  function startCountdowns(record) {
    stopCountdowns();
    const hero = $("#hero-count");
    const list = $("#milestones");
    const anchor = anchorFor(record);
    if (!anchor) { hero.innerHTML = ""; list.innerHTML = ""; return; }

    const items = (C.milestones || []).map((m) => ({
      ...m,
      at: new Date(anchor.date.getTime() - (m.daysBefore || 0) * DAY),
      whenLabel: m.daysBefore ? `${m.daysBefore} day${m.daysBefore === 1 ? "" : "s"} before` : "departure day",
    }));
    if (C.birthday) {
      const b = parseLocal(`${String(C.birthday).slice(0, 10)}T00:00`);
      if (b) items.push({ title: "Your 40th", detail: "The actual day. Cake is not optional.", at: b, whenLabel: "the big day" });
    }
    items.sort((a, b) => a.at - b.at);

    list.innerHTML = items.map((m, i) => `
      <li class="milestone">
        <button class="milestone__btn" type="button" aria-expanded="false" aria-controls="ms-${i}">
          <span class="milestone__title">${esc(m.title)}</span>
          <span class="milestone__when" data-when></span>
          <span class="milestone__plus" aria-hidden="true">${PLUS}</span>
        </button>
        <div class="milestone__panel" id="ms-${i}"><div>
          <p class="milestone__detail">${esc(m.detail)}<span class="milestone__date">${esc(shortDate(m.at))} · ${esc(m.whenLabel)}</span></p>
        </div></div>
      </li>`).join("");

    const picks = (record.answers.weekends || []).length;
    const tick = () => {
      const now = Date.now();
      renderHero(hero, anchor, now, picks);
      $$(".milestone", list).forEach((li, i) => {
        const diff = items[i].at - now;
        $("[data-when]", li).textContent = diff <= 0 ? "Unlocked" : `in ${relShort(diff)}`;
        li.classList.toggle("is-live", diff <= 0);
      });
    };
    tick();
    countdownTimer = setInterval(tick, 30000);
  }

  function renderDone(record, { celebrate = false } = {}) {
    const a = record.answers;
    const confirmed = record.confirmed ? parseLocal(record.confirmed) : null;
    const picks = (a.weekends || []).slice().sort();
    let whenText;
    if (confirmed) whenText = shortDate(confirmed);
    else if (picks.length <= 3) whenText = picks.map(tinyDate).join(", ");
    else whenText = `${picks.slice(0, 2).map(tinyDate).join(", ")} +${picks.length - 2}`;

    $("#ticket-done").innerHTML = ticketHTML({ done: true, whenText, wrapWhen: !confirmed, stampText: confirmed ? "Confirmed" : "Received" });
    $("#delivery-notice").hidden = record.delivered !== false;
    $("#mailto-link").href = mailtoHref(a);
    startCountdowns(record);
    if (celebrate) setTimeout(confetti, 350);
  }

  /* ---------- confetti ---------- */

  function confetti() {
    if (reducedMotion) return;
    const canvas = $("#confetti");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = (canvas.width = Math.floor(window.innerWidth * dpr));
    const H = (canvas.height = Math.floor(window.innerHeight * dpr));
    const colors = ["#e4553b", "#f0b429", "#1e7c86", "#1d1a17", "#fdf9f2", "#f7a58f", "#e4553b"];
    const pieces = [];
    const N = 170;
    for (let i = 0; i < N; i++) {
      const left = i % 2 === 0;
      const speed = (11 + Math.random() * 9) * dpr;
      const angle = (left ? -1 : 1) * (0.9 + Math.random() * 0.5); // radians from straight up
      pieces.push({
        x: (left ? -0.04 : 1.04) * W,
        y: H * (0.62 + Math.random() * 0.2),
        vx: Math.abs(Math.sin(angle)) * speed * (left ? 1 : -1),
        vy: -Math.cos(angle) * speed,
        w: (5 + Math.random() * 7) * dpr,
        h: (3 + Math.random() * 9) * dpr,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.35,
        wobble: Math.random() * Math.PI * 2,
        color: colors[i % colors.length],
        circle: Math.random() < 0.22,
      });
    }
    const g = 0.32 * dpr;
    const drag = 0.986;
    const life = 4400;
    const start = performance.now();
    function frame(t) {
      const age = t - start;
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = age > life - 900 ? Math.max(0, (life - age) / 900) : 1;
      for (const p of pieces) {
        p.vx *= drag;
        p.vy = p.vy * drag + g;
        p.wobble += 0.09;
        p.x += p.vx + Math.sin(p.wobble) * 0.7 * dpr;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.circle) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill(); }
        else { const hh = Math.max(1, p.h * Math.abs(Math.cos(p.wobble))); ctx.fillRect(-p.w / 2, -hh / 2, p.w, hh); }
        ctx.restore();
      }
      if (age < life) requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, W, H);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- wiring ---------- */

  function bind() {
    $("[data-action='start']").addEventListener("click", () => show("weekends"));
    $("[data-action='back-to-reveal']").addEventListener("click", () => show("reveal"));
    $("[data-action='back-to-weekends']").addEventListener("click", () => show("weekends"));
    $("[data-action='to-params']").addEventListener("click", () => { if (state.weekends.length) show("params"); });

    $("#weekend-list").addEventListener("change", () => {
      state.weekends = $$('input[name="weekends"]:checked').map((i) => i.value);
      updateCount();
    });

    $("#params-form").addEventListener("change", (e) => {
      const key = e.target.name;
      if (["direction", "kind", "vibe"].includes(key)) {
        state[key] = e.target.value;
        revealNext(key);
        updateSend();
      }
    });

    $("#params-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      if (submitting || !(state.direction && state.kind && state.vibe && state.weekends.length)) return;
      submitting = true;
      state.avoid = $("#avoid").value.trim();
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();

      const btn = $("#send");
      btn.classList.add("is-busy");
      btn.textContent = "Sending";

      const answers = { ...state, weekends: state.weekends.slice() };
      const delivered = await deliver(answers);
      const record = { answers, submittedAt: new Date().toISOString(), delivered, confirmed: pendingConfirmed || null };
      save(record);

      btn.classList.remove("is-busy");
      btn.textContent = "Send it";
      submitting = false;
      renderDone(record, { celebrate: true });
      show("done");
    });

    $("#milestones").addEventListener("click", (e) => {
      const btn = e.target.closest(".milestone__btn");
      if (!btn) return;
      const li = btn.closest(".milestone");
      const open = !li.classList.contains("is-open");
      li.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
    });

    let armed = false;
    let armTimer = null;
    const resetBtn = $("#reset");
    resetBtn.addEventListener("click", () => {
      if (!armed) {
        armed = true;
        resetBtn.textContent = "Sure? Tap again to start over";
        armTimer = setTimeout(() => { armed = false; resetBtn.textContent = "Made a mistake? Start over"; }, 4000);
        return;
      }
      clearTimeout(armTimer);
      armed = false;
      resetBtn.textContent = "Made a mistake? Start over";
      const existing = load();
      if (existing && existing.confirmed) pendingConfirmed = existing.confirmed;
      wipe();
      stopCountdowns();
      state.weekends = [];
      renderWeekends();
      updateCount();
      resetParams();
      show("weekends");
    });
  }

  function init() {
    $$("[data-name]").forEach((el) => { el.textContent = C.name; });
    $$("[data-from]").forEach((el) => { el.textContent = C.from; });
    if (C.name) document.title = `Pack a bag, ${C.name}`;

    $("#ticket-reveal").innerHTML = ticketHTML({ whenText: "You tell us" });
    renderWeekends();
    renderChips("direction", C.directions);
    renderChips("kind", C.kinds);
    renderChips("vibe", C.vibes);
    updateCount();
    updateSend();
    bind();

    const params = new URLSearchParams(location.search);
    let record = load();
    if (params.has("reset")) {
      wipe();
      record = null;
      history.replaceState(null, "", location.pathname);
    }
    const go = params.get("go");
    if (go && parseLocal(go)) {
      pendingConfirmed = go;
      if (record) { record.confirmed = go; save(record); }
    }

    if (record && record.answers && Array.isArray(record.answers.weekends)) {
      renderDone(record);
      show("done", { instant: true });
      if (record.delivered === false) retryDelivery(record);
    } else {
      show("reveal", { instant: true });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
