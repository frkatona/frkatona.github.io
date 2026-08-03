(() => {
  "use strict";

  const STORAGE_KEY = "deadlock-counterbuy-lineup-v2";
  const MAX_HEROES = 6;
  const TIERS = [800, 1600, 3200, 6400];
  const TIER_COLORS = {
    800: "#54d8ff",
    1600: "#ff7065",
    3200: "#f29be5",
    6400: "#f1ead6",
  };
  const TYPE_COLORS = {
    weapon: "#e6ad2e",
    vitality: "#78c858",
    spirit: "#a875e8",
  };
  const TYPE_LABELS = {
    weapon: "GUN",
    vitality: "HEALTH",
    spirit: "SPIRIT",
  };

  const itemDefinitions = [
    ["rebuttal", "Rebuttal", 800, "rebuttal.svg", "vitality"],
    ["rusted-barrel", "Rusted Barrel", 800, "rusted-barrel.webp", "spirit"],
    ["monster-rounds", "Monster Rounds", 800, "monster-rounds.webp", "weapon"],
    ["slowing-hex", "Slowing Hex", 1600, "slowing-hex.webp", "spirit"],
    ["debuff-reducer", "Debuff Reducer", 1600, "debuff-reducer.webp", "vitality"],
    ["reactive-barrier", "Reactive Barrier", 1600, "reactive-barrier.webp", "vitality"],
    ["return-fire", "Return Fire", 1600, "return-fire.webp", "vitality"],
    ["healbane", "Healbane", 1600, "healbane.webp", "vitality"],
    ["enchanters-emblem", "Enchanter's Emblem", 1600, "enchanter-s-emblem.webp", "vitality"],
    ["decay", "Decay", 3200, "decay.webp", "spirit"],
    ["toxic-bullets", "Toxic Bullets", 3200, "toxic-bullets.webp", "weapon"],
    ["warp-stone", "Warp Stone", 3200, "warp-stone.webp", "vitality"],
    ["silence-wave", "Silence Wave", 3200, "silence-wave.webp", "spirit"],
    ["counterspell", "Counterspell", 3200, "counterspell.svg", "vitality"],
    ["dispel-magic", "Dispel Magic", 3200, "dispel-magic.webp", "vitality"],
    ["spirit-resilience", "Spirit Resilience", 3200, "spirit-resilience.webp", "vitality"],
    ["disarming-hex", "Disarming Hex", 3200, "disarming-hex.webp", "spirit"],
    ["metal-skin", "Metal Skin", 3200, "metal-skin.webp", "vitality"],
    ["rescue-beam", "Rescue Beam", 3200, "rescue-beam.webp", "vitality"],
    ["ricochet", "Ricochet", 6400, "ricochet.webp", "weapon"],
    ["knockdown", "Knockdown", 3200, "knockdown.webp", "spirit"],
    ["cultist-sacrifice", "Cultist Sacrifice", 3200, "cultist-sacrifice.webp", "weapon"],
    ["juggernaut", "Juggernaut", 6400, "juggernaut.webp", "vitality"],
    ["spellbreaker", "Spellbreaker", 6400, "spellbreaker.webp", "vitality"],
    ["indomitable", "Indomitable", 6400, "indomitable.webp", "vitality"],
    ["unstoppable", "Unstoppable", 6400, "unstoppable.webp", "vitality"],
    ["cursed-relic", "Cursed Relic", 6400, "cursed-relic.webp", "spirit"],
    ["divine-barrier", "Divine Barrier", 6400, "divine-barrier.webp", "vitality"],
    ["plated-armor", "Plated Armor", 6400, "plated-armor.webp", "vitality"],
    ["ethereal-shift", "Ethereal Shift", 6400, "ethereal-shift.webp", "spirit"],
    ["silencer", "Silencer", 6400, "silencer.webp", "weapon"],
    ["spirit-burn", "Spirit Burn", 6400, "spirit-burn.webp", "spirit"],
    ["phantom-strike", "Phantom Strike", 6400, "phantom-strike.webp", "vitality"],
  ];

  const items = Object.fromEntries(itemDefinitions.map(([id, name, cost, file, type]) => [id, {
    id,
    name,
    cost,
    type,
    icon: `counterbuy-assets/items/${file}`,
  }]));

  const rec = (item, target, note) => ({ item, target, note });
  const hero = (id, name, color, recommendations) => ({
    id,
    name,
    color,
    image: `counterbuy-assets/heroes/${id}.webp`,
    recommendations,
  });

  const heroes = [
    hero("abrams", "Abrams", "#4f95ff", [
      rec("rebuttal", "Melee pressure", "Adds immediate melee resistance against his common close-range build."),
      rec("decay", "Healing + max health", "Percent-health damage and anti-heal punish his large health pool."),
      rec("toxic-bullets", "Healing + max health", "Sustained percent-health damage with anti-heal."),
      rec("warp-stone", "Charge / slam", "Reposition to avoid Shoulder Charge and the slam area."),
      rec("juggernaut", "Melee pressure", "Late-game melee resistance when an early Rebuttal is no longer enough."),
    ]),
    hero("apollo", "Apollo", "#efbf64", [
      rec("slowing-hex", "Movement kit", "Shuts off most of his ability-based movement."),
      rec("silence-wave", "Movement + casting", "A second disable if he removes the first Slowing Hex."),
      rec("counterspell", "Ultimate silence", "Can answer the ultimate before or after its silence lands."),
      rec("spellbreaker", "Spirit burst", "Large spirit resistance blunts his burst window."),
    ]),
    hero("bebop", "Bebop", "#d4a86f", [
      rec("warp-stone", "Hook follow-up", "Break line of sight or escape around a corner after the hook."),
      rec("counterspell", "Sticky Bomb", "Block the bomb timing when the target is predictable."),
      rec("dispel-magic", "Sticky Bomb", "Remove the bomb before detonation."),
      rec("indomitable", "First hook", "Automatically negates the first hook control instance."),
      rec("unstoppable", "Hook follow-up", "Activate after the hook to leave the combo."),
    ]),
    hero("billy", "Billy", "#e1905e", [
      rec("rebuttal", "Melee pressure", "Punishes his melee-heavy trading pattern."),
      rec("slowing-hex", "Rising Ram", "Stops the free movement and escape from Rising Ram."),
      rec("counterspell", "Ultimate", "Creates a reaction-based way out of the ultimate."),
      rec("dispel-magic", "Wrecked", "Removes the Wrecked debuff and lowers his follow-up damage."),
      rec("unstoppable", "Ultimate", "Reliable crowd-control immunity for his ultimate."),
      rec("ethereal-shift", "Ultimate", "Wait out the dangerous part of the ultimate."),
    ]),
    hero("calico", "Calico", "#d496ee", [
      rec("slowing-hex", "Movement kit", "Disables her movement abilities and interrupts her combo flow."),
      rec("silence-wave", "Ability combo", "Temporarily shuts down the abilities that make her mobile."),
      rec("spirit-resilience", "Spirit burst", "Helps survive her spirit-heavy burst combo."),
      rec("cursed-relic", "Cooldown escape", "A hard disable when her movement cooldowns are available."),
    ]),
    hero("celeste", "Celeste", "#da98ff", [
      rec("rusted-barrel", "Early gun pressure", "An inexpensive answer to her unusually strong early lane gun damage."),
      rec("slowing-hex", "Air movement", "Added gravity makes her easier to chase and bring toward the floor."),
      rec("knockdown", "Flight", "Puts her on the ground to secure the kill."),
      rec("dispel-magic", "Light Eater Sack", "Removing the buff nullifies much of her damage."),
      rec("disarming-hex", "Gun follow-up", "Turns off the weapon damage hidden inside her kit."),
    ]),
    hero("the-doorman", "The Doorman", "#7fb5db", [
      rec("silence-wave", "Door setup", "His door is not movement, so use silence or crowd control instead of Slowing Hex."),
      rec("warp-stone", "Ultimate exit", "Reposition after the combo to avoid the prepared follow-up."),
      rec("counterspell", "Door hit / exit", "Block the initial door hit or the post-ultimate follow-up."),
      rec("unstoppable", "Exit time slow", "Prevents the slow applied when leaving his ultimate."),
      rec("cursed-relic", "Door setup + Cheat Death", "Hard-disables him and can remove Cheat Death before Unstoppable."),
    ]),
    hero("drifter", "Drifter", "#d57b62", [
      rec("dispel-magic", "Mark + debuffs", "Cleanses his mark, Toxic Bullets, and other kit debuffs."),
      rec("counterspell", "Ultimate", "The telegraphed ultimate is often easy to preempt."),
      rec("disarming-hex", "Gun damage", "He contributes very little while his gun is disabled."),
      rec("metal-skin", "High stacks", "Temporarily blocks gun damage, though it does not stop debuff buildup."),
      rec("divine-barrier", "Ultimate", "A well-timed barrier can nullify the ultimate's impact."),
    ]),
    hero("dynamo", "Dynamo", "#6eb8bf", [
      rec("reactive-barrier", "Singularity", "Provides a shield while controlled, but does not fully answer the ultimate."),
      rec("rescue-beam", "Singularity", "Pull an ally out once Dynamo cannot be interrupted."),
      rec("unstoppable", "Singularity", "The most reliable personal answer if activated in time."),
    ]),
    hero("graves", "Graves", "#82c879", [
      rec("return-fire", "Skulls", "Can destroy skulls while Graves is shooting on the same timing."),
      rec("dispel-magic", "Wall + Toxic Bullets", "Helps escape the wall or cleanse her Toxic Bullets proc."),
      rec("ricochet", "Skulls + ghouls", "Bounces through summons and clears an entire wave quickly."),
    ]),
    hero("grey-talon", "Grey Talon", "#8fc975", [
      rec("rusted-barrel", "Early lane", "A cheap answer to his strong early weapon pressure."),
      rec("slowing-hex", "Flight", "Limits his late-game aerial positioning."),
      rec("knockdown", "Flight", "Brings him down and opens a kill window."),
      rec("spellbreaker", "Charged Shot", "Absorbs much of the spirit burst from a charged shot."),
    ]),
    hero("haze", "Haze", "#a0a7ff", [
      rec("dispel-magic", "Fixation stacks", "Cleanses the stacks retained through temporary bullet immunity."),
      rec("metal-skin", "Bullet Dance", "Provides temporary bullet immunity during the damage window."),
      rec("indomitable", "Sleep combo", "An automatic answer when the combo is too fast to predict."),
      rec("plated-armor", "Fixation buildup", "Slows stack application so her damage ramps much more slowly."),
    ]),
    hero("holliday", "Holliday", "#f0a45e", [
      rec("slowing-hex", "Jump pads", "Shuts off her ability to escape through jump pads."),
      rec("counterspell", "Lasso", "Block the audible lasso wind-up if your reactions are reliable."),
      rec("spirit-resilience", "Barrels", "General spirit resistance reduces barrel burst."),
      rec("indomitable", "Lasso", "The lasso automatically procs a large defensive shield."),
      rec("unstoppable", "Lasso", "Reaction-based immunity to the lasso."),
    ]),
    hero("infernus", "Infernus", "#ed684d", [
      rec("counterspell", "Concussive Combustion", "Block the ultimate's burst and control."),
      rec("dispel-magic", "Afterburn", "Immediately removes his burn buildup and damage-over-time."),
      rec("warp-stone", "Ultimate radius", "Exit the explosion radius before it resolves."),
      rec("plated-armor", "Catalyst buildup", "Slows repeated hit buildup when other stack-based carries are present."),
      rec("juggernaut", "Weapon pressure", "A durable option when his build leans heavily into primary fire."),
    ]),
    hero("ivy", "Ivy", "#6ebf8f", [
      rec("counterspell", "Stone Form", "Block Stone Form and walk away before the repeat cast."),
      rec("dispel-magic", "Capacitor gun build", "Strong against the common Capacitor-enhanced gun setup."),
      rec("metal-skin", "Gun build", "Temporary bullet immunity against weapon-focused Ivy."),
      rec("unstoppable", "Stone Form", "Ignore the control from Stone Form."),
    ]),
    hero("kelvin", "Kelvin", "#6ecfed", [
      rec("slowing-hex", "Ice Path startup", "Cast before Ice Path; it does not stop a path already active."),
      rec("healbane", "Frozen Shelter healing", "A low-cost source of anti-heal inside the dome."),
      rec("knockdown", "Ice Path", "Knocks him through the path and back to the floor."),
      rec("silence-wave", "Frozen Shelter", "Stop the ultimate before the dome appears."),
      rec("toxic-bullets", "Frozen Shelter healing", "Percent-health anti-heal is effective against his large frame."),
      rec("ethereal-shift", "Frozen Shelter", "Time out much of the dome while invulnerable."),
      rec("spirit-burn", "Frozen Shelter healing", "Late-game anti-heal when the dome sustain is decisive."),
    ]),
    hero("lady-geist", "Lady Geist", "#c68bf0", [
      rec("decay", "Low-health healing", "Apply when she is low to punish her healing and health swap setup."),
      rec("silence-wave", "Soul Exchange", "One of the cleanest ways to stop her ultimate cast."),
      rec("counterspell", "Soul Exchange", "Block the health swap when approaching a low-health Geist."),
      rec("dispel-magic", "Life Drain", "Removes one of her active drains."),
      rec("metal-skin", "Late gun build", "Useful once she transitions into a weapon carry."),
      rec("plated-armor", "Late gun build", "Late-game defense against her weapon scaling."),
      rec("silencer", "Soul Exchange", "Sustained late-game silence prevents the health swap."),
    ]),
    hero("lash", "Lash", "#55d4ec", [
      rec("slowing-hex", "Grapple escape", "Severely limits his ability to leave after committing."),
      rec("enchanters-emblem", "Spirit burst", "An efficient early layer of spirit defense."),
      rec("counterspell", "Death Slam", "A reaction-based answer to the ultimate."),
      rec("spirit-resilience", "Spirit burst", "Reduces the damage from his full combo."),
      rec("indomitable", "Death Slam", "Automatically protects against the ultimate control."),
      rec("unstoppable", "Death Slam", "Crowd-control immunity when the ultimate is anticipated."),
      rec("ethereal-shift", "Ground Strike slam", "The strongest transcript recommendation: nullify the committed slam and its damage."),
    ]),
    hero("mcginnis", "McGinnis", "#e4a65e", [
      rec("monster-rounds", "Mini Turrets", "Turrets count as NPCs, so the bonus damage applies to them."),
      rec("cultist-sacrifice", "Mini Turrets", "A stronger late option for clearing NPC-classed turrets."),
      rec("knockdown", "Indomitable + channel", "Coordinate two Knockdowns or another stun because she often buys Indomitable."),
    ]),
    hero("mina", "Mina", "#d96b95", [
      rec("slowing-hex", "Bat movement", "The first cast forces her cleanse; a teammate can then reapply it."),
      rec("silence-wave", "Ability escape", "Stops the movement chain more reliably than Knockdown."),
      rec("cursed-relic", "Ability escape", "Hard disable for the window after her cleanse is forced."),
    ]),
    hero("mirage", "Mirage", "#d9a361", [
      rec("slowing-hex", "Tornado movement", "Often needs two casts: force the cleanse, then apply it again."),
      rec("dispel-magic", "Scarabs / marks / Tornado", "Removes the beetle debuff, damage reduction, marks, and Tornado lift."),
      rec("unstoppable", "Basilisk + Tornado", "Built-in debuff reduction shortens stacks and prevents control."),
    ]),
    hero("mo-and-krill", "Mo & Krill", "#b58460", [
      rec("debuff-reducer", "Combo duration", "A strong baseline purchase that shortens the ultimate control."),
      rec("counterspell", "Combo", "Possible but difficult to time against the full combo."),
      rec("decay", "Large health pool", "Percent-health anti-heal punishes his durability."),
      rec("toxic-bullets", "Large health pool", "Sustained percent-health anti-heal."),
      rec("indomitable", "Combo", "Automatic control protection in a 1v1 scenario."),
      rec("unstoppable", "Combo", "Reliable immunity when multiple enemy controls justify it."),
    ]),
    hero("paige", "Paige", "#8eb4f7", [
      rec("dispel-magic", "Root + Knockdown", "Removes both her root and the Knockdown she commonly buys."),
      rec("unstoppable", "Control chain", "Required if repeated roots and purchased control are overwhelming."),
    ]),
    hero("paradox", "Paradox", "#7aa9dd", [
      rec("dispel-magic", "Damage amp stacks", "Removes the amplification stacks applied by her abilities."),
      rec("indomitable", "Paradoxical Swap", "The carbine does not proc it; the ultimate does, preserving the charge."),
    ]),
    hero("pocket", "Pocket", "#d0ac65", [
      rec("slowing-hex", "Flying Cloak", "Does not stop the throw, but prevents Pocket from taking the cloak."),
      rec("silence-wave", "Enchanter's Satchel", "Stops the invulnerable briefcase response to Slowing Hex."),
      rec("counterspell", "Affliction", "The telegraphed ultimate can be blocked on reaction."),
      rec("cursed-relic", "Escape chain", "A hard disable that prevents Cloak and Satchel escapes."),
      rec("divine-barrier", "Affliction", "Absorbs much of the ultimate when reactions are slower."),
    ]),
    hero("rem", "Rem", "#d995c5", [
      rec("slowing-hex", "Ally jump", "Stops the movement ability and can strand both Rem and the intended ally."),
      rec("healbane", "Team healing", "A cheap answer to Rem's high recent healing output."),
      rec("counterspell", "Ultimate", "The ultimate is telegraphed and often free to block."),
      rec("toxic-bullets", "Team healing", "Sustained anti-heal for longer fights."),
    ]),
    hero("seven", "Seven", "#9b8fff", [
      rec("dispel-magic", "Static Charge", "Removes the telegraphed stun and any Toxic Bullets proc."),
      rec("knockdown", "Storm Cloud", "Interrupts the aerial ultimate before he buys Unstoppable."),
      rec("disarming-hex", "Gun build", "A weapon carry without access to his gun is briefly ineffective."),
    ]),
    hero("shiv", "Shiv", "#e56758", [
      rec("healbane", "Sustain", "Low-cost healing reduction against his brawling sustain."),
      rec("dispel-magic", "Knives / Decay / dash", "Cleanses several stacked damage-over-time and amp debuffs at once."),
      rec("toxic-bullets", "Sustain", "Anti-heal that remains applied through an extended fight."),
      rec("spellbreaker", "Spirit burst + debuffs", "Blunts the large chunk and shortens his debuff durations."),
    ]),
    hero("silver", "Silver", "#a9b7c8", [
      rec("slowing-hex", "Dash", "She can still chase, but losing the dash makes her approach predictable."),
      rec("return-fire", "Slamfire", "Reflects a meaningful amount of her rapid human-form damage."),
      rec("warp-stone", "Dash", "Warp over her body-blocked dash and let her travel past you."),
      rec("metal-skin", "Wolf form", "Allows you to survive the claw window while bullet immunity lasts."),
      rec("disarming-hex", "Gun + claws", "Temporarily turns off both weapon fire and wolf-form claws."),
    ]),
    hero("sinclair", "Sinclair", "#b888e7", [
      rec("slowing-hex", "Assistant teleport", "Stops the repeated back-and-forth teleport interaction."),
      rec("knockdown", "Copied ultimate", "A generic interrupt when his chosen ultimate creates an opening."),
      rec("unstoppable", "Copied crowd control", "Protects against the most dangerous control ultimates he can copy."),
      rec("spellbreaker", "Spirit bolts", "Mitigates the extremely high-damage spirit bolts."),
    ]),
    hero("venator", "Venator", "#95b5e3", [
      rec("metal-skin", "Gun + ultimate", "Blocks both his primary weapon damage and the full ultimate."),
      rec("disarming-hex", "Gun + ultimate", "If he cannot fire, he cannot deliver his core damage."),
    ]),
    hero("victor", "Victor", "#88a998", [
      rec("slowing-hex", "Damage / healing zone", "His slow, lumbering movement makes it easier to leave his sustain area."),
      rec("healbane", "Healing", "Low-cost anti-heal for his core sustain loop."),
      rec("decay", "Healing", "A stronger active anti-heal window."),
      rec("cursed-relic", "Infuser / post-ultimate", "Disable Infuser or catch him immediately after the ultimate."),
      rec("spirit-burn", "Healing", "Late-game anti-heal when his sustain becomes the win condition."),
    ]),
    hero("vindicta", "Vindicta", "#69b6e6", [
      rec("slowing-hex", "Flight", "Stops her from entering Flight, though Knockdown is usually the harder answer."),
      rec("knockdown", "Flight", "Brings her to the ground and forces a defensive counter purchase."),
      rec("phantom-strike", "Flight", "Hard-engages and ruins her ability to play at aerial range."),
    ]),
    hero("viscous", "Viscous", "#8ece64", [
      rec("rebuttal", "Puddle Punch", "Parry a Puddle Punch to heal and gain the transcript's noted damage amplification."),
      rec("cursed-relic", "The Cube", "The Cube is a buff; Cursed Relic can remove it."),
    ]),
    hero("vyper", "Vyper", "#a7d358", [
      rec("return-fire", "Rapid fire", "Reflects pre-mitigation damage and can make her eliminate herself."),
      rec("counterspell", "Ultimate stun", "A reaction option if the stun timing is readable."),
      rec("dispel-magic", "Poison", "Removes the poison buildup after disengaging."),
      rec("knockdown", "Momentum", "Briefly kills her momentum and creates a punish window."),
      rec("metal-skin", "Rapid fire", "Blocks the bullets, though poison can still build."),
      rec("disarming-hex", "Gun", "Stops incoming bullets while the disarm lasts."),
      rec("indomitable", "Ultimate stun", "More predictable than trying to time Unstoppable against the fast stun."),
    ]),
    hero("warden", "Warden", "#7e9bd0", [
      rec("healbane", "Ultimate healing", "Reduces the sustain from his ultimate."),
      rec("dispel-magic", "Binding Word cage", "The first and most direct answer to a cage-max Warden."),
      rec("metal-skin", "Fed gun build", "The preferred weapon defense if he becomes highly fed."),
      rec("toxic-bullets", "Ultimate healing", "Applies sustained anti-heal during the ultimate."),
      rec("unstoppable", "Binding Word cage", "Required when repeated cage control cannot be safely cleansed."),
      rec("plated-armor", "Fed gun build", "An alternate defense against his weapon scaling."),
    ]),
    hero("wraith", "Wraith", "#cf83de", [
      rec("metal-skin", "Gun follow-up", "A temporary answer to the weapon damage after Telekinesis."),
      rec("indomitable", "Telekinesis", "Automatic protection against the instantaneous ultimate."),
      rec("unstoppable", "Telekinesis follow-up", "Activate after the lift to leave free of its effects."),
      rec("plated-armor", "Card buildup", "Slows card stack application, which is most of her damage."),
    ]),
    hero("yamato", "Yamato", "#ef715e", [
      rec("counterspell", "Telegraphed burst", "Her spirit damage is readable enough to block on reaction."),
      rec("dispel-magic", "Flying Strike signal", "Removes the point-and-click debuff signaling her arrival."),
      rec("silence-wave", "Shadow Transformation", "Stop the ultimate cast before it begins."),
      rec("spirit-resilience", "Spirit kit", "General protection because nearly all of her damage is spirit."),
      rec("cursed-relic", "Shadow Transformation", "Hard-disable her before she can become unkillable."),
      rec("silencer", "Shadow Transformation", "Sustained silence can prevent the ultimate cast."),
    ]),
  ];

  const heroById = Object.fromEntries(heroes.map((entry) => [entry.id, entry]));
  const lineupSlots = document.querySelector("[data-lineup-slots]");
  const lineupCount = document.querySelector("[data-lineup-count]");
  const overlapList = document.querySelector("[data-overlap-list]");
  const matrix = document.querySelector("[data-recommendation-matrix]");
  const sortSelect = document.querySelector("[data-sort]");
  const picker = document.querySelector("[data-hero-picker]");
  const heroSearch = document.querySelector("[data-hero-search]");
  const heroGrid = document.querySelector("[data-hero-grid]");
  const autoAdd = document.querySelector("[data-auto-add]");

  let selected = loadLineup();
  let replaceIndex = null;

  bindEvents();
  renderAll();

  function bindEvents() {
    lineupSlots.addEventListener("click", (event) => {
      const remove = event.target.closest("[data-remove-hero]");
      if (remove) {
        selected.splice(Number(remove.dataset.removeHero), 1);
        saveAndRender();
        return;
      }

      const slot = event.target.closest("[data-slot-index]");
      if (!slot) return;
      replaceIndex = slot.dataset.heroId ? Number(slot.dataset.slotIndex) : null;
      openPicker();
    });

    document.querySelector('[data-action="clear-lineup"]').addEventListener("click", () => {
      selected = [];
      saveAndRender();
    });

    sortSelect.addEventListener("change", renderOverlap);
    heroSearch.addEventListener("input", renderHeroGrid);
    heroSearch.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || event.isComposing) return;
      event.preventDefault();
      const topChoice = heroGrid.querySelector("[data-hero-choice]:not(:disabled)");
      if (topChoice) selectHero(topChoice.dataset.heroChoice);
    });

    heroGrid.addEventListener("click", (event) => {
      const choice = event.target.closest("[data-hero-choice]");
      if (!choice || choice.disabled) return;
      selectHero(choice.dataset.heroChoice);
    });

    picker.addEventListener("close", () => {
      replaceIndex = null;
      heroSearch.value = "";
      autoAdd.checked = false;
    });
  }

  function selectHero(heroId) {
    if (!heroById[heroId] || selected.includes(heroId) && selected[replaceIndex] !== heroId) return;

    if (replaceIndex !== null) {
      selected[replaceIndex] = heroId;
    } else if (selected.length < MAX_HEROES) {
      selected.push(heroId);
    }

    selected = [...new Set(selected)].slice(0, MAX_HEROES);
    replaceIndex = null;
    saveAndRender();

    if (autoAdd.checked && selected.length < MAX_HEROES) {
      heroSearch.value = "";
      renderHeroGrid();
      heroSearch.focus();
      return;
    }

    picker.close();
  }

  function renderAll() {
    renderLineup();
    renderOverlap();
    renderMatrix();
  }

  function renderLineup() {
    const slots = [];
    for (let index = 0; index < MAX_HEROES; index += 1) {
      const heroId = selected[index];
      if (heroId && heroById[heroId]) {
        const entry = heroById[heroId];
        slots.push(`
          <div class="hero-slot" style="--hero-color:${entry.color}">
            <button class="hero-slot-main" type="button" data-slot-index="${index}" data-hero-id="${entry.id}" aria-label="Replace ${entry.name}">
              <img class="hero-slot-image" src="${entry.image}" alt="">
              <span class="hero-slot-copy">
                <small>ENEMY ${index + 1}</small>
                <strong>${entry.name.toUpperCase()}</strong>
              </span>
            </button>
            <button class="remove-hero" type="button" data-remove-hero="${index}" aria-label="Remove ${entry.name}">&times;</button>
          </div>`);
      } else {
        slots.push(`
          <button class="add-slot" type="button" data-slot-index="${index}" aria-label="Add enemy hero">
            <span aria-hidden="true">+</span>
            <strong>ADD HERO</strong>
          </button>`);
      }
    }
    lineupSlots.innerHTML = slots.join("");
    lineupCount.textContent = `${selected.length} / ${MAX_HEROES} SELECTED`;
  }

  function renderOverlap() {
    if (!selected.length) {
      overlapList.innerHTML = '<div class="empty-lineup"><div><strong>NO LINEUP YET</strong><span>Add an enemy to rank shared counter items.</span></div></div>';
      return;
    }

    const aggregated = new Map();
    selected.forEach((heroId) => {
      const entry = heroById[heroId];
      entry.recommendations.forEach((recommendation) => {
        const current = aggregated.get(recommendation.item) || { item: items[recommendation.item], heroes: [] };
        current.heroes.push({ hero: entry, recommendation });
        aggregated.set(recommendation.item, current);
      });
    });

    const sorted = [...aggregated.values()].sort((a, b) => {
      if (sortSelect.value === "price") {
        return a.item.cost - b.item.cost || b.heroes.length - a.heroes.length || a.item.name.localeCompare(b.item.name);
      }
      return b.heroes.length - a.heroes.length || a.item.cost - b.item.cost || a.item.name.localeCompare(b.item.name);
    });

    overlapList.innerHTML = sorted.map((entry, index) => {
      const shared = entry.heroes.length > 1;
      const targets = entry.heroes.map(({ hero: targetHero }) => targetHero.name).join(", ");
      return `
        <article class="overlap-card${shared ? " is-shared" : ""}" style="--tier-color:${TIER_COLORS[entry.item.cost]};--type-color:${TYPE_COLORS[entry.item.type]}" title="Useful against: ${targets}">
          <span class="overlap-rank">${String(index + 1).padStart(2, "0")}</span>
          ${iconHtml(entry.item)}
          <div class="overlap-copy">
            <strong>${entry.item.name.toUpperCase()}</strong>
            <div class="overlap-meta">
              <span class="impact-badge">${entry.heroes.length} ${entry.heroes.length === 1 ? "HERO" : "HEROES"}</span>
              <span class="type-badge">${TYPE_LABELS[entry.item.type]}</span>
              <span class="price-badge">${formatCost(entry.item.cost)}</span>
              <span class="overlap-heroes">${entry.heroes.map(({ hero: targetHero }) => `<img src="${targetHero.image}" alt="${targetHero.name}" title="${targetHero.name}" style="--hero-color:${targetHero.color}">`).join("")}</span>
            </div>
          </div>
        </article>`;
    }).join("");
  }

  function renderMatrix() {
    if (!selected.length) {
      matrix.style.setProperty("--hero-count", 1);
      matrix.innerHTML = '<div class="empty-lineup"><div><strong>ADD AN ENEMY HERO</strong><span>The matchup board will organize every recommendation by current shop tier.</span></div></div>';
      return;
    }

    matrix.style.setProperty("--hero-count", selected.length);
    const cells = ['<div class="matrix-corner">SOUL TIER</div>'];
    selected.forEach((heroId) => {
      const entry = heroById[heroId];
      cells.push(`<div class="matrix-hero" style="--hero-color:${entry.color}"><img src="${entry.image}" alt=""><strong>${entry.name.toUpperCase()}</strong></div>`);
    });

    TIERS.forEach((tier) => {
      cells.push(`<div class="tier-label" style="--tier-color:${TIER_COLORS[tier]}"><strong>${formatCost(tier)}</strong><small>SOULS</small></div>`);
      selected.forEach((heroId) => {
        const entry = heroById[heroId];
        const recommendations = entry.recommendations.filter((recommendation) => items[recommendation.item].cost === tier);
        if (!recommendations.length) {
          cells.push('<div class="recommendation-cell is-empty" aria-label="No recommendation at this tier">-</div>');
          return;
        }
        cells.push(`<div class="recommendation-cell">${recommendations.map((recommendation) => itemCardHtml(recommendation)).join("")}</div>`);
      });
    });

    matrix.innerHTML = cells.join("");
  }

  function itemCardHtml(recommendation) {
    const item = items[recommendation.item];
    const tooltip = `${item.name} - ${recommendation.target}: ${recommendation.note}`;
    return `
      <article class="item-card" tabindex="0" style="--tier-color:${TIER_COLORS[item.cost]};--type-color:${TYPE_COLORS[item.type]}" title="${tooltip}">
        ${iconHtml(item)}
        <div class="item-copy">
          <strong>${item.name.toUpperCase()}</strong>
          <span class="item-card-meta"><span class="type-badge">${TYPE_LABELS[item.type]}</span><span class="price-badge">${formatCost(item.cost)}</span></span>
          <span class="item-target">COUNTERS: ${recommendation.target}</span>
          <span class="item-reason">${recommendation.note}</span>
        </div>
      </article>`;
  }

  function iconHtml(item) {
    return `<span class="item-icon-shell"><img src="${item.icon}" alt=""></span>`;
  }

  function openPicker() {
    heroSearch.value = "";
    renderHeroGrid();
    picker.showModal();
    window.requestAnimationFrame(() => heroSearch.focus());
  }

  function renderHeroGrid() {
    const query = heroSearch.value.trim().toLowerCase();
    const filtered = heroes.filter((entry) => entry.name.toLowerCase().includes(query));
    let enterTargetAssigned = false;
    heroGrid.innerHTML = filtered.map((entry) => {
      const alreadySelected = selected.includes(entry.id) && selected[replaceIndex] !== entry.id;
      const isEnterTarget = !alreadySelected && !enterTargetAssigned;
      if (isEnterTarget) enterTargetAssigned = true;
      return `
        <button class="hero-choice${isEnterTarget ? " is-enter-target" : ""}" type="button" data-hero-choice="${entry.id}" ${alreadySelected ? "disabled" : ""} style="--hero-color:${entry.color}">
          <img src="${entry.image}" alt="">
          <span>${entry.name.toUpperCase()}</span>
        </button>`;
    }).join("");
  }

  function loadLineup() {
    try {
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(stored)) {
        return [...new Set(stored.filter((id) => heroById[id]))].slice(0, MAX_HEROES);
      }
    } catch {
      // Ignore invalid or unavailable local storage.
    }
    return [];
  }

  function saveAndRender() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
    } catch {
      // The guide still works when storage is unavailable.
    }
    renderAll();
  }

  function formatCost(cost) {
    return cost.toLocaleString("en-US");
  }
})();
