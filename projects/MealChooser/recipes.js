/*
  PLATE PLAN RECIPE DATA
  ----------------------
  Add or update meals in this one file. Copy an existing object, give it a unique
  `id`, and keep the same fields. The interface, filters, nutrition panel, and
  source citation are generated automatically by script.js.

  Nutrition and cost values are per serving. They are working estimates, not
  medical or budgeting advice. `mealPrep: true` enables the Meal prep filter.
*/

window.RECIPES = [
  {
    id: "broccoli-cheddar-soup",
    name: "Broccoli Cheddar Soup",
    icon: "🥦",
    deck: "A thick, tangy pot of broccoli, carrot, and sharp cheddar that reheats gently for two extra lunches.",
    diet: "vegetarian",
    category: "Soup",
    timeMinutes: 35,
    servings: 4,
    mealPrep: true,
    accent: "#dbe85c",
    costPerServing: 2.65,
    nutrition: { calories: 505, protein: 23, carbs: 34, fat: 32, fiber: 4, sodium: 870 },
    ingredients: [
      "4 Tbsp unsalted butter",
      "1 yellow onion, chopped",
      "3 garlic cloves, chopped",
      "1/4 cup all-purpose flour",
      "2 cups whole milk",
      "2 cups vegetable broth",
      "3 cups small broccoli florets",
      "1 large carrot, finely chopped",
      "1/2 tsp Dijon mustard",
      "8 oz sharp cheddar, grated",
      "Salt and black pepper"
    ],
    steps: [
      "Melt butter in a large pot. Soften the onion with salt and pepper for 5 minutes; add garlic for 1 minute.",
      "Whisk in flour for 1–2 minutes. Slowly whisk in milk, then add broth, broccoli, carrot, and mustard.",
      "Simmer 15–20 minutes, until the broccoli is tender.",
      "Turn the heat very low. Add cheddar a handful at a time, stirring smooth before the next addition. Season and serve."
    ],
    storage: "Refrigerate up to 3 days. Reheat slowly on the stovetop so the cheese stays smooth; avoid a hard boil.",
    source: {
      publisher: "Love & Lemons",
      url: "https://www.loveandlemons.com/broccoli-cheddar-soup/"
    }
  },
  {
    id: "honey-garlic-shrimp",
    name: "Honey Garlic Shrimp Bowls",
    icon: "🍤",
    deck: "Glossy ginger-garlic shrimp, rice, and broccoli—fast enough for tonight, sturdy enough for tomorrow.",
    diet: "pescetarian",
    category: "Bowl",
    timeMinutes: 25,
    servings: 4,
    mealPrep: true,
    accent: "#ef8a68",
    costPerServing: 4.1,
    nutrition: { calories: 455, protein: 31, carbs: 61, fat: 10, fiber: 5, sodium: 790 },
    ingredients: [
      "1 lb shrimp, peeled and deveined",
      "1 Tbsp low-sodium soy sauce",
      "1 Tbsp cornstarch",
      "2 Tbsp neutral oil",
      "3 garlic cloves, minced",
      "1 Tbsp grated ginger",
      "1/4 cup honey",
      "Pinch of chile flakes",
      "3 cups cooked brown or white rice",
      "4 cups broccoli florets",
      "2 scallions, sliced"
    ],
    steps: [
      "Toss shrimp with soy sauce and cornstarch. Steam or microwave the broccoli until crisp-tender.",
      "Heat oil in a wide skillet. Cook garlic and ginger for 30 seconds, then add shrimp in one layer.",
      "Cook shrimp 1–2 minutes per side. Add honey and chile; toss until the glaze clings and shrimp are opaque.",
      "Divide rice and broccoli among four bowls. Add shrimp, glaze, and scallions."
    ],
    storage: "Chill up to 3 days. Reheat the rice and broccoli first, then add shrimp briefly so it does not turn rubbery.",
    source: {
      publisher: "Vikalinka",
      url: "https://vikalinka.com/honey-garlic-shrimp/"
    }
  },
  {
    id: "mediterranean-tuna-melts",
    name: "Mediterranean Tuna Melts",
    icon: "🥪",
    deck: "Lemony tuna, olives, and melty cheese on crisp pita with a quick cucumber-tomato salad.",
    diet: "pescetarian",
    category: "Sandwich",
    timeMinutes: 30,
    servings: 4,
    mealPrep: true,
    accent: "#a9d2c0",
    costPerServing: 4.65,
    nutrition: { calories: 615, protein: 42, carbs: 48, fat: 29, fiber: 5, sodium: 940 },
    ingredients: [
      "3 (7 oz) cans oil-packed light tuna, drained",
      "1/2 cup chopped parsley",
      "1/4 cup Kalamata olives, chopped",
      "1/2 small red onion, thinly sliced",
      "1 lemon",
      "1/4 tsp smoked paprika",
      "4 whole pitas, split into rounds",
      "4 oz halloumi, Muenster, or provolone",
      "3 cups baby arugula",
      "1 pint cherry tomatoes, halved",
      "2 Persian cucumbers, sliced",
      "Olive oil, salt, and black pepper"
    ],
    steps: [
      "Heat the broiler. Mix tuna, parsley, olives, half the onion, half the lemon juice, and paprika; season lightly.",
      "Set pita rounds cut-side up on a sheet pan. Top with tuna mixture and cheese.",
      "Broil until the cheese bubbles and the pita edges crisp, 3–5 minutes.",
      "Toss arugula, tomatoes, cucumber, remaining onion, lemon juice, and a little olive oil. Serve beside the melts."
    ],
    storage: "Keep the tuna mixture up to 3 days; store pita and salad separately. Assemble and broil only what you will eat.",
    source: {
      publisher: "Food Network Kitchen",
      url: "https://www.foodnetwork.com/recipes/food-network-kitchen/mediterranean-tuna-melts-3363316"
    }
  },
  {
    id: "seven-can-soup",
    name: "Vegetarian Seven-Can Soup",
    icon: "🥣",
    deck: "A nearly no-prep, bean-heavy Tex-Mex soup that feeds six and freezes without complaint.",
    diet: "vegetarian",
    category: "Soup",
    timeMinutes: 25,
    servings: 6,
    mealPrep: true,
    accent: "#f2c65f",
    costPerServing: 2.2,
    nutrition: { calories: 465, protein: 23, carbs: 58, fat: 17, fiber: 16, sodium: 1160 },
    ingredients: [
      "1 (15 oz) can vegetarian chili",
      "1 (15 oz) can black beans",
      "1 (15 oz) can kidney beans",
      "1 (15 oz) can pinto beans",
      "1 (15 oz) can diced tomatoes",
      "1 (15 oz) can corn",
      "1 (10 oz) can tomatoes with green chiles",
      "8 oz processed cheese, cubed",
      "Salt, pepper, and cilantro to finish"
    ],
    steps: [
      "Empty all seven cans—including their liquid—into a large pot.",
      "Bring to a boil, reduce to a steady simmer, and cook 10–15 minutes.",
      "Stir in the cheese until completely melted. Taste before adding salt; finish with pepper and cilantro."
    ],
    storage: "Refrigerate up to 3 days or freeze up to 3 months. Thaw overnight and reheat over low heat.",
    source: {
      publisher: "The Pioneer Woman",
      url: "https://www.thepioneerwoman.com/food-cooking/recipes/a78065/seven-can-soup/"
    }
  },
  {
    id: "stuffed-portobellos",
    name: "Spinach-Stuffed Portobellos",
    icon: "🍄",
    deck: "Roasted mushroom caps packed with jammy onions, spinach, Parmesan, and mozzarella.",
    diet: "vegetarian",
    category: "Bake",
    timeMinutes: 65,
    servings: 3,
    mealPrep: true,
    accent: "#c6a98b",
    costPerServing: 3.85,
    nutrition: { calories: 420, protein: 20, carbs: 31, fat: 26, fiber: 7, sodium: 610 },
    ingredients: [
      "6 large portobello mushrooms",
      "2 large yellow onions, diced",
      "3 Tbsp olive oil, plus more for caps",
      "Splash of balsamic or cider vinegar",
      "15 oz fresh spinach, chopped",
      "2 Tbsp grated Parmesan",
      "4 oz shredded mozzarella",
      "1/2 cup whole-wheat breadcrumbs",
      "Lemon, basil, salt, and black pepper"
    ],
    steps: [
      "Heat oven to 425°F. Cook onions with oil and a large pinch of salt over medium-low heat until deep gold, 30–40 minutes.",
      "Remove mushroom stems and gills. Oil the caps and roast on a rack or stem-side up for 10–12 minutes; blot any pooled liquid.",
      "Deglaze onions with vinegar. Add spinach to wilt, then remove from heat and stir in Parmesan.",
      "Fill caps, top with mozzarella and breadcrumbs, and bake 10 minutes more. Finish with lemon and basil."
    ],
    storage: "Refrigerate up to 3 days. Reheat uncovered in a 375°F oven or air fryer to drive off moisture.",
    source: {
      publisher: "Camille Styles",
      url: "https://camillestyles.com/food/stuffed-portobello-mushrooms/"
    }
  },
  {
    id: "curried-chickpea-prep",
    name: "Curried Chickpea Prep Boxes",
    icon: "🫘",
    deck: "Tomato-spinach chickpeas, roasted cauliflower, and naan in four inexpensive, genuinely filling boxes.",
    diet: "vegetarian",
    category: "Meal prep",
    timeMinutes: 45,
    servings: 4,
    mealPrep: true,
    accent: "#e2aa4f",
    costPerServing: 2.22,
    nutrition: { calories: 505, protein: 19, carbs: 72, fat: 17, fiber: 15, sodium: 760 },
    ingredients: [
      "2 (15 oz) cans chickpeas, drained",
      "1 (15 oz) can tomato sauce",
      "1 small onion, diced",
      "2 garlic cloves, minced",
      "1 Tbsp grated ginger",
      "2 Tbsp curry powder, divided",
      "8 oz spinach",
      "1 large cauliflower, in florets",
      "3 Tbsp olive oil",
      "2 naan, halved",
      "Salt and chile flakes"
    ],
    steps: [
      "Heat oven to 425°F. Toss cauliflower with half the oil, half the curry powder, salt, and chile; roast 25–30 minutes.",
      "Meanwhile, soften onion in remaining oil. Add garlic, ginger, and remaining curry powder for 1 minute.",
      "Add chickpeas and tomato sauce; simmer 10 minutes. Fold in spinach until wilted and season.",
      "Divide chickpeas and cauliflower among four containers. Cool fully; pack half a naan separately with each."
    ],
    storage: "Refrigerate up to 4 days. Keep naan wrapped separately so it stays tender; cauliflower is best within 3 days.",
    source: {
      publisher: "Budget Bytes",
      url: "https://www.budgetbytes.com/curried-chickpeas-meal-prep/"
    }
  },
  {
    id: "roasted-veggie-grain-bowls",
    name: "Roasted Veggie Grain Bowls",
    icon: "🥗",
    deck: "Quinoa, chickpeas, caramelized vegetables, and a sharp kale-pepita pesto built for four lunches.",
    diet: "vegetarian",
    category: "Bowl",
    timeMinutes: 60,
    servings: 4,
    mealPrep: true,
    accent: "#b8cf78",
    costPerServing: 3.85,
    nutrition: { calories: 640, protein: 21, carbs: 72, fat: 35, fiber: 16, sodium: 500 },
    ingredients: [
      "1 cup dry quinoa, rinsed",
      "2 (14 oz) cans chickpeas, drained",
      "1/2 cauliflower, in florets",
      "1 1/2 cups Brussels sprouts, halved",
      "2 parsnips, chopped",
      "1 bunch broccolini",
      "1/2 cup pepitas, plus more to finish",
      "1 cup packed kale",
      "1 cup cilantro",
      "1/4 cup lemon juice",
      "1/2 cup olive oil",
      "Sauerkraut, salt, pepper, and a touch of honey"
    ],
    steps: [
      "Heat oven to 425°F. Simmer quinoa in 1 3/4 cups water for 15 minutes; rest covered for 10, then fluff.",
      "Roast cauliflower, sprouts, parsnips, and broccolini with oil, salt, and pepper until browned, 12–25 minutes depending on the vegetable.",
      "Blend pepitas, kale, cilantro, lemon, olive oil, a splash of water, honey, salt, and pepper into a pourable pesto.",
      "Layer quinoa, chickpeas, and vegetables in containers. Add sauerkraut and pepitas; keep pesto separate until serving."
    ],
    storage: "Refrigerate assembled bowls up to 4 days. Store pesto separately and add fresh herbs after reheating.",
    source: {
      publisher: "Love & Lemons",
      url: "https://www.loveandlemons.com/grain-bowl/"
    }
  },
  {
    id: "tofu-spinach-pea-curry",
    name: "Tofu, Spinach & Pea Curry",
    icon: "🍛",
    deck: "Extra tofu in a bright spinach, tomato, coconut, and warm-spice sauce that improves overnight.",
    diet: "vegetarian",
    category: "Curry",
    timeMinutes: 43,
    servings: 5,
    mealPrep: true,
    accent: "#8fc4a2",
    costPerServing: 3.05,
    nutrition: { calories: 405, protein: 21, carbs: 29, fat: 25, fiber: 8, sodium: 890 },
    ingredients: [
      "24 oz extra-firm tofu, pressed and cubed",
      "1 yellow onion, diced",
      "4 garlic cloves, minced",
      "2 Tbsp grated ginger",
      "10 oz fresh spinach",
      "1 (14.5 oz) can diced tomatoes, drained",
      "1 1/2 cups frozen peas",
      "1/2 (13.5 oz) can full-fat coconut milk",
      "1 cup vegetable broth",
      "1 1/2 Tbsp cumin",
      "2 tsp garam masala and 1 tsp turmeric",
      "Chile paste, lemon, oil, salt, and cilantro"
    ],
    steps: [
      "Toast cumin, garam masala, and turmeric in a dry skillet until fragrant; set aside.",
      "Blend onion, garlic, ginger, and spinach into a coarse paste.",
      "Brown tofu in oil. Coat with toasted spices, then add spinach paste, tomatoes, broth, chile paste, lemon, and salt.",
      "Simmer 8–10 minutes. Stir in peas and coconut milk; heat through and adjust lemon and salt."
    ],
    storage: "Refrigerate up to 4 days; the flavor deepens overnight. Freeze up to 2 months and thaw in the fridge.",
    source: {
      publisher: "Budget Bytes",
      url: "https://www.budgetbytes.com/tofu-spinach-and-green-pea-curry/"
    }
  },
  {
    id: "marry-me-lentils",
    name: "Creamy Sun-Dried Tomato Lentils",
    icon: "🥘",
    deck: "One skillet of brown lentils, sun-dried tomato, spinach, cream, and Parmesan with serious staying power.",
    diet: "vegetarian",
    category: "One-pot",
    timeMinutes: 55,
    servings: 4,
    mealPrep: true,
    accent: "#e99178",
    costPerServing: 1.67,
    nutrition: { calories: 523, protein: 21, carbs: 47, fat: 30, fiber: 18, sodium: 1613 },
    ingredients: [
      "1 Tbsp oil from a sun-dried tomato jar",
      "1/2 onion, diced",
      "4 garlic cloves, minced",
      "1/2 cup oil-packed sun-dried tomatoes, sliced",
      "2 Tbsp tomato paste",
      "1 cup dry brown lentils, rinsed",
      "3 cups vegetable broth",
      "1 1/2 tsp Italian seasoning",
      "1 cup heavy cream, room temperature",
      "1/3 cup thawed frozen spinach",
      "1/2 cup grated Parmesan",
      "Salt and black pepper"
    ],
    steps: [
      "Cook onion, garlic, and sun-dried tomatoes in the tomato oil for 5 minutes. Stir in tomato paste for 1 minute.",
      "Add lentils, broth, Italian seasoning, salt, and pepper. Bring to a boil, then cover and simmer 30 minutes, stirring occasionally.",
      "Add room-temperature cream and spinach; simmer covered for 5 minutes more.",
      "When lentils are tender with a slight bite, turn off heat and stir in Parmesan. Loosen with broth if needed."
    ],
    storage: "Refrigerate up to 4 days. Reheat gently with a splash of broth; freeze without the cream when planning farther ahead.",
    source: {
      publisher: "Budget Bytes",
      url: "https://www.budgetbytes.com/creamy-marry-me-lentils/"
    }
  },
  {
    id: "crispy-tofu-bowls",
    name: "Crispy Tofu Rice Bowls",
    icon: "🍚",
    deck: "Crunchy-edged tofu, brown rice, broccoli, radish, avocado, and vivid carrot-ginger dressing.",
    diet: "vegetarian",
    category: "Bowl",
    timeMinutes: 75,
    servings: 4,
    mealPrep: true,
    accent: "#f0bd68",
    costPerServing: 4,
    nutrition: { calories: 635, protein: 29, carbs: 62, fat: 32, fiber: 11, sodium: 760 },
    ingredients: [
      "28 oz extra-firm tofu, pressed and cubed",
      "1 1/2 tsp avocado oil",
      "2 Tbsp tamari or soy sauce",
      "1/2 tsp sriracha",
      "1 Tbsp cornstarch",
      "2 cups cooked brown rice",
      "1 large head broccoli, roasted",
      "1 avocado, sliced",
      "4 radishes, thinly sliced",
      "1 cup carrot-ginger dressing",
      "Sesame seeds and greens"
    ],
    steps: [
      "Heat an air fryer to 400°F or oven to 425°F. Toss tofu with oil, tamari, and sriracha; add cornstarch and toss again.",
      "Air-fry 11–15 minutes or bake 20–25 minutes, turning halfway, until the edges are crisp.",
      "Divide rice, roasted broccoli, tofu, avocado, and radish among bowls.",
      "Spoon over carrot-ginger dressing and finish with sesame seeds and greens."
    ],
    storage: "Refrigerate rice, tofu, and broccoli up to 4 days. Pack dressing, avocado, and radish separately; re-crisp tofu if possible.",
    source: {
      publisher: "Love & Lemons",
      url: "https://www.loveandlemons.com/tofu-bowl/"
    }
  },
  {
    id: "quinoa-fried-rice",
    name: "Mushroom-Edamame Quinoa Fry",
    icon: "🫛",
    deck: "A two-serving, high-protein riff on fried rice with quinoa, eggs, shiitakes, edamame, and kale.",
    diet: "vegetarian",
    category: "Skillet",
    timeMinutes: 30,
    servings: 2,
    mealPrep: false,
    accent: "#9bc9a0",
    costPerServing: 2.75,
    nutrition: { calories: 465, protein: 24, carbs: 48, fat: 21, fiber: 9, sodium: 720 },
    ingredients: [
      "1 1/2 cups cooked, chilled quinoa",
      "4 oz shiitake mushrooms, sliced",
      "1 cup shelled edamame",
      "3 large eggs, beaten",
      "2 cups chopped kale",
      "3 garlic cloves, minced",
      "1 Tbsp grated ginger",
      "2 scallions, sliced",
      "1 Tbsp olive or grapeseed oil",
      "1 Tbsp soy sauce or tamari",
      "Sesame oil, chile sauce, herbs, and sesame seeds"
    ],
    steps: [
      "Heat oil in a large nonstick skillet over medium-high. Cook garlic and scallion whites for 30 seconds.",
      "Add mushrooms and ginger; cook until browned, about 5 minutes.",
      "Add kale, quinoa, and edamame. Toss until hot and the quinoa starts to crisp, about 3 minutes.",
      "Push everything aside, scramble eggs in the open space, then fold together with soy sauce. Finish with sesame oil, chile, herbs, and seeds."
    ],
    storage: "Best fresh, but leftovers hold 3 days refrigerated. Reheat in a hot skillet for the best texture.",
    source: {
      publisher: "Love & Lemons",
      url: "https://www.loveandlemons.com/aida-mollenkamp-giveaway/comment-page-2/"
    }
  },
  {
    id: "teriyaki-salmon-bowls",
    name: "Teriyaki Salmon Edamame Bowls",
    icon: "🐟",
    deck: "Caramelized salmon, sticky rice, edamame, and cool cucumber in two balanced bowls.",
    diet: "pescetarian",
    category: "Bowl",
    timeMinutes: 55,
    servings: 2,
    mealPrep: false,
    accent: "#f09a72",
    costPerServing: 5.25,
    nutrition: { calories: 491, protein: 33, carbs: 63, fat: 10, fiber: 3, sodium: 960 },
    ingredients: [
      "8 oz salmon, skin removed and cubed",
      "2 1/2 Tbsp low-sodium soy sauce",
      "2 1/2 Tbsp mirin",
      "2 1/2 Tbsp sake or dry sherry",
      "1 1/2 tsp honey",
      "1 1/2 cups cooked jasmine rice",
      "1/2 cup shelled edamame",
      "2 mini cucumbers, chopped",
      "1 scallion, sliced",
      "Sesame seeds and optional sriracha"
    ],
    steps: [
      "Whisk soy sauce, mirin, sake, and honey. Marinate salmon 30–60 minutes.",
      "Lift out salmon; simmer the marinade in a small pan until reduced by half, 3–6 minutes.",
      "Air-fry salmon at 400°F for 5–7 minutes, or broil 3–4 minutes, until cooked and caramelized.",
      "Divide rice, edamame, and cucumber between bowls. Add salmon, reduced sauce, scallion, sesame, and optional heat."
    ],
    storage: "Salmon, rice, and edamame keep 3 days refrigerated. Store cucumber separately and add it cold after reheating.",
    source: {
      publisher: "Skinnytaste",
      url: "https://www.skinnytaste.com/teriyaki-salmon-bowl-air-fryer-or-oven/"
    }
  },
  {
    id: "spicy-canned-salmon-bowls",
    name: "Spicy Canned Salmon Rice Bowls",
    icon: "🍙",
    deck: "Five-minute pantry salmon with brown rice, cucumber, scallion, and creamy sriracha sauce.",
    diet: "pescetarian",
    category: "No-cook",
    timeMinutes: 5,
    servings: 2,
    mealPrep: true,
    accent: "#ef7e69",
    costPerServing: 3.1,
    nutrition: { calories: 389, protein: 25, carbs: 39, fat: 14, fiber: 4, sodium: 650 },
    ingredients: [
      "2 (5 oz) cans wild salmon in water, drained",
      "3 Tbsp light mayonnaise",
      "2 tsp sriracha, plus more to serve",
      "2 scallions, sliced",
      "2 cups cooked brown rice",
      "2 Persian cucumbers, diced",
      "2 tsp furikake or crumbled nori",
      "Pinch of salt"
    ],
    steps: [
      "Mix salmon with mayonnaise, sriracha, scallion whites, and a pinch of salt.",
      "Warm the rice and divide between two bowls.",
      "Add salmon salad and cucumber. Finish with scallion greens, furikake, and extra sriracha."
    ],
    storage: "Double or quadruple freely. Refrigerate salmon mixture and rice up to 4 days; keep cucumber separate for crunch.",
    source: {
      publisher: "Skinnytaste",
      url: "https://www.skinnytaste.com/spicy-canned-salmon-rice-bowl/"
    }
  },
  {
    id: "black-bean-sweet-potato-enchiladas",
    name: "Black Bean Sweet Potato Enchiladas",
    icon: "🌯",
    deck: "Ten salsa-verde enchiladas with creamy sweet potato, black beans, green chile, and two cheeses.",
    diet: "vegetarian",
    category: "Bake",
    timeMinutes: 80,
    servings: 5,
    mealPrep: true,
    accent: "#e9a34c",
    costPerServing: 2.85,
    nutrition: { calories: 560, protein: 20, carbs: 75, fat: 22, fiber: 13, sodium: 980 },
    ingredients: [
      "1 1/4 lb sweet potatoes",
      "1 (15 oz) can black beans, drained",
      "8 oz Monterey Jack, grated and divided",
      "2 oz feta, crumbled",
      "2 (4 oz) cans diced green chiles",
      "1 jalapeño, minced",
      "2 garlic cloves, minced",
      "2 Tbsp lime juice",
      "Cumin, chile powder, cayenne, salt, and pepper",
      "2 cups mild salsa verde",
      "10 corn tortillas",
      "Red onion, cilantro, and sour cream to finish"
    ],
    steps: [
      "Heat oven to 400°F. Roast halved sweet potatoes cut-side down until tender, 30–35 minutes; scoop and mash.",
      "Mix sweet potato, black beans, half the Jack, feta, green chiles, jalapeño, garlic, lime, and spices.",
      "Spread a thin layer of salsa in a 9-by-13-inch dish. Warm tortillas, fill, roll, and place seam-side down.",
      "Cover with remaining salsa and Jack. Bake until bubbling, about 25 minutes; finish with onion, cilantro, and thinned sour cream."
    ],
    storage: "Refrigerate up to 4 days; leftovers improve overnight. Freeze baked portions up to 3 months and reheat covered.",
    source: {
      publisher: "Cookie and Kate",
      url: "https://cookieandkate.com/black-bean-sweet-potato-enchiladas/"
    }
  },
  {
    id: "red-pepper-feta-frittata",
    name: "Roasted Pepper & Feta Frittata",
    icon: "🍳",
    deck: "A protein-boosted spinach, red pepper, cottage cheese, and feta bake for dinner now and easy wedges later.",
    diet: "vegetarian",
    category: "Eggs",
    timeMinutes: 45,
    servings: 4,
    mealPrep: true,
    accent: "#e78368",
    costPerServing: 1.95,
    nutrition: { calories: 285, protein: 23, carbs: 10, fat: 18, fiber: 1, sodium: 650 },
    ingredients: [
      "1 Tbsp cooking oil",
      "2 garlic cloves, minced",
      "3–4 cups baby spinach",
      "6 oz jarred roasted red peppers, sliced",
      "2 oz feta, crumbled",
      "8 large eggs",
      "1 cup low-fat cottage cheese",
      "1/4 cup whole milk",
      "Salt, pepper, and optional chile flakes",
      "Crusty bread or salad, to serve"
    ],
    steps: [
      "Heat oven to 350°F. In a 10-inch oven-safe skillet, soften garlic in oil; add spinach and wilt.",
      "Add red pepper for 1–2 minutes to remove extra moisture. Season, scatter over feta, and take the pan off heat.",
      "Whisk eggs, cottage cheese, and milk with a pinch of salt and pepper. Pour over the vegetables.",
      "Bake 20–25 minutes, until the center is just set. Rest 5 minutes before cutting into four hearty wedges."
    ],
    storage: "Refrigerate up to 4 days or freeze well-wrapped wedges up to 2 months. Reheat gently or eat at room temperature.",
    source: {
      publisher: "Budget Bytes",
      url: "https://www.budgetbytes.com/roasted-red-pepper-and-feta-frittata/"
    }
  }
];
