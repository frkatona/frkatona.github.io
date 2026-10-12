const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { bounty, laneSupply, waveInterval, milestoneTime, heroes, guides } = require("./economy-data.js");

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
