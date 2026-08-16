/* ==========================================================================
   STATE
   ========================================================================== */
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let totalXP = parseInt(localStorage.getItem("totalXP")) || 0;

const CATEGORY_COLORS = {
  work: "#5b8cff",
  health: "#3ddc97",
  life: "#8c7ae6"
};

const grids = {
  work: document.getElementById("workHeatmap"),
  health: document.getElementById("healthHeatmap"),
  life: document.getElementById("lifeHeatmap")
};

document.getElementById("addBtn").addEventListener("click", addTask);
document.getElementById("taskInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTask();
});

/* ==========================================================================
   DATE HELPERS
   ========================================================================== */
function todayStr() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function dayOfYear(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d - start;
  return Math.floor(diff / 86400000); // 1-indexed
}

/* ==========================================================================
   GRID SETUP
   ========================================================================== */
function buildYearlyGrid(gridContainer, categoryName) {
  const year = new Date().getFullYear();
  const totalDays = isLeapYear(year) ? 366 : 365;
  gridContainer.innerHTML = "";
  for (let i = 1; i <= totalDays; i++) {
    const box = document.createElement("div");
    box.id = `${categoryName}-day-${i}`;
    gridContainer.appendChild(box);
  }
}

Object.keys(grids).forEach((cat) => buildYearlyGrid(grids[cat], cat));

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
    completions: [] // list of "YYYY-MM-DD" strings, one per completed day
  });

  saveTasks();
  document.getElementById("taskInput").value = "";
  renderTasks();
}

function completeTask(id) {
  const today = todayStr();
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  if (task.completions.includes(today)) return; // already logged today

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
function taskCard(task, { doneToday }) {
  const div = document.createElement("div");
  div.className = "task";
  if (doneToday) div.classList.add("completed");

  div.innerHTML = `
    <span class="task-info">
      <span class="task-tag" style="background:${CATEGORY_COLORS[task.category]}22; color:${CATEGORY_COLORS[task.category]}">${task.category}</span>
      <span>${task.title}</span>
      <span class="task-count">${task.completions.length} day${task.completions.length === 1 ? "" : "s"}</span>
    </span>
    <span class="task-actions">
      ${doneToday
        ? `<button disabled>Done ✓</button>`
        : `<button onclick="completeTask(${task.id})">Done</button>`
      }
      <button class="delete-btn" onclick="deleteTask(${task.id})" title="Delete habit">✕</button>
    </span>
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
    pending.forEach((t) => todayContainer.appendChild(taskCard(t, { doneToday: false })));
  }

  if (doneToday.length === 0) {
    completedContainer.innerHTML = `<p class="empty-state">Nothing logged today yet.</p>`;
  } else {
    doneToday.forEach((t) => completedContainer.appendChild(taskCard(t, { doneToday: true })));
  }

  if (notStarted.length === 0) {
    upcomingContainer.innerHTML = `<p class="empty-state">No new habits waiting.</p>`;
  } else {
    notStarted.forEach((t) => upcomingContainer.appendChild(taskCard(t, { doneToday: false })));
  }

  updateGridVisuals();
  updateStreak();
}

function updateGridVisuals() {
  const year = new Date().getFullYear();
  const totalDays = isLeapYear(year) ? 366 : 365;

  Object.keys(grids).forEach((cat) => {
    for (let i = 1; i <= totalDays; i++) {
      const el = document.getElementById(`${cat}-day-${i}`);
      if (el) {
        el.style.backgroundColor = "#21262d";
        el.style.boxShadow = "none";
        el.title = "";
      }
    }
  });

  tasks.forEach((task) => {
    const color = CATEGORY_COLORS[task.category];
    task.completions.forEach((dateStr) => {
      if (!dateStr.startsWith(String(year))) return; // only show current year
      const idx = dayOfYear(dateStr);
      const box = document.getElementById(`${task.category}-day-${idx}`);
      if (box) {
        box.style.backgroundColor = color;
        box.style.boxShadow = `0 0 6px ${color}99`;
        box.title = box.title ? `${box.title}, ${task.title}` : `${dateStr}: ${task.title}`;
      }
    });
  });
}

/* ==========================================================================
   XP / LEVEL / STREAK
   ========================================================================== */
function updateXP() {
  document.getElementById("xpDisplay").innerText = `XP: ${totalXP}`;
  document.getElementById("levelDisplay").innerText = `Level ${Math.floor(totalXP / 120) + 1} 🔥`;
  document.getElementById("xpFill").style.width = ((totalXP % 120) / 120) * 100 + "%";
}

function updateStreak() {
  // Union of every date any task was completed on
  const allDates = new Set();
  tasks.forEach((t) => t.completions.forEach((d) => allDates.add(d)));

  let streak = 0;
  let cursor = new Date();
  // If nothing done today yet, start checking from yesterday instead,
  // so today not being logged yet doesn't zero out an ongoing streak.
  if (!allDates.has(todayStr())) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (allDates.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  document.getElementById("streakDisplay").innerText = `Streak: ${streak}`;
}

/* ==========================================================================
   INIT
   ========================================================================== */
updateXP();
renderTasks();
