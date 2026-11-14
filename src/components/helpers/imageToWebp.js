// src/utils/imageToWebp.js
// Reusable helper: convert any image File to a WebP File (in the browser)
// before uploading it to the backend.

const SKIP_TYPES = ["image/webp", "image/gif", "image/svg+xml"]; // already webp / animated / vector

const loadBitmap = async (file) => {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall through to <img> loader */
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read the image."));
    };
    img.src = url;
  });
};

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve) => canvas.toBlob(resolve, type, quality));

/**
 * Convert an image File to WebP.
 *
 * @param {File} file
 * @param {Object} [options]
 * @param {number} [options.quality=0.8]   0 - 1
 * @param {number} [options.maxWidth=1600] downscale if wider (keeps ratio)
 * @param {number} [options.maxHeight=1600]
 * @returns {Promise<File>} a .webp File (or the original if it can't/needn't be converted)
 */
export const convertToWebp = async (
  file,
  { quality = 0.8, maxWidth = 1600, maxHeight = 1600 } = {},
) => {
  if (!file || !file.type?.startsWith("image/")) {
    throw new Error("Please select a valid image file.");
  }
  if (SKIP_TYPES.includes(file.type)) return file;

  const bitmap = await loadBitmap(file);
  const srcW = bitmap.width;
  const srcH = bitmap.height;

  const scale = Math.min(1, maxWidth / srcW, maxHeight / srcH);
  const width = Math.round(srcW * scale);
  const height = Math.round(srcH * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height);
  if (typeof bitmap.close === "function") bitmap.close();

  const blob = await canvasToBlob(canvas, "image/webp", quality);

  // Browser doesn't support WebP encoding (it silently returns PNG) -> keep original
  if (!blob || blob.type !== "image/webp") return file;

  const baseName = file.name.replace(/\.[^/.]+$/, "") || "image";
  return new File([blob], `${baseName}.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });
};

export default convertToWebp;
