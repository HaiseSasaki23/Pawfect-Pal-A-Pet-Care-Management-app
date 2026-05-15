// notifications.js
// Works with the existing .notif-bell and #RemindDot already in your dashboard.html
// No changes needed to your bell HTML — this file handles everything automatically.

const NOTIF_API = "http://localhost:5182";
const POLL_MS   = 60_000; // refresh every 60 seconds

document.addEventListener("DOMContentLoaded", () => {
    buildDropdown();
    fetchNotifications();
    setInterval(fetchNotifications, POLL_MS);
});

// Injects the dropdown into your existing .notif-bell div
// and removes the old onclick that opened the Reminders modal
function buildDropdown() {
    const bell = document.querySelector(".notif-bell");
    if (!bell) return;

    bell.removeAttribute("onclick");

    bell.insertAdjacentHTML("beforeend", `
        <div class="notif-dropdown" id="notifDropdown">
            <div class="notif-dropdown-header">
                <span class="notif-dropdown-title">🔔 Notifications</span>
                <button class="notif-mark-all-btn" id="markAllBtn">Mark all read</button>
            </div>
            <div class="notif-list" id="notifList">
                <div class="notif-empty"><p>Loading…</p></div>
            </div>
        </div>
    `);

    bell.addEventListener("click", toggleDropdown);

    document.getElementById("markAllBtn")
        ?.addEventListener("click", (e) => {
            e.stopPropagation();
            markAllRead();
        });

    document.addEventListener("click", (e) => {
        if (!bell.contains(e.target)) closeDropdown();
    });
}

async function fetchNotifications() {
    try {
        const res = await fetch(`${NOTIF_API}/api/Notification`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) return;

        const data = await res.json();
        renderList(data);
        updateRedDot(data);
    } catch (err) {
        console.error("[Notif] fetch error:", err);
    }
}

function renderList(notifications) {
    const list = document.getElementById("notifList");
    if (!list) return;

    if (!notifications || notifications.length === 0) {
        list.innerHTML = `<div class="notif-empty"><p>No notifications yet 🐾</p></div>`;
        return;
    }

    list.innerHTML = notifications.map(n => `
        <div class="notif-item ${n.isRead ? "notif-read" : "notif-unread"}"
             data-id="${n.notificationId}"
             data-type="${n.type ?? ""}"
             data-refid="${n.referenceId ?? ""}">
            <div class="notif-icon">${iconFor(n.type)}</div>
            <div class="notif-body">
                <p class="notif-title">${safe(n.title)}</p>
                <p class="notif-msg">${safe(n.message)}</p>
                <p class="notif-time">${timeAgo(n.createdAt)}</p>
            </div>
            ${!n.isRead ? `<span class="notif-unread-dot"></span>` : ""}
        </div>
    `).join("");

    list.querySelectorAll(".notif-item").forEach(item => {
        item.addEventListener("click", () => handleClick(item));
    });
}

function updateRedDot(notifications) {
    const dot = document.getElementById("RemindDot");
    if (!dot) return;
    dot.classList.toggle("active", notifications.some(n => !n.isRead));
}

async function handleClick(item) {
    const id   = item.dataset.id;
    const type = item.dataset.type;

    try {
        await fetch(`${NOTIF_API}/api/Notification/${id}/read`, {
            method: "PATCH",
            headers: getAuthHeaders()
        });
    } catch { /* ignore */ }

    if (type === "appointment_confirmed" || type === "appointment_reminder") {
        window.location.href = "../appointments/appointments.html";
    } else if (type === "billing_reminder") {
        window.location.href = "../payment/payment.html";
    }

    fetchNotifications();
}

async function markAllRead() {
    try {
        await fetch(`${NOTIF_API}/api/Notification/read-all`, {
            method: "PATCH",
            headers: getAuthHeaders()
        });
        fetchNotifications();
    } catch (err) {
        console.error("[Notif] mark all read error:", err);
    }
}

function toggleDropdown() {
    document.getElementById("notifDropdown")?.classList.toggle("notif-open");
}

function closeDropdown() {
    document.getElementById("notifDropdown")?.classList.remove("notif-open");
}

function iconFor(type) {
    if (type === "appointment_confirmed") return "🎉";
    if (type === "appointment_reminder")  return "🐾";
    if (type === "billing_reminder")      return "💳";
    return "🔔";
}

function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60)    return "Just now";
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function safe(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
