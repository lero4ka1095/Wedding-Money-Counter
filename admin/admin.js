import {
  db, ref, push, set, onValue, remove, serverTimestamp
} from "../firebase.js";

const paymentsRef = ref(db, "payments");
const fmt = new Intl.NumberFormat("ru-RU");
const $ = (s) => document.querySelector(s);

let payments = [];

function totals(items) {
  return items.reduce((acc, p) => {
    if (p.side === "boy") acc.boy += Number(p.amount || 0);
    if (p.side === "girl") acc.girl += Number(p.amount || 0);
    return acc;
  }, { boy: 0, girl: 0 });
}

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 1500);
}

async function addPayment(side, amount) {
  amount = Math.round(Number(amount));
  if (!Number.isFinite(amount) || amount <= 0) {
    toast("Введите сумму больше 0");
    return;
  }

  const newRef = push(paymentsRef);
  await set(newRef, {
    side,
    amount,
    createdAt: serverTimestamp()
  });

  toast(`${side === "boy" ? "👦" : "👧"} +${fmt.format(amount)} сом`);
}

document.addEventListener("click", async (e) => {
  const quick = e.target.closest("[data-side][data-amount]");
  if (quick) {
    quick.disabled = true;
    try {
      await addPayment(quick.dataset.side, quick.dataset.amount);
    } finally {
      quick.disabled = false;
    }
    return;
  }

  const custom = e.target.closest("[data-custom]");
  if (custom) {
    const side = custom.dataset.custom;
    const input = $(`#${side}Custom`);
    custom.disabled = true;
    try {
      await addPayment(side, input.value);
      input.value = "";
    } finally {
      custom.disabled = false;
    }
    return;
  }

  const removeBtn = e.target.closest("[data-remove-id]");
  if (removeBtn) {
    await remove(ref(db, `payments/${removeBtn.dataset.removeId}`));
    toast("Внесение отменено");
  }
});

$("#resetAll").addEventListener("click", async () => {
  if (!confirm("Точно удалить ВСЕ внесения и обнулить счёт?")) return;
  await remove(paymentsRef);
  toast("Счёт обнулён");
});

onValue(paymentsRef, (snap) => {
  const raw = snap.val() || {};
  payments = Object.entries(raw).map(([id, value]) => ({ id, ...value }));
  payments.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

  const sum = totals(payments);
  $("#boyTotal").textContent = fmt.format(sum.boy);
  $("#girlTotal").textContent = fmt.format(sum.girl);

  const history = $("#history");
  if (!payments.length) {
    history.innerHTML = `<div class="empty">Пока никто ничего не добавил</div>`;
    return;
  }

  history.innerHTML = payments.slice(0, 12).map(p => {
    const isBoy = p.side === "boy";
    const time = p.createdAt
      ? new Date(p.createdAt).toLocaleTimeString("ru-RU", {hour:"2-digit", minute:"2-digit"})
      : "сейчас";

    return `
      <div class="history-row">
        <div>
          <strong>${isBoy ? "👦 Мальчик" : "👧 Девочка"}</strong>
          <div class="time">${time}</div>
        </div>
        <div class="amount">+${fmt.format(Number(p.amount || 0))} сом</div>
        <button class="icon-btn" title="Отменить" data-remove-id="${p.id}">✕</button>
      </div>`;
  }).join("");
}, (err) => {
  console.error(err);
  toast("Нет доступа к Firebase");
});
