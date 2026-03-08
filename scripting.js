let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let contributions = JSON.parse(localStorage.getItem("contributions")) || {};
let totalXP = parseInt(localStorage.getItem("totalXP")) || 0;
let streak = parseInt(localStorage.getItem("streak")) || 0;
let lastCompletionDate = localStorage.getItem("lastCompletionDate") || null;

document.getElementById("addBtn").addEventListener("click", addTask);

function addTask() {
  const title = document.getElementById("taskInput").value;
  const category = document.getElementById("category").value;
  const dueDate = document.getElementById("dueDate").value;

  if (!title || !dueDate) return alert("Fill all fields");

  tasks.push({
    id: Date.now(),
    title,
    category,
    dueDate,
    completed: false
  });

  localStorage.setItem("tasks", JSON.stringify(tasks));
  document.getElementById("taskInput").value = "";
  renderTasks();
}

function renderTasks() {
  todayTasks.innerHTML = "";
  upcomingTasks.innerHTML = "";
  completedTasks.innerHTML = "";

  const today = new Date().toISOString().split("T")[0];

  tasks.forEach(task => {
    const div = document.createElement("div");
    div.className = `task ${task.category.toLowerCase()}`;
    if (task.completed) div.classList.add("completed");

    div.innerHTML = `
      <span>${task.title} (${task.dueDate})</span>
      <button onclick="completeTask(${task.id})">Done</button>
    `;

    if (task.completed) completedTasks.appendChild(div);
    else if (task.dueDate === today) todayTasks.appendChild(div);
    else upcomingTasks.appendChild(div);
  });
}

function completeTask(id) {
  const today = new Date().toISOString().split("T")[0];

  tasks = tasks.map(t => {
    if (t.id === id && !t.completed) {
      t.completed = true;
      updateContribution(t.category, today);
      updateXP();
    }
    return t;
  });

  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderTasks();
}

function updateContribution(category, date) {
  if (!contributions[date]) {
    contributions[date] = { Work: 0, Health: 0, Life: 0 };
  }

  contributions[date][category]++;
  localStorage.setItem("contributions", JSON.stringify(contributions));
  renderHeatmaps();
}

function renderHeatmaps() {
  ["Work", "Health", "Life"].forEach(cat => {
    const container = document.getElementById(cat.toLowerCase() + "Heatmap");
    container.innerHTML = "";

    for (let i = 0; i < 364; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const square = document.createElement("div");
      const count = contributions[dateStr]?.[cat] || 0;

      square.style.backgroundColor = getColor(cat, count);
      container.appendChild(square);
    }
  });
}

function getColor(cat, count) {
  const map = {
    Work: ["#3a4255", "#3b5ca8", "#5b8cff"],
    Health: ["#3a4255", "#2f8a5e", "#3ddc97"],
    Life: ["#3a4255", "#5a4c94", "#8c7ae6"]
  };

  if (count >= 2) return map[cat][2];
  if (count >= 1) return map[cat][1];
  return map[cat][0];
}

function updateXP() {
  totalXP += 20;
  localStorage.setItem("totalXP", totalXP);

  xpDisplay.innerText = `XP: ${totalXP}`;
  levelDisplay.innerText = `Level ${Math.floor(totalXP / 120) + 1} 🔥`;
  xpFill.style.width = (totalXP % 120) / 120 * 100 + "%";
}

renderTasks();
renderHeatmaps();