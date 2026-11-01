
// HACKER PRODUCTIVITY SYSTEM - VERSION 2.0

const $ = (id) => document.getElementById(id);

function loadData(key, fallback) {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : fallback;
    } catch {
        return fallback;
    }
}

let tasks = loadData("hackerTasks", []);
let notes = localStorage.getItem("hackerNotes") || "";

const categories = ["College", "Skills", "Personal"];

function saveTasks() {
    localStorage.setItem("hackerTasks", JSON.stringify(tasks));
}

// CLOCK
function updateClock() {
    const now = new Date();
    $("clock").textContent = now.toLocaleTimeString();
    $("date").textContent = now.toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

setInterval(updateClock, 1000);
updateClock();

// NAVIGATION
function showPage(page) {
    document.querySelectorAll(".page").forEach(section => {
        section.classList.toggle("active", section.id === page);
    });

    document.querySelectorAll(".nav-btn").forEach(button => {
        button.classList.toggle("active", button.dataset.page === page);
    });

    const titles = {
        dashboard: "Dashboard",
        missions: "Mission Control",
        focus: "Focus Timer",
        analytics: "Analytics",
        notes: "Operator Notes"
    };

    $("page-title").textContent = titles[page] || "Dashboard";
}

document.querySelectorAll(".nav-btn").forEach(button => {
    button.addEventListener("click", () => showPage(button.dataset.page));
});

document.querySelectorAll("[data-goto]").forEach(button => {
    button.addEventListener("click", () => showPage(button.dataset.goto));
});

// ADD TASK
$("task-form").addEventListener("submit", event => {
    event.preventDefault();

    const name = $("task-input").value.trim();
    const category = $("task-category").value;
    const dueDate = $("task-date").value;

    if (!name) return;

    tasks.unshift({
        id: crypto.randomUUID
            ? crypto.randomUUID()
            : String(Date.now()) + Math.random(),
        name,
        category,
        dueDate,
        completed: false,
        createdAt: new Date().toISOString()
    });

    saveTasks();
    $("task-form").reset();
    renderAll();
});

// TASK ACTIONS
function toggleTask(id) {
    const task = tasks.find(item => item.id === id);
    if (!task) return;

    task.completed = !task.completed;
    saveTasks();
    renderAll();
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderAll();
}

function editTask(id) {
    const task = tasks.find(item => item.id === id);
    if (!task) return;

    const updated = prompt("EDIT YOUR MISSION:", task.name);

    if (updated === null) return;

    if (!updated.trim()) {
        alert("Mission name cannot be empty.");
        return;
    }

    task.name = updated.trim();
    saveTasks();
    renderAll();
}

// TASK ELEMENT
function createTaskElement(task) {
    const item = document.createElement("div");
    item.className = "task-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", "Complete " + task.name);
    checkbox.addEventListener("change", () => toggleTask(task.id));

    const name = document.createElement("span");
    name.className = "task-name" + (task.completed ? " completed" : "");
    name.textContent = task.name;

    const meta = document.createElement("small");
    meta.className = "task-meta";
    meta.textContent = task.category +
        (task.dueDate ? " • Due " + task.dueDate : "");

    const edit = document.createElement("button");
    edit.className = "edit-btn";
    edit.textContent = "EDIT";
    edit.addEventListener("click", () => editTask(task.id));

    const remove = document.createElement("button");
    remove.className = "delete-btn";
    remove.textContent = "DELETE";
    remove.addEventListener("click", () => {
        if (confirm("Delete this mission?")) deleteTask(task.id);
    });

    item.append(checkbox, name, meta, edit, remove);
    return item;
}

// RENDER TASKS
function renderTaskList(container, list) {
    container.replaceChildren();

    if (!list.length) {
        const empty = document.createElement("p");
        empty.className = "empty";
        empty.textContent = "NO MISSIONS FOUND. ADD A NEW MISSION.";
        container.appendChild(empty);
        return;
    }

    list.forEach(task => container.appendChild(createTaskElement(task)));
}

function renderMissions() {
    const search = $("search-task").value.toLowerCase();
    const category = $("filter-category").value;
    const status = $("filter-status").value;

    const filtered = tasks.filter(task => {
        const matchesSearch = task.name.toLowerCase().includes(search);
        const matchesCategory = category === "All" || task.category === category;
        const matchesStatus = status === "All" ||
            (status === "Completed" ? task.completed : !task.completed);

        return matchesSearch && matchesCategory && matchesStatus;
    });

    renderTaskList($("task-list"), filtered);
    renderTaskList($("recent-tasks"), tasks.slice(0, 5));
}

["search-task", "filter-category", "filter-status"].forEach(id => {
    $(id).addEventListener("input", renderMissions);
    $(id).addEventListener("change", renderMissions);
});

