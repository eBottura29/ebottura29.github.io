const datum_d = document.getElementById("datum");
const tijd_d = document.getElementById("tijd");
const les_d = document.getElementById("les");
const vantot_d = document.getElementById("vantot");

const lessonElements = [
  document.getElementById("l1"),
  document.getElementById("l2"),
  document.getElementById("l3"),
  document.getElementById("l4"),
  document.getElementById("l5"),
  document.getElementById("l6"),
  document.getElementById("l7"),
  document.getElementById("l8"),
];

const dayNames = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];

const timetable = [
  { start: "08:30", end: "09:20" },
  { start: "09:20", end: "10:10" },
  { start: "10:25", end: "11:15" },
  { start: "11:15", end: "12:05" },
  { start: "13:10", end: "14:00" },
  { start: "14:00", end: "14:50" },
  { start: "15:05", end: "15:55" },
  { start: "15:55", end: "16:45" }
];

const schedule = {
  0: ["Free", "Free", "Free", "Free", "Free", "Free", "Free", "Free"],
  1: ["Free", "Free", "Free", "Free", "Free", "Free", "Free", "Free"],
  2: ["Free", "Free", "Free", "Free", "Free", "Free", "Free", "Free"],
  3: ["Free", "Free", "Free", "Free", "Free", "Free", "Free", "Free"],
  4: ["Free", "Free", "Free", "Free", "Free", "Free", "Free", "Free"],
  5: ["Free", "Free", "Free", "Free", "Free", "Free", "Free", "Free"],
  6: ["Free", "Free", "Free", "Free", "Free", "Free", "Free", "Free"]
};

function pad(n) {
  return n < 10 ? "0" + n : n;
}

function formatDate(d) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatTime(d) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function timeToDate(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const now = new Date();
  now.setHours(h, m, 0, 0);
  return now;
}

function updateSchedule() {
  const now = new Date();
  const weekday = now.getDay();
  const lessons = schedule[weekday];

  datum_d.textContent = `Datum: ${formatDate(now)} (${dayNames[weekday]})`;
  tijd_d.textContent = `Het is nu: ${formatTime(now)}`;

  // Reset and fill lesson slots
  lessonElements.forEach((cell, i) => {
    cell.textContent = lessons[i] !== "Free" ? lessons[i] : "";
    cell.classList.remove("highlight");
  });

  // Detect current lesson
  let found = false;
  for (let i = 0; i < timetable.length; i++) {
    const start = timeToDate(timetable[i].start);
    const end = timeToDate(timetable[i].end);
    if (now >= start && now < end) {
      const currentSubject = lessons[i];
      if (currentSubject !== "Free") {
        les_d.textContent = `Les: ${currentSubject}`;
        vantot_d.textContent = `Van tot: ${timetable[i].start} - ${timetable[i].end}`;
        lessonElements[i].classList.add("highlight");
        found = true;
      }
      break;
    }
  }

  if (!found) {
    les_d.textContent = "Les: Geen les nu";
    vantot_d.textContent = "Van tot: -";
  }
}

// Initial run
updateSchedule();

// Update every second
setInterval(updateSchedule, 1000);
