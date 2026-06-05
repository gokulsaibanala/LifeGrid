let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let totalXP = parseInt(localStorage.getItem("totalXP")) || 0;

const workGrid = document.getElementById('workHeatmap');
const healthGrid = document.getElementById('healthHeatmap');
const lifeGrid = document.getElementById('lifeHeatmap');

document.getElementById("addBtn").addEventListener("click", addTask);

function buildYearlyGrid(gridContainer, categoryName) {
  gridContainer.innerHTML = "";
  for (let i = 1; i <= 365; i++) {
    const box = document.createElement('div');
    box.id = `${categoryName.toLowerCase()}-day-${i}`;
    gridContainer.appendChild(box);
  }
}

buildYearlyGrid(workGrid, "Work");
buildYearlyGrid(healthGrid, "Health");
buildYearlyGrid(lifeGrid, "Life");

function addTask() {
  const title = document.getElementById("taskInput").value.trim();

  if (!title) return alert("Please enter a habit title");

  tasks.push({
    id: Date.now(),
    title,
    completed: false,
    completionCount: 0 
  });

  localStorage.setItem("tasks", JSON.stringify(tasks));
  document.getElementById("taskInput").value = "";
  renderTasks();
}

function renderTasks() {
  const container = document.getElementById("todayTasks");
  container.innerHTML = "";

  tasks.forEach(task => {
    const div = document.createElement("div");
    div.className = "task";
    if (task.completed) div.classList.add("completed");

    div.innerHTML = `
      <span>${task.title}</span>
      <button onclick="completeTask(${task.id})">Done</button>
    `;

    container.appendChild(div);
  });

  updateGridVisuals();
}

function completeTask(id) {
  tasks = tasks.map(t => {
    if (t.id === id) {
      t.completionCount++;
      updateXP();
      
      if (t.completionCount >= 365) {
        t.completed = true;
      }
    }
    return t;
  });

  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderTasks();
}

function updateGridVisuals() {
  ["work", "health", "life"].forEach(cat => {
    for (let i = 1; i <= 365; i++) {
      const el = document.getElementById(`${cat}-day-${i}`);
      if (el) el.style.backgroundColor = "#21262d";
    }
  });

  tasks.forEach(task => {
    let count = task.completionCount;
    if (count > 365) count = 365;

    let color = "#5b8cff"; 
    if (task.title.toLowerCase().includes("health") || task.title.toLowerCase().includes("run")) {
      color = "#3ddc97"; 
    } else if (task.title.toLowerCase().includes("life") || task.title.toLowerCase().includes("read")) {
      color = "#8c7ae6"; 
    }

    for (let i = 1; i <= count; i++) {
      ["work", "health", "life"].forEach(cat => {
        const targetBox = document.getElementById(`${cat}-day-${i}`);
        if (targetBox && task.title.toLowerCase().includes(cat)) {
          targetBox.style.backgroundColor = color;
          targetBox.style.boxShadow = `0 0 6px ${color}99`;
        } else if (targetBox && cat === "work" && !task.title.toLowerCase().includes("health") && !task.title.toLowerCase().includes("life")) {
          targetBox.style.backgroundColor = "#5b8cff";
          targetBox.style.boxShadow = "0 0 6px #5b8cff99";
        }
      });
    }
  });
}

function updateXP() {
  totalXP += 20;
  localStorage.setItem("totalXP", totalXP);

  document.getElementById("xpDisplay").innerText = `XP: ${totalXP}`;
  document.getElementById("levelDisplay").innerText = `Level ${Math.floor(totalXP / 120) + 1} 🔥`;
  document.getElementById("xpFill").style.width = (totalXP % 120) / 120 * 100 + "%";
}

document.getElementById("xpDisplay").innerText = `XP: ${totalXP}`;
document.getElementById("levelDisplay").innerText = `Level ${Math.floor(totalXP / 120) + 1} 🔥`;
document.getElementById("xpFill").style.width = (totalXP % 120) / 120 * 100 + "%";

renderTasks();
