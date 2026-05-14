// Helper to generate month data with dates
const generateMonthData = (month = 9, year = 2025) => {
  const daysInMonth = 30; // For September
  return Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(year, month - 1, i + 1);
    const dayOfWeek = date.getDay(); // 0-Sun, 6-Sat
    let status = "On Time";
    let workHours = "09:23:05";
    let off = false;

    // Weekly off (Sat/Sun)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      status = "Weekly off";
      workHours = null;
      off = true;
    } else if ((i + 1) % 5 === 0) {
      status = "Casual Leave";
      workHours = "00:00:00";
    } else if ((i + 1) % 8 === 0) {
      status = "Sick Leave";
      workHours = "00:00:00";
    } else if ((i + 1) % 11 === 0) {
      status = "Late";
      workHours = "09:00:00";
    }

    return {
      date: i + 1, // Day number
      status,
      workHours,
      off,
    };
  });
};

// Example employees
export const ATTENDANCE_DATA = [
  {
    name: "Vishnu",
    role: "UI/UX Designer",
    avatar: "https://i.pravatar.cc/30?img=1",
    daily: generateMonthData(),
  },
  {
    name: "Aswin Lal",
    role: "UI/UX Designer",
    avatar: "https://i.pravatar.cc/30?img=2",
    daily: generateMonthData(),
  },
  {
    name: "Aleena Eldhose",
    role: "React Developer",
    avatar: "https://i.pravatar.cc/30?img=3",
    daily: generateMonthData(),
  },
  {
    name: "Greeshma b",
    role: "React Developer",
    avatar: "https://i.pravatar.cc/30?img=4",
    daily: generateMonthData(),
  },
  {
    name: "Alwin Gigi",
    role: "Golang Developer",
    avatar: "https://i.pravatar.cc/30?img=5",
    daily: generateMonthData(),
  },
  {
    name: "Hridya S B",
    role: "Web Developer",
    avatar: "https://i.pravatar.cc/30?img=6",
    daily: generateMonthData(),
  },
];
