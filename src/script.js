function calculateWeeks() {
  var startDate = new Date("2025-06-01");

  var endDate = new Date();

  var day = endDate.getDate();
  var months = [
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
  var daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var month = months[endDate.getMonth()];
  var DATE = daysOfWeek[endDate.getDay()] + ", " + month + " " + day;

  var timeDifference = endDate - startDate;
  var weeks = 1 + Math.floor(timeDifference / (1000 * 60 * 60 * 24 * 7));

  document.getElementById("week").innerHTML = "Week " + weeks;
  document.getElementById("date").innerHTML = DATE;
}
