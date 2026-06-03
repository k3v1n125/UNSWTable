export const REMOTE_ICS_URL = "https://my.unsw.edu.au/cal/pttd/bdZr5B6SjC.ics";

export const LECTURE_LINKS = {
  MATH2099: "https://moodle.telt.unsw.edu.au/course/view.php?id=97891",
  MATH2121: "https://moodle.telt.unsw.edu.au/course/view.php?id=97909",
  COMP6441: "https://moodle.telt.unsw.edu.au/course/view.php?id=99596",
}

export const MATH2099_WED_TUTORIAL_MAP_LINK = "https://maps.app.goo.gl/MnZ1noKRfKAXDCDV6";
export const COMP6441_WED_TUTORIAL_MAP_LINK = "https://maps.app.goo.gl/YA3F8vtmp12AE4AP7";
export const MATH2121_FRI_TUTORIAL_MAP_LINK = "https://maps.app.goo.gl/UhQw9hQazvKJXebL6";
export const MATH2099_FRI_LAB_MAP_LINK = "https://maps.app.goo.gl/sPC69MLPicdaM5Qo7";
export const MATH2121_EXAM_MAP_LINK = "https://maps.app.goo.gl/GGoYHeDr7WgaLque6";

export const MANUAL_EVENTS = [
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
  {
    summary: "ENGG2600 Meeting",
    description: "",
    location: "E15 Quadrangle Building 2055",
    start: "20260603T150000",
    end: "20260603T160000",
    day: "WE",
  },
]

function extractCourseCode(event) {
  const haystack = `${event.summary || ""} ${event.description || ""}`;
  return haystack.match(/\b[A-Z]{4}\d{4}\b/)?.[0] || "";
}

export function normalizeTitle(title) {
  return (title || "")
    .replace(/\bLec\s+\d+\s+of\s+\d+\b/gi, "Lecture")
    .replace(/\bTut\s+\d+\s+of\s+\d+\b/gi, "Tutorial")
    .trim();
}

export function shouldDisplayEvent(event, weekNumber) {
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

export function getDisplaySummary(event, weekNumber) {
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

export function formatLocation(event, displaySummary) {
  const location = event.location || "TBA";
  const courseCode = extractCourseCode(event);
  const isOnlineLectureCourse = /^MATH\d{4}\b/.test(courseCode) || courseCode === "COMP6441";
  const isOnlineLecture = isOnlineLectureCourse && /\bLecture\b/i.test(displaySummary || "");

  if (!isOnlineLecture || /\(Online\)$/.test(location)) {
    return location;
  }

  return `${location} (Online)`;
}