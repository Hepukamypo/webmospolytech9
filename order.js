// orders.js

const API_KEY = "043f7d68-3cee-44dd-9ba1-bfed45a44f99";
const ORDERS_API = "https://edu.std-900.ist.mospolytech.ru/labs/api/orders";

let orders = [];
let currentOrderId = null;

document.addEventListener("DOMContentLoaded", () => {
  loadOrders();

  document.querySelectorAll(".modal-close").forEach(el => {
    el.addEventListener("click", closeAllModals);
  });

  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", e => {
      if (e.target === overlay) closeAllModals();
    });
  });

  document.querySelector("#message-modal .modal-ok-btn").addEventListener("click", () => {
    document.getElementById("message-modal").classList.remove("show");
  });

  document.querySelector("#detail-modal .modal-ok-btn").addEventListener("click", () => {
    document.getElementById("detail-modal").classList.remove("show");
  });

  document.querySelector("#edit-modal .modal-cancel-btn").addEventListener("click", () => {
    document.getElementById("edit-modal").classList.remove("show");
  });

  document.querySelector("#delete-modal .modal-cancel-btn").addEventListener("click", () => {
    document.getElementById("delete-modal").classList.remove("show");
  });

  document.querySelector("#delete-modal .modal-delete-btn").addEventListener("click", deleteOrder);

  document.getElementById("edit-form").addEventListener("submit", saveEdit);
});

async function loadOrders() {
  try {
    const resp = await fetch(`${ORDERS_API}?api_key=${API_KEY}`);
    if (!resp.ok) throw new Error("Ошибка загрузки заказов");
    orders = await resp.json();

    await loadDishesForOrders();

    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    renderOrders();
  } catch (err) {
    showMessage("Не удалось загрузить заказы: " + err.message);
  }
}

async function loadDishesForOrders() {
  try {
    const dishesResp = await fetch(`https://edu.std-900.ist.mospolytech.ru/labs/api/dishes?api_key=${API_KEY}`);
    if (!dishesResp.ok) throw new Error("Ошибка загрузки блюд");
    const allDishes = await dishesResp.json();

    const dishMap = {};
    allDishes.forEach(d => dishMap[d.id] = d);

    orders.forEach(order => {
      if (order.soup_id) order.soup = dishMap[order.soup_id] || null;
      if (order.main_course_id) order.main_course = dishMap[order.main_course_id] || null;
      if (order.salad_id) order.salad = dishMap[order.salad_id] || null;
      if (order.drink_id) order.drink = dishMap[order.drink_id] || null;
      if (order.dessert_id) order.dessert = dishMap[order.dessert_id] || null;
    });
  } catch (err) {
    console.error(err);
  }
}

function renderOrders() {
  const tbody = document.querySelector("#orders-table tbody");
  tbody.innerHTML = "";

  if (orders.length === 0) {
    document.getElementById("empty-orders").style.display = "block";
    document.getElementById("orders-table").style.display = "none";
    return;
  }

  document.getElementById("empty-orders").style.display = "none";
  document.getElementById("orders-table").style.display = "table";

  orders.forEach((order, index) => {
    const dishes = [];
    let total = 0;

    if (order.soup) {
      dishes.push(order.soup.name);
      total += order.soup.price || 0;
    }
    if (order.main_course) {
      dishes.push(order.main_course.name);
      total += order.main_course.price || 0;
    }
    if (order.salad) {
      dishes.push(order.salad.name);
      total += order.salad.price || 0;
    }
    if (order.drink) {
      dishes.push(order.drink.name);
      total += order.drink.price || 0;
    }
    if (order.dessert) {
      dishes.push(order.dessert.name);
      total += order.dessert.price || 0;
    }

    const delivery = order.delivery_type === "now" ? "Как можно скорее" : `В ${order.delivery_time || ""}`;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="padding:12px;">${index + 1}</td>
      <td style="padding:12px;">${new Date(order.created_at).toLocaleString("ru-RU")}</td>
      <td style="padding:12px;">${dishes.join(", ") || "—"}</td>
      <td style="padding:12px;">${total} ₽</td>
      <td style="padding:12px;">${delivery}</td>
      <td style="padding:12px;text-align:center;">
        <button class="action-btn" data-action="detail" data-id="${order.id}">Подробнее</button>
        <button class="action-btn" data-action="edit" data-id="${order.id}">Редактировать</button>
        <button class="action-btn" data-action="delete" data-id="${order.id}">Удалить</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll(".action-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      const action = btn.dataset.action;
      const id = Number(btn.dataset.id);
      currentOrderId = id;
      const order = orders.find(o => o.id === id);

      if (action === "detail") showDetail(order);
      if (action === "edit") showEdit(order);
      if (action === "delete") document.getElementById("delete-modal").classList.add("show");
    });
  });
}

