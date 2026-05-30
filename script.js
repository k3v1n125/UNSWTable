const DAYS = ["MO", "TU", "WE", "TH", "FR"];
const REMOTE_ICS_URL = "https://my.unsw.edu.au/cal/pttd/bdZr5B6SjC.ics";
const CUTOFF_DATE = new Date(2026, 4, 31, 23, 59, 59);
const WEEK_1_START = new Date(2026, 4, 31);
const TERM_END_DATE = new Date(2026, 7, 8, 23, 59, 59);
const LECTURE_LINKS = {
  MATH2099: "https://moodle.telt.unsw.edu.au/course/view.php?id=97891",
  MATH2121: "https://moodle.telt.unsw.edu.au/course/view.php?id=97909",
  COMP6441: "https://moodle.telt.unsw.edu.au/course/view.php?id=99596",
};

const MANUAL_EVENTS = [
  {
    summary: "COMP6441 Lecture",
    description: "",
    location: "E19 Patricia O'Shane 104",
    start: "20260601T110000",
    end: "20260601T130000",
    day: "MO",
  },
  {
    summary: "COMP6441 Lecture",
    description: "",
    location: "Science Theatre",
    start: "20260602T110000",
    end: "20260602T130000",
    day: "TU",
  },
];
const DAY_LABELS = {
  MO: "Monday",
  TU: "Tuesday",
  WE: "Wednesday",
  TH: "Thursday",
  FR: "Friday",
};
const WEEKDAY_CODES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

const scheduleGrid = document.getElementById("scheduleGrid");
const icsUpload = document.getElementById("icsUpload");
const classCardTemplate = document.getElementById("classCardTemplate");
const weekLabel = document.getElementById("weekLabel");
const monthCalendarGrid = document.getElementById("monthCalendarGrid");
const calendarMonthLabel = document.getElementById("calendarMonthLabel");
const prevMonthBtn = document.getElementById("prevMonthBtn");
const todayMonthBtn = document.getElementById("todayMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");
const calendarPanel = document.querySelector(".calendarPanel");

let calendarMonthCursor = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let selectedCalendarDate = null;
let selectedWeekReferenceDate = null;
let latestCalendarText = "";
let latestCalendarSource = "";

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatMonthDay(date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function toSundayFirstWeekdayIndex(date) {
  return date.getDay();
}

function getDateKey(date) {
  const d = startOfDay(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getSelectedDayCode() {
  if (!selectedCalendarDate) {
    return "";
  }
  return WEEKDAY_CODES[selectedCalendarDate.getDay()] || "";
}

function renderMonthCalendar(targetMonth = calendarMonthCursor) {
  if (!monthCalendarGrid || !calendarMonthLabel) {
    return;
  }

  const monthStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
  calendarMonthCursor = monthStart;

  calendarMonthLabel.textContent = monthStart.toLocaleDateString([], {
    month: "long",
    year: "numeric",
  });

  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const leadingDays = toSundayFirstWeekdayIndex(monthStart);

  const today = startOfDay(new Date());
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - toSundayFirstWeekdayIndex(today));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  monthCalendarGrid.innerHTML = "";

  for (let i = 0; i < leadingDays; i += 1) {
    const day = daysInPrevMonth - leadingDays + i + 1;
    const date = new Date(year, month - 1, day);
    monthCalendarGrid.appendChild(buildCalendarDayCell(date, true, today, weekStart, weekEnd));
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    monthCalendarGrid.appendChild(buildCalendarDayCell(date, false, today, weekStart, weekEnd));
  }

  const totalCells = leadingDays + daysInMonth;
  const trailingDays = (7 - (totalCells % 7 || 7)) % 7;

  for (let i = 1; i <= trailingDays; i += 1) {
    const date = new Date(year, month + 1, i);
    monthCalendarGrid.appendChild(buildCalendarDayCell(date, true, today, weekStart, weekEnd));
  }
}

function buildCalendarDayCell(date, isOutsideMonth, today, weekStart, weekEnd) {
  const cell = document.createElement("div");
  cell.className = "calendarDay";
  cell.textContent = String(date.getDate());
  cell.tabIndex = 0;
  cell.setAttribute("role", "button");
  cell.setAttribute("aria-label", date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }));

  const cellDate = startOfDay(date);
  const cellKey = getDateKey(cellDate);
  const selectedKey = selectedCalendarDate ? getDateKey(selectedCalendarDate) : "";

  if (selectedKey && selectedKey === cellKey) {
    cell.classList.add("is-selected");
  }

  if (isOutsideMonth) {
    cell.classList.add("is-outside");
  }

  if (date >= weekStart && date <= weekEnd) {
    cell.classList.add("is-current-week");
  }

  if (sameDay(date, today)) {
    cell.classList.add("is-today");
  }

  function applyDayFilter() {
    if (selectedKey && selectedKey === cellKey) {
      selectedCalendarDate = null;
      selectedWeekReferenceDate = cellDate;
    } else {
      selectedCalendarDate = cellDate;
      selectedWeekReferenceDate = cellDate;
    }

    renderMonthCalendar(calendarMonthCursor);
    renderCalendar(latestCalendarText, latestCalendarSource);
  }

  cell.addEventListener("click", applyDayFilter);
  cell.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    applyDayFilter();
  });

  return cell;
}

