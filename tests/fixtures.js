export const REFERENCE_DATE = "2026-03-02";

export function createTask(overrides = {}) {
  return {
    id: "task-default",
    title: "Review lecture notes",
    subject: "Computer Science",
    type: "assignment",
    deadline: "2026-03-08",
    estimatedHours: 2,
    progress: 0,
    priority: "medium",
    flexible: true,
    ...overrides
  };
}

export function createLightSchedule() {
  return {
    referenceDate: REFERENCE_DATE,
    weeklyAvailableHours: 24,
    tasks: [
      createTask({
        id: "light-reading",
        title: "Read one short chapter",
        type: "reading",
        estimatedHours: 2,
        progress: 25,
        priority: "low"
      })
    ]
  };
}

export function createOverloadedSchedule() {
  const taskData = [
    ["exam-algorithms", "Prepare for the algorithms exam", "Algorithms", "exam", "2026-03-03", 14],
    ["project-ai", "Finish the AI prototype", "Artificial Intelligence", "project", "2026-03-03", 16],
    ["report-networks", "Write the networks report", "Computer Networks", "assignment", "2026-03-04", 11],
    ["exam-statistics", "Prepare for the statistics exam", "Statistics", "exam", "2026-03-04", 13],
    ["project-databases", "Complete the database project", "Databases", "project", "2026-03-05", 15],
    ["reading-ethics", "Study the ethics materials", "Technology Ethics", "reading", "2026-03-05", 9]
  ];

  return {
    referenceDate: REFERENCE_DATE,
    weeklyAvailableHours: 8,
    tasks: taskData.map(([id, title, subject, type, deadline, estimatedHours]) =>
      createTask({
        id,
        title,
        subject,
        type,
        deadline,
        estimatedHours,
        priority: "high",
        flexible: type !== "exam"
      })
    )
  };
}

export function createFeatureSchedule() {
  return {
    referenceDate: REFERENCE_DATE,
    weeklyAvailableHours: 18,
    tasks: [
      createTask({
        id: "overdue-assignment",
        title: "Submit the late assignment",
        deadline: "2026-03-01",
        estimatedHours: 5,
        progress: 20,
        priority: "high"
      }),
      createTask({
        id: "due-today",
        title: "Present the class seminar",
        type: "project",
        deadline: "2026-03-02",
        estimatedHours: 4,
        progress: 50,
        flexible: false
      }),
      createTask({
        id: "week-boundary",
        title: "Complete the weekly exercise set",
        deadline: "2026-03-08",
        estimatedHours: 6,
        progress: 0
      }),
      createTask({
        id: "upcoming-exam",
        title: "Prepare for the operating systems exam",
        subject: "Operating Systems",
        type: "exam",
        deadline: "2026-03-12",
        estimatedHours: 8,
        progress: 10,
        priority: "high",
        flexible: false
      }),
      createTask({
        id: "completed-reading",
        title: "Read the research paper",
        type: "reading",
        deadline: "2026-03-02",
        estimatedHours: 3,
        progress: 100,
        priority: "low"
      })
    ]
  };
}
