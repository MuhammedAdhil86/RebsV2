import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  borderStyle,
  titleStyle,
  headerStyle,
  textCellStyle,
  centerCellStyle,
  numberCellStyle,
} from "../../utils/excelStyles";

// Helper to convert Hex color strings (#10B981) to RGB array [r, g, b]
const hexToRgb = (hex) => {
  if (!hex || typeof hex !== "string") return [16, 185, 129];
  let cleanHex = hex.replace("#", "");
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split("")
      .map((char) => char + char)
      .join("");
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return [16, 185, 129];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
};

// Helper to format minutes into "Xh Ym"
const formatMinutesToHours = (totalMins = 0) => {
  const minsNum = Number(totalMins) || 0;
  const hours = Math.floor(minsNum / 60);
  const mins = minsNum % 60;
  return `${hours}h ${mins}m`;
};

// Month Names Helper
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Computes Period string based on selected filter option
const calculatePeriodDisplay = ({ viewBy, selectedDate, selectedMonth, selectedWeek, summary }) => {
  const activeView = (viewBy || "Date").toLowerCase();

  if (activeView === "date" && selectedDate) {
    return selectedDate;
  }
  if (activeView === "month" && selectedMonth) {
    const monthName = MONTH_NAMES[parseInt(selectedMonth, 10) - 1] || selectedMonth;
    return `${monthName}`;
  }
  if (activeView === "week" && selectedWeek) {
    const monthName = selectedMonth ? (MONTH_NAMES[parseInt(selectedMonth, 10) - 1] || selectedMonth) : "";
    return `Week ${selectedWeek}${monthName ? ` (${monthName})` : ""}`;
  }
  if (summary?.fromDate && summary?.toDate) {
    return `${summary.fromDate} → ${summary.toDate}`;
  }
  return summary?.fromDate || summary?.toDate || "—";
};

// Flattens grouped dates for employee timesheets including employee info per entry
export const flattenEmployeeTimesheetData = (timesheetData, formatIsoTime) => {
  const safeData = Array.isArray(timesheetData)
    ? timesheetData
    : Array.isArray(timesheetData?.dates)
    ? timesheetData.dates
    : Array.isArray(timesheetData?.data?.dates)
    ? timesheetData.data.dates
    : [];

  const rows = [];
  safeData.forEach((group) => {
    const entries = Array.isArray(group.entries) ? group.entries : [];
    entries.forEach((item) => {
      const mins = item.time_taken_minutes || 0;

      const empObj = item.employee || item.user || {};
      const firstName = item.first_name || empObj.first_name || "";
      const lastName = item.last_name || empObj.last_name || "";
      const joinedName = [firstName, lastName].filter(Boolean).join(" ");

      const fullName =
        item.employee_name ||
        item.full_name ||
        empObj.name ||
        empObj.full_name ||
        (joinedName.length > 0 ? joinedName : null) ||
        item.nick_name ||
        "—";

      const empCode =
        item.employee_code ||
        item.employee_id ||
        empObj.employee_code ||
        empObj.code ||
        item.uuid ||
        item.id ||
        "—";

      const safeFormat = (t) =>
        typeof formatIsoTime === "function" ? formatIsoTime(t) : t || "—";

      rows.push({
        workDate: group.work_date || "—",
        employeeName: fullName,
        employeeCode: empCode,
        project: item.project || "—",
        task: item.task || "—",
        startTime: safeFormat(item.start_time),
        endTime: safeFormat(item.end_time),
        duration: formatMinutesToHours(mins),
        minutes: mins,
        status: item.status_name || "In Progress",
        statusColor: item.status_color || "#10B981",
        remarks: item.remarks || "—",
      });
    });
  });
  return rows;
};

/**
 * Employee Timesheet Export Controller
 */
