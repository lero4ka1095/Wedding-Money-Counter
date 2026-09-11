import { db, ref, onValue } from "../firebase.js";

const paymentsRef = ref(db, "payments");
const fmt = new Intl.NumberFormat("ru-RU");

let previous = { boy: 0, girl: 0 };
let initialized = false;

function animate(id) {
  const el = document.getElementById(id);
  el.classList.remove("flash");
  void el.offsetWidth;
  el.classList.add("flash");
}

onValue(paymentsRef, (snap) => {
  const raw = snap.val() || {};
  let boy = 0;
  let girl = 0;

  for (const p of Object.values(raw)) {
    const amount = Number(p.amount || 0);
    if (p.side === "boy") boy += amount;
    if (p.side === "girl") girl += amount;
  }

  document.getElementById("boyScore").textContent = fmt.format(boy);
  document.getElementById("girlScore").textContent = fmt.format(girl);

  const total = boy + girl;
  const boyPct = total ? (boy / total) * 100 : 50;
  const girlPct = total ? (girl / total) * 100 : 50;
  document.getElementById("boyProgress").style.width = `${boyPct}%`;
  document.getElementById("girlProgress").style.width = `${girlPct}%`;

  if (initialized) {
    if (boy > previous.boy) animate("boyCard");
    if (girl > previous.girl) animate("girlCard");
  }

  previous = { boy, girl };
  initialized = true;
});