function showDetail(order) {
  const dishes = [];
  let total = 0;

  if (order.soup) {
    dishes.push(`${order.soup.name} — ${order.soup.price} ₽`);
    total += order.soup.price || 0;
  }
  if (order.main_course) {
    dishes.push(`${order.main_course.name} — ${order.main_course.price} ₽`);
    total += order.main_course.price || 0;
  }
  if (order.salad) {
    dishes.push(`${order.salad.name} — ${order.salad.price} ₽`);
    total += order.salad.price || 0;
  }
  if (order.drink) {
    dishes.push(`${order.drink.name} — ${order.drink.price} ₽`);
    total += order.drink.price || 0;
  }
  if (order.dessert) {
    dishes.push(`${order.dessert.name} — ${order.dessert.price} ₽`);
    total += order.dessert.price || 0;
  }

  const content = `
    <p><strong>Имя:</strong> ${order.full_name}</p>
    <p><strong>Email:</strong> ${order.email}</p>
    <p><strong>Телефон:</strong> ${order.phone}</p>
    <p><strong>Адрес:</strong> ${order.delivery_address}</p>
    <p><strong>Тип доставки:</strong> ${order.delivery_type === "now" ? "Как можно скорее" : "В указанное время"}</p>
    ${order.delivery_time ? `<p><strong>Время доставки:</strong> ${order.delivery_time}</p>` : ""}
    <p><strong>Комментарий:</strong> ${order.comment || "—"}</p>
    <p><strong>Состав:</strong><br>${dishes.join("<br>") || "—"}</p>
    <p><strong>Итого:</strong> ${total} ₽</p>
  `;

  document.getElementById("detail-content").innerHTML = content;
  document.getElementById("detail-modal").classList.add("show");
}

function showEdit(order) {
  const fields = `
    <label>Имя<br><input type="text" name="full_name" value="${order.full_name}" required></label><br><br>
    <label>Email<br><input type="email" name="email" value="${order.email}" required></label><br><br>
    <label>Телефон<br><input type="tel" name="phone" value="${order.phone}" required></label><br><br>
    <label>Адрес доставки<br><input type="text" name="delivery_address" value="${order.delivery_address}" required></label><br><br>

    <p>Время доставки</p>
    <label><input type="radio" name="delivery_type" value="asap" ${order.delivery_type === "now" ? "checked" : ""}> Как можно скорее</label><br>
    <label><input type="radio" name="delivery_type" value="exact" ${order.delivery_type === "by_time" ? "checked" : ""}> Точное время</label><br><br>

    <label>Указать время<br><input type="time" name="delivery_time" value="${order.delivery_time || ""}" min="10:00" max="21:00" step="1800"></label><br><br>

    <label>Комментарий<br><textarea name="comment" rows="4">${order.comment || ""}</textarea></label>
  `;

  document.getElementById("edit-fields").innerHTML = fields;
  document.getElementById("edit-modal").classList.add("show");
}

async function saveEdit(e) {
  e.preventDefault();
  const fd = new FormData(e.target);

  const data = {
    full_name: fd.get("full_name").trim(),
    email: fd.get("email").trim(),
    phone: fd.get("phone").trim(),
    delivery_address: fd.get("delivery_address").trim(),
    delivery_type: fd.get("delivery_type") === "asap" ? "now" : "by_time",
    comment: fd.get("comment")?.trim() || "",
  };

  if (data.delivery_type === "by_time") {
    data.delivery_time = fd.get("delivery_time");
    if (!data.delivery_time) {
      showMessage("Укажите время доставки");
      return;
    }
  } else {
    data.delivery_time = null;
  }

  try {
    const resp = await fetch(`${ORDERS_API}/${currentOrderId}?api_key=${API_KEY}`, {
      method: "PUT",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(data)
    });

    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.error || "Ошибка сервера");
    }

    showMessage("Заказ успешно изменён");
    document.getElementById("edit-modal").classList.remove("show");
    loadOrders();
  } catch (err) {
    showMessage("Ошибка: " + err.message);
  }
}

async function deleteOrder() {
  try {
    const resp = await fetch(`${ORDERS_API}/${currentOrderId}?api_key=${API_KEY}`, {
      method: "DELETE"
    });

    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.error || "Ошибка сервера");
    }

    showMessage("Заказ успешно удалён");
    document.getElementById("delete-modal").classList.remove("show");
    loadOrders();
  } catch (err) {
    showMessage("Ошибка: " + err.message);
  }
}

function closeAllModals() {
  document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("show"));
}

function showMessage(text) {
  document.getElementById("message-text").textContent = text;
  document.getElementById("message-modal").classList.add("show");
}