(function () {
  "use strict";

  const recipes = Array.isArray(window.RECIPES) ? window.RECIPES : [];
  const requiredFields = [
    "id", "name", "icon", "deck", "diet", "category", "timeMinutes", "servings",
    "costPerServing", "nutrition", "ingredients", "steps", "storage", "source"
  ];

  const validRecipes = recipes.filter((recipe) => {
    const missing = requiredFields.filter((field) => recipe[field] === undefined || recipe[field] === null);
    if (missing.length) {
      console.warn(`Plate Plan skipped recipe "${recipe.name || recipe.id || "unknown"}"; missing: ${missing.join(", ")}`);
      return false;
    }
    return true;
  });

  const elements = {
    filterForm: document.querySelector("[data-filter-form]"),
    search: document.querySelector("[data-search]"),
    quick: document.querySelector("[data-quick]"),
    mealPrep: document.querySelector("[data-meal-prep]"),
    sort: document.querySelector("[data-sort]"),
    list: document.querySelector("[data-recipe-list]"),
    count: document.querySelector("[data-result-count]"),
    summary: document.querySelector("[data-result-summary]"),
    empty: document.querySelector("[data-empty-state]"),
    placeholder: document.querySelector("[data-detail-placeholder]"),
    detail: document.querySelector("[data-recipe-detail]"),
    detailPanel: document.querySelector("[data-detail-panel]"),
    random: document.querySelector("[data-pick-random]"),
    clear: document.querySelector("[data-clear-filters]")
  };

  const state = {
    query: "",
    diet: "all",
    quick: false,
    mealPrep: false,
    sort: "featured",
    selectedId: new URL(window.location.href).searchParams.get("recipe")
  };

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getVisibleRecipes() {
    const query = state.query.trim().toLowerCase();
    const filtered = validRecipes.filter((recipe) => {
      const searchable = [
        recipe.name,
        recipe.deck,
        recipe.category,
        recipe.diet,
        ...recipe.ingredients
      ].join(" ").toLowerCase();

      return (!query || searchable.includes(query))
        && (state.diet === "all" || recipe.diet === state.diet)
        && (!state.quick || recipe.timeMinutes <= 30)
        && (!state.mealPrep || recipe.mealPrep);
    });

    const sorters = {
      fastest: (a, b) => a.timeMinutes - b.timeMinutes,
      protein: (a, b) => b.nutrition.protein - a.nutrition.protein,
      cost: (a, b) => a.costPerServing - b.costPerServing
    };

    return state.sort === "featured"
      ? filtered
      : [...filtered].sort(sorters[state.sort]);
  }

  function cardMarkup(recipe, displayIndex) {
    const active = recipe.id === state.selectedId;
    const prepLabel = recipe.mealPrep ? " · meal prep" : "";

    return `
      <button class="recipe-card" type="button" data-recipe-id="${escapeHtml(recipe.id)}"
        aria-pressed="${active}" style="--recipe-accent: ${escapeHtml(recipe.accent)}">
        <span class="card-index" aria-hidden="true">
          <span class="dish-icon">${escapeHtml(recipe.icon)}</span>
          <span class="dish-number">${String(displayIndex + 1).padStart(2, "0")}</span>
        </span>
        <span>
          <span class="card-topline">
            <span class="diet-mark">${escapeHtml(recipe.diet)}</span>
            <span>${escapeHtml(recipe.category)}${prepLabel}</span>
          </span>
          <h3>${escapeHtml(recipe.name)}</h3>
          <span class="card-metrics">
            <span>${recipe.timeMinutes} min</span>
            <span><strong>$${recipe.costPerServing.toFixed(2)}</strong> / serving</span>
            <span class="card-nutrition card-calories"><strong>${recipe.nutrition.calories}</strong> cal</span>
            <span class="card-nutrition card-protein"><strong>${recipe.nutrition.protein}g</strong> protein</span>
          </span>
        </span>
      </button>`;
  }

  function renderList() {
    const visible = getVisibleRecipes();
    elements.list.innerHTML = visible.map(cardMarkup).join("");
    elements.count.textContent = visible.length;
    elements.summary.textContent = visible.length === validRecipes.length
      ? "Showing every recipe"
      : `${visible.length} of ${validRecipes.length} recipes`;
    elements.empty.hidden = visible.length > 0;

    elements.list.querySelectorAll("[data-recipe-id]").forEach((button) => {
      button.addEventListener("click", () => selectRecipe(button.dataset.recipeId));
    });
  }

  function tagMarkup(label) {
    return `<span class="detail-tag">${escapeHtml(label)}</span>`;
  }

  function nutritionMarkup(label, value, suffix, emphasis) {
    return `
      <div class="nutrition-item${emphasis ? ` is-${escapeHtml(emphasis)}` : ""}">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}${escapeHtml(suffix || "")}</strong>
      </div>`;
  }

  function ingredientKind(ingredient) {
    const value = ingredient.toLowerCase();
    const rules = [
      ["produce", /\b(onions?|garlic|ginger|broccoli|carrots?|spinach|parsley|olives?|lemons?|arugula|tomatoes?|cucumbers?|cilantro|mushrooms?|cauliflower|sprouts?|parsnips?|broccolini|kale|avocados?|radishes?|scallions?|sweet potatoes?|jalapeños?|peppers?|basil|limes?|sauerkraut|green chiles?|herbs?)\b/],
      ["protein", /\b(shrimp|tuna|salmon|tofu|chickpeas?|beans?|lentils?|edamame|eggs?)\b/],
      ["grain", /\b(rice|quinoa|pitas?|naan|tortillas?|bread|breadcrumbs?|cornstarch|flour)\b/],
      ["dairy", /\b(cheddar|cheese|halloumi|muenster|provolone|mozzarella|parmesan|feta|milk|cream|butter|cottage cheese|sour cream|mayonnaise)\b/]
    ];
    return rules.find(([, pattern]) => pattern.test(value))?.[0] || "pantry";
  }

  function groupedIngredients(ingredients) {
    const order = ["produce", "protein", "grain", "dairy", "pantry"];
    return order.flatMap((kind) => ingredients
      .filter((ingredient) => ingredientKind(ingredient) === kind)
      .map((ingredient, index) => ({ ingredient, kind, groupStart: index === 0 }))
    );
  }

  function detailMarkup(recipe) {
    const prepTag = recipe.mealPrep ? tagMarkup("Meal-prep friendly") : "";
    const nutrition = recipe.nutrition;

    return `
      <button class="detail-close" type="button" data-close-detail aria-label="Close recipe">×</button>
      <header class="detail-hero" style="--recipe-accent: ${escapeHtml(recipe.accent)}">
        <div class="detail-tags">
          ${tagMarkup(recipe.diet)}
          ${tagMarkup(recipe.category)}
          ${prepTag}
        </div>
        <h2 id="selected-recipe-title">${escapeHtml(recipe.name)}</h2>
        <p class="detail-deck">${escapeHtml(recipe.deck)}</p>
      </header>

      <section class="headline-metrics" aria-label="Key recipe facts">
        <div class="headline-metric is-calories">
          <span>Est. cost</span>
          <strong>$${recipe.costPerServing.toFixed(2)}</strong>
          <small>per serving</small>
        </div>
        <div class="headline-metric is-protein">
          <span>Calories</span>
          <strong>${nutrition.calories}</strong>
          <small>per serving</small>
        </div>
        <div class="headline-metric">
          <span>Protein</span>
          <strong>${nutrition.protein}g</strong>
          <small>per serving</small>
        </div>
        <div class="headline-metric">
          <span>Yield</span>
          <strong>${recipe.servings}</strong>
          <small>servings</small>
        </div>
        <div class="headline-metric">
          <span>Time</span>
          <strong>${recipe.timeMinutes}</strong>
          <small>minutes</small>
        </div>
      </section>

      <div class="detail-body">
        <section class="ingredients" aria-labelledby="ingredients-title">
          <h3 id="ingredients-title">Ingredients</h3>
          <ul class="ingredient-list">
            ${groupedIngredients(recipe.ingredients).map(({ ingredient, kind, groupStart }) => `
              <li class="ingredient-${escapeHtml(kind)}${groupStart ? " group-start" : ""}">
                <label>
                  <input type="checkbox" aria-label="Mark ${escapeHtml(ingredient)} complete">
                  <span class="ingredient-text">${escapeHtml(ingredient)}</span>
                </label>
              </li>`).join("")}
          </ul>
        </section>

        <section class="method" aria-labelledby="method-title">
          <h3 id="method-title">INSTRUCTIONS</h3>
          <ol class="step-list">
            ${recipe.steps.map((step) => `<li><span>${escapeHtml(step)}</span></li>`).join("")}
          </ol>
        </section>
      </div>

      <section class="nutrition-block" aria-labelledby="nutrition-title">
        <div class="nutrition-header">
          <h3 id="nutrition-title">More nutrition</h3>
          <p>Estimated per serving</p>
        </div>
        <div class="nutrition-grid">
          ${nutritionMarkup("Calories", nutrition.calories, "", "calories")}
          ${nutritionMarkup("Protein", nutrition.protein, "g", "protein")}
          ${nutritionMarkup("Carbs", nutrition.carbs, "g")}
          ${nutritionMarkup("Fat", nutrition.fat, "g")}
          ${nutritionMarkup("Fiber", nutrition.fiber, "g")}
          ${nutritionMarkup("Sodium", nutrition.sodium, "mg")}
        </div>
      </section>

      <section class="storage-block" aria-labelledby="storage-title">
        <h3 id="storage-title">Leftover logic</h3>
        <p>${escapeHtml(recipe.storage)}</p>
      </section>

      <p class="source-line">
        Concise directions adapted and paraphrased from
        <a href="${escapeHtml(recipe.source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(recipe.source.publisher)}</a>.
        Cost and nutrition are working estimates; consult the source for the publisher's full recipe and notes.
      </p>`;
  }

  function selectRecipe(id, options) {
    const recipe = validRecipes.find((item) => item.id === id);
    if (!recipe) return;

    state.selectedId = recipe.id;
    elements.placeholder.hidden = true;
    elements.detail.hidden = false;
    elements.detail.style.setProperty("--recipe-accent", recipe.accent);
    elements.detail.innerHTML = detailMarkup(recipe);
    elements.detail.setAttribute("aria-labelledby", "selected-recipe-title");
    renderList();

    elements.detail.querySelector("[data-close-detail]")?.addEventListener("click", closeDetail);
    elements.detailPanel.scrollTop = 0;

    const url = new URL(window.location.href);
    url.searchParams.set("recipe", recipe.id);
    window.history.replaceState({}, "", url);

    if (window.matchMedia("(max-width: 900px)").matches) {
      elements.detailPanel.classList.add("is-open");
      document.body.classList.add("detail-open");
      if (!options?.skipFocus) {
        window.setTimeout(() => elements.detail.querySelector("[data-close-detail]")?.focus(), 280);
      }
    } else {
      elements.detailPanel.classList.remove("is-open");
      document.body.classList.remove("detail-open");
    }
  }

  function closeDetail() {
    state.selectedId = null;
    elements.detailPanel.classList.remove("is-open");
    document.body.classList.remove("detail-open");
    elements.detail.hidden = true;
    elements.detail.innerHTML = "";
    elements.placeholder.hidden = false;
    renderList();

    const url = new URL(window.location.href);
    url.searchParams.delete("recipe");
    window.history.replaceState({}, "", url);
  }

  function syncStateFromForm() {
    state.query = elements.search.value;
    state.diet = elements.filterForm.elements.diet.value;
    state.quick = elements.quick.checked;
    state.mealPrep = elements.mealPrep.checked;
    state.sort = elements.sort.value;

    const selectedIsVisible = getVisibleRecipes().some((recipe) => recipe.id === state.selectedId);
    if (state.selectedId && !selectedIsVisible) closeDetail();
    renderList();
  }

  function clearFilters() {
    elements.filterForm.reset();
    state.query = "";
    state.diet = "all";
    state.quick = false;
    state.mealPrep = false;
    state.sort = "featured";
    renderList();
    elements.search.focus();
  }

  elements.filterForm.addEventListener("input", syncStateFromForm);
  elements.filterForm.addEventListener("change", syncStateFromForm);
  elements.clear.addEventListener("click", clearFilters);
  elements.random.addEventListener("click", () => {
    let visible = getVisibleRecipes();
    if (!visible.length) {
      clearFilters();
      visible = getVisibleRecipes();
    }
    const choice = visible[Math.floor(Math.random() * visible.length)];
    if (choice) selectRecipe(choice.id);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && elements.detailPanel.classList.contains("is-open")) {
      closeDetail();
    }
  });

  window.addEventListener("resize", () => {
    if (!window.matchMedia("(max-width: 900px)").matches) {
      elements.detailPanel.classList.remove("is-open");
      document.body.classList.remove("detail-open");
    } else if (state.selectedId) {
      elements.detailPanel.classList.add("is-open");
      document.body.classList.add("detail-open");
    }
  });

  renderList();
  if (state.selectedId) selectRecipe(state.selectedId, { skipFocus: true });
}());
