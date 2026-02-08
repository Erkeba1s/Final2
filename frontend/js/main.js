const CFG = {
  baseURL: "",
  endpoints: {
    register: "/api/auth/register",
    login: "/api/auth/login",
    profile: "/api/profile/me",
    jobs: "/api/jobs",
    jobsSearch: "/api/jobs/search",
    jobsMy: "/api/jobs/mine",
    applications: "/api/applications"
  }
};

const S = {
  tok: "token",
  role: "role",
  user: "user",
  candidateProfile: "candidateProfile"
};

const $ = (sel, root = document) => root.querySelector(sel);

function setText(sel, text) {
  const el = $(sel);
  if (el) el.textContent = text;
}

function setDisabled(sel, v) {
  const el = $(sel);
  if (el) el.disabled = !!v;
}

function toast(msg) {
  alert(msg);
}

function getToken() {
  return localStorage.getItem(S.tok) || "";
}

function setSession({ token, role, user }) {
  if (token) localStorage.setItem(S.tok, token);
  if (role) localStorage.setItem(S.role, role);
  if (user) localStorage.setItem(S.user, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(S.tok);
  localStorage.removeItem(S.role);
  localStorage.removeItem(S.user);
}

function getRole() {
  return localStorage.getItem(S.role) || "";
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem(S.user) || "null");
  } catch {
    return null;
  }
}

function getCandidateProfile() {
  try {
    return JSON.parse(localStorage.getItem(S.candidateProfile) || "null");
  } catch {
    return null;
  }
}

function hasProfileData(p) {
  if (!p) return false;
  if (p.fullName || p.title || p.location || p.bio) return true;
  if (Array.isArray(p.skills) && p.skills.length) return true;
  if (typeof p.skills === "string" && p.skills.trim()) return true;
  return false;
}

function pathEndsWith(name) {
  return window.location.pathname.toLowerCase().endsWith(name.toLowerCase());
}

function isInFolder(folder) {
  return window.location.pathname.toLowerCase().includes(`/${folder.toLowerCase()}/`);
}

