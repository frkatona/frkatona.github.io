(() => {
  "use strict";

  const MINUTE = 60;
  const TRACKED_DURATION = 60 * MINUTE;
  const PREFERENCES_KEY = "field-clock-preferences-v1";

  const defaultPreferences = {
    flashWarning: false,
    audioCues: false,
    enabled: {
      rift: true,
      urn: true,
      bridge: true,
      towers: true,
      camps: true,
      economy: true,
      creeps: true,
    },
  };

  const baseEvents = [
    event("small-camps", 2 * MINUTE, "02:00", "SMALL CAMPS", "camp", "camps", "icons/neutral-small.png", "JUNGLE ECONOMY", "The first quick neutral farm appears across the map.", [["RESPAWN", "~1:25"], ["SOULS", "UNSECURED"]]),
    event("breakables", 3 * MINUTE, "03:00", "BOXES + STATUES SPAWN", "economy", "economy", "icons/golden-statue.png", "MAP ECONOMY", "Regular breakable boxes and Golden Statues appear. Boxes grant souls; statues grant a random permanent stat.", [["RESPAWN", "3:00"], ["STATUE BUFF", "PERMANENT"]]),
    event("medium-camps", 5 * MINUTE, "05:00", "MEDIUM CAMPS", "camp", "camps", "icons/neutral-medium.png", "JUNGLE ECONOMY", "Medium camps become available for the first time.", [["FIRST SPAWN", "05:00"], ["RESPAWN", "~5:00"]]),
    event("tower-t1-zero", 6 * MINUTE, "06:00", "T1 PASSIVE DR HITS 0%", "tower", "towers", "icons/tower-t1.svg", "PUSH WINDOW", "Lane Guardians cross 0% on their time-based damage resistance curve and continue becoming more vulnerable.", [["CURVE", "+50% → −50%"], ["FULL CURVE", "12:00"]]),
    windowEvent("rift-1", 6 * MINUTE, 8 * MINUTE, "06:00–08:00", "UNSTABLE RIFT WINDOW", "rift", "rift", "icons/unstable-rift.svg", "VARIABLE OBJECTIVE", "A random lane is marked before this capture objective opens.", [["GLOBAL CALL", "25s"], ["VARIANCE", "±1:00"]]),
    event("large-camps", 8 * MINUTE, "08:00", "LARGE CAMPS + SINNER’S", "sinner", "camps", "icons/neutral-vault.png", "JUNGLE ECONOMY", "Large camps and Sinner’s Sacrifice enter the map.", [["SINNER", "5:00"], ["LARGE", "~5–6m"]]),
    event("tower-t2-zero", 9 * MINUTE, "09:00", "T2 PASSIVE DR HITS 0%", "tower", "towers", "icons/tower-t2.svg", "PUSH WINDOW", "Walkers cross 0% on their time-based damage resistance curve and continue toward negative resistance.", [["CURVE", "+65% → −65%"], ["FULL CURVE", "18:00"]]),
    event("mid-boxes", 10 * MINUTE, "10:00", "MID BOXES SPAWN", "economy", "economy", "icons/breakable-box.png", "MAP ECONOMY", "The dense central breakables around the Mid Boss area become available.", [["FIRST SPAWN", "10:00"], ["RESPAWN", "3:00"]]),
    event("statue-tier-2", 10 * MINUTE, "10:00", "STATUE BUFFS IMPROVE", "economy", "economy", "icons/golden-statue.png", "PERMANENT STATS · TIER 2", "Golden Statue permanent bonuses step up to their second strength tier.", [["TIER", "2 OF 3"], ["NEXT UPGRADE", "30:00"]]),
    event("troopers-20", 20 * MINUTE, "20:00", "TROOPER WAVES SPEED UP", "creeps", "creeps", "icons/trooper.png", "LANE PRESSURE", "Lane Trooper waves become more frequent and their Spirit Resistance begins scaling upward.", [["WAVE INTERVAL", "25s"], ["SPIRIT RESIST", "SCALES UP"]]),
    event("statue-tier-3", 30 * MINUTE, "30:00", "STATUE BUFFS IMPROVE AGAIN", "economy", "economy", "icons/golden-statue.png", "PERMANENT STATS · TIER 3", "Golden Statue permanent bonuses reach their late-game strength tier.", [["TIER", "3 OF 3"], ["HEALTH ROLL", "+30"]]),
    event("troopers-35", 35 * MINUTE, "35:00", "TROOPERS EMPOWERED", "creeps", "creeps", "icons/trooper.png", "LATE-GAME LANE PRESSURE", "Lane Troopers grow larger, gain 50% health, and waves arrive more frequently.", [["WAVE INTERVAL", "20s"], ["HEALTH", "+50%"]]),
  ];

  function event(id, start, timeLabel, title, kind, filter, icon, eyebrow, summary, facts) {
    return { id, start, end: start, timeLabel, title, kind, filter, icon, eyebrow, summary, facts };
  }

  function windowEvent(id, start, end, timeLabel, title, kind, filter, icon, eyebrow, summary, facts) {
    return { id, start, end, timeLabel, title, kind, filter, icon, eyebrow, summary, facts };
  }

  function makeEvents() {
    const events = [...baseEvents];

    for (let time = 5 * MINUTE; time <= TRACKED_DURATION; time += 5 * MINUTE) {
      events.push(event(`bridge-${time}`, time, formatTime(time), "BRIDGE BUFFS", "bridge", "bridge", "icons/bridge-buff.svg", "TEMPORARY POWERUP", "Bridge powerups respawn on the fixed five-minute schedule. Heavy melee to claim one.", [["INTERVAL", "5:00"], ["SCALING", "5:00–40:00"]]));
    }

    for (let time = 10 * MINUTE; time <= TRACKED_DURATION; time += 5 * MINUTE) {
      const spawnSide = (time / (5 * MINUTE)) % 2 === 0 ? "YELLOW" : "GREEN";
      const deliverySide = spawnSide === "YELLOW" ? "GREEN" : "YELLOW";
      events.push(event(`urn-${time}`, time, formatTime(time), `SOUL URN · ${spawnSide}`, "urn", "urn", "icons/soul-urn.png", `${spawnSide} SIDE SPAWN`, `The Urn appears on the ${spawnSide.toLowerCase()} side. Carry it to the ${deliverySide.toLowerCase()} side for the team bounty.`, [["SPAWN SIDE", spawnSide], ["DELIVER TO", deliverySide]]));
    }

    for (let center = 14 * MINUTE; center <= 56 * MINUTE; center += 7 * MINUTE) {
      events.push(windowEvent(`rift-${center}`, center - MINUTE, center + MINUTE, `${formatTime(center - MINUTE)}–${formatTime(center + MINUTE)}`, "UNSTABLE RIFT WINDOW", "rift", "rift", "icons/unstable-rift.svg", "VARIABLE OBJECTIVE", "Watch for the lane effect, then the global countdown.", [["GLOBAL CALL", "25s"], ["VARIANCE", "±1:00"]]));
    }

    return events.sort((a, b) => a.start - b.start || a.end - b.end || a.title.localeCompare(b.title));
  }

  const events = makeEvents();
  const campPresets = [
    { title: "SMALL CAMP", duration: 85, icon: "icons/neutral-small.png" },
    { title: "MEDIUM CAMP", duration: 5 * MINUTE, icon: "icons/neutral-medium.png" },
    { title: "LARGE CAMP", duration: 5.5 * MINUTE, icon: "icons/neutral-large.png" },
  ];

  let preferences = loadPreferences();
  let seconds = 0;
  let running = false;
  let timers = [];
  let nextTimerId = 1;
  let lastTick = performance.now();
  let previousCueSecond = 0;
  let focusedEventId = "";

  const clockElement = document.querySelector(".master-clock");
  const runButton = document.querySelector('[data-action="run"]');
  const runLabel = document.querySelector("[data-run-label]");
  const liveStatus = document.querySelector("[data-live-status]");
  const setTimeButton = document.querySelector('[data-action="set-time"]');
  const setTimeForm = document.querySelector("[data-set-time-form]");
  const clockInput = document.querySelector("[data-clock-input]");
  const menuButton = document.querySelector('[data-action="menu"]');
  const preferencesMenu = document.querySelector("[data-preferences-menu]");
  const eventList = document.querySelector("[data-event-list]");
  const eventRows = document.querySelector("[data-event-rows]");
  const activeEyebrow = document.querySelector("[data-active-eyebrow]");
  const activeTitle = document.querySelector("[data-active-title]");
  const activeTimers = document.querySelector("[data-active-timers]");
  const timerCount = document.querySelector("[data-timer-count]");
  const campSelect = document.querySelector("[data-camp-select]");
  const campIcon = document.querySelector("[data-camp-icon]");

  hydratePreferenceControls();
  bindControls();
  renderAll();

  window.setInterval(() => {
    if (!running) return;
    const now = performance.now();
    const elapsedWholeSeconds = Math.floor((now - lastTick) / 1000);
    if (elapsedWholeSeconds < 1) return;
    lastTick += elapsedWholeSeconds * 1000;
    const nextSecond = seconds + elapsedWholeSeconds;
    checkWarningCues(seconds, nextSecond);
    seconds = nextSecond;
    timers = timers.filter((timer) => timer.targetSecond > seconds);
    previousCueSecond = seconds;
    renderAll();
  }, 100);

  function bindControls() {
    runButton.addEventListener("click", () => {
      running = !running;
      lastTick = performance.now();
      renderClock();
    });

    document.querySelector('[data-action="back"]').addEventListener("click", () => adjustClock(-10));
    document.querySelector('[data-action="forward"]').addEventListener("click", () => adjustClock(10));

    setTimeButton.addEventListener("click", () => {
      const opening = setTimeForm.hidden;
      setTimeForm.hidden = !opening;
      preferencesMenu.hidden = true;
      menuButton.setAttribute("aria-expanded", "false");
      setTimeButton.classList.toggle("active-control", opening);
      menuButton.classList.remove("active-control");
      if (opening) {
        clockInput.value = formatTime(seconds);
        clockInput.focus();
      }
    });

    setTimeForm.addEventListener("submit", (submitEvent) => {
      submitEvent.preventDefault();
      const parsed = parseClock(clockInput.value);
      if (parsed === null) return;
      const delta = parsed - seconds;
      seconds = parsed;
      timers = timers.map((timer) => ({ ...timer, targetSecond: timer.targetSecond + delta }));
      previousCueSecond = seconds;
      setTimeForm.hidden = true;
      setTimeButton.classList.remove("active-control");
      renderAll();
    });

    menuButton.addEventListener("click", () => {
      const opening = preferencesMenu.hidden;
      preferencesMenu.hidden = !opening;
      setTimeForm.hidden = true;
      menuButton.setAttribute("aria-expanded", String(opening));
      menuButton.classList.toggle("active-control", opening);
      setTimeButton.classList.remove("active-control");
    });

    document.querySelector('[data-action="close-menu"]').addEventListener("click", closeMenu);

    document.querySelectorAll("[data-preference]").forEach((control) => {
      control.addEventListener("change", () => {
        preferences[control.dataset.preference] = control.checked;
        savePreferences();
      });
    });

    document.querySelectorAll("[data-filter]").forEach((control) => {
      control.addEventListener("change", () => {
        preferences.enabled[control.dataset.filter] = control.checked;
        savePreferences();
        focusedEventId = "";
        renderSchedule();
      });
    });

    document.querySelector('[data-timer="boss"]').addEventListener("click", () => startTimer({ title: "MID BOSS", duration: 7 * MINUTE, icon: "icons/mid-boss.png", color: "coral" }));
    document.querySelector('[data-timer="rejuvenator"]').addEventListener("click", () => startTimer({ title: "REJUVENATOR", duration: 3 * MINUTE, icon: "icons/rejuvenator.svg", color: "green" }));
    document.querySelector('[data-timer="sinner"]').addEventListener("click", () => startTimer({ title: "SINNER’S", duration: 5 * MINUTE, icon: "icons/neutral-vault.png", color: "amber" }));
    document.querySelector('[data-timer="camp"]').addEventListener("click", () => startTimer({ ...campPresets[Number(campSelect.value)], color: "cyan" }));

    campSelect.addEventListener("change", () => {
      campIcon.src = campPresets[Number(campSelect.value)].icon;
    });

    activeTimers.addEventListener("click", (clickEvent) => {
      const cancelButton = clickEvent.target.closest("[data-cancel-timer]");
      if (!cancelButton) return;
      timers = timers.filter((timer) => timer.id !== Number(cancelButton.dataset.cancelTimer));
      renderTimers();
    });
  }

  function closeMenu() {
    preferencesMenu.hidden = true;
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.classList.remove("active-control");
  }

  function adjustClock(delta) {
    const nextSecond = Math.max(0, seconds + delta);
    const appliedDelta = nextSecond - seconds;
    checkWarningCues(seconds, nextSecond);
    seconds = nextSecond;
    timers = timers.map((timer) => ({ ...timer, targetSecond: timer.targetSecond + appliedDelta }));
    previousCueSecond = seconds;
    renderAll();
  }

  function startTimer(preset) {
    const timer = { ...preset, id: nextTimerId++, targetSecond: seconds + preset.duration };
    timers = [timer, ...timers.filter((item) => item.title !== timer.title)];
    renderTimers();
  }

  function renderAll() {
    renderClock();
    renderSchedule();
    renderTimers();
  }

  function renderClock() {
    const display = formatTime(seconds);
    clockElement.textContent = display;
    clockElement.setAttribute("aria-label", `Match time ${display}`);
    runLabel.textContent = running ? "PAUSE" : "START";
    runButton.classList.toggle("is-running", running);
    liveStatus.textContent = running ? "LIVE" : "PAUSED";
  }

  function renderSchedule() {
    const filtered = events.filter((matchEvent) => preferences.enabled[matchEvent.filter]);
    const activeIndex = findActiveIndex(filtered);
    const active = activeIndex >= 0 ? filtered[activeIndex] : null;

    activeEyebrow.textContent = active ? active.eyebrow : "EVENT FILTERS";
    activeTitle.textContent = active ? active.title : "NO EVENTS SELECTED";

    if (!filtered.length) {
      eventRows.innerHTML = '<div class="empty-schedule"><strong>NO EVENTS SELECTED</strong><span>Use the menu to restore event groups.</span></div>';
      return;
    }

    eventRows.innerHTML = filtered.map((matchEvent, index) => renderEvent(matchEvent, index, activeIndex)).join("");

    if (active && focusedEventId !== active.id) {
      focusedEventId = active.id;
      window.requestAnimationFrame(() => {
        const activeRow = eventRows.querySelector(`[data-event-id="${active.id}"]`);
        if (!activeRow) return;
        const desiredTop = eventRows.offsetTop + activeRow.offsetTop - eventList.clientHeight * 0.32;
        eventList.scrollTo({ top: Math.max(0, desiredTop), behavior: "smooth" });
      });
    }
  }

  function renderEvent(matchEvent, index, activeIndex) {
    const status = eventState(matchEvent, seconds);
    const countdown = matchEvent.start - seconds;
    const enlargedIcon = matchEvent.kind === "camp" || matchEvent.kind === "sinner" || matchEvent.kind === "creeps";
    let statusMarkup = "";

    if (status === "past") statusMarkup = "<span>PASSED</span>";
    if (status === "live") statusMarkup = `<strong>${matchEvent.start === matchEvent.end ? "SPAWNED" : "WINDOW OPEN"}</strong>`;
    if (status === "warning") statusMarkup = `<strong>${formatTime(countdown)}</strong><span>GET READY</span>`;
    if (status === "upcoming" && index === activeIndex) statusMarkup = `<strong>${formatTime(countdown)}</strong><span>UNTIL EVENT</span>`;

    return `
      <article class="event-row event-${matchEvent.kind} is-${status} ${index === activeIndex ? "is-focus" : ""}" data-event-id="${matchEvent.id}" tabindex="0">
        <div class="event-time">${matchEvent.timeLabel}</div>
        <div class="event-icon-wrap"><img class="event-icon event-icon-${matchEvent.kind} ${enlargedIcon ? "event-icon-large" : ""}" src="${matchEvent.icon}" alt="" width="88" height="88"></div>
        <div class="event-copy"><span>${matchEvent.eyebrow}</span><h3>${matchEvent.title}</h3></div>
        <div class="event-status">${statusMarkup}</div>
        <div class="event-tooltip" role="tooltip">
          <span>${matchEvent.eyebrow}</span><h4>${matchEvent.title}</h4><p>${matchEvent.summary}</p>
          <dl>${matchEvent.facts.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl>
        </div>
      </article>`;
  }

  function renderTimers() {
    timerCount.textContent = String(timers.length);
    if (!timers.length) {
      activeTimers.innerHTML = '<div class="empty-timers"><span>NO RETRIGGERS RUNNING</span><p>Click a clear button when an objective goes down.</p></div>';
      return;
    }

    activeTimers.innerHTML = timers.map((timer) => {
      const remaining = Math.max(0, timer.targetSecond - seconds);
      const progress = Math.max(0, Math.min(1, remaining / timer.duration));
      const largeClass = timer.title.includes("CAMP") || timer.title.includes("SINNER") ? "active-icon-large" : "";
      return `
        <article class="active-timer timer-${timer.color}">
          <img class="${largeClass}" src="${timer.icon}" alt="" width="56" height="56">
          <div><span>${timer.title}</span><strong>${formatTime(remaining)}</strong></div>
          <div class="timer-ring" style="--progress:${progress * 360}deg" aria-hidden="true"></div>
          <button type="button" data-cancel-timer="${timer.id}" aria-label="Cancel ${timer.title} timer">×</button>
        </article>`;
    }).join("");
  }

  function findActiveIndex(filtered) {
    if (!filtered.length) return -1;
    let found = filtered.findIndex((matchEvent) => matchEvent.start === matchEvent.end && seconds >= matchEvent.start && seconds <= matchEvent.start + 10);
    if (found !== -1) return found;
    found = filtered.findIndex((matchEvent) => matchEvent.start === matchEvent.end && matchEvent.start > seconds && matchEvent.start - seconds <= 30);
    if (found !== -1) return found;
    found = filtered.findIndex((matchEvent) => matchEvent.end > matchEvent.start && seconds >= matchEvent.start && seconds <= matchEvent.end);
    if (found !== -1) return found;
    found = filtered.findIndex((matchEvent) => matchEvent.start > seconds);
    return found === -1 ? filtered.length - 1 : found;
  }

  function eventState(matchEvent, currentSeconds) {
    const exact = matchEvent.start === matchEvent.end;
    if (exact) {
      if (currentSeconds > matchEvent.start + 10) return "past";
      if (currentSeconds >= matchEvent.start) return "live";
      if (matchEvent.start - currentSeconds <= 30) return "warning";
      return "upcoming";
    }
    if (currentSeconds > matchEvent.end) return "past";
    if (currentSeconds >= matchEvent.start && currentSeconds <= matchEvent.end) return "live";
    if (matchEvent.start - currentSeconds <= 30 && matchEvent.start > currentSeconds) return "warning";
    return "upcoming";
  }

  function checkWarningCues(previous, next) {
    if (next < previous || next === previous) return;
    const filtered = events.filter((matchEvent) => preferences.enabled[matchEvent.filter]);
    const crossedWarning = filtered.some((matchEvent) => {
      const cueAt = matchEvent.start - 30;
      return cueAt >= 0 && previous < cueAt && next >= cueAt;
    });
    if (!crossedWarning) return;
    if (preferences.flashWarning) showFlashCue();
    if (preferences.audioCues) playAudioCue();
  }

  function showFlashCue() {
    document.querySelector(".warning-flash")?.remove();
    const flash = document.createElement("div");
    flash.className = "warning-flash";
    flash.setAttribute("aria-hidden", "true");
    document.querySelector(".field-clock").prepend(flash);
    window.setTimeout(() => flash.remove(), 1800);
  }

  function playAudioCue() {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return;
    const context = new AudioContextCtor();
    const start = context.currentTime;
    [0, 0.16].forEach((offset, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(index === 0 ? 620 : 820, start + offset);
      gain.gain.setValueAtTime(0.0001, start + offset);
      gain.gain.exponentialRampToValueAtTime(0.1, start + offset + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.12);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start + offset);
      oscillator.stop(start + offset + 0.13);
    });
    window.setTimeout(() => context.close(), 600);
  }

  function formatTime(value) {
    const safe = Math.max(0, Math.floor(value));
    const minutes = Math.floor(safe / 60);
    const remainingSeconds = safe % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  function parseClock(value) {
    const match = value.trim().match(/^(\d{1,3})(?::([0-5]?\d))?$/);
    if (!match) return null;
    return Number(match[1]) * MINUTE + Number(match[2] || 0);
  }

  function loadPreferences() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(PREFERENCES_KEY));
      if (!saved) return structuredClone(defaultPreferences);
      return {
        ...defaultPreferences,
        ...saved,
        enabled: { ...defaultPreferences.enabled, ...(saved.enabled || {}) },
      };
    } catch {
      return structuredClone(defaultPreferences);
    }
  }

  function savePreferences() {
    window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  }

  function hydratePreferenceControls() {
    document.querySelectorAll("[data-preference]").forEach((control) => {
      control.checked = Boolean(preferences[control.dataset.preference]);
    });
    document.querySelectorAll("[data-filter]").forEach((control) => {
      control.checked = Boolean(preferences.enabled[control.dataset.filter]);
    });
  }
})();
