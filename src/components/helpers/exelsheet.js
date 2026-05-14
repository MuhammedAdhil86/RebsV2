// excelStyles.js

// Common border for all cells
export const borderStyle = {
  top: { style: "thin", color: { rgb: "000000" } },
  bottom: { style: "thin", color: { rgb: "000000" } },
  left: { style: "thin", color: { rgb: "000000" } },
  right: { style: "thin", color: { rgb: "000000" } },
};

// Title row style: "MONTH OF JANUARY"
export const titleStyle = {
  font: {
    bold: true,
    sz: 14,
  },
  alignment: {
    horizontal: "center",
    vertical: "center",
  },
};

// Header row style (SL.NO, NAME, etc.)
export const headerStyle = {
  font: {
    bold: true,
  },
  alignment: {
    horizontal: "center",
    vertical: "center",
    wrapText: true,
  },
  border: borderStyle,
};

// Normal text cell (Name, Department, etc.)
export const textCellStyle = {
  alignment: {
    horizontal: "left",
    vertical: "center",
  },
  border: borderStyle,
};

// Number cell (days, wages, salary, etc.)
export const numberCellStyle = {
  alignment: {
    horizontal: "right",
    vertical: "center",
  },
  border: borderStyle,
};

// Total row style
export const totalRowStyle = {
  font: {
    bold: true,
  },
  alignment: {
    horizontal: "right",
    vertical: "center",
  },
  border: borderStyle,
};