async function api(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }

  const res = await fetch(CFG.baseURL + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  let data = null;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) data = await res.json();
  else data = await res.text();

  if (!res.ok) {
    const msg =
      (data && data.message) ||
      (typeof data === "string" && data) ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

function ensureAuthOrRedirect() {
  const t = getToken();
  if (!t) {
    window.location.href = "/pages/auth/login.html";
    return false;
  }
  return true;
}

function enforceRole(role) {
  const r = getRole();
  if (r && r !== role) {
    window.location.href = "../../index.html";
    return false;
  }
  return true;
}

function setLinkHrefIfExists(selector, href) {
  const el = $(selector);
  if (el) el.href = href;
}

function attachNavRoleLinks() {
  const r = getRole();
  const t = getToken();

  let href = "/pages/auth/register.html";
  if (t && (r === "employer")) href = "/pages/employer/e.profile.html";
  if (t && (r === "seeker" || r === "candidate")) href = "/pages/seeker/s.profile.html";

  const topProfileLink = document.querySelector('a.icon-btn[title="Profile"]');
  if (topProfileLink) topProfileLink.href = href;

  const bottomProfileLink = document.getElementById("navProfile");
  if (bottomProfileLink) bottomProfileLink.href = href;
}

function normalizeJobForCard(j) {
  const title = j.title || j.position || "Untitled";
  const company = j.company || j.companyName || j.employer || "Unknown";
  const location = j.location || j.city || "—";
  const source = j.source || (j.externalUrl ? "external" : "internal");
  const isFeatured = !!j.isFeatured;
  const id = j._id || j.id || "";
  const salary =
    j.salary ||
    (j.salaryFrom || j.salaryTo
      ? `${j.salaryFrom || ""}${j.salaryFrom && j.salaryTo ? "–" : ""}${j.salaryTo || ""}`
      : "—");
  const externalUrl = j.externalUrl || j.url || "";

  return { id, title, company, location, source, isFeatured, salary, externalUrl };
}

function renderJobCards(container, jobs, opts = {}) {
  if (!container) return;

  const items = jobs.map(normalizeJobForCard);
  container.innerHTML = "";

  for (const j of items) {
    const classes = ["job-card", "neu-in", j.source];
    if (j.isFeatured && j.source === "internal") classes.push("featured");

    const badgeHTML =
      j.source === "internal"
        ? `<span class="badge badge-internal">INTERNAL</span>${j.isFeatured ? `<span class="badge badge-featured">FEATURED</span>` : ""}`
        : `<span class="badge badge-external">EXTERNAL</span>`;

    const actionHTML =
      j.source === "external"
        ? `<a class="btn-sm neu" href="${j.externalUrl || "#"}" target="_blank" rel="noreferrer">Source ↗</a>`
        : `<a class="btn-sm neu" href="${opts.detailsPath || "../job/details.html"}?id=${encodeURIComponent(j.id)}">Details</a>`;

    const saveBtnHTML = `<button class="save neu" data-save="1" data-source="${j.source}" data-id="${j.id}" data-url="${encodeURIComponent(
      j.externalUrl || ""
    )}">＋</button>`;

    const card = document.createElement("article");
    card.className = classes.join(" ");
    card.innerHTML = `
      <div class="job-top">
        <div class="badges">${badgeHTML}</div>
        ${saveBtnHTML}
      </div>
      <h3>${escapeHtml(j.title)}</h3>
      <div class="job-meta">${escapeHtml(j.company)} • ${escapeHtml(j.location)}</div>
      <div class="job-bottom">
        <div class="pill neu">${escapeHtml(String(j.salary))}</div>
        ${actionHTML}
      </div>
    `;

    container.appendChild(card);
  }

  container.addEventListener("click", async (e) => {
    const btn = e.target.closest('button[data-save="1"]');
    if (!btn) return;

    const source = btn.dataset.source;
    const id = btn.dataset.id || "";
    const url = decodeURIComponent(btn.dataset.url || "");

    try {
      if (!ensureAuthOrRedirect()) return;
      if (getRole() !== "candidate") {
        toast("Only candidates can save jobs.");
        return;
      }
      if (source === "external") {
        toast("External jobs cannot be saved.");
        return;
      }

      const payload = { jobId: id };
      await api("/api/saved-jobs", { method: "POST", body: payload, auth: true });
      toast("Saved.");
    } catch (err) {
      toast(err.message || "Failed to save.");
    }
  });
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function initAuthRegister() {
  const form = $("form.auth-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const inputs = form.querySelectorAll("input, select");
    const nameInput = form.querySelector("#username") || inputs[0];
    const emailInput = form.querySelector("#email") || inputs[1];
    const passwordInput = form.querySelector("#password") || inputs[2];
    const roleInput = form.querySelector("#role") || inputs[3];

    const name = nameInput?.value?.trim() || "";
    const email = emailInput?.value?.trim() || "";
    const password = passwordInput?.value || "";
    const role = roleInput?.value || "";

    if (!role) {
      toast("Select a role.");
      return;
    }

    let profile = null;
    if (role === "candidate" || role === "seeker") {
      const fullName = form.querySelector("#fullName")?.value?.trim() || "";
      const title = form.querySelector("#title")?.value?.trim() || "";
      const location = form.querySelector("#location")?.value?.trim() || "";
      const bio = form.querySelector("#bio")?.value?.trim() || "";
      const skillsRaw = form.querySelector("#skills")?.value || "";
      const skills = skillsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      profile = { fullName, title, location, bio, skills };
    }

    try {
      setDisabled('button[type="submit"]', true);
      const body = { name, email, password, role };
      if (profile) body.profile = profile;
      const data = await api(CFG.endpoints.register, {
        method: "POST",
        body
      });

      const token = data.token || data.accessToken || "";
      const apiUser = data.user || {};
      const mergedProfile = { ...(profile || {}), ...(apiUser.profile || {}) };
      const user = {
        name: apiUser.name || name,
        email: apiUser.email || email,
        role: apiUser.role || role,
        profile: mergedProfile
      };
      const finalRole = user.role || role;

      setSession({ token, role: finalRole, user });
      if (finalRole === "candidate" || finalRole === "seeker") {
        localStorage.setItem(S.candidateProfile, JSON.stringify(mergedProfile));
      } else {
        localStorage.removeItem(S.candidateProfile);
      }

      if (finalRole === "employer") window.location.href = "/profile";
      else window.location.href = "/pages/seeker/s.profile.html";
    } catch (err) {
      toast(err.message || "Registration failed.");
    } finally {
      setDisabled('button[type="submit"]', false);
    }
  });
}

async function initAuthLogin() {
  const form = $("form.auth-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const inputs = form.querySelectorAll("input");
    const email = inputs[0]?.value?.trim() || "";
    const password = inputs[1]?.value || "";

    try {
      setDisabled('button[type="submit"]', true);
      const data = await api(CFG.endpoints.login, {
        method: "POST",
        body: { email, password }
      });

      const token = data.token || data.accessToken || "";
      const user = data.user || {};
      const role = user.role || data.role || "";

      if (!token) throw new Error("Token not returned by API.");

      setSession({ token, role, user });

      if (role === "candidate" || role === "seeker") {
        const existingProfile = getCandidateProfile();
        try {
          const me = await api(CFG.endpoints.profile, { auth: true });
          const apiProfile = me.profile || me.seekerProfile || {};
          const finalProfile = hasProfileData(apiProfile) ? apiProfile : (existingProfile || apiProfile);
          const mergedUser = { ...(user || {}), role, profile: finalProfile };
          localStorage.setItem(S.user, JSON.stringify(mergedUser));
          if (finalProfile) {
            localStorage.setItem(S.candidateProfile, JSON.stringify(finalProfile));
          }
        } catch {}
      }

      if (role === "employer") window.location.href = "/profile";
      else window.location.href = "/";
    } catch (err) {
      toast(err.message || "Login failed.");
    } finally {
      setDisabled('button[type="submit"]', false);
    }
  });
}

async function initEmployerCreateJob() {
  const form = $("form.auth-form");
  if (!form) return;

  if (!ensureAuthOrRedirect()) return;
  if (!enforceRole("employer")) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fields = form.querySelectorAll("input, select, textarea");

    const title = fields[0]?.value?.trim() || "";
    const company = fields[1]?.value?.trim() || "";
    const location = fields[2]?.value?.trim() || "";
    const salary = fields[4]?.value?.trim() || "";
    const description = fields[5]?.value?.trim() || "";

    try {
      setDisabled('button[type="submit"]', true);
      await api(CFG.endpoints.jobs, {
        method: "POST",
        auth: true,
        body: { title, company, location, salary, description }
      });
      toast("Job published.");
      window.location.href = "/pages/employer/e.profile.html";
    } catch (err) {
      toast(err.message || "Failed to publish.");
    } finally {
      setDisabled('button[type="submit"]', false);
    }
  });
}

async function initEmployerMyJobs() {
  const list = $(".cards");
  if (!list) return;

  if (!ensureAuthOrRedirect()) return;
  if (!enforceRole("employer")) return;

  try {
    const jobs = await api(CFG.endpoints.jobsMy, { auth: true });
    renderJobCards(list, Array.isArray(jobs) ? jobs : jobs.items || [], { detailsPath: "../job/details.html" });

    list.addEventListener("click", async (e) => {
      const a = e.target.closest("a.btn-sm");
      if (!a) return;

      const text = a.textContent.trim().toLowerCase();
      const href = a.getAttribute("href") || "";
      const id = new URLSearchParams(href.split("?")[1] || "").get("id") || "";

      if (text === "edit") {
        toast("Edit flow is not wired in this minimal frontend.");
        e.preventDefault();
      }

      if (text === "delete") {
        e.preventDefault();
        try {
          await api(`${CFG.endpoints.jobs}/${encodeURIComponent(id)}`, { method: "DELETE", auth: true });
          toast("Deleted.");
          initEmployerMyJobs();
        } catch (err) {
          toast(err.message || "Delete failed.");
        }
      }
    });
  } catch (err) {
    toast(err.message || "Failed to load jobs.");
  }
}

async function initSeekerProfile() {
  const form = $("form.auth-form");
  if (!form) return;

  if (!ensureAuthOrRedirect()) return;
  const role = getRole();
  if (role && role !== "seeker" && role !== "candidate") {
    window.location.href = "../../index.html";
    return;
  }

  try {
    const me = await api(CFG.endpoints.profile, { auth: true });
    const localProfile = getCandidateProfile();
    const apiProfile = me.profile || me.seekerProfile || {};
    const profile = hasProfileData(apiProfile) ? apiProfile : (localProfile || apiProfile);

    const fullNameEl = form.querySelector("#fullName") || form.querySelector('input[name="fullName"]');
    const titleEl = form.querySelector("#title") || form.querySelector('input[name="title"]');
    const locationEl = form.querySelector("#location") || form.querySelector('input[name="location"]');
    const bioEl = form.querySelector("#bio") || form.querySelector('textarea[name="bio"]');
    const skillsEl = form.querySelector("#skills") || form.querySelector('input[name="skills"]');

    const fields = form.querySelectorAll("input, textarea");
    if (fullNameEl) fullNameEl.value = profile.fullName || "";
    if (titleEl) titleEl.value = profile.title || "";
    if (locationEl) locationEl.value = profile.location || "";
    if (bioEl) bioEl.value = profile.bio || "";
    if (skillsEl) {
      const s = Array.isArray(profile.skills) ? profile.skills.join(", ") : profile.skills || "";
      skillsEl.value = s;
    }
    if (!fullNameEl && fields[0]) fields[0].value = profile.fullName || "";
    if (!skillsEl && fields[1]) fields[1].value = (profile.skills || []).join(", ") || profile.skills || "";
    if (fields[2] && !titleEl) fields[2].value = profile.experience || profile.title || "";
    if (fields[3] && !bioEl) fields[3].value = profile.about || profile.bio || "";
  } catch {
    const profile = getCandidateProfile() || {};
    const fullNameEl = form.querySelector("#fullName") || form.querySelector('input[name="fullName"]');
    const titleEl = form.querySelector("#title") || form.querySelector('input[name="title"]');
    const locationEl = form.querySelector("#location") || form.querySelector('input[name="location"]');
    const bioEl = form.querySelector("#bio") || form.querySelector('textarea[name="bio"]');
    const skillsEl = form.querySelector("#skills") || form.querySelector('input[name="skills"]');

    const fields = form.querySelectorAll("input, textarea");
    if (fullNameEl) fullNameEl.value = profile.fullName || "";
    if (titleEl) titleEl.value = profile.title || "";
    if (locationEl) locationEl.value = profile.location || "";
    if (bioEl) bioEl.value = profile.bio || "";
    if (skillsEl) {
      const s = Array.isArray(profile.skills) ? profile.skills.join(", ") : profile.skills || "";
      skillsEl.value = s;
    }
    if (!fullNameEl && fields[0]) fields[0].value = profile.fullName || "";
    if (!skillsEl && fields[1]) fields[1].value = (profile.skills || []).join(", ") || profile.skills || "";
    if (fields[2] && !titleEl) fields[2].value = profile.experience || profile.title || "";
    if (fields[3] && !bioEl) fields[3].value = profile.about || profile.bio || "";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fullName = form.querySelector("#fullName")?.value?.trim()
      || form.querySelector('input[name="fullName"]')?.value?.trim()
      || "";
    const title = form.querySelector("#title")?.value?.trim()
      || form.querySelector('input[name="title"]')?.value?.trim()
      || "";
    const location = form.querySelector("#location")?.value?.trim()
      || form.querySelector('input[name="location"]')?.value?.trim()
      || "";
    const bio = form.querySelector("#bio")?.value?.trim()
      || form.querySelector('textarea[name="bio"]')?.value?.trim()
      || "";
    const skillsRaw = form.querySelector("#skills")?.value
      || form.querySelector('input[name="skills"]')?.value
      || "";

    const skills = skillsRaw
      ? skillsRaw.split(",").map((x) => x.trim()).filter(Boolean)
      : [];

    const profile = { fullName, title, location, bio, skills };

    try {
      setDisabled('button[type="submit"]', true);
      await api(CFG.endpoints.profile, {
        method: "PUT",
        auth: true,
        body: { profile }
      });
      const user = getUser() || {};
      const mergedUser = { ...user, role: getRole() || user.role, profile };
      localStorage.setItem(S.user, JSON.stringify(mergedUser));
      localStorage.setItem(S.candidateProfile, JSON.stringify(profile));
      toast("Profile saved.");
      window.location.href = "/pages/seeker/s.profile.html";
    } catch (err) {
      toast(err.message || "Failed to save profile.");
    } finally {
      setDisabled('button[type="submit"]', false);
    }
  });
}

