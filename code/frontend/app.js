import { CONFIG } from "./config.js";

const els = {
  status: document.getElementById("status"),
  refreshBtn: document.getElementById("refreshBtn"),

  catalogueUrl: document.getElementById("catalogueUrl"),
  loansUrl: document.getElementById("loansUrl"),

  devicesTbody: document.getElementById("devicesTbody"),
  loansTbody: document.getElementById("loansTbody"),

  devicesError: document.getElementById("devicesError"),
  loansError: document.getElementById("loansError"),

  reserveForm: document.getElementById("reserveForm"),
  reserveDeviceId: document.getElementById("reserveDeviceId"),
  reserveStudentId: document.getElementById("reserveStudentId"),
  reserveMsg: document.getElementById("reserveMsg")
};

function setStatus(text, ok) {
  els.status.textContent = text;
  els.status.classList.remove("ok", "bad");
  els.status.classList.add(ok ? "ok" : "bad");
}

function show(el, msg) {
  el.textContent = msg;
  el.classList.remove("hidden");
}

function hide(el) {
  el.textContent = "";
  el.classList.add("hidden");
}

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: {
      Accept: "application/json",
      ...(opts.headers || {})
    }
  });

  const ct = res.headers.get("content-type") || "";
  let body = null;

  if (ct.includes("application/json")) body = await res.json();
  else body = await res.text();

  if (!res.ok) {
    const msg = typeof body === "string" ? body : JSON.stringify(body);
    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }
  return body;
}

function serviceBase(url) {
  // CONFIG values are like https://xxxxx.azurewebsites.net
  // local is like http://localhost:7071
  return String(url).replace(/\/$/, "");
}

function api(url, path) {
  return `${serviceBase(url)}${path}`;
}

function renderDevices(devices) {
  els.devicesTbody.innerHTML = "";
  for (const d of devices) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.id}</td>
      <td>${d.brand}</td>
      <td>${d.model}</td>
      <td>${d.category}</td>
      <td>${d.totalCount}</td>
      <td>${d.availableCount}</td>
    `;
    els.devicesTbody.appendChild(tr);
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderLoans(loans) {
  els.loansTbody.innerHTML = "";

  for (const l of loans) {
    const tr = document.createElement("tr");

    const canCollect = l.status === "reserved" || l.status === "active";
    const canReturn = l.status === "collected" || l.status === "active" || l.status === "reserved";

    tr.innerHTML = `
      <td>${escapeHtml(l.loanId)}</td>
      <td>${escapeHtml(l.deviceId)}</td>
      <td>${escapeHtml(l.studentId)}</td>
      <td>${escapeHtml(l.startDate)}</td>
      <td>${escapeHtml(l.dueDate)}</td>
      <td>${escapeHtml(l.status)}</td>
      <td>
        <button data-action="collect" data-loan="${escapeHtml(l.loanId)}" ${canCollect ? "" : "disabled"}>
          Collect
        </button>
        <button data-action="return" data-loan="${escapeHtml(l.loanId)}" ${canReturn ? "" : "disabled"}>
          Return
        </button>
      </td>
    `;

    els.loansTbody.appendChild(tr);
  }
}

async function loadAll() {
  const catalogue = serviceBase(els.catalogueUrl.value);
  const loans = serviceBase(els.loansUrl.value);

  hide(els.devicesError);
  hide(els.loansError);

  try {
    const d = await fetchJson(api(catalogue, "/api/devices"));
    renderDevices(d.devices || []);
  } catch (e) {
    show(els.devicesError, `Error: ${e.message}`);
  }

  try {
    const l = await fetchJson(api(loans, "/api/loans"));
    renderLoans(l.loans || []);
  } catch (e) {
    show(els.loansError, `Error: ${e.message}`);
  }

  const ok = els.devicesError.classList.contains("hidden") && els.loansError.classList.contains("hidden");
  setStatus(ok ? "Connected to both services" : "Problem connecting", ok);
}

async function reserve(deviceId, studentId) {
  const loans = serviceBase(els.loansUrl.value);

  const body = { deviceId, studentId };
  const result = await fetchJson(api(loans, "/api/reservations"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  return result;
}

async function collectLoan(loanId) {
  const loans = serviceBase(els.loansUrl.value);
  return fetchJson(api(loans, `/api/loans/${encodeURIComponent(loanId)}/collected`), {
    method: "POST"
  });
}

async function returnLoan(loanId) {
  const loans = serviceBase(els.loansUrl.value);
  return fetchJson(api(loans, `/api/loans/${encodeURIComponent(loanId)}/returned`), {
    method: "POST"
  });
}

function wireUp() {
  // Defaults
  els.catalogueUrl.value = CONFIG.catalogueBaseUrl;
  els.loansUrl.value = CONFIG.loansBaseUrl;

  els.refreshBtn.addEventListener("click", () => loadAll());

  // Reserve form
  els.reserveForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    els.reserveMsg.textContent = "";

    const deviceId = els.reserveDeviceId.value.trim();
    const studentId = els.reserveStudentId.value.trim();

    if (!deviceId || !studentId) {
      els.reserveMsg.textContent = "Please enter deviceId and studentId.";
      return;
    }

    try {
      const out = await reserve(deviceId, studentId);
      els.reserveMsg.textContent = `Reserved: ${out.loan?.loanId || "OK"}`;
      await loadAll();
    } catch (err) {
      els.reserveMsg.textContent = `Reserve failed: ${err.message}`;
    }
  });

  // Collect/Return buttons (event delegation)
  els.loansTbody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const action = btn.dataset.action;
    const loanId = btn.dataset.loan;
    if (!action || !loanId) return;

    btn.disabled = true;

    try {
      if (action === "collect") await collectLoan(loanId);
      if (action === "return") await returnLoan(loanId);
      await loadAll();
    } catch (err) {
      alert(`${action} failed: ${err.message}`);
    } finally {
      btn.disabled = false;
    }
  });
}

// Start
wireUp();
loadAll();