function shiftCalendarMonth(delta) {
  renderMonthCalendar(new Date(calendarMonthCursor.getFullYear(), calendarMonthCursor.getMonth() + delta, 1));
}

function getCurrentMonthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function bindButtonPress(button, action) {
  if (!button) {
    return;
  }

  button.addEventListener("click", action);
  button.addEventListener(
    "touchend",
    (event) => {
      event.preventDefault();
      action();
    },
    { passive: false },
  );
}

function setupMonthSwipeNavigation() {
  if (!monthCalendarGrid && !calendarPanel) {
    return;
  }

  const swipeSurface = monthCalendarGrid || calendarPanel;
  const minSwipeDistance = 40;
  const axisBias = 10;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;
  let tracking = false;

  function begin(clientX, clientY) {
    startX = clientX;
    startY = clientY;
    lastX = clientX;
    lastY = clientY;
    tracking = true;
  }

  function move(clientX, clientY) {
    if (!tracking) {
      return;
    }
    lastX = clientX;
    lastY = clientY;
  }

  function finish(clientX = lastX, clientY = lastY) {
    if (!tracking) {
      return;
    }

    tracking = false;
    const deltaX = clientX - startX;
    const deltaY = clientY - startY;

    if (Math.abs(deltaX) < minSwipeDistance) {
      return;
    }

    if (Math.abs(deltaX) <= Math.abs(deltaY) + axisBias) {
      return;
    }

    shiftCalendarMonth(deltaX < 0 ? 1 : -1);
  }

  swipeSurface.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.touches[0] || event.changedTouches[0];
      if (!touch) {
        return;
      }
      begin(touch.clientX, touch.clientY);
    },
    { passive: true },
  );

  swipeSurface.addEventListener(
    "touchmove",
    (event) => {
      const touch = event.touches[0] || event.changedTouches[0];
      if (!touch) {
        return;
      }
      move(touch.clientX, touch.clientY);
    },
    { passive: true },
  );

  swipeSurface.addEventListener(
    "touchend",
    (event) => {
      const touch = event.changedTouches[0];
      if (!touch) {
        finish();
        return;
      }
      finish(touch.clientX, touch.clientY);
    },
    { passive: true },
  );

  swipeSurface.addEventListener(
    "touchcancel",
    () => {
      tracking = false;
    },
    { passive: true },
  );

  if (window.PointerEvent) {
    swipeSurface.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch") {
        return;
      }
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }
      begin(event.clientX, event.clientY);
    });

    swipeSurface.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") {
        return;
      }
      move(event.clientX, event.clientY);
    });

    swipeSurface.addEventListener("pointerup", (event) => {
      if (event.pointerType === "touch") {
        return;
      }
      finish(event.clientX, event.clientY);
    });

    swipeSurface.addEventListener("pointercancel", () => {
      tracking = false;
    });
  }
}

