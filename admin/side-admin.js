import { db, ref, push, set, onValue, remove, serverTimestamp } from "../firebase.js";

const side = document.body.dataset.side;
const isBoy = side === "boy";
const label = isBoy ? "Мальчик" : "Девочка";
const icon = isBoy ? "👦" : "👧";
const paymentsRef = ref(db, "payments");
const collectionOpenRef = ref(db, "settings/collectionOpen");
const fmt = new Intl.NumberFormat("ru-RU");
const $ = (selector) => document.querySelector(selector);
let currentTotal = 0;
let collectionOpen = true;

function setCollectionControls(isOpen) {
  document.querySelectorAll("[data-amount], #customAmount, #addCustom, #targetTotal, #applyCorrection, [data-remove-id]")
    .forEach((control) => { control.disabled = !isOpen; });
  document.body.classList.toggle("collection-closed", !isOpen);
}

function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");
  setTimeout(() => element.classList.remove("show"), 1500);
}

async function addPayment(amount) {
  if (!collectionOpen) {
    toast("Сбор закрыт. Сначала продолжите сбор.");
    return;
  }
  amount = Math.round(Number(amount));
  if (!Number.isFinite(amount) || amount <= 0) {
    toast("Введите сумму больше 0");
    return;
  }
  const newRef = push(paymentsRef);
  await set(newRef, { side, amount, createdAt: serverTimestamp() });
  toast(`${icon} +${fmt.format(amount)} сом`);
}

async function applyCorrection() {
  if (!collectionOpen) {
    toast("Сбор закрыт. Сначала продолжите сбор.");
    return;
  }
  const input = $("#targetTotal");
  const target = Math.round(Number(input.value));
  if (!Number.isFinite(target) || target < 0) {
    toast("Введите итоговую сумму от 0");
    return;
  }

  const difference = target - currentTotal;
  if (difference === 0) {
    toast("Итог уже совпадает");
    return;
  }
  if (Math.abs(difference) > 10000000) {
    toast("Корректировка не может быть больше 10 000 000 сом");
    return;
  }

  const newRef = push(paymentsRef);
  await set(newRef, { side, amount: difference, type: "adjustment", createdAt: serverTimestamp() });
  input.value = "";
  toast(`Итог изменён на ${fmt.format(target)} сом`);
}

document.addEventListener("click", async (event) => {
  const collectionToggle = event.target.closest("#collectionToggle");
  if (collectionToggle) {
    collectionToggle.disabled = true;
    try {
      await set(collectionOpenRef, !collectionOpen);
    } catch (error) {
      console.error(error);
      toast("Не удалось изменить статус сбора");
    } finally {
      collectionToggle.disabled = false;
    }
    return;
  }

  const quick = event.target.closest("[data-amount]");
  if (quick) {
    if (!collectionOpen) return;
    quick.disabled = true;
    try { await addPayment(quick.dataset.amount); } finally { quick.disabled = false; }
    return;
  }
  const custom = event.target.closest("#addCustom");
  if (custom) {
    if (!collectionOpen) return;
    const input = $("#customAmount");
    custom.disabled = true;
    try { await addPayment(input.value); input.value = ""; } finally { custom.disabled = false; }
    return;
  }
  const removeButton = event.target.closest("[data-remove-id]");
  if (removeButton) {
    if (!collectionOpen) return;
    await remove(ref(db, `payments/${removeButton.dataset.removeId}`));
    toast("Внесение отменено");
  }

  const correction = event.target.closest("#applyCorrection");
  if (correction) {
    if (!collectionOpen) return;
    correction.disabled = true;
    try { await applyCorrection(); } finally { correction.disabled = false; }
  }
});

onValue(collectionOpenRef, (snapshot) => {
  collectionOpen = snapshot.val() !== false;
  const state = $("#collectionState");
  const toggle = $("#collectionToggle");
  state.textContent = collectionOpen ? "Сбор открыт" : "Сбор закрыт";
  state.className = `collection-state ${collectionOpen ? "open" : "closed"}`;
  toggle.textContent = collectionOpen ? "Закрыть сбор" : "Продолжить сбор";
  setCollectionControls(collectionOpen);
});

$("#customAmount").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    $("#addCustom").click();
  }
});

$("#targetTotal").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    $("#applyCorrection").click();
  }
});

onValue(paymentsRef, (snapshot) => {
  const payments = Object.entries(snapshot.val() || {})
    .map(([id, value]) => ({ id, ...value }))
    .filter((payment) => payment.side === side)
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  currentTotal = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  $("#sideTotal").textContent = fmt.format(currentTotal);
  const history = $("#history");
  if (!payments.length) {
    history.innerHTML = `<div class="empty">Пока нет внесений за сторону «${label}»</div>`;
    return;
  }
  history.innerHTML = payments.slice(0, 12).map((payment) => {
    const time = payment.createdAt ? new Date(payment.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : "сейчас";
    const amount = Number(payment.amount || 0);
    const adjustment = payment.type === "adjustment";
    const amountLabel = adjustment ? `${amount > 0 ? "+" : "−"}${fmt.format(Math.abs(amount))}` : `+${fmt.format(amount)}`;
    return `<div class="history-row"><div><strong>${adjustment ? "↔ Корректировка" : `${icon} ${label}`}</strong><div class="time">${time}</div></div><div class="amount">${amountLabel} сом</div><button class="icon-btn" title="Отменить" aria-label="Отменить внесение" data-remove-id="${payment.id}" ${collectionOpen ? "" : "disabled"}>✕</button></div>`;
  }).join("");
  setCollectionControls(collectionOpen);
}, (error) => {
  console.error(error);
  toast("Нет доступа к Firebase");
});
