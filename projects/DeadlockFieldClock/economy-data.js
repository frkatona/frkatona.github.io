/* Research snapshot: 2026-10-12. No live API or game connection is required.
 * Formulas are full, unshared bounties. Fractions are retained for plotting.
 * Guide milestones are editorial build advice; their minute marks are our model,
 * NOT timings claimed by the guide authors. See plots.html for assumptions.
 */
(() => {
  "use strict";
  const heroes = [
    ["abrams", "Abrams"], ["apollo", "Apollo"], ["baba", "Baba"],
    ["bebop", "Bebop"], ["billy", "Billy"], ["calico", "Calico"],
    ["celeste", "Celeste"], ["deadman-danny", "Deadman Danny"],
    ["the-doorman", "The Doorman"], ["drifter", "Drifter"], ["dynamo", "Dynamo"],
    ["graves", "Graves"], ["grey-talon", "Grey Talon"], ["haze", "Haze"],
    ["holliday", "Holliday"], ["infernus", "Infernus"], ["ivy", "Ivy"],
    ["kelvin", "Kelvin"], ["lady-geist", "Lady Geist"], ["lash", "Lash"],
    ["mcginnis", "McGinnis"], ["mina", "Mina"], ["mirage", "Mirage"],
    ["mo-and-krill", "Mo & Krill"], ["nurse-harrow", "Nurse Harrow"],
    ["paige", "Paige"], ["paradox", "Paradox"], ["pocket", "Pocket"],
    ["rat-king", "Rat King"], ["rem", "Rem"], ["seven", "Seven"],
    ["shiv", "Shiv"], ["silver", "Silver"], ["sinclair", "Sinclair"],
    ["solomon", "Solomon"], ["venator", "Venator"], ["victor", "Victor"],
    ["vindicta", "Vindicta"], ["violet", "Violet"], ["viscous", "Viscous"],
    ["vyper", "Vyper"], ["warden", "Warden"], ["wraith", "Wraith"], ["yamato", "Yamato"],
  ].map(([id, name]) => ({ id, name, image: `counterbuy-assets/heroes/${id}.webp` }));

  // Short paraphrases of the linked author guides, not universal build prescriptions.
  const guides = {
    "calico": { title: "4.8k Spirit investment", kind: "investment", souls: 4800,
      author: "Hydration", updated: "2026-03-09", slug: "calico",
      note: "The Spirit build aims for this investment bonus before committing to all-ins." },
    "graves": { title: "Toxic Bullets", kind: "item", souls: 3200,
      author: "Hydration", updated: "2026-03-09", slug: "graves-build",
      note: "A key mid-game damage purchase for this carry build." },
    "grey-talon": { title: "Charged Shot · T2 rush", kind: "ability", souls: 2600,
      author: "Vegas", updated: "2026-02-05", slug: "grey-talon",
      note: "The guide prioritizes the second upgrade. The earliest threshold assumes all first 3 AP go into Charged Shot." },
    "lash": { title: "Stamina Mastery", kind: "item", souls: 3200,
      author: "Hydration", updated: "2026-05-10", slug: "hydration-lash",
      note: "A mobility spike for initiating, finding isolated targets, and escaping." },
    "paradox": { title: "Spirit Burn", kind: "item", souls: 6400,
      author: "Sharky", updated: "2026-08-03", slug: "sharky-paradox",
      note: "A late-build Spirit damage spike. Increase earlier spending to fit your actual buy order." },
    "sinclair": { title: "4.8k Weapon investment", kind: "investment", souls: 4800,
      author: "Vegas", updated: "2026-02-05", slug: "sinclair",
      note: "After the Spirit core, the guide targets the Weapon investment bonus for stronger bolt follow-ups." },
    "vindicta": { title: "4.8k Vitality investment", kind: "investment", souls: 4800,
      author: "Suzu", updated: "2026-10-06", slug: "suzu-hybrid-vindicta",
      note: "This hybrid guide emphasizes the Vitality bonus to make a fragile carry harder to kill." },
    "viscous": { title: "4.8k Vitality investment", kind: "investment", souls: 4800,
      author: "Vegas", updated: "2026-02-05", slug: "viscous",
      note: "Lifestrike plus Battle Vest reaches the first Vitality spike in this Spirit/ball build." },
    "wraith": { title: "Ricochet", kind: "item", souls: 6400,
      author: "Rina", updated: "2026-07-26", slug: "carry-wraith-rina",
      note: "A farming spike for this carry build, helping generate cards and clear groups." },
  };
  const sources = {
    trooper: "https://deadlock.wiki/Trooper",
    box: "https://deadlock.wiki/Crates",
    sinner: "https://deadlock.wiki/Sinner",
    spawns: "https://deadlock.wiki/The_Cursed_Apple",
    boons: "https://deadlock.wiki/Boon",
    investment: "https://deadlock.wiki/Items",
    waves: "https://dramalock.org/guides/deadlock-creeps-troopers-lane-guide/",
    camps: "https://deadlock.wiki/Haunt",
    campModel: "https://mobalytics.gg/deadlock/guides/jungle-guide",
    kills: "https://deadlock.wiki/Deadlock:Tools",
    killDistribution: "https://www.dltimes.com/articles/deadlock-comeback-system",
  };
  // Representative composition means, NOT a census weighted by map locations.
  // Medium: mean of [2S+M, S+2M, 3M]. Large: mean of [L+2M, 3L].
  const campCompositions = Object.freeze({
    "small-camp": { start: 2, small: 3, medium: 0, large: 0 },
    "medium-camp": { start: 5, small: 1, medium: 2, large: 0 },
    "large-camp": { start: 8, small: 0, medium: 1, large: 2 },
  });
  const bounty = (type, minute, { wave = false, run = false, onDrop = false, soloKill = true } = {}) => {
    const t = Math.max(0, minute);
    if (type === "creep") return (100 + 2 * t) * (wave ? 4 : 1);
    if (type === "box") return t < 3 ? null : (23 + 2 * t) * (onDrop ? 1 : 0.6) * (run ? 10 : 1);
    if (type === "sinner") return t < 8 ? null : 310 + 3.35 * t;
    const camp = campCompositions[type];
    if (camp) return t < camp.start ? null : camp.small * (41 + 0.44 * t) + camp.medium * (68 + 0.73 * t) + camp.large * (181 + 1.95 * t);
    // Equal team net worth, victim at killer-team average; no first-kill,
    // comeback or hero-specific bonus, no dropped haunted souls. Continuous
    // reward curve (actual per-kill rounding can differ by about one soul).
    if (type === "hero-kill") return Math.min(2200, 200 + 50 * t) * (soloKill ? 1.25 : 1);
    throw new Error(`Unknown bounty type: ${type}`);
  };
  const waveInterval = minute => minute >= 35 ? 20 : minute >= 20 ? 25 : 30;
  const laneSupply = minute => bounty("creep", minute, { wave: true }) * 60 / waveInterval(minute);
  const milestoneTime = (totalSouls, income) => Math.max(0, (totalSouls - 600) / Math.max(1, income));
  const api = Object.freeze({ heroes, guides, sources, campCompositions, bounty, waveInterval, laneSupply, milestoneTime });
  if (typeof window !== "undefined") window.DeadlockEconomy = api;
  if (typeof module !== "undefined") module.exports = api;
})();