function getCurrentWeekNumber(today = new Date()) {
  const dayMs = 24 * 60 * 60 * 1000;
  const currentDay = startOfDay(today);
  const week1Day = startOfDay(WEEK_1_START);

  if (currentDay < week1Day) {
    return null;
  }

  const diffDays = Math.floor((currentDay - week1Day) / dayMs);
  return Math.floor(diffDays / 7) + 1;
}

function updateWeekLabel(today = new Date()) {
  if (!weekLabel) {
    return;
  }

  const weekNumber = getCurrentWeekNumber(today);
  if (weekNumber === null) {
    weekLabel.textContent = `Week 1 starts ${formatMonthDay(startOfDay(WEEK_1_START))}`;
    return;
  }

  weekLabel.textContent = `Week ${weekNumber}`;
}

function shouldDisplayEvent(event, weekNumber) {
  const courseCode = extractCourseCode(event);
  const rawSummary = event.rawSummary || event.summary || "";
  const isMath2099MondayLecture =
    courseCode === "MATH2099" && /\bLec\s+2\s+of\s+2\b/i.test(rawSummary) && event.day === "MO";

  if (isMath2099MondayLecture) {
    return [4, 5, 9].includes(weekNumber);
  }

  const isMath2099Exam = courseCode === "MATH2099" && /\bExam\b/i.test(event.summary || "");
  if (!isMath2099Exam) {
    return true;
  }

  return weekNumber === 8;
}

async function loadDefaultCalendar() {
  try {
    const remote = await fetch(REMOTE_ICS_URL, { cache: "no-store" });
    if (!remote.ok) {
      throw new Error(`HTTP ${remote.status}`);
    }
    const remoteText = await remote.text();
    renderCalendar(remoteText, REMOTE_ICS_URL);
  } catch (error) {
    try {
      const local = await fetch("calendar.ics", { cache: "no-store" });
      if (!local.ok) {
        throw new Error(`HTTP ${local.status}`);
      }
      const localText = await local.text();
      renderCalendar(localText, "calendar.ics");
    } catch {
      renderCalendar("", "none");
    }
  }
}

function unfoldIcs(icsText) {
  return icsText.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
}

function parseIcsEvents(icsText) {
  if (!icsText.trim()) {
    return [];
  }

  const normalized = unfoldIcs(icsText);
  const chunks = normalized.split("BEGIN:VEVENT").slice(1);

  return chunks
    .map((chunk) => {
      const body = chunk.split("END:VEVENT")[0] || "";
      const lines = body.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      const event = {};

      for (const line of lines) {
        const splitAt = line.indexOf(":");
        if (splitAt === -1) {
          continue;
        }
        const keyPart = line.slice(0, splitAt);
        const value = line.slice(splitAt + 1);
        const key = keyPart.split(";")[0].toUpperCase();
        event[key] = value;
      }

      if (!(event.CATEGORIES || "").toLowerCase().includes("classes")) {
        return null;
      }

      const rrule = event.RRULE || "";
      const byDay = (rrule.match(/BYDAY=([^;]+)/)?.[1] || "").split(",")[0] || inferDayFromDate(event.DTSTART);
      const startDate = parseIcsDate(event.DTSTART);

      if (!startDate || startDate <= CUTOFF_DATE) {
        return null;
      }

      return {
        rawSummary: event.SUMMARY || "Untitled class",
        summary: normalizeTitle(event.SUMMARY || "Untitled class"),
        description: event.DESCRIPTION || "",
        location: event.LOCATION || "TBA",
        start: event.DTSTART || "",
        end: event.DTEND || "",
        day: byDay,
      };
    })
    .filter(Boolean);
}

