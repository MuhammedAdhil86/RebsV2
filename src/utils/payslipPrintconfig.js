// src/utils/payslipPrintconfig.js

// ================= AVATAR =================
export const avatar =
  "https://ui-avatars.com/api/?name=Admin&background=000000&color=ffffff";

// ================= FORMAT INR =================
export const formatINR = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

// ================= FORMAT PAY DATE =================
export const formatPayDate = (date) => {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// ================= PDF OPTIONS =================
export const getPdfOptions = (employee) => {
  return {
    margin: [0.4, 0.4, 0.4, 0.4], // Margins balanced to protect headers and footers

    filename: `Payslip_${employee?.full_name || "Employee"}.pdf`,

    image: {
      type: "jpeg",
      quality: 1,
    },

    html2canvas: {
      scale: 3,
      useCORS: true,
      letterRendering: true,
    },

    jsPDF: {
      unit: "in",
      format: "a4",
      orientation: "portrait",
    },

    // Prevents breaking inside rows, cards, and major layout sections during PDF generation
    pagebreak: { 
      mode: ["css", "legacy"], 
      avoid: ["tr", ".bg-green-50", ".grid", "table"] 
    },
  };
};