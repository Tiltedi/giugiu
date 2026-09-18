/* ==================================================================
   Pack a bag, Giulia — behaviour
   Flow: reveal → weekends → direction → done (+ countdowns).
   Answers are emailed via FormSubmit and kept in localStorage; once
   they are pasted into trip.js that file drives the page everywhere.
   ================================================================== */
(() => {
  "use strict";

  const C = window.GIUGIU || {};
  const T = window.GIUGIU_TRIP || {};
  const STORAGE_KEY = "giugiu:v2";
  const DAY = 864e5;
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const CHECK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.2 3L13 4.5"/></svg>';
  const PLUS = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 1v10M1 6h10"/></svg>';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const escLines = (s) => esc(s).replace(/\r?\n/g, "<br>");

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
  const shortDate = (d) => `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  const tinyDate = (iso) => { const d = dateOnly(iso); return d ? `${d.getDate()} ${MONTHS[d.getMonth()]}` : iso; };

  /* ---------- weekends ({ from, to }, identified by their first day) ---------- */

  const weekends = () => (C.weekends || []).filter((w) => w && dateOnly(w.from));
  const weekendByFrom = (from) => weekends().find((w) => w.from === from) || null;

  // "Fri 9 – Sun 11 Oct" (or "Fri 30 Oct – Sun 1 Nov")
  function weekendLabel(w) {
    const a = dateOnly(w.from);
    const b = dateOnly(w.to) || a;
    if (!a) return String(w.from);
    if (a.getMonth() === b.getMonth()) {
      return `${DAYS[a.getDay()]} ${a.getDate()} – ${DAYS[b.getDay()]} ${b.getDate()} ${MONTHS[a.getMonth()]}`;
    }
    return `${DAYS[a.getDay()]} ${a.getDate()} ${MONTHS[a.getMonth()]} – ${DAYS[b.getDay()]} ${b.getDate()} ${MONTHS[b.getMonth()]}`;
  }
  const labelFor = (from) => { const w = weekendByFrom(from); return w ? weekendLabel(w) : String(from); };

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

  /* ---------- trip file (trip.js) ---------- */

  function tripAnswers() {
    const a = T.answers;
    return a && Array.isArray(a.weekends) && a.weekends.length ? a : null;
  }
  function noteFor(key) {
    const n = T.notes && key ? T.notes[key] : null;
    return typeof n === "string" && n.trim() ? n.trim() : null;
  }
  const showEarly = (key) => Array.isArray(T.showEarly) && T.showEarly.includes(key);

  /* ---------- storage ---------- */

  function load() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; } catch { return null; } }
  function save(data) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* private mode: fine */ } }
  function wipe() { try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ } }

  /* ---------- state ---------- */

  const state = { weekends: [], direction: null, avoid: "" };
  let pendingConfirmed = null; // a ?go= date seen before she has submitted
  let countdownTimer = null;
  let submitting = false;
  let needleAngle = 0;

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
          <div class="ticket__row"><span class="ticket__k">${C.companion ? "Seatmate" : "Seat"}</span><span class="ticket__v">${esc(C.companion || "Next to us")}</span></div>
        </div>
        <div class="ticket__stub" aria-hidden="true"><span class="ticket__class">40</span><span class="ticket__barcode"></span></div>
      </div>`;
  }

  /* ---------- step 1: weekends ---------- */

  function renderWeekends() {
    $("#weekend-list").innerHTML = weekends().map((w, i) => `
      <li class="weekend">
        <input type="checkbox" id="wk-${i}" name="weekends" value="${esc(w.from)}"${state.weekends.includes(w.from) ? " checked" : ""}>
        <label class="weekend__card" for="wk-${i}">
          <span class="weekend__text">
            <span class="weekend__day">${esc(relWeeks(w.from))}</span>
            <span class="weekend__date">${esc(weekendLabel(w))}</span>
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

  /* ---------- step 2: the compass ---------- */

  const POS = { 0: "n", 90: "e", 180: "s", 270: "w" };

  function renderCompass() {
    const points = (C.directions || []).map((d, i) => {
      const angle = Number.isFinite(d.angle) ? ((d.angle % 360) + 360) % 360 : null;
      const pos = angle === null ? "c" : (POS[angle] || "c");
      return `
        <span class="chip compass__pt compass__pt--${pos}">
          <input type="radio" id="direction-${i}" name="direction" value="${esc(d.label)}" data-angle="${angle === null ? "" : angle}">
          <label class="chip__label${pos === "c" ? " chip__label--round" : ""}" for="direction-${i}">${esc(d.label)}</label>
        </span>`;
    }).join("");
    $("[data-compass]").innerHTML = `
      <div class="compass__ring" aria-hidden="true"></div>
      <div class="compass__ticks" aria-hidden="true"></div>
      <div class="compass__needle" aria-hidden="true"></div>
      ${points}`;
  }

  function pointNeedle(angleAttr) {
    const compass = $("[data-compass]");
    compass.classList.add("is-set");
    const anywhere = angleAttr === "" || angleAttr == null;
    compass.classList.toggle("is-anywhere", anywhere);
    if (anywhere) return;
    // take the short way round
    const target = Number(angleAttr);
    let delta = ((target - (needleAngle % 360)) + 540) % 360 - 180;
    needleAngle += delta;
    compass.style.setProperty("--angle", `${needleAngle}deg`);
  }

  const ORDER = ["direction", "avoid"];

  function revealNext(afterKey) {
    const nextKey = ORDER[ORDER.indexOf(afterKey) + 1];
    if (!nextKey) return;
    const q = $(`[data-q="${nextKey}"]`);
    if (!q || !q.hidden) return;
    q.hidden = false;
    requestAnimationFrame(() => q.scrollIntoView({ block: "end", behavior: reducedMotion ? "auto" : "smooth" }));
  }

  function updateSend() {
    $("#send").disabled = !state.direction;
  }

  function resetParams() {
    state.direction = null;
    $$('input[name="direction"]').forEach((i) => { i.checked = false; });
    const compass = $("[data-compass]");
    compass.classList.remove("is-set", "is-anywhere");
    state.avoid = "";
    $("#avoid").value = "";
    $('[data-q="avoid"]').hidden = true;
    updateSend();
  }

  /* ---------- delivery ---------- */

  const subject = () => `${C.name}'s answers · surprise weekend`;

  async function deliver(answers, submittedAt) {
    if (C.preview) return true; // preview builds never email anyone
    if (!C.email) return false;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    const payload = {
      _subject: subject(),
      _template: "table",
      _captcha: "false",
      name: C.name,
      weekends: answers.weekends.map(labelFor).join("  /  "),
      direction: answers.direction,
      places_to_avoid: answers.avoid || "(none)",
      submitted: new Date().toString(),
      paste_into_trip_js: JSON.stringify({
        weekends: answers.weekends,
        direction: answers.direction,
        avoid: answers.avoid || "",
        submittedAt: submittedAt || new Date().toISOString(),
      }),
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
      `Weekends: ${answers.weekends.map(labelFor).join(", ")}`,
      `Direction: ${answers.direction}`,
      `Places to avoid: ${answers.avoid || "none"}`,
      "",
      `${C.name} x`,
    ].join("\n");
    return `mailto:${C.email}?subject=${encodeURIComponent(subject())}&body=${encodeURIComponent(body)}`;
  }

  async function retryDelivery(record) {
    const ok = await deliver(record.answers, record.submittedAt);
    if (ok) {
      record.delivered = true;
      save(record);
      $("#delivery-notice").hidden = true;
    }
  }

  /* ---------- step 3: done + countdowns ---------- */

  // Until the weekend is confirmed, her page counts down to our next message.
  function nextNewsAt(record) {
    const base = record.submittedAt ? new Date(record.submittedAt) : null;
    if (!base || Number.isNaN(base.getTime())) return null;
    const cfg = C.nextNews || {};
    const first = weekends()[0];
    const pickedEarliest = !!first && (record.answers.weekends || []).includes(first.from);
    const days = pickedEarliest
      ? (Number.isFinite(cfg.daysIfEarliest) ? cfg.daysIfEarliest : (Number.isFinite(cfg.days) ? cfg.days : 25))
      : (Number.isFinite(cfg.days) ? cfg.days : 25);
    return new Date(base.getTime() + days * DAY);
  }

  function renderHero(el, kind, date, now) {
    const diff = date - now;
    let num, unit = "", sub;
    if (diff <= 0) {
      if (kind === "news") { num = "Soon"; sub = "Any moment now."; }
      else { num = "Today"; sub = "Bag by the door."; }
    } else if (kind === "news") {
      // whole days, counting today: "25 days" right after she submits
      const days = Math.ceil(diff / DAY);
      num = days; unit = days === 1 ? "day" : "days"; sub = "Then you'll know your weekend.";
    } else {
      const days = Math.floor(diff / DAY);
      const hours = Math.floor((diff % DAY) / 36e5);
      const mins = Math.floor((diff % 36e5) / 6e4);
      if (days >= 1) { num = days; unit = days === 1 ? "day" : "days"; sub = hours ? `and ${hours} hour${hours === 1 ? "" : "s"}` : "and counting"; }
      else if (hours >= 1) { num = hours; unit = hours === 1 ? "hour" : "hours"; sub = `and ${mins} minute${mins === 1 ? "" : "s"}`; }
      else { num = Math.max(1, mins); unit = "min"; sub = "Almost."; }
    }
    const tag = kind === "news" ? "Next you'll hear from us" : `Departure <span class="pill">Confirmed</span>`;
    el.innerHTML = `
      <p class="hero-count__tag">${tag}</p>
      <p class="hero-count__num">${esc(num)}${unit ? `<small>${unit}</small>` : ""}</p>
      <p class="hero-count__sub">${esc(sub)}</p>
      <p class="hero-count__date">${esc(shortDate(date))}</p>`;
  }

  function stopCountdowns() { if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; } }

  function startCountdowns(record) {
    stopCountdowns();
    const hero = $("#hero-count");
    const list = $("#milestones");
    const departure = record.confirmed ? parseLocal(record.confirmed) : null;
    const newsAt = departure ? null : nextNewsAt(record);

    const items = (C.milestones || []).map((m) => ({
      ...m,
      at: departure ? new Date(departure.getTime() - (m.daysBefore || 0) * DAY) : null,
      rowLabel: m.daysBefore ? `${m.daysBefore} day${m.daysBefore === 1 ? "" : "s"} before` : "departure day",
      note: noteFor(m.key),
    }));
    if (C.birthday) {
      const b = parseLocal(`${String(C.birthday).slice(0, 10)}T00:00`);
      if (b) items.push({ key: "birthday", title: "Your 40th", detail: "The actual day. Cake is not optional.", at: b, rowLabel: "the big day", note: null });
    }
    if (departure) items.sort((a, b) => (a.at || 0) - (b.at || 0));

    // The expanded content: the teaser until the note is available, then the note itself.
    const panelHTML = (m, available) => {
      const dateLine = m.at ? `${shortDate(m.at)} · ${m.rowLabel}` : (m.daysBefore ? `${m.rowLabel} departure` : "on departure day");
      return `
      <p class="milestone__detail">${available
        ? `<span class="milestone__from">From us</span><span class="milestone__note">${escLines(m.note)}</span>`
        : esc(m.detail)}<span class="milestone__date">${esc(dateLine)}</span></p>`;
    };

    list.innerHTML = items.map((m, i) => `
      <li class="milestone">
        <button class="milestone__btn" type="button" aria-expanded="false" aria-controls="ms-${i}">
          <span class="milestone__title">${esc(m.title)}</span>
          <span class="milestone__when" data-when></span>
          <span class="milestone__plus" aria-hidden="true">${PLUS}</span>
        </button>
        <div class="milestone__panel" id="ms-${i}"><div></div></div>
      </li>`).join("");

    const tick = () => {
      const now = Date.now();
      if (departure) renderHero(hero, "trip", departure, now);
      else if (newsAt) renderHero(hero, "news", newsAt, now);
      else hero.innerHTML = "";
      $$(".milestone", list).forEach((li, i) => {
        const m = items[i];
        const unlocked = !!m.at && m.at - now <= 0;
        const available = !!m.note && (unlocked || showEarly(m.key));
        const when = unlocked || available ? "Unlocked" : m.at ? `in ${relShort(m.at - now)}` : m.rowLabel;
        $("[data-when]", li).textContent = when;
        li.classList.toggle("is-live", unlocked || available);
        const stateKey = available ? "note" : "teaser";
        if (li.dataset.state !== stateKey) {
          li.dataset.state = stateKey;
          $(".milestone__panel > div", li).innerHTML = panelHTML(m, available);
        }
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
    $("#preview-note").hidden = !C.preview;
    $("#reset-row").hidden = !!record.fromTrip;
    const message = typeof T.message === "string" ? T.message.trim() : "";
    $("#trip-message").hidden = !message;
    $("#trip-message-text").innerHTML = escLines(message);
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
      if (e.target.name === "direction") {
        state.direction = e.target.value;
        pointNeedle(e.target.dataset.angle);
        revealNext("direction");
        updateSend();
      }
    });

    $("#params-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      if (submitting || !(state.direction && state.weekends.length)) return;
      submitting = true;
      state.avoid = $("#avoid").value.trim();
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();

      const btn = $("#send");
      btn.classList.add("is-busy");
      btn.textContent = "Sending";

      const answers = { weekends: state.weekends.slice(), direction: state.direction, avoid: state.avoid };
      const submittedAt = new Date().toISOString();
      const delivered = await deliver(answers, submittedAt);
      const record = { answers, submittedAt, delivered, confirmed: pendingConfirmed || null };
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
    $$("[data-givers]").forEach((el) => { el.textContent = C.givers || C.from; });
    $$("[data-companion]").forEach((el) => { el.textContent = C.companion || "us"; });
    if (C.name) document.title = `Pack a bag, ${C.name}`;

    $("#ticket-reveal").innerHTML = ticketHTML({ whenText: "You tell us" });
    renderWeekends();
    renderCompass();
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
    if (T.confirmed && parseLocal(T.confirmed)) {
      pendingConfirmed = T.confirmed;
      if (record) record.confirmed = T.confirmed;
    }

    const trip = tripAnswers();
    if (trip) {
      record = {
        answers: { weekends: trip.weekends.slice(), direction: trip.direction || null, avoid: trip.avoid || "" },
        submittedAt: trip.submittedAt || null,
        delivered: true,
        confirmed: pendingConfirmed || (record && record.confirmed) || null,
        fromTrip: true,
      };
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