function inferDayFromDate(dateString) {
  const date = parseIcsDate(dateString);
  if (!date) {
    return "";
  }
  const map = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  return map[date.getDay()] || "";
}

function parseIcsDate(value) {
  const clean = (value || "").replace(/Z$/, "");
  const match = clean.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?$/);
  if (!match) {
    return null;
  }

  const [, y, m, d, hh, mm, ss = "00"] = match;
  return new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss));
}

function extractCourseCode(event) {
  const haystack = `${event.summary || ""} ${event.description || ""}`;
  return haystack.match(/\b[A-Z]{4}\d{4}\b/)?.[0] || "";
}

function extractClock(value) {
  const clean = (value || "").replace(/Z$/, "");
  const match = clean.match(/^\d{8}T(\d{2})(\d{2})/);
  if (!match) {
    return "";
  }
  return `${match[1]}:${match[2]}`;
}

function normalizeTitle(title) {
  return (title || "")
    .replace(/\bLec\s+\d+\s+of\s+\d+\b/gi, "Lecture")
    .replace(/\bTut\s+\d+\s+of\s+\d+\b/gi, "Tutorial")
    .trim();
}

function getDisplaySummary(event, weekNumber) {
  const rawSummary = (event.rawSummary || event.summary || "Untitled class").trim();
  const normalizedSummary = normalizeTitle(rawSummary);
  const courseCode = extractCourseCode(event);
  const isMath2099Tut1 = courseCode === "MATH2099" && /\bTut\s+1\s+of\s+2\b/i.test(rawSummary);
  const isMath2121WednesdayLecture =
    courseCode === "MATH2121" && event.day === "WE" && /\bLecture\b/i.test(normalizedSummary);

  if (isMath2121WednesdayLecture && [4, 7].includes(weekNumber)) {
    return normalizedSummary.replace(/\bLecture\b/i, "Exam");
  }

  if (!isMath2099Tut1) {
    return normalizedSummary;
  }

  if (weekNumber === 7) {
    return rawSummary.replace(/\bTut\s+1\s+of\s+2\b/gi, "Exam");
  }

  return rawSummary.replace(/\bTut\s+1\s+of\s+2\b/gi, "Lab");
}

function formatLocation(event, displaySummary) {
  const location = event.location || "TBA";
  const courseCode = extractCourseCode(event)
  
  const isOnlineLectureCourse = /^MATH\d{4}\b/.test(courseCode) || courseCode === "COMP6441";
  const isOnlineLecture = isOnlineLectureCourse && /\bLecture\b/i.test(displaySummary || "");

  if (!isOnlineLecture || /\(Online\)$/.test(location)) {
    return location;
  }

  return `${location} (Online)`;
}

function getLectureLink(event, displaySummary) {
  const courseCode = extractCourseCode(event);
  const isExam = /\bExam\b/i.test(displaySummary || "");
  const isLecture = /\bLecture\b/i.test(displaySummary || "");

  if (isExam || !isLecture) {
    return "";
  }

  return LECTURE_LINKS[courseCode] || "";
}

function buildEventContent(event, weekNumber, includeTime = false) {
  const displaySummary = getDisplaySummary(event, weekNumber);
  const href = getLectureLink(event, displaySummary);
  const content = href ? document.createElement("a") : document.createElement("div");

  content.className = href ? "classLink" : "classContent";

  if (href) {
    content.href = href;
    content.target = "_blank";
    content.rel = "noopener noreferrer";
  }

  if (includeTime) {
    const time = document.createElement("p");
    time.className = "classTime";
    time.textContent = formatTimeRange(event.start, event.end);
    content.appendChild(time);
  }

  const title = document.createElement("h3");
  title.className = "classTitle";
  title.textContent = displaySummary;

  const location = document.createElement("p");
  location.className = "classDetail classLocation";
  location.textContent = formatLocation(event, displaySummary);

  content.appendChild(title);
  content.appendChild(location);

  return content;
}

