const DAYS = ["MO", "TU", "WE", "TH", "FR"];
const REMOTE_ICS_URL = "https://my.unsw.edu.au/cal/pttd/bdZr5B6SjC.ics";
const CUTOFF_DATE = new Date(2026, 4, 31, 23, 59, 59);
const MATH_LECTURE_LINKS = {
  MATH2099: "https://moodle.telt.unsw.edu.au/course/view.php?id=97891",
  MATH2121: "https://moodle.telt.unsw.edu.au/course/view.php?id=97909",
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

const scheduleGrid = document.getElementById("scheduleGrid");
const icsUpload = document.getElementById("icsUpload");
const classCardTemplate = document.getElementById("classCardTemplate");

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

function formatLocation(event) {
  const location = event.location || "TBA";
  const isMathLecture = /^MATH\d{4}\b/.test(event.summary || "") && /\bLecture\b/i.test(event.summary || "");

  if (!isMathLecture || /\(Online\)$/.test(location)) {
    return location;
  }

  return `${location} (Online)`;
}

function getMathLectureLink(event) {
  const courseCode = extractCourseCode(event);
  const isMathLecture = /^MATH\d{4}\b/.test(courseCode) && /\bLecture\b/i.test(event.summary || "");

  if (!isMathLecture) {
    return "";
  }

  return MATH_LECTURE_LINKS[courseCode] || "";
}

function buildEventContent(event, includeTime = false) {
  const href = getMathLectureLink(event);
  const content = href ? document.createElement("a") : document.createElement("div");

  content.className = href ? "classLink" : "classContent";

  if (href) {
    content.href = href;
  }

  if (includeTime) {
    const time = document.createElement("p");
    time.className = "classTime";
    time.textContent = formatTimeRange(event.start, event.end);
    content.appendChild(time);
  }

  const title = document.createElement("h3");
  title.className = "classTitle";
  title.textContent = event.summary;

  const location = document.createElement("p");
  location.className = "classDetail classLocation";
  location.textContent = formatLocation(event);

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

function buildSlotCard(eventsInSlot) {
  const root = document.createElement("article");
  root.className = "classCard slotCard";

  if (eventsInSlot.length === 1) {
    root.appendChild(buildEventContent(eventsInSlot[0], true));
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

    slide.appendChild(buildEventContent(event));
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

function renderCalendar(icsText, sourceLabel) {
  const parsed = dedupeEvents([...parseIcsEvents(icsText), ...MANUAL_EVENTS]);
  const groups = Object.fromEntries(DAYS.map((day) => [day, []]));

  for (const event of parsed) {
    if (!groups[event.day]) {
      continue;
    }
    groups[event.day].push(event);
  }

  for (const day of DAYS) {
    groups[day].sort((a, b) => (a.start > b.start ? 1 : -1));
  }

  scheduleGrid.innerHTML = "";

  for (const [index, day] of DAYS.entries()) {
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
      empty.textContent = "No classes";
      body.appendChild(empty);
    } else {
      const slots = groupEventsByTimeslot(groups[day]);
      for (const eventsInSlot of slots) {
        body.appendChild(buildSlotCard(eventsInSlot));
      }
    }

    col.appendChild(title);
    col.appendChild(body);
    scheduleGrid.appendChild(col);
  }

}

icsUpload.addEventListener("change", async (event) => {
  const [file] = event.target.files || [];
  if (!file) {
    return;
  }

  const text = await file.text();
  renderCalendar(text, file.name);
});

loadDefaultCalendar();
