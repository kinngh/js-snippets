function addWeeks(weeksToAdd) {
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + 7 * weeksToAdd);

  const day = currentDate.getDate();
  const month = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear();

  return `${day}-${month}-${year}`;
}

// Usage
addWeeks(1);

//2-April-2024
