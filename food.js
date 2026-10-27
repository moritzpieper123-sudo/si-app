'use strict';
/* Food search and grams maths. No server: lookups go straight to free public databases. */

const Food = (() => {
  const r1 = n => Math.round(n * 10) / 10;

  // Every food, whatever its source, is stored as values per 100 g.
  // Grams maths: value = grams / 100 * value-per-100g.
  function forGrams(food, grams) {
    const f = grams / 100;
    return { kcal: Math.round(food.kcal * f), protein: r1(food.protein * f), carbs: r1(food.carbs * f), fat: r1(food.fat * f) };
  }

  function sumEntries(entries) {
    return entries.reduce((t, e) => ({ kcal: t.kcal + e.kcal, protein: r1(t.protein + e.protein), carbs: r1(t.carbs + e.carbs), fat: r1(t.fat + e.fat) }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
  }

  // Open Food Facts: nutriments are per 100 g.
  function fromOpenFoodFacts(p) {
    const n = p.nutriments || {};
    const name = [p.product_name, p.brands].filter(Boolean).join(' · ');
    if (!name || n['energy-kcal_100g'] == null) return null;
    return { id: 'off-' + p.code, name, source: 'Open Food Facts', kcal: Math.round(n['energy-kcal_100g']), protein: r1(n.proteins_100g || 0), carbs: r1(n.carbohydrates_100g || 0), fat: r1(n.fat_100g || 0) };
  }

  // USDA FoodData Central: foodNutrients are per 100 g.
  function fromUsda(f) {
    const get = names => (f.foodNutrients || []).find(x => names.includes(x.nutrientName));
    const kcal = get(['Energy']);
    if (!f.description || !kcal) return null;
    const val = x => (x ? x.value || 0 : 0);
    return { id: 'usda-' + f.fdcId, name: f.description, source: 'USDA', kcal: Math.round(kcal.value), protein: r1(val(get(['Protein']))), carbs: r1(val(get(['Carbohydrate, by difference']))), fat: r1(val(get(['Total lipid (fat)']))) };
  }

  async function searchOpenFoodFacts(q, signal) {
    const url = 'https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1&page_size=10&search_terms=' + encodeURIComponent(q);
    const data = await (await fetch(url, { signal })).json();
    return (data.products || []).map(fromOpenFoodFacts).filter(Boolean);
  }

  async function searchUsda(q, apiKey, signal) {
    if (!apiKey) return [];
    const url = 'https://api.nal.usda.gov/fdc/v1/foods/search?pageSize=10&query=' + encodeURIComponent(q) + '&api_key=' + encodeURIComponent(apiKey);
    const data = await (await fetch(url, { signal })).json();
    return (data.foods || []).map(fromUsda).filter(Boolean);
  }

  // Saved foods first (your own entries win), then the online sources.
  // A failing source is skipped, so the others still answer.
  async function search(q, { saved = [], usdaKey = '', signal } = {}) {
    const term = (q || '').trim().toLowerCase();
    if (term.length < 2) return [];
    const mine = saved.filter(f => f.name.toLowerCase().includes(term)).map(f => ({ ...f, source: 'Saved' }));
    const settled = await Promise.allSettled([searchOpenFoodFacts(term, signal), searchUsda(term, usdaKey, signal)]);
    const online = settled.flatMap(s => (s.status === 'fulfilled' ? s.value : []));
    return [...mine, ...online];
  }

  return { forGrams, sumEntries, fromOpenFoodFacts, fromUsda, search };
})();

if (typeof module !== 'undefined') module.exports = Food;
