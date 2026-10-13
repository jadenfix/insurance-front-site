import { $, escape, load, save, download, announce } from "./shared.js";
import { defaults, validateScenario, compare, payout } from "./engine.js";
let stored = load("clearcover.v1", {}),
  scenario;
try {
  scenario = validateScenario(stored.scenario ?? defaults);
} catch {
  scenario = { ...defaults };
}
let shortlist = Array.isArray(stored.shortlist)
  ? stored.shortlist.filter((x) =>
      ["essential", "balanced", "extended"].includes(x),
    )
  : [];
const money = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
function persist() {
  save("clearcover.v1", { scenario, shortlist });
}
function render() {
  for (const [k, v] of Object.entries(scenario))
    $("scenario").elements[k].value = v;
  $("coverage").textContent = money(scenario.coverage);
  $("deductible").textContent = money(scenario.deductible);
  $("shortCount").textContent = shortlist.length;
  const plans = compare(scenario);
  $("plans").innerHTML = plans
    .map(
      (p) =>
        `<article class="card"><span class="chip">FICTIONAL PLAN</span><h3>${p.name}</h3><div class="metric">${money(p.annual / 12)}<span class="small"> / mo</span></div><p>${money(p.annual)} / year · rounded display</p><p>${p.detail}</p><p>Dwelling <strong>${money(scenario.coverage)}</strong><br>Contents <strong>${money(p.contents)}</strong><br>Liability <strong>${money(p.liability)}</strong><br>Deductible <strong>${money(scenario.deductible)}</strong></p><button data-save="${p.id}" class="${shortlist.includes(p.id) ? "secondary" : ""}" aria-pressed="${shortlist.includes(p.id)}">${shortlist.includes(p.id) ? "✓ Shortlisted" : "Add to shortlist"}</button></article>`,
    )
    .join("");
  $("formula").textContent =
    "Annual base = coverage × 0.003 × property factor × (1 + min(age, 100) × 0.005) × exposure factor × (1 − (deductible − 500) / 10,000). Plan multipliers: 1.00, 1.18, 1.42. These constants were chosen solely for this demo.";
  $("claim").innerHTML = [500, 10000, scenario.coverage + 50000]
    .map(
      (loss) =>
        `<tr><td>${money(loss)}</td><td>${money(Math.min(loss, scenario.coverage))}</td><td>${money(scenario.deductible)}</td><td>${money(payout(loss, scenario.coverage, scenario.deductible))}</td></tr>`,
    )
    .join("");
}
$("scenario").onsubmit = (e) => {
  e.preventDefault();
  try {
    scenario = validateScenario(Object.fromEntries(new FormData(e.target)));
    persist();
    render();
    announce("Comparison updated. Prices remain illustrative.");
  } catch (err) {
    announce(err.message);
  }
};
$("plans").onclick = (e) => {
  const b = e.target.closest("[data-save]");
  if (!b) return;
  const id = b.dataset.save;
  shortlist = shortlist.includes(id)
    ? shortlist.filter((x) => x !== id)
    : [...shortlist, id];
  persist();
  render();
  announce("Shortlist updated.");
};
$("export").onclick = () =>
  download("illustrative-comparison.json", {
    disclaimer: "Fictional educational comparison. Not an insurance quote.",
    scenario,
    plans: compare(scenario),
    shortlist,
  });
$("reset").onclick = () => {
  scenario = { ...defaults };
  shortlist = [];
  persist();
  render();
  announce("Default scenario restored.");
};
render();
