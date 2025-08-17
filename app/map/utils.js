import { dateTimeFormatter, colors } from "./constants.js";

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

export function haversineDistance([lon1, lat1], [lon2, lat2]) {
  const R = 6371; // Earth radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 0.621371; // in miles
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

    if (d.geometry && d.geometry.type) {
      const { type } = d.geometry;
      if (type === "Point") {
        // inreach data point, display its date
        const { MessageText } = d.properties;
        const messageDate = new Date(d.properties.GPSTime);
        const messageDateString = dateTimeFormatter.format(messageDate);

        // Only show full message if correct user
        const displayText =
          currentUser && currentUser.email === "katy@gmail.com"
            ? MessageText
            : "Message hidden";
        tooltip.innerHTML = `<p>${displayText}</p><p>Date: ${messageDateString}</p>`;
        tooltip.style.display = "block";
      } else if (type === "LineString") {
        // trail route, display it's leg name
        const legNum = d.properties.title;
        const legName = d.properties.description;
        tooltip.innerHTML = ` <p>Leg #${legNum}: ${legName}<p>`;
        tooltip.style.display = "block";
      } else if (type === "Photo") {
        // Photopoint, display it
        const { path, dateTime } = d.properties;
        tooltip.innerHTML = `<img src="${path}" width="550"><br /><p> Date: ${dateTime}</p>`;
        tooltip.style.display = "block";
      }
    }
  };
}

export function handleMouseMove(event) {
  const tooltip = document.getElementById("tooltip");
  tooltip.style.left = event.pageX + 15 + "px";
  tooltip.style.top = event.pageY - 50 + "px";
}

export function handleMouseOut() {
  document.getElementById("tooltip").style.display = "none";
}