async function initSeekerSearch() {
  const searchBox = $(".search.neu-in");
  const list = $(".cards");
  if (!searchBox || !list) return;

  const input = searchBox.querySelector("input");
  const btn = searchBox.querySelector("button");

  async function runSearch() {
    const q = (input?.value || "").trim();
    try {
      const data = await api(`${CFG.endpoints.jobsSearch}?q=${encodeURIComponent(q)}`, { auth: false });
      const items = Array.isArray(data) ? data : data.items || [];
      renderJobCards(list, items, { detailsPath: "../job/details.html" });
    } catch (err) {
      toast(err.message || "Search failed.");
    }
  }

  btn?.addEventListener("click", runSearch);
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runSearch();
    }
  });

  runSearch();
}

async function initJobDetails() {
  const title = document.querySelector("h2");
  if (!title) return;

  const qs = new URLSearchParams(window.location.search);
  const id = qs.get("id") || "";
  const applyBtn = document.querySelector('a.btn.neu[href="#"]') || document.querySelector('a.btn.neu');

  if (!id) return;

  try {
    const data = await api(`${CFG.endpoints.jobs}/${encodeURIComponent(id)}`, { auth: false });
    const j = normalizeJobForCard(data);

    title.textContent = j.title;
    const meta = document.querySelector("p.muted");
    if (meta) meta.textContent = `${j.company} • ${j.location}`;

    const badges = document.querySelector(".badges");
    if (badges) {
      badges.innerHTML =
        j.source === "internal"
          ? `<span class="badge badge-internal">INTERNAL</span>${j.isFeatured ? `<span class="badge badge-featured">FEATURED</span>` : ""}`
          : `<span class="badge badge-external">EXTERNAL</span>`;
    }

    const pill = document.querySelector(".pill.neu");
    if (pill) pill.textContent = j.salary;

    if (j.source === "external") {
      if (applyBtn) {
        applyBtn.textContent = "Open source";
        applyBtn.href = j.externalUrl || "#";
        applyBtn.target = "_blank";
        applyBtn.rel = "noreferrer";
      }
      return;
    }

    if (applyBtn) {
      applyBtn.href = "#";
      applyBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        if (!ensureAuthOrRedirect()) return;
      if (getRole() !== "candidate") {
        toast("Only candidates can apply.");
        return;
      }

        const message = prompt("Enter a short message:");
        if (!message) return;

        try {
          await api(CFG.endpoints.applications, {
            method: "POST",
            auth: true,
            body: { jobId: id, message }
          });
          toast("Application sent.");
        } catch (err) {
          toast(err.message || "Failed to apply.");
        }
      });
    }
  } catch (err) {
    toast(err.message || "Failed to load job.");
  }
}

async function initIndexJobs() {
  const cards = document.querySelector(".cards");
  if (!cards) return;

  try {
    const data = await api(CFG.endpoints.jobsSearch, { auth: false });
    const items = Array.isArray(data) ? data : data.items || [];
    renderJobCards(cards, items, { detailsPath: "pages/job/details.html" });
  } catch {}
}

function boot() {
  attachNavRoleLinks();

  if (pathEndsWith("register.html")) initAuthRegister();
  if (pathEndsWith("login.html")) initAuthLogin();

  if (pathEndsWith("createjob.html")) initEmployerCreateJob();
  if (pathEndsWith("myjob.html")) initEmployerMyJobs();

  if (window.location.pathname === "/profile") return;
  if (pathEndsWith("edit-s.profile.html")) initSeekerProfile();
  if (pathEndsWith("search.html")) initSeekerSearch();
  if (pathEndsWith("details.html")) initJobDetails();

  if (pathEndsWith("index.html") || window.location.pathname.endsWith("/")) initIndexJobs();
}

document.addEventListener("DOMContentLoaded", boot);
