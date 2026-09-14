import { db, ref, onValue } from "../firebase.js";

const paymentsRef = ref(db, "payments");
const collectionOpenRef = ref(db, "settings/collectionOpen");
const fmt = new Intl.NumberFormat("ru-RU");

let previous = { boy: 0, girl: 0 };
let initialized = false;
let collectionOpen = true;

onValue(collectionOpenRef, (snap) => {
  const isOpen = snap.val() !== false;
  const status = document.getElementById("collectionStatus");
  status.textContent = isOpen ? "Сбор открыт" : "Сбор закрыт";
  status.className = `collection-status ${isOpen ? "open" : "closed"}`;
  collectionOpen = isOpen;
  document.body.classList.toggle("collection-finished", !isOpen);
});

function animate(id) {
  const el = document.getElementById(id);
  el.classList.remove("flash");
  void el.offsetWidth;
  el.classList.add("flash");
}

onValue(paymentsRef, (snap) => {
  const raw = snap.val() || {};
  const payments = Object.entries(raw).map(([id, value]) => ({ id, ...value }));
  let boy = 0;
  let girl = 0;

  for (const p of payments) {
    const amount = Number(p.amount || 0);
    if (p.side === "boy") boy += amount;
    if (p.side === "girl") girl += amount;
  }

  document.getElementById("boyScore").textContent = fmt.format(boy);
  document.getElementById("girlScore").textContent = fmt.format(girl);
  updateClosingSummary(boy, girl);

  const lastPayment = payments
    .filter((payment) => (payment.side === "boy" || payment.side === "girl") && payment.type !== "adjustment")
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0) || b.id.localeCompare(a.id))[0];
  const lastPaymentEl = document.getElementById("lastPayment");
  const lastPaymentAmount = document.getElementById("lastPaymentAmount");
  if (lastPayment) {
    const amount = Number(lastPayment.amount || 0);
    lastPaymentAmount.textContent = `+${fmt.format(amount)} сом`;
    lastPaymentEl.className = `last-payment last-payment-${lastPayment.side}`;
  } else {
    lastPaymentAmount.textContent = "Пока нет переводов";
    lastPaymentEl.className = "last-payment";
  }

  const total = boy + girl;
  const boyPct = total ? (boy / total) * 100 : 50;
  const girlPct = total ? (girl / total) * 100 : 50;
  const leader = document.getElementById("leaderStatus");
  const difference = document.getElementById("leaderDifference");
  if (boy > girl) {
    leader.textContent = "Впереди Андреевич";
    leader.className = "leader-status boy-leading";
    difference.innerHTML = `<span class="difference-label">Разница</span><strong class="difference-amount">${fmt.format(boy - girl)} сом</strong>`;
  } else if (girl > boy) {
    leader.textContent = "Впереди Андреевна";
    leader.className = "leader-status girl-leading";
    difference.innerHTML = `<span class="difference-label">Разница</span><strong class="difference-amount">${fmt.format(girl - boy)} сом</strong>`;
  } else {
    leader.textContent = "Пока ничья";
    leader.className = "leader-status";
    difference.innerHTML = '<span class="difference-label">Счёт</span><strong class="difference-amount">равный</strong>';
  }

  if (initialized) {
    if (boy > previous.boy) animate("boyCard");
    if (girl > previous.girl) animate("girlCard");
  }

  previous = { boy, girl };
  initialized = true;
});

function updateClosingSummary(boy, girl) {
  const card = document.getElementById("celebrationCard");
  const winner = document.getElementById("celebrationWinner");
  const message = document.getElementById("celebrationMessage");
  document.getElementById("finalBoyTotal").textContent = `${fmt.format(boy)} сом`;
  document.getElementById("finalGirlTotal").textContent = `${fmt.format(girl)} сом`;
  document.getElementById("finalTotal").textContent = `${fmt.format(boy + girl)} сом`;

  if (boy > girl) {
    card.dataset.winner = "boy";
    message.textContent = "Судя по сборам ваших гостей, у вас будет";
    winner.textContent = "мальчик!";
  } else if (girl > boy) {
    card.dataset.winner = "girl";
    message.textContent = "Судя по сборам ваших гостей, у вас будет";
    winner.textContent = "девочка!";
  } else {
    card.dataset.winner = "tie";
    message.textContent = "Судя по сборам ваших гостей,";
    winner.textContent = "пока ничья!";
  }
}
