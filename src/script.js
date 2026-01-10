function calculateWeeks() {
  const startDate = new Date("2026-02-15");

  const endDate = new Date();

  const day = endDate.getDate();
  const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
  ];
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const month = months[endDate.getMonth()];
  const DATE = daysOfWeek[endDate.getDay()] + ", " + month + " " + day;

  const timeDifference = endDate - startDate;
  const weeks = 1 + Math.floor(timeDifference / (1000 * 60 * 60 * 24 * 7));

  document.getElementById("week").innerHTML = "Week " + weeks;
  document.getElementById("date").innerHTML = DATE;
}

