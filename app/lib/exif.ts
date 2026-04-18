export type PhotoExif = {
  lat: number | null;
  lon: number | null;
  dateTimeStr: string | null; // "YYYY:MM:DD HH:mm:ss"
  calendarDate: string | null; // "YYYY-MM-DD"
  width: number | null;
  height: number | null;
};

/**
 * Extract GPS, timestamp, and dimensions from a JPEG or HEIC buffer.
 * All fields are nullable — EXIF may be absent or partially present.
 * exifr is dynamically imported because it is ESM-only.
 */
export async function extractPhotoExif(buffer: Buffer): Promise<PhotoExif> {
  const exifr = (await import("exifr")).default;

  let lat: number | null = null;
  let lon: number | null = null;
  let dateTimeStr: string | null = null;
  let calendarDate: string | null = null;
  let width: number | null = null;
  let height: number | null = null;

  try {
    // exifr.gps() is the most reliable cross-format GPS extractor (JPEG and HEIC).
    // It bypasses the pick-filter issue where the GPS sub-IFD isn't always parsed.
    const gps = await exifr.gps(buffer);
    if (gps) {
      lat = gps.latitude ?? null;
      lon = gps.longitude ?? null;
    }
  } catch {
    // Non-fatal: photo saves without GPS coords if none embedded
  }

  try {
    const exifData = await exifr.parse(buffer, {
      pick: ["DateTimeOriginal", "ExifImageWidth", "ExifImageHeight"],
    });
    if (exifData) {
      width = exifData.ExifImageWidth ?? null;
      height = exifData.ExifImageHeight ?? null;

      const dt: Date | undefined = exifData.DateTimeOriginal;
      if (dt instanceof Date) {
        const y  = dt.getFullYear();
        const mo = String(dt.getMonth() + 1).padStart(2, "0");
        const d  = String(dt.getDate()).padStart(2, "0");
        const h  = String(dt.getHours()).padStart(2, "0");
        const mi = String(dt.getMinutes()).padStart(2, "0");
        const s  = String(dt.getSeconds()).padStart(2, "0");
        dateTimeStr = `${y}:${mo}:${d} ${h}:${mi}:${s}`;
        calendarDate = `${y}-${mo}-${d}`;
      }
    }
  } catch {
    // Non-fatal: photo saves without date/dimensions if EXIF is unreadable
  }

  return { lat, lon, dateTimeStr, calendarDate, width, height };
}