function formatTimeRange(startValue, endValue) {
  const start = parseIcsDate(startValue);
  const end = parseIcsDate(endValue);
  if (!start || !end) {
    return "Time TBA";
  }

  const opts = { hour: "numeric", minute: "2-digit" };
  return `${start.toLocaleTimeString([], opts)} - ${end.toLocaleTimeString([], opts)}`;
}

function groupEventsByTimeslot(events) {
  const slotMap = new Map();

  for (const event of events) {
    const startClock = extractClock(event.start);
    const endClock = extractClock(event.end);
    const key = `${startClock}|${endClock}`;

    if (!slotMap.has(key)) {
      slotMap.set(key, []);
    }
    slotMap.get(key).push(event);
  }

  return Array.from(slotMap.values());
}

function buildSlotCard(eventsInSlot, weekNumber) {
  const root = document.createElement("article");
  root.className = "classCard slotCard";

  if (eventsInSlot.length === 1) {
    root.appendChild(buildEventContent(eventsInSlot[0], weekNumber, true));
    return root;
  }

  const time = document.createElement("p");
  time.className = "classTime";
  time.textContent = formatTimeRange(eventsInSlot[0].start, eventsInSlot[0].end);
  root.appendChild(time);

  const viewport = document.createElement("div");
  viewport.className = "slotViewport";

  const track = document.createElement("div");
  track.className = "slotTrack";

  for (const event of eventsInSlot) {
    const slide = document.createElement("div");
    slide.className = "slotSlide";

    slide.appendChild(buildEventContent(event, weekNumber));
    track.appendChild(slide);
  }

  viewport.appendChild(track);
  root.appendChild(viewport);

  if (eventsInSlot.length > 1) {
    let index = 0;
    let startX = 0;
    let isPointerDown = false;

    const controls = document.createElement("div");
    controls.className = "slotControls";

    const prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className = "slotNav";
    prevBtn.textContent = "<";

    const indicator = document.createElement("p");
    indicator.className = "slotIndicator";

    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "slotNav";
    nextBtn.textContent = ">";

    function updateSlide(nextIndex) {
      index = (nextIndex + eventsInSlot.length) % eventsInSlot.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      indicator.textContent = `${index + 1}/${eventsInSlot.length}`;
    }

    prevBtn.addEventListener("click", () => updateSlide(index - 1));
    nextBtn.addEventListener("click", () => updateSlide(index + 1));

    viewport.addEventListener("pointerdown", (event) => {
      isPointerDown = true;
      startX = event.clientX;
    });

    viewport.addEventListener("pointerup", (event) => {
      if (!isPointerDown) {
        return;
      }
      isPointerDown = false;
      const delta = event.clientX - startX;
      if (Math.abs(delta) < 30) {
        return;
      }
      if (delta < 0) {
        updateSlide(index + 1);
      } else {
        updateSlide(index - 1);
      }
    });

    viewport.addEventListener("pointercancel", () => {
      isPointerDown = false;
    });

    controls.appendChild(prevBtn);
    controls.appendChild(indicator);
    controls.appendChild(nextBtn);
    root.appendChild(controls);

    updateSlide(0);
  }

  return root;
}

