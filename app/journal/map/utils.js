import { dateTimeFormatter, colors } from "./constants.js";

/**
 * Parse a Garmin InReach GPSTime string ("M/D/YYYY H:MM:SS AM/PM") as UTC.
 * new Date() treats this non-ISO format as local time, which shifts evening
 * UTC timestamps (e.g. 2:30 AM UTC = 8:30 PM MDT) to the wrong local time.
 */
export function parseGPSTime(str) {
  const m = str?.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)$/i,
  );
  if (!m) return new Date(str);
  let h = parseInt(m[4]);
  if (m[7].toUpperCase() === "PM" && h !== 12) h += 12;
  if (m[7].toUpperCase() === "AM" && h === 12) h = 0;
  return new Date(Date.UTC(+m[3], +m[1] - 1, +m[2], h, +m[5], +m[6]));
}

/**
 * Taakes the properties object of a route and returns a color based on the leg number.
 * @param {*} properties
 * @returns alternating colors
 */
export function getAlternatingColor(properties) {
  const { title } = properties;
  if (typeof title === "string") {
    const legNum = Number(title.split(" ")[0]);
    if (legNum % 2 === 0) {
      return colors.evenDays;
    } else {
      return colors.oddDays;
    }
  }
}

export function normalizeExifDate(dt) {
  return dt.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3");
}

export function checkForCampsite(data) {
  // Function to check if the data contains a campsite
  if (!data || !data.properties) {
    return false; // Invalid data
  }

  if (data.properties.MessageText.toLowerCase().includes("camped")) {
    return true;
  }
  return false; // No campsite found
}

/**
 *
 * @param {*} event
 * @param {*} d
 * @returns
 */

export function handleMouseOver(currentUser = null) {
  return function handleMouseOver(event, d) {
    if (!d) {
      return;
    }
    const tooltip = document.getElementById("tooltip");

    // Remove hiding classes and add visible classes
    tooltip.classList.remove("invisible", "opacity-0");
    tooltip.classList.add("visible", "opacity-100");

    if (d.geometry && d.geometry.type) {
      const { type } = d.geometry;
      if (type === "Point") {
        // inreach data point, display its date
        const { MessageText } = d.properties;
        const messageDate = parseGPSTime(d.properties.GPSTime);
        const messageDateString = dateTimeFormatter.format(messageDate);

        // Only show full message if correct user
        const displayText =
          currentUser && currentUser.email === "katy6514@gmail.com"
            ? MessageText
            : "Message hidden";

        const isCampsite = checkForCampsite(d);
        const borderColor = isCampsite ? colors.campSitesLight : colors.messages;
        const headerLabel = isCampsite ? "Campsite Message" : "InReach Message";

        tooltip.style.border = `2px solid ${borderColor}`;
        tooltip.style.maxWidth = "300px";
        tooltip.style.padding = "0";
        tooltip.style.overflow = "hidden";
        tooltip.innerHTML = `
          <div style="background:${borderColor};padding:4px 10px;font-weight:600;font-size:11px;letter-spacing:0.05em;text-transform:uppercase;">${headerLabel}</div>
          <div style="padding:8px 10px;">
            <p>${displayText}</p>
            <p style="margin-top:4px;opacity:0.75;font-size:12px;">Date: ${messageDateString}</p>
          </div>`;
        tooltip.style.display = "block";
      } else if (type === "LineString") {
        tooltip.style.border = "";
        tooltip.style.maxWidth = "";
        tooltip.style.padding = "";
        tooltip.style.overflow = "";
        const legNum = d.properties.title;
        const legName = d.properties.description;
        tooltip.innerHTML = ` <p>Leg #${legNum}: ${legName}<p>`;
        tooltip.style.display = "block";
      } else if (type === "Photo") {
        tooltip.style.border = "";
        tooltip.style.maxWidth = "";
        tooltip.style.padding = "";
        tooltip.style.overflow = "";
        const { path, dateTime } = d.properties;
        const photoDate = new Date(normalizeExifDate(dateTime));
        const dateStr = photoDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        const timeStr = photoDate.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        tooltip.innerHTML = `<img src="${path}" width="550"><br /><p><strong>Date:</strong> ${dateStr}</p><p><strong>Time:</strong> ${timeStr}</p>`;
        tooltip.style.display = "block";
      }
    }
  };
}

export function handleMouseMove(event) {
  const tooltip = document.getElementById("tooltip");
  tooltip.style.left = event.pageX - tooltip.offsetWidth - 15 + "px";
  tooltip.style.top = event.pageY - 50 + "px";
}

export function handleMouseOut() {
  const tooltip = document.getElementById("tooltip");
  if (!tooltip) return;
  tooltip.classList.add("invisible", "opacity-0");
  tooltip.classList.remove("visible", "opacity-100");
  tooltip.style.border = "";
  tooltip.style.maxWidth = "";
  tooltip.style.padding = "";
  tooltip.style.overflow = "";
}
