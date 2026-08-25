const DAY_IN_MS = 86_400_000;

function parseDate(date) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, amount) {
  return formatDate(new Date(parseDate(date).getTime() + amount * DAY_IN_MS));
}

export function todayISO() {
  return formatDate(new Date());
}

export function createDemoSchedule(referenceDate = todayISO()) {
  return {
    referenceDate,
    weeklyAvailableHours: 18,
    demoMode: true,
    tasks: [
      {
        id: "demo-ai-project",
        title: "Build the AI project prototype",
        subject: "Artificial Intelligence",
        type: "project",
        deadline: addDays(referenceDate, 2),
        estimatedHours: 12,
        progress: 30,
        priority: "high",
        flexible: true
      },
      {
        id: "demo-algorithms-exam",
        title: "Algorithms midterm",
        subject: "Algorithm Design",
        type: "exam",
        deadline: addDays(referenceDate, 4),
        estimatedHours: 8,
        progress: 10,
        priority: "high",
        flexible: false
      },
      {
        id: "demo-statistics-assignment",
        title: "Problem set 4",
        subject: "Probability and Statistics",
        type: "assignment",
        deadline: addDays(referenceDate, 1),
        estimatedHours: 4,
        progress: 45,
        priority: "medium",
        flexible: true
      },
      {
        id: "demo-hci-presentation",
        title: "Accessibility seminar",
        subject: "Human-Computer Interaction",
        type: "project",
        deadline: addDays(referenceDate, 6),
        estimatedHours: 6,
        progress: 20,
        priority: "medium",
        flexible: true
      },
      {
        id: "demo-database-reading",
        title: "Read about normalization and indexes",
        subject: "Database Systems",
        type: "reading",
        deadline: addDays(referenceDate, 3),
        estimatedHours: 3,
        progress: 0,
        priority: "low",
        flexible: true
      },
      {
        id: "demo-networks-report",
        title: "Write the lab report",
        subject: "Computer Networks",
        type: "assignment",
        deadline: addDays(referenceDate, 9),
        estimatedHours: 5,
        progress: 15,
        priority: "medium",
        flexible: true
      }
    ]
  };
}