function dedupeEvents(events) {
  const seen = new Set();
  return events.filter((event) => {
    const courseCode = extractCourseCode(event);
    const startClock = extractClock(event.start);
    const endClock = extractClock(event.end);
    const key = `${event.summary}|${courseCode}|${event.location}|${event.day}|${startClock}|${endClock}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function clearSingleDayView() {
  if (selectedCalendarDate) {
    selectedWeekReferenceDate = selectedCalendarDate;
  }
  selectedCalendarDate = null;
  renderMonthCalendar(calendarMonthCursor);
  renderCalendar(latestCalendarText, latestCalendarSource);
}

function buildSingleDayHeader(titleText) {
  const row = document.createElement("div");
  row.className = "dayHeaderRow";

  const title = document.createElement("h2");
  title.className = "dayHeader";
  title.textContent = titleText;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "weekScheduleBtn";
  button.textContent = "Week schedule";
  button.addEventListener("click", clearSingleDayView);

  row.appendChild(title);
  row.appendChild(button);

  return row;
}

function renderCalendar(icsText, sourceLabel) {
  latestCalendarText = icsText;
  latestCalendarSource = sourceLabel;

  const referenceDate = selectedCalendarDate || selectedWeekReferenceDate || new Date();
  const weekNumber = getCurrentWeekNumber(referenceDate);
  const isAfterTermEnd = startOfDay(referenceDate) > startOfDay(TERM_END_DATE);
  const isNoClassWeek = weekNumber === null || weekNumber === 6 || isAfterTermEnd;
  const selectedDayCode = getSelectedDayCode();
  const isSingleDayView = Boolean(selectedCalendarDate);
  const parsed = isNoClassWeek
    ? []
    : dedupeEvents([...parseIcsEvents(icsText), ...MANUAL_EVENTS]).filter((event) =>
        shouldDisplayEvent(event, weekNumber),
      );
  const groups = Object.fromEntries(DAYS.map((day) => [day, []]));

  const filteredEvents = selectedDayCode && DAYS.includes(selectedDayCode)
    ? parsed.filter((event) => event.day === selectedDayCode)
    : selectedDayCode
      ? []
      : parsed;

  for (const event of filteredEvents) {
    if (!groups[event.day]) {
      continue;
    }
    groups[event.day].push(event);
  }

  for (const day of DAYS) {
    groups[day].sort((a, b) => (a.start > b.start ? 1 : -1));
  }

  scheduleGrid.innerHTML = "";

  if (isSingleDayView && selectedDayCode && !DAYS.includes(selectedDayCode)) {
    const weekendColumn = document.createElement("section");
    weekendColumn.className = "dayColumn";

    const weekendBody = document.createElement("div");
    weekendBody.className = "dayBody";

    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No classes";
    weekendBody.appendChild(empty);

    weekendColumn.appendChild(buildSingleDayHeader(selectedCalendarDate.toLocaleDateString([], { weekday: "long" })));
    weekendColumn.appendChild(weekendBody);
    scheduleGrid.appendChild(weekendColumn);
    return;
  }

  const daysToRender = isSingleDayView && selectedDayCode ? [selectedDayCode] : DAYS;

  for (const [index, day] of daysToRender.entries()) {
    const col = document.createElement("section");
    col.className = "dayColumn";
    col.style.animationDelay = `${index * 35}ms`;

    const title = document.createElement("h2");
    title.className = "dayHeader";
    title.textContent = DAY_LABELS[day];

    const body = document.createElement("div");
    body.className = "dayBody";

    if (!groups[day].length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = isSingleDayView ? "No classes" : isNoClassWeek ? "No classes this week" : "No classes";
      body.appendChild(empty);
    } else {
      const slots = groupEventsByTimeslot(groups[day]);
      for (const eventsInSlot of slots) {
        body.appendChild(buildSlotCard(eventsInSlot, weekNumber));
      }
    }

    if (isSingleDayView) {
      col.appendChild(buildSingleDayHeader(DAY_LABELS[day]));
    } else {
      col.appendChild(title);
    }
    col.appendChild(body);
    scheduleGrid.appendChild(col);
  }

}

bindButtonPress(prevMonthBtn, () => {
  shiftCalendarMonth(-1);
});

bindButtonPress(todayMonthBtn, () => {
  renderMonthCalendar(getCurrentMonthStart());
});

bindButtonPress(nextMonthBtn, () => {
  shiftCalendarMonth(1);
});

icsUpload.addEventListener("change", async (event) => {
  const [file] = event.target.files || [];
  if (!file) {
    return;
  }

  const text = await file.text();
  renderCalendar(text, file.name);
});

loadDefaultCalendar();
updateWeekLabel();
renderMonthCalendar();
setupMonthSwipeNavigation();
