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

// Flattens grouped date objects into a single flat array of entries
export const flattenTimesheetData = (timesheetData, formatIsoTime) => {
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
      rows.push({
        workDate: group.work_date || "—",
        project: item.project || "—",
        task: item.task || "—",
        startTime: item.start_time
          ? typeof formatIsoTime === "function"
            ? formatIsoTime(item.start_time)
            : item.start_time
          : "—",
        endTime: item.end_time
          ? typeof formatIsoTime === "function"
            ? formatIsoTime(item.end_time)
            : item.end_time
          : "—",
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
 * Export Controller
 */
export const exportTimesheetReport = async ({
  fileType,
  timesheetData = [],
  summary = {},
  viewBy = "Year",
  formatIsoTime,
  userInfo = { employeeName: "Aswin P Raghu", employeeId: "100340" },
}) => {
  const flattenedData = flattenTimesheetData(timesheetData, formatIsoTime);

  const meta = {
    employeeName: userInfo.employeeName,
    employeeId: userInfo.employeeId,
    fromDate: summary?.fromDate || "—",
    toDate: summary?.toDate || "—",
    filter: viewBy || "Year",
    totalEntries: flattenedData.length,
    totalHours: summary?.totalHours || "0h 0m",
  };

// -------------------------------------------------------------
  // CSV GENERATOR (Auto-Fit Column Widths, Dash Fallback & Date Fix)
  // -------------------------------------------------------------
  if (fileType === "csv") {
    const tableHeaders = [
      "Work Date",
      "Project",
      "Task",
      "Start Time",
      "End Time",
      "Duration",
      "Minutes",
      "Status",
      "Remarks",
    ];

    // Helper to replace empty/null/undefined values with a dash ("—")
    const getValueOrDash = (val) => {
      if (val === null || val === undefined) return "—";
      const str = String(val).trim();
      return str === "" ? "—" : str;
    };

    // Format table rows with safety fallback
    const rawRows = flattenedData.map((row) => [
      getValueOrDash(row.workDate),
      getValueOrDash(row.project),
      getValueOrDash(row.task),
      getValueOrDash(row.startTime),
      getValueOrDash(row.endTime),
      getValueOrDash(row.duration),
      getValueOrDash(row.minutes),
      getValueOrDash(row.status),
      getValueOrDash(row.remarks),
    ]);

    // 1. Calculate Maximum Content Width per Column
    const colWidths = tableHeaders.map((header, colIdx) => {
      let maxLen = header.length;
      rawRows.forEach((row) => {
        const valLen = row[colIdx].length;
        if (valLen > maxLen) {
          maxLen = valLen;
        }
      });
      return maxLen + 4; // Longest content length + padding spaces
    });

    // 2. Helper to Format Cells with Exact Padded Column Width
    const formatCellWithExactWidth = (val, colIdx, isDateOrTime = false) => {
      const cleanVal = getValueOrDash(val);
      
      // Force text mode for dates/times using Excel string formula to eliminate '#####'
      if (isDateOrTime && cleanVal !== "—") {
        return `="` + cleanVal.padEnd(colWidths[colIdx], " ") + `"`;
      }
      
      return `="` + cleanVal.padEnd(colWidths[colIdx], " ") + `"`;
    };

    // 3. Horizontal Border Line
    const borderDivider = colWidths.map((w) => `="${"-".repeat(w)}"`).join(",");

    // 4. Construct CSV Structure
    const csvRows = [
      ["TIMESHEET REPORT"],
      [],
      ["+---------------------------------------+"],
      ["| Employee", `="${getValueOrDash(meta.employeeName)}"`],
      ["| Employee ID", `="${getValueOrDash(meta.employeeId)}"`],
      ["| Period", `="${getValueOrDash(meta.fromDate)} -> ${getValueOrDash(meta.toDate)}"`],
      ["| Filter", `="${getValueOrDash(meta.filter)}"`],
      ["| Total Entries", `="${getValueOrDash(meta.totalEntries)}"`],
      ["| Total Hours", `="${getValueOrDash(meta.totalHours)}"`],
      ["+---------------------------------------+"],
      [],
      ["Timesheet data"],
      borderDivider,
      tableHeaders.map((h, idx) => formatCellWithExactWidth(h, idx)).join(","),
      borderDivider,
      ...rawRows.map((row) =>
        row.map((val, idx) => {
          const isDateOrTime = idx === 0 || idx === 3 || idx === 4; // Work Date, Start Time, End Time
          return formatCellWithExactWidth(val, idx, isDateOrTime);
        }).join(",")
      ),
      borderDivider,
    ];

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      csvRows.map((e) => (Array.isArray(e) ? e.join(",") : e)).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Timesheet_Report_${meta.employeeId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }
  // -------------------------------------------------------------
  // EXCEL (.xlsx) GENERATION WITH EXCELJS
  // -------------------------------------------------------------
  if (fileType === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Timesheet Report");

    worksheet.columns = [
      { key: "colA", width: 22 },
      { key: "colB", width: 32 },
      { key: "colC", width: 35 },
      { key: "colD", width: 16 },
      { key: "colE", width: 16 },
      { key: "colF", width: 16 },
      { key: "colG", width: 14 },
      { key: "colH", width: 18 },
      { key: "colI", width: 28 },
    ];

    // Title Row
    const titleRow = worksheet.addRow(["TIMESHEET REPORT"]);
    titleRow.getCell(1).font = titleStyle.font;
    titleRow.getCell(1).alignment = titleStyle.alignment;

    worksheet.addRow([]);

    // Summary Block
    const summaryBlock = [
      ["Employee", meta.employeeName],
      ["Employee ID", meta.employeeId],
      ["Period", `${meta.fromDate} → ${meta.toDate}`],
      ["Filter", meta.filter],
      ["Total Entries", meta.totalEntries],
      ["Total Hours", meta.totalHours],
    ];

    summaryBlock.forEach(([label, value]) => {
      const row = worksheet.addRow([label, value]);
      row.getCell(1).font = { bold: true };
      row.getCell(1).alignment = textCellStyle.alignment;
      row.getCell(1).border = borderStyle;

      row.getCell(2).alignment = textCellStyle.alignment;
      row.getCell(2).border = borderStyle;
    });

    worksheet.addRow([]);

    // Section Header
    const subTitleRow = worksheet.addRow(["Timesheet data"]);
    subTitleRow.getCell(1).font = { bold: true, size: 12 };
    subTitleRow.getCell(1).alignment = textCellStyle.alignment;

    // Header Row
    const headers = [
      "Work Date",
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
      cell.font = headerStyle.font;
      cell.alignment = headerStyle.alignment;
      cell.fill = headerStyle.fill;
      cell.border = headerStyle.border;
    });

    // Data Rows
    flattenedData.forEach((item) => {
      const row = worksheet.addRow([
        item.workDate,
        item.project,
        item.task,
        item.startTime,
        item.endTime,
        item.duration,
        item.minutes,
        item.status,
        item.remarks,
      ]);

      row.getCell(1).alignment = centerCellStyle.alignment;
      row.getCell(1).border = centerCellStyle.border;

      row.getCell(2).alignment = textCellStyle.alignment;
      row.getCell(2).border = textCellStyle.border;

      row.getCell(3).alignment = textCellStyle.alignment;
      row.getCell(3).border = textCellStyle.border;

      row.getCell(4).alignment = centerCellStyle.alignment;
      row.getCell(4).border = centerCellStyle.border;

      row.getCell(5).alignment = centerCellStyle.alignment;
      row.getCell(5).border = centerCellStyle.border;

      row.getCell(6).alignment = numberCellStyle.alignment;
      row.getCell(6).border = numberCellStyle.border;

      row.getCell(7).alignment = numberCellStyle.alignment;
      row.getCell(7).border = numberCellStyle.border;

      row.getCell(8).alignment = centerCellStyle.alignment;
      row.getCell(8).border = centerCellStyle.border;

      row.getCell(9).alignment = textCellStyle.alignment;
      row.getCell(9).border = textCellStyle.border;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Timesheet_Report_${meta.employeeId}.xlsx`;
    link.click();
  }

  // -------------------------------------------------------------
  // HIGH-CONTRAST BORDERED PDF EXPORT WITH DYNAMIC STATUS TEXT COLOR
  // -------------------------------------------------------------
  else if (fileType === "pdf") {
    const doc = new jsPDF({ orientation: "landscape" });

    // Header Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("TIMESHEET REPORT", 14, 15);

    doc.setFontSize(9);

    const summaryMeta = [
      ["Employee", meta.employeeName],
      ["Employee ID", meta.employeeId],
      ["Period", `${meta.fromDate} → ${meta.toDate}`],
      ["Filter", meta.filter],
      ["Total Entries", String(meta.totalEntries)],
      ["Total Hours", meta.totalHours],
    ];

    let startY = 22;
    const boxWidth = 120;
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
    doc.text("Timesheet data", 14, tableStartY);

    const headers = [
      [
        "Work Date",
        "Project",
        "Task",
        "Start Time",
        "End Time",
        "Duration",
        "Minutes",
        "Status",
        "Remarks",
      ],
    ];

    const body = flattenedData.map((row) => [
      row.workDate,
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
        fontSize: 8,
        cellPadding: 3,
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { halign: "center" },
        1: { halign: "left" },
        2: { halign: "left" },
        3: { halign: "center" },
        4: { halign: "center" },
        5: { halign: "right" },
        6: { halign: "right" },
        7: { halign: "center", fontStyle: "bold" },
        8: { halign: "left" },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 7) {
          const rowIndex = data.row.index;
          const statusHex = flattenedData[rowIndex]?.statusColor || "#10B981";
          data.cell.styles.textColor = hexToRgb(statusHex);
        }
      },
    });

    doc.save(`Timesheet_Report_${meta.employeeId}.pdf`);
  }
};