$("clear-completed").addEventListener("click", () => {
    if (!tasks.some(task => task.completed)) {
        alert("There are no completed missions.");
        return;
    }

    if (confirm("Clear all completed missions?")) {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderAll();
    }
});

// DASHBOARD STATISTICS
function renderStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    const percentage = total ? Math.round(completed / total * 100) : 0;

    $("total-stat").textContent = total;
    $("completed-stat").textContent = completed;
    $("pending-stat").textContent = pending;
    $("progress-stat").textContent = percentage + "%";

    $("progress-label").textContent = percentage + "%";
    $("progress-bar").style.width = percentage + "%";

    $("progress-message").textContent =
        total === 0 ? "Start your first mission." :
        percentage === 100 ? "ALL MISSIONS COMPLETED. EXCELLENT WORK!" :
        `${completed} of ${total} missions completed. Keep going!`;

    $("analytics-total").textContent = total;
    $("analytics-completed").textContent = completed;
    $("analytics-rate").textContent = percentage + "%";
}

// CATEGORY ANALYTICS
function renderAnalytics() {
    const container = $("category-stats");
    container.replaceChildren();

    categories.forEach(category => {
        const group = tasks.filter(task => task.category === category);
        const completed = group.filter(task => task.completed).length;
        const percent = group.length
            ? Math.round(completed / group.length * 100)
            : 0;

        const row = document.createElement("div");
        row.className = "category-row";

        const label = document.createElement("p");
        const name = document.createElement("span");
        name.textContent = category.toUpperCase();

        const count = document.createElement("span");
        count.textContent = `${completed}/${group.length} • ${percent}%`;

        label.append(name, count);

        const track = document.createElement("div");
        track.className = "category-track";

        const fill = document.createElement("div");
        fill.className = "category-fill";
        fill.style.width = percent + "%";

        track.appendChild(fill);
        row.append(label, track);
        container.appendChild(row);
    });
}

// MOTIVATIONAL QUOTE
const quotes = [
    '"Small steps lead to big achievements."',
    '"Focus on progress, not perfection."',
    '"Your future is created by what you do today."',
    '"Discipline turns goals into results."',
    '"Learn something new every day."'
];

$("quote").textContent = quotes[new Date().getDate() % quotes.length];

// NOTES
$("notes-area").value = notes;

$("save-notes").addEventListener("click", () => {
    notes = $("notes-area").value;
    localStorage.setItem("hackerNotes", notes);
    $("notes-status").textContent = "NOTES SAVED SUCCESSFULLY.";
});

// POMODORO TIMER
let timerSeconds = 25 * 60;
let timerInterval = null;
let timerMode = "focus";

function updateTimerDisplay() {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;

    $("timer").textContent =
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0");
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

function resetTimer() {
    stopTimer();

    const inputId = timerMode === "focus"
        ? "focus-minutes"
        : "break-minutes";

    const duration = Number($(inputId).value);
    const safeDuration = Number.isFinite(duration)
        ? Math.min(120, Math.max(1, duration))
        : 25;

    timerSeconds = safeDuration * 60;
    $("timer-status").textContent =
        timerMode === "focus" ? "Ready to focus?" : "Ready for a break?";
    updateTimerDisplay();
}

function finishTimer() {
    stopTimer();

    $("timer-status").textContent =
        timerMode === "focus"
            ? "FOCUS SESSION COMPLETE! TAKE A BREAK."
            : "BREAK COMPLETE! READY TO FOCUS AGAIN.";

    timerMode = timerMode === "focus" ? "break" : "focus";
    resetTimer();
    $("timer-status").textContent =
        timerMode === "break"
            ? "Focus session complete. Break time!"
            : "Break complete. Ready for another focus session?";
}

$("start-timer").addEventListener("click", () => {
    if (timerInterval) return;

    $("timer-status").textContent =
        timerMode === "focus" ? "FOCUS MODE ACTIVE..." : "BREAK MODE ACTIVE...";

    timerInterval = setInterval(() => {
        if (timerSeconds > 0) {
            timerSeconds--;
            updateTimerDisplay();
        } else {
            finishTimer();
        }
    }, 1000);
});

$("pause-timer").addEventListener("click", () => {
    stopTimer();
    $("timer-status").textContent = "Timer paused.";
});

$("reset-timer").addEventListener("click", resetTimer);

$("focus-minutes").addEventListener("change", () => {
    if (timerMode === "focus") resetTimer();
});

$("break-minutes").addEventListener("change", () => {
    if (timerMode === "break") resetTimer();
});

// INITIALIZE
function renderAll() {
    renderStats();
    renderMissions();
    renderAnalytics();
}

renderAll();
updateTimerDisplay();
