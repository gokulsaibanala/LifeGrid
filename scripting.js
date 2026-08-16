/* ==========================================================================
   STATE
   ========================================================================== */
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let totalXP = parseInt(localStorage.getItem("totalXP")) || 0;

const CATEGORY_COLORS = {
  work: "#c98a3e",
  health: "#d9614f",
  life: "#8577b0"
};

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const dayCells = {}; // dateStr -> element

document.getElementById("addBtn").addEventListener("click", addTask);
document.getElementById("taskInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTask();
});

/* ==========================================================================
   DATE HELPERS
   ========================================================================== */
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function toISO(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/* ==========================================================================
   CALENDAR — single week-aligned grid, combined across categories
   ========================================================================== */
function buildCalendar() {
  const year = new Date().getFullYear();
  const grid = document.getElementById("calendarGrid");
  const monthsRow = document.getElementById("calendarMonths");
  grid.innerHTML = "";
  monthsRow.innerHTML = "";

  const jan1 = new Date(year, 0, 1);
  const dec31 = new Date(year, 11, 31);
  const gridStart = addDays(jan1, -jan1.getDay()); // Sunday on/before Jan 1
  const gridEnd = addDays(dec31, 6 - dec31.getDay()); // Saturday on/after Dec 31

  const totalCells = Math.round((gridEnd - gridStart) / 86400000) + 1;
  const numCols = totalCells / 7;

  grid.style.gridTemplateColumns = `repeat(${numCols}, 12px)`;
  monthsRow.style.gridTemplateColumns = `repeat(${numCols}, 12px)`;

  let lastMonth = -1;
  let cursor = new Date(gridStart);

  for (let i = 0; i < totalCells; i++) {
    const col = Math.floor(i / 7) + 1;
    const row = (i % 7) + 1;
    const inYear = cursor.getFullYear() === year;
    const dateStr = toISO(cursor);

    const cell = document.createElement("div");
    cell.className = "day-cell" + (inYear ? "" : " out-of-year");
    cell.style.gridColumn = col;
    cell.style.gridRow = row;

    if (inYear) {
      cell.dataset.date = dateStr;
      dayCells[dateStr] = cell;

      if (cursor.getDate() <= 7 && cursor.getMonth() !== lastMonth) {
        lastMonth = cursor.getMonth();
        const label = document.createElement("span");
        label.textContent = MONTH_NAMES[lastMonth];
        label.style.gridColumn = col;
        monthsRow.appendChild(label);
      }
    }

    grid.appendChild(cell);
    cursor = addDays(cursor, 1);
  }
}

function computeDayCategoryMap(year) {
  const map = {};
  tasks.forEach((t) => {
    t.completions.forEach((d) => {
      if (!d.startsWith(String(year))) return;
      if (!map[d]) map[d] = new Set();
      map[d].add(t.category);
    });
  });
  return map;
}

function paintCalendar() {
  const year = new Date().getFullYear();
  const dayMap = computeDayCategoryMap(year);

  Object.entries(dayCells).forEach(([dateStr, cell]) => {
    const cats = dayMap[dateStr] ? [...dayMap[dateStr]] : [];

    if (cats.length === 0) {
      cell.style.background = "#2a2015";
      cell.style.boxShadow = "none";
      cell.removeAttribute("title");
    } else if (cats.length === 3) {
      cell.style.background = "var(--gold)";
      cell.style.boxShadow = "0 0 8px rgba(232,196,104,0.7)";
      cell.title = `${dateStr}: a perfect day`;
    } else if (cats.length === 2) {
      const [c1, c2] = cats.map((c) => CATEGORY_COLORS[c]);
      cell.style.background = `linear-gradient(135deg, ${c1} 50%, ${c2} 50%)`;
      cell.style.boxShadow = `0 0 6px ${c1}66`;
      cell.title = `${dateStr}: ${cats.join(" + ")}`;
    } else {
      const c = CATEGORY_COLORS[cats[0]];
      cell.style.background = c;
      cell.style.boxShadow = `0 0 6px ${c}88`;
      cell.title = `${dateStr}: ${cats[0]}`;
    }
  });
}

/* ==========================================================================
   TASK MANAGEMENT
   ========================================================================== */
function addTask() {
  const title = document.getElementById("taskInput").value.trim();
  const category = document.getElementById("categorySelect").value;
  if (!title) return alert("Please enter a habit title");

  tasks.push({
    id: Date.now(),
    title,
    category,
    completions: []
  });

  saveTasks();
  document.getElementById("taskInput").value = "";
  renderTasks();
}

function completeTask(id) {
  const today = todayStr();
  const task = tasks.find((t) => t.id === id);
  if (!task || task.completions.includes(today)) return;

  task.completions.push(today);
  totalXP += 20;
  localStorage.setItem("totalXP", totalXP);

  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  renderTasks();
}

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

/* ==========================================================================
   RENDERING
   ========================================================================== */
function taskRow(task, { doneToday }) {
  const div = document.createElement("div");
  div.className = "ledger-row";

  div.innerHTML = `
    <span class="task-dot" style="background:${CATEGORY_COLORS[task.category]}"></span>
    <span class="task-title">${task.title}</span>
    <span class="task-count">${task.completions.length}d</span>
    ${doneToday
      ? `<button class="stamp-btn" disabled>stamped</button>`
      : `<button class="stamp-btn" onclick="completeTask(${task.id})">stamp</button>`
    }
    <button class="delete-btn" onclick="deleteTask(${task.id})" title="Delete habit">✕</button>
  `;
  return div;
}

function renderTasks() {
  const today = todayStr();
  const todayContainer = document.getElementById("todayTasks");
  const completedContainer = document.getElementById("completedTasks");
  const upcomingContainer = document.getElementById("upcomingTasks");

  todayContainer.innerHTML = "";
  completedContainer.innerHTML = "";
  upcomingContainer.innerHTML = "";

  const pending = tasks.filter((t) => t.completions.length > 0 && !t.completions.includes(today));
  const doneToday = tasks.filter((t) => t.completions.includes(today));
  const notStarted = tasks.filter((t) => t.completions.length === 0);

  if (pending.length === 0) {
    todayContainer.innerHTML = `<p class="empty-state">Nothing pending — nice.</p>`;
  } else {
    pending.forEach((t) => todayContainer.appendChild(taskRow(t, { doneToday: false })));
  }

  if (doneToday.length === 0) {
    completedContainer.innerHTML = `<p class="empty-state">Nothing logged today yet.</p>`;
  } else {
    doneToday.forEach((t) => completedContainer.appendChild(taskRow(t, { doneToday: true })));
  }

  if (notStarted.length === 0) {
    upcomingContainer.innerHTML = `<p class="empty-state">No new habits waiting.</p>`;
  } else {
    notStarted.forEach((t) => upcomingContainer.appendChild(taskRow(t, { doneToday: false })));
  }

  paintCalendar();
  updateStreak();
}

/* ==========================================================================
   XP / LEVEL / STREAK
   ========================================================================== */
function updateXP() {
  document.getElementById("xpDisplay").innerText = totalXP;
  document.getElementById("levelDisplay").innerText = Math.floor(totalXP / 120) + 1;
  document.getElementById("xpFill").style.width = ((totalXP % 120) / 120) * 100 + "%";
}

function updateStreak() {
  const allDates = new Set();
  tasks.forEach((t) => t.completions.forEach((d) => allDates.add(d)));

  let streak = 0;
  let cursor = new Date();
  if (!allDates.has(todayStr())) {
    cursor = addDays(cursor, -1);
  }

  while (allDates.has(toISO(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }

  document.getElementById("streakDisplay").innerText = `${streak} 🔥`;
}

/* ==========================================================================
   INIT
   ========================================================================== */
buildCalendar();
updateXP();
renderTasks();
