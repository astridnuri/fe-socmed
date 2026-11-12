export const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export function validateImageFile(file: File, maxMB = 5): string | null {
  if (!IMAGE_TYPES.includes(file.type)) {
    return "Image format must be JPG, JPEG, PNG, or WEBP";
  }
  if (file.size > maxMB * 1024 * 1024) {
    return `Image file size max ${maxMB} MB`;
  }
  return null;
}