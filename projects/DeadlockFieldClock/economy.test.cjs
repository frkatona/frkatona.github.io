const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { bounty, initialHiddenSeries, laneSupply, waveInterval, milestoneTime, heroes, guides } = require("./economy-data.js");

test("Rift shares and spawn-locked Urn rewards exclude bonuses", () => {
  assert.equal(bounty("rift", 12.999), null);
  assert.equal(bounty("rift", 13), 247);
  assert.equal(bounty("rift", 20), 506);
  assert.equal(bounty("rift", 20, {riftTeam:true}), 3036);
  assert.equal(bounty("urn", 9.999), null);
  assert.equal(bounty("urn", 10), 950);
  assert.equal(bounty("urn", 14.999), 950);
  assert.equal(bounty("urn", 15), 1300);
  assert.equal(bounty("urn", 17.5), 1300);
  assert.equal(bounty("urn", 60), 4450);
});

test("Rift, Urn and Kill start hidden even with saved opt-ins", () => {
  assert.deepEqual(initialHiddenSeries(), ["rift", "urn", "hero-kill"]);
  assert.deepEqual(initialHiddenSeries([]), ["rift", "urn", "hero-kill"]);
  assert.deepEqual(initialHiddenSeries(["box", "urn", null]), ["box", "urn", "rift", "hero-kill"]);
});

test("full bounty formulas and independent group toggles", () => {
  assert.equal(bounty("creep", 10), 120);
  assert.equal(bounty("creep", 10, { wave: true }), 480);
  assert.equal(bounty("box", 10), 25.8);
  assert.equal(bounty("box", 10, { run: true }), 258);
  assert.equal(bounty("box", 10, { onDrop: true }), 43);
  assert.equal(bounty("box", 10, { onDrop: true, run: true }), 430);
  assert.equal(bounty("sinner", 10), 343.5);
  assert.equal(bounty("sinner", 10, { run: true, wave: true }), 343.5);
});

test("availability starts at actual spawn times, scaling starts at zero", () => {
  assert.equal(bounty("box", 2.999), null);
  assert.equal(bounty("box", 3), 17.4);
  assert.equal(bounty("sinner", 7.999), null);
  assert.equal(bounty("sinner", 8), 336.8);
  assert.equal(bounty("creep", -2), 100);
});

test("wave supply includes both interval step changes", () => {
  assert.equal(waveInterval(19.999), 30);
  assert.equal(waveInterval(20), 25);
  assert.equal(waveInterval(34.999), 25);
  assert.equal(waveInterval(35), 20);
  assert.equal(laneSupply(0), 800);
  assert.equal(laneSupply(20), 1344);
  assert.equal(laneSupply(35), 2040);
});

test("camp curves use documented, explicit representative composition means", () => {
  const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
  assert.equal(bounty("small-camp", 1.999), null);
  assert.equal(bounty("medium-camp", 4.999), null);
  assert.equal(bounty("large-camp", 7.999), null);
  close(bounty("small-camp", 2), 3 * (41 + 0.44 * 2));
  close(bounty("medium-camp", 5), 41 + 0.44 * 5 + 2 * (68 + 0.73 * 5));
  close(bounty("large-camp", 8), 2 * (181 + 1.95 * 8) + 68 + 0.73 * 8);
  close(bounty("small-camp", 10), 136.2);
  close(bounty("medium-camp", 10), 196);
  close(bounty("large-camp", 10), 476.3);
  close(bounty("medium-camp", 10, {wave: true, run: true}), 196);
});

test("equal-worth hero kill curve includes solo credit and a 40-minute cap", () => {
  assert.equal(bounty("hero-kill", 0), 250);
  assert.equal(bounty("hero-kill", 10), 875);
  assert.equal(bounty("hero-kill", 10, {soloKill: false}), 700);
  assert.equal(bounty("hero-kill", 40), 2750);
  assert.equal(bounty("hero-kill", 45), 2750);
  assert.equal(bounty("hero-kill", 60, {soloKill: false}), 2200);
  assert.ok(bounty("hero-kill", 39.9) < bounty("hero-kill", 40));
});

test("milestone estimates subtract starting souls, not item cost alone", () => {
  assert.equal(milestoneTime(3800, 800), 4);
  assert.equal(milestoneTime(6600, 1000), 6);
  assert.equal(milestoneTime(4800 + 3200, 1000), 7.4);
  assert.equal(milestoneTime(600, 800), 0);
});

test("every roster entry has a real local portrait and guide entries resolve", () => {
  assert.equal(heroes.length, 44);
  assert.equal(new Set(heroes.map(hero => hero.id)).size, 44);
  for (const hero of heroes) assert.ok(fs.existsSync(path.join(__dirname, hero.image)), hero.id);
  assert.equal(Object.keys(guides).length, 9);
  for (const [id, guide] of Object.entries(guides)) {
    assert.ok(heroes.some(hero => hero.id === id));
    assert.ok(["item", "investment", "ability"].includes(guide.kind));
    assert.ok(guide.souls > 600);
    assert.match(guide.updated, /^2026-\d\d-\d\d$/);
    assert.ok(guide.slug && guide.author && guide.note);
  }
});