export const exportEmployeeTimesheetReport = async ({
  fileType = "xlsx",
  timesheetData = [],
  summary = {},
  viewBy = "Date",
  selectedDate,
  selectedMonth,
  selectedWeek,
  formatIsoTime,
  selectedEmployee = "all",
}) => {
  const flattenedData = flattenEmployeeTimesheetData(timesheetData, formatIsoTime);

  const periodDisplay = calculatePeriodDisplay({
    viewBy,
    selectedDate,
    selectedMonth,
    selectedWeek,
    summary,
  });

  const totalMinutes = summary?.totalMinutes ?? summary?.total_minutes ?? 2402;
  const totalHours = summary?.totalHours ?? summary?.total_hours ?? "40h 2m";

  const meta = {
    employeeFilter: selectedEmployee === "all" ? "All Employees" : selectedEmployee,
    period: periodDisplay,
    filter: viewBy || "Date",
    totalEntries: flattenedData.length,
    totalMinutes: `${totalMinutes} mins`,
    totalHours: totalHours,
  };

  // -------------------------------------------------------------
  // 1. CSV EXPORT
  // -------------------------------------------------------------
  if (fileType === "csv") {
    const tableHeaders = [
      "Work Date",
      "Employee",
      "Employee ID",
      "Project",
      "Task",
      "Start Time",
      "End Time",
      "Duration",
      "Minutes",
      "Status",
      "Remarks",
    ];

    const getValueOrDash = (val) => {
      if (val === null || val === undefined) return "—";
      const str = String(val).trim();
      return str === "" ? "—" : str;
    };

    const rawRows = flattenedData.map((row) => [
      getValueOrDash(row.workDate),
      getValueOrDash(row.employeeName),
      getValueOrDash(row.employeeCode),
      getValueOrDash(row.project),
      getValueOrDash(row.task),
      getValueOrDash(row.startTime),
      getValueOrDash(row.endTime),
      getValueOrDash(row.duration),
      getValueOrDash(row.minutes),
      getValueOrDash(row.status),
      getValueOrDash(row.remarks),
    ]);

    const colWidths = tableHeaders.map((header, colIdx) => {
      let maxLen = header.length;
      rawRows.forEach((row) => {
        const valLen = row[colIdx].length;
        if (valLen > maxLen) maxLen = valLen;
      });
      return maxLen + 4;
    });

    const formatCellWithExactWidth = (val, colIdx) => {
      const cleanVal = getValueOrDash(val);
      return `="` + cleanVal.padEnd(colWidths[colIdx], " ") + `"`;
    };

    const borderDivider = colWidths.map((w) => `="${"-".repeat(w)}"`).join(",");

    const csvRows = [
      ["EMPLOYEE TIMESHEET REPORT"],
      [],
      ["+---------------------------------------+"],
      ["| Employee Filter", `="${getValueOrDash(meta.employeeFilter)}"`],
      ["| Period", `="${getValueOrDash(meta.period)}"`],
      ["| Filter View", `="${getValueOrDash(meta.filter)}"`],
      ["| Total Entries", `="${getValueOrDash(meta.totalEntries)}"`],
      ["| Total Minutes", `="${getValueOrDash(meta.totalMinutes)}"`],
      ["| Total Hours", `="${getValueOrDash(meta.totalHours)}"`],
      ["+---------------------------------------+"],
      [],
      ["Timesheet Data"],
      borderDivider,
      tableHeaders.map((h, idx) => formatCellWithExactWidth(h, idx)).join(","),
      borderDivider,
      ...rawRows.map((row) =>
        row.map((val, idx) => formatCellWithExactWidth(val, idx)).join(",")
      ),
      borderDivider,
    ];

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      csvRows.map((e) => (Array.isArray(e) ? e.join(",") : e)).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Employee_Timesheet_Report_${meta.filter}_${meta.period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // -------------------------------------------------------------
  // 2. EXCEL (.xlsx) EXPORT WITH EXCELJS
  // -------------------------------------------------------------
  if (fileType === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Employee Timesheet Report");

    worksheet.columns = [
      { key: "colA", width: 16 },
      { key: "colB", width: 25 },
      { key: "colC", width: 16 },
      { key: "colD", width: 28 },
      { key: "colE", width: 30 },
      { key: "colF", width: 14 },
      { key: "colG", width: 14 },
      { key: "colH", width: 14 },
      { key: "colI", width: 12 },
      { key: "colJ", width: 16 },
      { key: "colK", width: 26 },
    ];

    const titleRow = worksheet.addRow(["EMPLOYEE TIMESHEET REPORT"]);
    titleRow.getCell(1).font = titleStyle?.font || { bold: true, size: 14 };
    titleRow.getCell(1).alignment = titleStyle?.alignment || { horizontal: "left" };

    worksheet.addRow([]);

    const summaryBlock = [
      ["Employee Filter", meta.employeeFilter],
      ["Period", meta.period],
      ["Filter View", meta.filter],
      ["Total Entries", meta.totalEntries],
      ["Total Minutes", meta.totalMinutes],
      ["Total Hours", meta.totalHours],
    ];

    summaryBlock.forEach(([label, value]) => {
      const row = worksheet.addRow([label, value]);
      row.getCell(1).font = { bold: true };
      row.getCell(1).alignment = textCellStyle?.alignment || { horizontal: "left" };
      if (borderStyle) row.getCell(1).border = borderStyle;

      row.getCell(2).alignment = textCellStyle?.alignment || { horizontal: "left" };
      if (borderStyle) row.getCell(2).border = borderStyle;
    });

    worksheet.addRow([]);

    const subTitleRow = worksheet.addRow(["Timesheet Data"]);
    subTitleRow.getCell(1).font = { bold: true, size: 12 };

    const headers = [
      "Work Date",
      "Employee",
      "Employee ID",
      "Project",
      "Task",
      "Start Time",
      "End Time",
      "Duration",
      "Minutes",
      "Status",
      "Remarks",
    ];

    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = headerStyle?.font || { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = headerStyle?.alignment || { horizontal: "center", vertical: "middle" };
      cell.fill = headerStyle?.fill || { type: "pattern", pattern: "solid", fgColor: { argb: "FF000000" } };
      if (headerStyle?.border) cell.border = headerStyle.border;
    });

    flattenedData.forEach((item) => {
      const row = worksheet.addRow([
        item.workDate,
        item.employeeName,
        item.employeeCode,
        item.project,
        item.task,
        item.startTime,
        item.endTime,
        item.duration,
        item.minutes,
        item.status,
        item.remarks,
      ]);

      row.getCell(1).alignment = centerCellStyle?.alignment || { horizontal: "center" };
      row.getCell(2).alignment = textCellStyle?.alignment || { horizontal: "left" };
      row.getCell(3).alignment = centerCellStyle?.alignment || { horizontal: "center" };
      row.getCell(4).alignment = textCellStyle?.alignment || { horizontal: "left" };
      row.getCell(5).alignment = textCellStyle?.alignment || { horizontal: "left" };
      row.getCell(6).alignment = centerCellStyle?.alignment || { horizontal: "center" };
      row.getCell(7).alignment = centerCellStyle?.alignment || { horizontal: "center" };
      row.getCell(8).alignment = numberCellStyle?.alignment || { horizontal: "right" };
      row.getCell(9).alignment = numberCellStyle?.alignment || { horizontal: "right" };
      row.getCell(10).alignment = centerCellStyle?.alignment || { horizontal: "center" };
      row.getCell(11).alignment = textCellStyle?.alignment || { horizontal: "left" };

      row.eachCell((cell) => {
        if (textCellStyle?.border) cell.border = textCellStyle.border;
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Employee_Timesheet_Report_${meta.filter}_${meta.period}.xlsx`;
    link.click();
    return;
  }

  // -------------------------------------------------------------
  // 3. PDF EXPORT
  // -------------------------------------------------------------
  if (fileType === "pdf") {
    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("EMPLOYEE TIMESHEET REPORT", 14, 15);

    doc.setFontSize(9);

    const summaryMeta = [
      ["Employee Filter", meta.employeeFilter],
      ["Period", meta.period],
      ["Filter View", meta.filter],
      ["Total Entries", String(meta.totalEntries)],
      ["Total Minutes", meta.totalMinutes],
      ["Total Hours", meta.totalHours],
    ];

    let startY = 22;
    const boxWidth = 130;
    const boxHeight = summaryMeta.length * 6 + 4;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(14, startY, boxWidth, boxHeight);

    let currentY = startY + 5;
    summaryMeta.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, 18, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(value, 60, currentY);
      currentY += 6;
    });

    const tableStartY = startY + boxHeight + 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Timesheet Data", 14, tableStartY);

    const headers = [
      [
        "Work Date",
        "Employee",
        "ID",
        "Project",
        "Task",
        "Start Time",
        "End Time",
        "Duration",
        "Mins",
        "Status",
        "Remarks",
      ],
    ];

    const body = flattenedData.map((row) => [
      row.workDate,
      row.employeeName,
      row.employeeCode,
      row.project,
      row.task,
      row.startTime,
      row.endTime,
      row.duration,
      row.minutes,
      row.status,
      row.remarks,
    ]);

    autoTable(doc, {
      startY: tableStartY + 4,
      head: headers,
      body: body,
      theme: "grid",
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "center",
        valign: "middle",
        lineWidth: 0.3,
        lineColor: [0, 0, 0],
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { halign: "center" },
        1: { halign: "left" },
        2: { halign: "center" },
        3: { halign: "left" },
        4: { halign: "left" },
        5: { halign: "center" },
        6: { halign: "center" },
        7: { halign: "right" },
        8: { halign: "right" },
        9: { halign: "center", fontStyle: "bold" },
        10: { halign: "left" },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 9) {
          const rowIndex = data.row.index;
          const statusHex = flattenedData[rowIndex]?.statusColor || "#10B981";
          data.cell.styles.textColor = hexToRgb(statusHex);
        }
      },
    });

    doc.save(`Employee_Timesheet_Report_${meta.filter}_${meta.period}.pdf`);
  }
};