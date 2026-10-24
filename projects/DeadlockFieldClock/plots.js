(() => {
  "use strict";
  const data = window.DeadlockEconomy;
  const $ = selector => document.querySelector(selector);
  const key = "deadlock-soul-lab-v1";
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const escape = value => String(value).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const format = value => value == null ? "—" : value.toLocaleString("en-US", { maximumFractionDigits: 1 });
  const clock = minute => {
    const seconds = Math.round(minute * 60);
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  };
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(key)) || {}; } catch { /* Storage is optional, including file://. */ }
  const state = {
    wave: saved.wave === true, run: saved.run === true, onDrop: saved.onDrop === true,
    soloKill: saved.soloKill !== false,
    riftTeam: saved.riftTeam === true,
    hiddenSeries: data.initialHiddenSeries(saved.hiddenSeries),
    end: [30, 45, 60].includes(saved.end) ? saved.end : 45,
    minute: clamp(finite(saved.minute, 10), 0, 60),
    hero: data.heroes.some(hero => hero.id === saved.hero) ? saved.hero : "",
    income: clamp(finite(saved.income, 700), 300, 1800),
    earlier: clamp(finite(saved.earlier, 3200), 0, 50000),
    custom: clamp(finite(saved.custom, 10000), 600, 100000),
    customEnabled: saved.customEnabled === true,
    show: saved.show !== false,
  };
  state.minute = Math.min(state.minute, state.end);
  const save = () => { try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* Nonessential preference. */ } };
  const types = [
    { id: "creep", color: "#5bd8ea", start: 0 },
    { id: "box", color: "#f5bb58", start: 3 },
    { id: "sinner", color: "#bb9aff", start: 8 },
    { id: "small-camp", name: "small camp", color: "#77dca4", start: 2, dash: "4 3" },
    { id: "medium-camp", name: "medium camp", color: "#7aa6ff", start: 5, dash: "8 4" },
    { id: "large-camp", name: "large camp", color: "#ea95d0", start: 8, dash: "12 3 2 3" },
    { id: "hero-kill", name: "equal-worth hero kill", color: "#ff806e", start: 0, dash: "2 5", breaks: [40] },
    { id: "rift", name: "Unstable Rift", color: "#f3f0ba", start: 13, dash: "9 3 2 3" },
    { id: "urn", name: "Soul Urn", color: "#f49c56", start: 10, step: 5, dash: "6 3" },
  ];
  const visibleTypes = () => types.filter(type => !state.hiddenSeries.includes(type.id));

  function milestones() {
    const result = [];
    if (state.hero) {
      result.push({ id: "ult", tag: "U", label: "ULTIMATE UNLOCK", title: "Ultimate available", souls: 3800,
        note: "Shared threshold · unlock it manually", shared: true });
      result.push({ id: "max", tag: "T3", label: "EARLIEST T3", title: "First possible maxed ability", souls: 6600,
        note: "8 AP in one ability · later if you split points", shared: true });
      const guide = data.guides[state.hero];
      if (guide) result.push({ id: "guide", tag: "G", label: "GUIDE MILESTONE", title: guide.title,
        souls: guide.souls + (guide.kind === "ability" ? 0 : state.earlier),
        note: guide.kind === "ability" ? "Earliest possible · ability-point rush" : `${format(guide.souls)} target + ${format(state.earlier)} other spending`,
        guide: true });
    }
    if (state.customEnabled) result.push({ id: "custom", tag: "C", label: "YOUR TARGET", title: "Custom soul target", souls: state.custom,
      note: "Your own milestone · not guide-backed", guide: true });
    return result.map(marker => ({ ...marker,
      time: data.milestoneTime(marker.souls, state.income),
      early: data.milestoneTime(marker.souls, state.income * 1.2),
      late: data.milestoneTime(marker.souls, state.income * 0.8),
    }));
  }

  function renderControls() {
    $("#time-window").value = state.end;
    $("#on-drop").checked = state.onDrop;
    document.querySelectorAll("[data-rift]").forEach(button => button.setAttribute("aria-pressed", String(state.riftTeam === (button.dataset.rift === "team"))));
    document.querySelectorAll("[data-series]").forEach(input => {
      input.checked = !state.hiddenSeries.includes(input.dataset.series);
      input.closest(".series-card").classList.toggle("series-muted", !input.checked);
    });
    document.querySelectorAll("[data-kill]").forEach(button => button.setAttribute("aria-pressed", String(state.soloKill === (button.dataset.kill === "solo"))));
    $("#hero-select").value = state.hero;
    $("#income").value = state.income;
    $("#income-label").textContent = format(state.income);
    $("#earlier-spend").value = state.earlier;
    $("#custom-souls").value = state.custom;
    $("#custom-enabled").checked = state.customEnabled;
    $("#show-overlay").checked = state.show;
    document.querySelectorAll("[data-unit]").forEach(button => {
      const group = button.dataset.unit === "creep" ? state.wave : state.run;
      button.setAttribute("aria-pressed", String(group === (button.dataset.value === "group")));
    });
    const hero = data.heroes.find(entry => entry.id === state.hero);
    $("#hero-identity").hidden = !hero;
    if (hero) {
      $("#hero-portrait").src = hero.image;
      $("#hero-portrait").alt = hero.name;
      $("#hero-name").textContent = hero.name;
      $("#hero-status").textContent = data.guides[hero.id] ? "Guide-backed build milestone" : "Shared thresholds only";
    }
    const guide = data.guides[state.hero];
    $("#target-controls").hidden = !guide || guide.kind === "ability";
    $("#spend-label").innerHTML = guide?.kind === "investment"
      ? 'SPENDING IN OTHER CATEGORIES <span>SOULS</span>'
      : 'OTHER SPENDING <span>EXCLUDES THE TARGET</span>';
    $("#budget-note").textContent = guide?.kind === "investment"
      ? "The 4.8k target is in one category. Add your investment in the other two."
      : "Adjust for the rest of your build. Target components are already included.";
    $("#guide-source").hidden = !hero;
    $("#guide-source").innerHTML = guide
      ? `<a href="https://mobalytics.gg/deadlock/builds/${guide.slug}" target="_blank" rel="noreferrer">${escape(guide.author)}’s ${escape(hero.name)} guide ↗</a><span class="date">GUIDE UPDATED ${guide.updated}</span><p>${escape(guide.note)}</p><p>Build-specific advice; older guides may not reflect the current patch. Minute marks are calculated here, not provided by the author.</p>`
      : hero ? `<p>No vetted hero-specific spike has been added for ${escape(hero.name)}. The two shared thresholds are not a claim about this hero’s strongest timing. You can add your own soul target.</p>` : "";
    const markers = milestones();
    $("#milestone-cards").innerHTML = markers.length ? markers.map(marker =>
      `<button type="button" class="milestone-card ${marker.guide ? "guide" : ""}" data-marker="${marker.id}" ${marker.time > 60 ? "disabled" : ""} aria-label="${marker.time > 60 ? "Outside the 60-minute chart:" : "Inspect"} ${escape(marker.title)} at estimated ${clock(marker.time)}"><span class="card-top"><span>${marker.tag} · ${marker.label}</span><strong>~${clock(marker.time)}</strong></span><h3>${escape(marker.title)}</h3><p>${format(marker.souls)} total souls · ${escape(marker.note)}${marker.time > 60 ? " · Beyond the 60-minute plot limit" : ""}</p></button>`
    ).join("") : '<p class="empty-note">Pick any hero for shared ability milestones. Guide-backed heroes also get a build-specific target.</p>';
  }

  function renderValues() {
    for (const type of types) $("#" + type.id + "-value").textContent = format(data.bounty(type.id, state.minute, state));
    $("#box-mode-label").textContent = state.onDrop ? "all drop" : "average";
    $("#rift-mode-label").textContent = state.riftTeam ? "souls · team total" : "souls · per hero";
    $("#kill-basis-label").textContent = `KILL: ${state.soloKill ? "SOLO ×1.25" : "BASE BOUNTY"} · NO COMEBACK`;
    $("#inspect-time").max = state.end;
    $("#inspect-time").value = state.minute;
    $("#inspect-time").setAttribute("aria-valuetext", `${clock(state.minute)} match time`);
    $("#inspect-time-label").value = clock(state.minute);
    $("#selection-caption").textContent = `${visibleTypes().length} / ${types.length} CURVES · CAMPS = COMPOSITION ESTIMATES`;
    const active = state.show && milestones().length;
    $("#overlay-caption").textContent = active ? "DASHED = MODELED TIMING · SHADE = ±20% PACE" : state.hero ? "Hero overlay hidden" : "Select a hero to overlay milestones";
    $("#lane-value").textContent = format(data.laneSupply(state.minute));
    $("#lane-interval").textContent = `${data.waveInterval(state.minute)}s / wave`;
    const boxRun = data.bounty("box", state.minute, { run: true });
    const wave = data.bounty("creep", state.minute, { wave: true });
    const sinner = data.bounty("sinner", state.minute);
    $("#comparison-insight").innerHTML = state.minute < 3
      ? "<strong>Boxes arrive at 03:00.</strong> Sinner’s Sacrifices become available at 08:00. Their values scale from the start of the match."
      : `At <strong>${clock(state.minute)}</strong>, an average ten-box run is worth <strong>${format(boxRun / wave * 100)}% of a wave</strong>${sinner == null ? ". Sinner’s arrives at 08:00." : `; one Sinner’s is worth <strong>${format(sinner / wave * 100)}%</strong>.`}<br>Value per clear does not account for travel or clear speed.`;
  }

  const niceMax = value => {
    const rough = value / 4;
    const unit = 10 ** Math.floor(Math.log10(rough));
    const step = [1, 2, 2.5, 5, 10].find(n => n * unit >= rough) * unit;
    return { max: Math.ceil(value / step) * step, step };
  };
  function grid({ w, h, l, r, top, bottom, maximum, step, x, y }) {
    let html = "";
    for (let value = 0; value <= maximum; value += step) {
      html += `<line class="chart-grid" x1="${l}" x2="${w - r}" y1="${y(value)}" y2="${y(value)}"/><text class="chart-axis" x="${l - 8}" y="${y(value) + 3}" text-anchor="end">${format(value)}</text>`;
    }
    const tick = w < 450 ? 10 : 5;
    for (let t = 0; t <= state.end; t += tick) {
      if (state.end % tick && state.end - t < tick * 0.75) continue;
      html += `<text class="chart-axis" x="${x(t)}" y="${h - bottom + 22}" text-anchor="middle">${t}:00</text>`;
    }
    if (state.end % tick) html += `<text class="chart-axis" x="${x(state.end)}" y="${h - bottom + 22}" text-anchor="end">${state.end}:00</text>`;
    return html;
  }

  function renderBountyChart() {
    const svg = $("#bounty-chart");
    const w = Math.max(260, svg.clientWidth), h = svg.clientHeight || 330;
    const markers = state.show ? milestones() : [];
    const l = 48, r = 22, top = markers.length ? 64 : 28, bottom = 34;
    const shown = visibleTypes();
    const { max: maximum, step } = niceMax(Math.max(100, ...shown.map(type => data.bounty(type.id, state.end, state))) * 1.06);
    const x = t => l + t / state.end * (w - l - r);
    const y = value => h - bottom - value / maximum * (h - bottom - top);
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    let html = '<title id="chart-title">Soul rewards versus match time</title><desc id="chart-desc">Compare Troopers, boxes, Sinner’s, three modeled camp sizes, equal-worth hero kills, Rift and Urn. Card checkboxes control visible curves. Urn values step at scheduled spawns. Rift defaults to one sixth of the team bounty. Hero-kill bounty caps at minute 40. Vertical green lines are estimated build milestones. Use the time slider for exact values.</desc>';
    html += grid({ w, h, l, r, top, bottom, maximum, step, x, y });
    markers.forEach((marker, index) => {
      if (marker.early > state.end) return;
      html += `<rect x="${x(marker.early)}" y="${top}" width="${x(Math.min(state.end, marker.late)) - x(marker.early)}" height="${h - bottom - top}" fill="#a5e2b1" opacity=".045"/>`;
      if (marker.time > state.end) return;
      const labelX = clamp(x(marker.time), l + 34, w - r - 34);
      html += `<line class="milestone-line" x1="${x(marker.time)}" x2="${x(marker.time)}" y1="${top}" y2="${h - bottom}"/><text class="milestone-label" x="${labelX}" y="${top - 10 - index * 12}" text-anchor="middle">${marker.tag} ~${clock(marker.time)}</text>`;
    });
    shown.forEach(type => {
      const begin = data.bounty(type.id, type.start, state);
      const points = [type.start, ...(type.breaks || []).filter(t => t > type.start && t < state.end), state.end];
      let path = points.map((t, index) => `${index ? "L" : "M"} ${x(t)} ${y(data.bounty(type.id, t, state))}`).join(" ");
      if (type.step) {
        path = `M ${x(type.start)} ${y(begin)}`;
        for (let t = type.start + type.step; t <= state.end; t += type.step) {
          path += ` H ${x(t)} V ${y(data.bounty(type.id, t, state))}`;
        }
        path += ` H ${x(state.end)}`;
      }
      html += `<path class="chart-line" data-curve="${type.id}" stroke="${type.color}" ${type.dash ? `stroke-dasharray="${type.dash}"` : ""} d="${path}"/><circle cx="${x(type.start)}" cy="${y(begin)}" r="3" fill="${type.color}"/>`;
    });
    if (!shown.length) html += `<text class="chart-axis" x="${w / 2}" y="${h / 2}" text-anchor="middle">Check a card above to show its curve</text>`;
    html += `<line class="cursor-line" x1="${x(state.minute)}" x2="${x(state.minute)}" y1="${top}" y2="${h - bottom}"/>`;
    shown.forEach(type => {
      const value = data.bounty(type.id, state.minute, state);
      if (value != null) html += `<circle cx="${x(state.minute)}" cy="${y(value)}" r="4" fill="#091824" stroke="${type.color}" stroke-width="2"/>`;
    });
    svg.innerHTML = html;
    svg.dataset.left = l;
    svg.dataset.right = r;
  }

  function renderLaneChart() {
    const svg = $("#lane-chart");
    const w = Math.max(280, svg.clientWidth), h = 190, l = 54, r = 25, top = 25, bottom = 34;
    const { max: maximum, step } = niceMax(data.laneSupply(state.end) * 1.1);
    const x = t => l + t / state.end * (w - l - r);
    const y = value => h - bottom - value / maximum * (h - bottom - top);
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    let html = "<title>Potential lane souls per minute</title><desc>Four Troopers per wave, before sharing. Wave interval decreases from 30 to 25 seconds at minute 20 and to 20 seconds at minute 35.</desc>";
    html += grid({ w, h, l, r, top, bottom, maximum, step, x, y });
    const points = [[0, data.laneSupply(0)]];
    [20, 35].filter(t => t <= state.end).forEach(t => {
      points.push([t, data.bounty("creep", t, { wave: true }) * 60 / data.waveInterval(t - 0.01)]);
      points.push([t, data.laneSupply(t)]);
      html += `<line class="chart-grid" x1="${x(t)}" x2="${x(t)}" y1="${top}" y2="${h - bottom}"/><text class="chart-axis" x="${x(t) - 5}" y="${top - 9}" text-anchor="end">${data.waveInterval(t)}s WAVES</text>`;
    });
    points.push([state.end, data.laneSupply(state.end)]);
    const path = points.map(([t, val], index) => `${index ? "L" : "M"} ${x(t)} ${y(val)}`).join(" ");
    html += `<path d="${path} L ${x(state.end)} ${y(0)} L ${x(0)} ${y(0)} Z" fill="#5bd8ea" opacity=".065"/><path class="chart-line" d="${path}" stroke="#5bd8ea"/><line class="cursor-line" x1="${x(state.minute)}" x2="${x(state.minute)}" y1="${top}" y2="${h - bottom}"/><circle cx="${x(state.minute)}" cy="${y(data.laneSupply(state.minute))}" r="4" fill="#081622" stroke="#5bd8ea" stroke-width="2"/>`;
    svg.innerHTML = html;
  }

  function renderCharts() { renderValues(); renderBountyChart(); renderLaneChart(); }
  function update() { renderControls(); renderCharts(); save(); }
  const sortedHeroes = [...data.heroes].sort((a, b) => a.name.localeCompare(b.name));
  for (const [label, filter] of [["Guide-backed milestone", hero => data.guides[hero.id]], ["Shared thresholds + custom target", hero => !data.guides[hero.id]]]) {
    const group = document.createElement("optgroup");
    group.label = label;
    sortedHeroes.filter(filter).forEach(hero => {
      const option = document.createElement("option");
      option.value = hero.id; option.textContent = hero.name; group.append(option);
    });
    $("#hero-select").append(group);
  }
  $("#coverage-label").textContent = `${Object.keys(data.guides).length} GUIDES / ${data.heroes.length} HEROES`;
  types.forEach(type => {
    const title = document.querySelector(`.series-card.${type.id} .series-title`);
    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.series = type.id;
    input.setAttribute("aria-label", `Show ${type.name || type.id} curve`);
    input.style.accentColor = type.color;
    input.addEventListener("change", () => {
      state.hiddenSeries = state.hiddenSeries.filter(id => id !== type.id);
      if (!input.checked) state.hiddenSeries.push(type.id);
      update();
    });
    title.prepend(input);
  });
  document.querySelectorAll("[data-kill]").forEach(button => button.addEventListener("click", () => {
    state.soloKill = button.dataset.kill === "solo"; update();
  }));
  document.querySelectorAll("[data-rift]").forEach(button => button.addEventListener("click", () => {
    state.riftTeam = button.dataset.rift === "team"; update();
  }));
  document.querySelectorAll("[data-unit]").forEach(button => button.addEventListener("click", () => {
    state[button.dataset.unit === "creep" ? "wave" : "run"] = button.dataset.value === "group"; update();
  }));
  $("#time-window").addEventListener("change", event => { state.end = Number(event.target.value); state.minute = Math.min(state.minute, state.end); update(); });
  $("#on-drop").addEventListener("change", event => { state.onDrop = event.target.checked; update(); });
  $("#hero-select").addEventListener("change", event => { state.hero = event.target.value; state.show = true; update(); });
  $("#show-overlay").addEventListener("change", event => { state.show = event.target.checked; update(); });
  $("#income").addEventListener("input", event => { state.income = Number(event.target.value); update(); });
  $("#earlier-spend").addEventListener("change", event => { state.earlier = clamp(finite(event.target.value, 3200), 0, 50000); update(); });
  $("#custom-souls").addEventListener("change", event => { state.custom = clamp(finite(event.target.value, 10000), 600, 100000); update(); });
  $("#custom-enabled").addEventListener("change", event => { state.customEnabled = event.target.checked; update(); });
  $("#inspect-time").addEventListener("input", event => { state.minute = Number(event.target.value); renderCharts(); save(); });
  $("#milestone-cards").addEventListener("click", event => {
    const marker = milestones().find(entry => entry.id === event.target.closest("[data-marker]")?.dataset.marker);
    if (!marker) return;
    if (marker.time > state.end) state.end = marker.time <= 45 ? 45 : 60;
    state.minute = clamp(marker.time, 0, state.end); update();
  });
  let pointerFrame;
  function inspectPointer(event) {
    // A touch scroll should not drag the inspection cursor unless explicitly tapped.
    if (event.type === "pointermove" && event.pointerType === "touch") return;
    const rect = $("#bounty-chart").getBoundingClientRect();
    const l = Number($("#bounty-chart").dataset.left), r = Number($("#bounty-chart").dataset.right);
    const minute = clamp((event.clientX - rect.left - l) / (rect.width - l - r) * state.end, 0, state.end);
    cancelAnimationFrame(pointerFrame);
    pointerFrame = requestAnimationFrame(() => { state.minute = Math.round(minute * 10) / 10; renderCharts(); });
  }
  $("#bounty-chart-wrap").addEventListener("pointermove", inspectPointer);
  $("#bounty-chart-wrap").addEventListener("pointerdown", inspectPointer);
  $("#bounty-chart-wrap").addEventListener("pointerleave", save);
  document.querySelectorAll(".help-wrap").forEach(help => {
    help.addEventListener("pointerenter", () => help.classList.remove("tooltip-dismissed"));
    help.addEventListener("focusin", () => help.classList.remove("tooltip-dismissed"));
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") document.querySelectorAll(".help-wrap").forEach(help => help.classList.add("tooltip-dismissed"));
  });
  let resizeFrame;
  const observer = new ResizeObserver(() => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(renderCharts); });
  observer.observe($("#bounty-chart-wrap"));
  update();
})();
