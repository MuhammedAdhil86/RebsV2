export const getValue = (value, fallback = "Not specified") => {
    return value || fallback;
  };

  export const formatDate = (dateString) => {
    if (!dateString || dateString === "0001-01-01T00:00:00Z")
      return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };