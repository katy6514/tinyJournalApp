"use client";

import React, { useRef, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import * as d3 from "d3";

import { width, height, cities, colors } from "./constants";
import { notoSans } from "@/app/ui/fonts";

import {
  getAlternatingColor,
  checkForCampsite,
  parseGPSTime,
  handleMouseMove,
  handleMouseOut,
} from "./utils";

// interface CDTmapProps {
//   user: any; // 👈 Replace `any` with your actual user type if available
// }

export default function CDTmap() {
  const ref = useRef();
  const gRef = useRef(null);
  const currentTransformRef = useRef(null);

  const { data: session } = useSession();
  const currentUserRef = useRef(null);
  currentUserRef.current = session?.user ?? null;
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const [photoPanel, setPhotoPanel] = useState(null);
  const setPhotoPanelRef = useRef(null);
  setPhotoPanelRef.current = setPhotoPanel;
  const photoPanelTimeoutRef = useRef(null);

  const [visibility, setVisibility] = useState({
    photos: true,
    campsites: true,
    messages: true,
    cities: true,
    trail: true,
    stateLabels: true,
  });

  // Sync visibility state → D3 element display whenever toggles change
  useEffect(() => {
    const g = gRef.current;
    if (!g) return;
    const photoDisplay = visibility.photos ? null : "none";
    g.selectAll(".photoPoints").attr("display", photoDisplay);
    g.selectAll(".photoHitAreas").attr("display", photoDisplay);
    g.selectAll(".campPoints").attr(
      "display",
      visibility.campsites ? null : "none",
    );
    g.selectAll(".messagePoints").attr(
      "display",
      visibility.messages ? null : "none",
    );
    g.selectAll(".cities").attr("display", visibility.cities ? null : "none");
    d3.select(ref.current).selectAll(".city_label_layer").attr("display", visibility.cities ? null : "none");
    g.selectAll(".trail").attr("display", visibility.trail ? null : "none");
    g.selectAll(".state-label").attr(
      "display",
      visibility.stateLabels ? null : "none",
    );
  }, [visibility]);

  // ✅ Define projection + path WITHIN component and memoize
  const projection = useMemo(() => {
    return d3
      .geoAlbersUsa()
      .scale(2000)
      .translate([width * 0.9, height * 0.625]);
  }, []);

  const path = useMemo(() => d3.geoPath().projection(projection), [projection]);

  function showMessagePanel(event, d, currentUser) {
    const panel = document.getElementById("message-panel");
    const messageDate = parseGPSTime(d.properties.GPSTime);
    const dateStr = messageDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const timeStr = messageDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const isOwner = currentUser?.email === "katy6514@gmail.com";
    const messageText = isOwner ? d.properties.MessageText : "Message hidden";
    panel.innerHTML = `
      <p style="font-weight:600;margin-bottom:8px;">Garmin Message</p>
      <p><strong>Date:</strong> ${dateStr}</p>
      <p><strong>Time:</strong> ${timeStr}</p>
      <p><strong>To:</strong> ${d.properties.Recipients}</p>
      <p style="margin-top:8px;padding-top:8px;border-top:1px solid #e5e7eb;">${messageText}</p>
    `;
    panel.style.display = "block";
    panel.style.left = event.pageX + 15 + "px";
    panel.style.top = event.pageY - 50 + "px";
  }

  function moveMessagePanel(event) {
    const panel = document.getElementById("message-panel");
    panel.style.left = event.pageX + 15 + "px";
    panel.style.top = event.pageY - 50 + "px";
  }

  function hideMessagePanel() {
    const panel = document.getElementById("message-panel");
    panel.style.display = "none";
  }

  useEffect(() => {
    const svg = d3
      .select(ref.current)
      .attr("id", "CDTmap")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("stroke", "rgb(127, 127, 127)")
      .attr("stroke-width", "1px")
      .attr("font-family", notoSans.style.fontFamily);

    svg.selectAll("*").remove();

    const g = svg.append("g").attr("class", "mapLayer");
    gRef.current = g; // ✅ store g in a ref for later access

    const square = d3.symbol().type(d3.symbolSquare).size(128);
    const triangle = d3.symbol().type(d3.symbolTriangle).size(128);
    const cross = d3.symbol().type(d3.symbolCross).size(128);

    // Add zoom behavior
    const zoom = d3
      .zoom()
      .scaleExtent([1, 500])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        currentTransformRef.current = event.transform;

        // Reposition city labels/lines and show only those whose dot is in the viewport
        const t = event.transform;
        const MARGIN = 10;
        const showLabels = t.k > 2.35;

        svg.selectAll(".city_labels").each(function () {
          const el = d3.select(this);
          const [dotSx, dotSy] = t.apply([+el.attr("data-dot-x"), +el.attr("data-dot-y")]);
          const inViewport = dotSx >= 0 && dotSx <= width && dotSy >= 0 && dotSy <= height;
          if (showLabels && inViewport) {
            const [sx, sy] = t.apply([+el.attr("data-bx"), +el.attr("data-by")]);
            el.attr("x", Math.max(MARGIN, Math.min(width - MARGIN, sx)))
              .attr("y", Math.max(MARGIN, Math.min(height - MARGIN, sy)))
              .attr("display", null);
          } else {
            el.attr("display", "none");
          }
        });

        svg.selectAll(".city_lines").each(function () {
          const el = d3.select(this);
          const [x1, y1] = t.apply([+el.attr("data-dot-x"), +el.attr("data-dot-y")]);
          const inViewport = x1 >= 0 && x1 <= width && y1 >= 0 && y1 <= height;
          if (showLabels && inViewport) {
            const [lx, ly] = t.apply([+el.attr("data-label-x"), +el.attr("data-label-y")]);
            el.attr("x1", x1).attr("y1", y1)
              .attr("x2", Math.max(MARGIN, Math.min(width - MARGIN, lx)))
              .attr("y2", Math.max(MARGIN, Math.min(height - MARGIN, ly)))
              .attr("display", null);
          } else {
            el.attr("display", "none");
          }
        });
      })

      .on("end", (event) => {
        // console.log("Zoom level:", event.transform.k);
        const newSize = 128 / (event.transform.k * event.transform.k);
        g.selectAll(".photoPoints").attr("r", 6 / event.transform.k);
        g.selectAll(".photoHitAreas").attr("r", 14 / event.transform.k);
        g.selectAll(".campPoints").attr("d", triangle.size(newSize));
        g.selectAll(".messagePoints").attr("d", square.size(newSize));
        g.selectAll(".cityPoints").attr("d", cross.size(newSize));
        g.selectAll(".state-label").attr("font-size", 20 / event.transform.k);
      });

    svg.call(zoom);

    svg.on("click", (event) => {
      if (!event.target.classList.contains("state-clickable")) {
        svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
      }
    });

    Promise.all([
      d3.json("/api/legs"),
      d3.json("/api/states"),
      d3.json("/data/cdtInreachData_withCoords.geojson"),
      d3.json("/api/photos"),
    ]).then(([trackData, stateData, inReachData, photoData]) => {
      /* -----------------------------------------------------
      *  State outline mapping functionality
      ----------------------------------------------------- */
      // geojson data from: https://github.com/johan/world.geo.json/tree/master
      g.selectAll(".state")
        .data(stateData.features)
        .enter()
        .append("path")
        .attr("class", "state state-clickable")
        .attr("fill", "transparent")
        .attr("stroke", "gray")
        .attr("stroke-width", "1px")
        .attr("d", path)
        .on("click", function (event, d) {
          event.stopPropagation();

          // Check if we’re already zoomed in on this state
          const [[x0, y0], [x1, y1]] = path.bounds(d); // Get bounding box of the selected state
          const dx = x1 - x0;
          const dy = y1 - y0;
          const x = (x0 + x1) / 2;
          const y = (y0 + y1) / 2;
          const scale = Math.max(
            1,
            Math.min(8, 0.9 / Math.max(dx / width, dy / height)),
          );
          const translate = [width / 2 - scale * x, height / 2 - scale * y];

          svg
            .transition()
            .duration(750)
            .call(
              zoom.transform,
              d3.zoomIdentity
                .translate(translate[0], translate[1])
                .scale(scale),
            );
        });

      /* -----------------------------------------------------
      *  State labels — centered, rotated to follow local latitude
      ----------------------------------------------------- */
      stateData.features.forEach((d) => {
        const centroid = d3.geoCentroid(d);
        if (!centroid) return;
        const pos = projection(centroid);
        if (!pos) return;

        const [lon, lat] = centroid;
        // Sample two nearby projected points along the same latitude to get the
        // local slope of a parallel, then rotate the label to match.
        const p1 = projection([lon - 2, lat]);
        const p2 = projection([lon + 2, lat]);
        let angle = 0;
        if (p1 && p2) {
          angle = (Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * 180) / Math.PI;
        }

        g.append("text")
          .attr("class", "state-label")
          .attr("x", pos[0])
          .attr("y", pos[1])
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("transform", `rotate(${angle}, ${pos[0]}, ${pos[1]})`)
          .attr("fill", "gray")
          .attr("stroke", "none")
          .attr("font-size", 20)
          .attr("font-weight", "400")
          .attr("letter-spacing", "3px")
          .attr("pointer-events", "none")
          .text(d.properties.name.toUpperCase());
      });

      /* -----------------------------------------------------
      *  Plotting Garmin Data
      ----------------------------------------------------- */

      const validPoints = inReachData.features.filter(
        (d) =>
          d.geometry?.type === "Point" &&
          Array.isArray(d.geometry.coordinates) &&
          d.geometry.coordinates.length === 2 &&
          projection(d.geometry.coordinates),
      );

      const campSites = [];
      const messageSites = [];

      validPoints.forEach((d) => {
        if (checkForCampsite(d) === true) {
          campSites.push(d);
        } else {
          messageSites.push(d);
        }
      });

      g.selectAll(".messagePoints")
        .data(messageSites)
        .enter()
        .append("path")
        .attr("class", "messagePoints")
        .attr("d", square)
        .attr("transform", (d) => {
          const [x, y] = projection(d.geometry.coordinates);
          return `translate(${x}, ${y})`;
        })
        .attr("fill", colors.messages)
        .attr("stroke", colors.messagesDark)
        .attr("stroke-width", 1.5)
        .attr("vector-effect", "non-scaling-stroke")
        .on("mouseover", function (event, d) {
          showMessagePanel(event, d, currentUserRef.current);
        })
        .on("mousemove", moveMessagePanel)
        .on("mouseout", hideMessagePanel);

      g.selectAll(".campPoints")
        .data(campSites)
        .enter()
        .append("path")
        .attr("class", "campPoints")
        .attr("d", triangle)
        .attr("transform", (d) => {
          const [x, y] = projection(d.geometry.coordinates);
          return `translate(${x}, ${y})`;
        })
        .attr("fill", colors.campSitesLight)
        .attr("stroke", colors.campSites)
        .attr("stroke-width", 1.5)
        .attr("vector-effect", "non-scaling-stroke")
        .on("mouseover", function (event, d) {
          showMessagePanel(event, d, currentUserRef.current);
        })
        .on("mousemove", moveMessagePanel)
        .on("mouseout", hideMessagePanel);

      /* -----------------------------------------------------
      *  Take the cleaned photo geojson data and plot it
      ----------------------------------------------------- */

      const validPhotoPoints = photoData.features.filter(
        (d) =>
          d.geometry?.type === "Photo" &&
          Array.isArray(d.geometry.coordinates) &&
          d.geometry.coordinates.length === 2 &&
          projection(d.geometry.coordinates),
      );

      // Visible photo dots – pointer events handled by hit areas below
      g.selectAll(".photoPoints")
        .data(validPhotoPoints)
        .enter()
        .append("circle")
        .attr("class", "photoPoints")
        .attr("cx", (d) => projection(d.geometry.coordinates)[0])
        .attr("cy", (d) => projection(d.geometry.coordinates)[1])
        .attr("r", 6)
        .attr("fill", colors.photos)
        .attr("stroke", colors.photosDark)
        .attr("stroke-width", 1.5)
        .attr("vector-effect", "non-scaling-stroke")
        .attr("pointer-events", "none");

      // Show photo panel on the left half of the screen on hover
      function showPhotoPanel(d) {
        const t = currentTransformRef.current ?? d3.zoomIdentity;
        const [hx, hy] = projection(d.geometry.coordinates);
        const [hsx, hsy] = t.apply([hx, hy]);

        const nearby = validPhotoPoints.filter((f) => {
          const [fx, fy] = projection(f.geometry.coordinates);
          const [fsx, fsy] = t.apply([fx, fy]);
          const dx = fsx - hsx;
          const dy = fsy - hsy;
          return Math.sqrt(dx * dx + dy * dy) <= 14;
        });

        const parseDateTime = (dateTime) => {
          const normalized = dateTime.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3");
          return new Date(normalized);
        };

        const firstDate = parseDateTime(nearby[0].properties.dateTime);
        const dateStr = firstDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const photos = nearby.map((f) => {
          const dt = parseDateTime(f.properties.dateTime);
          return {
            path: f.properties.path,
            timeStr: dt.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }),
          };
        });

        setPhotoPanelRef.current({ photos, dateStr });
      }

      // Transparent larger hit areas on top for easier interaction
      g.selectAll(".photoHitAreas")
        .data(validPhotoPoints)
        .enter()
        .append("circle")
        .attr("class", "photoHitAreas")
        .attr("cx", (d) => projection(d.geometry.coordinates)[0])
        .attr("cy", (d) => projection(d.geometry.coordinates)[1])
        .attr("r", 14)
        .attr("fill", "transparent")
        .attr("stroke", "none")
        .on("mouseover", function (_event, d) {
          clearTimeout(photoPanelTimeoutRef.current);
          showPhotoPanel(d);
        })
        .on("mouseout", function () {
          photoPanelTimeoutRef.current = setTimeout(() => {
            setPhotoPanelRef.current(null);
          }, 3000);
        });

      /* -----------------------------------------------------
      *  Track mapping functionality (rendered last = on top)
      ----------------------------------------------------- */

      g.selectAll(".trail")
        .data(
          trackData.features.filter(
            (d) =>
              Array.isArray(d.geometry?.coordinates) &&
              d.geometry.coordinates.length > 0,
          ),
        )
        .enter()
        .append("path")
        .attr("class", "trail")
        .attr("d", d3.geoPath().projection(projection))
        .attr("fill", "none")
        .attr("stroke", (d) => getAlternatingColor(d.properties))
        .attr("stroke-width", 2)
        .attr("vector-effect", "non-scaling-stroke")
        .attr("pointer-events", "none");

      // Transparent wide hit areas on top for easier hover detection
      const trailData = trackData.features.filter(
        (d) =>
          Array.isArray(d.geometry?.coordinates) &&
          d.geometry.coordinates.length > 0,
      );

      g.selectAll(".trail-hit")
        .data(trailData)
        .enter()
        .append("path")
        .attr("class", "trail-hit")
        .attr("d", d3.geoPath().projection(projection))
        .attr("fill", "none")
        .attr("stroke", "transparent")
        .attr("stroke-width", 12)
        .attr("vector-effect", "non-scaling-stroke")
        .on("mouseover", function (event, d) {
          if ((currentTransformRef.current?.k ?? 0) <= 20) return;
          const raw = d.properties.date;
          const dateStr = raw
            ? new Date(raw + "T00:00:00").toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })
            : null;
          const desc = d.properties.description || "";
          const tooltip = document.getElementById("tooltip");
          tooltip.innerHTML = dateStr
            ? `<p style="font-weight:600">${dateStr}</p><p style="font-weight:400;opacity:0.85">${desc}</p>`
            : `<p style="font-weight:600">${desc}</p>`;
          tooltip.style.left = event.pageX + 15 + "px";
          tooltip.style.top = event.pageY - 50 + "px";
          tooltip.classList.remove("invisible", "opacity-0");
          tooltip.classList.add("visible", "opacity-100");
        })
        .on("mousemove", handleMouseMove)
        .on("mouseout", handleMouseOut)
        .on("click", function (_event, d) {
          const entryId = d.properties.entry_id;
          if (!entryId) return;
          handleMouseOut();
          routerRef.current.push(`/journal/${entryId}`);
        })
        .style("cursor", (d) => d.properties.entry_id ? "pointer" : "default");

      /* -----------------------------------------------------
      /* -----------------------------------------------------
      *  City labels (rendered last so they float above state lines)
      ----------------------------------------------------- */

      // City label overlay is appended to svg (not g) so it is not affected by
      // the zoom transform — positions are updated manually on every zoom tick.
      const cityLabelsGroup = svg.append("g").attr("class", "city_label_layer");

      cityLabelsGroup
        .selectAll("line")
        .data(cities)
        .enter()
        .append("line")
        .attr("class", "city_lines")
        .attr("display", "none")
        .attr("data-dot-x", (d) => projection([d.lon, d.lat])[0])
        .attr("data-dot-y", (d) => projection([d.lon, d.lat])[1])
        .attr("data-label-x", (d) => projection([d.lon, d.lat])[0] + d.dx)
        .attr("data-label-y", (d) => projection([d.lon, d.lat])[1] + d.dy)
        .attr("x1", (d) => projection([d.lon, d.lat])[0])
        .attr("y1", (d) => projection([d.lon, d.lat])[1])
        .attr("x2", (d) => projection([d.lon, d.lat])[0] + d.dx)
        .attr("y2", (d) => projection([d.lon, d.lat])[1] + d.dy)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("vector-effect", "non-scaling-stroke");

      cityLabelsGroup
        .selectAll("text")
        .data(cities)
        .enter()
        .append("text")
        .attr("class", "city_labels")
        .attr("display", "none")
        .attr("data-dot-x", (d) => projection([d.lon, d.lat])[0])
        .attr("data-dot-y", (d) => projection([d.lon, d.lat])[1])
        .attr("data-bx", (d) => projection([d.lon, d.lat])[0] + d.dx)
        .attr("data-by", (d) => projection([d.lon, d.lat])[1] + d.dy)
        .attr("x", (d) => projection([d.lon, d.lat])[0] + d.dx)
        .attr("y", (d) => projection([d.lon, d.lat])[1] + d.dy)
        .text((d) => d.name)
        .attr("font-size", 12)
        .attr("font-weight", "600")
        .attr("text-anchor", (d) => (d.dx <= 0 ? "end" : "start"))
        .attr("dominant-baseline", "middle")
        .attr("fill", colors.black)
        .attr("stroke", "white")
        .attr("stroke-width", 3)
        .attr("stroke-linejoin", "round")
        .attr("paint-order", "stroke");
    });

    /* -----------------------------------------------------
    *  City symbols (appended at original z-order, under fetched data)
    ----------------------------------------------------- */

    const cityGroup = g.append("g").attr("class", "cities");

    cityGroup
      .selectAll(".cityPoints")
      .data(cities)
      .enter()
      .append("path")
      .attr("class", "cityPoints")
      .attr("d", cross)
      .attr("transform", (d) => {
        const [x, y] = projection([d.lon, d.lat]);
        return `translate(${x}, ${y})`;
      })
      .attr("fill", colors.black)
      .attr("stroke", "none");

    /* -----------------------------------------------------
 *  Legend
 ----------------------------------------------------- */

    // g.append("path")
    //   .attr("d", square)
    //   .attr("transform", "translate(100,430)")
    //   .style("fill", colors.messages)
    //   .style("stroke", "none");
    // g.append("path")
    //   .attr("d", triangle)
    //   .attr("transform", "translate(100,460)")
    //   .style("fill", colors.campSites)
    //   .style("stroke", "none");
    // g.append("circle")
    //   .attr("cx", 100)
    //   .attr("cy", 490)
    //   .attr("r", 6)
    //   .style("fill", colors.photos)
    //   .style("stroke", "none");

    // g.append("path")
    //   .attr("d", cross)
    //   .attr("transform", "translate(100,520)")
    //   .style("fill", "black")
    //   .style("stroke", "none");

    // g.append("line")
    //   .attr("x1", 90)
    //   .attr("x2", 110)
    //   .attr("y1", 550)
    //   .attr("y2", 550)
    //   .attr("stroke", colors.evenDays) // Set the line color
    //   .attr("stroke-width", 3); // Set the line width
    // g.append("line")
    //   .attr("x1", 90)
    //   .attr("x2", 110)
    //   .attr("y1", 580)
    //   .attr("y2", 580)
    //   .attr("stroke", colors.oddDays) // Set the line color
    //   .attr("stroke-width", 3); // Set the line width

    // g.append("text")
    //   .attr("x", 120)
    //   .attr("y", 430)
    //   .text("Garmin Message Sent")
    //   .style("font-size", "15px")
    //   .attr("alignment-baseline", "middle");
    // g.append("text")
    //   .attr("x", 120)
    //   .attr("y", 460)
    //   .text("Campsite Location")
    //   .style("font-size", "15px")
    //   .attr("alignment-baseline", "middle");
    // g.append("text")
    //   .attr("x", 120)
    //   .attr("y", 490)
    //   .text("Photo Location")
    //   .style("font-size", "15px")
    //   .attr("alignment-baseline", "middle");
    // g.append("text")
    //   .attr("x", 120)
    //   .attr("y", 520)
    //   .text("Resupply Stops")
    //   .style("font-size", "15px")
    //   .attr("alignment-baseline", "middle");
    // g.append("text")
    //   .attr("x", 120)
    //   .attr("y", 550)
    //   .text("Even days")
    //   .style("font-size", "15px")
    //   .attr("alignment-baseline", "middle");
    // g.append("text")
    //   .attr("x", 120)
    //   .attr("y", 580)
    //   .text("Odd days")
    //   .style("font-size", "15px")
    //   .attr("alignment-baseline", "middle");
  }, [path, projection]);

  const LAYERS = [
    { key: "photos",    label: "Photos",    fill: colors.photos,        stroke: colors.photosDark,    shape: "circle" },
    { key: "campsites", label: "Campsites", fill: colors.campSitesLight, stroke: colors.campSites,     shape: "triangle" },
    { key: "messages",  label: "Messages",  fill: colors.messages,       stroke: colors.messagesDark,  shape: "square" },
  ];

  const STATIC_LAYERS = [
    { label: "Resupply Stops", color: colors.black, shape: "cross" },
    { label: "Trail", color: colors.evenDays, shape: "line" },
  ];

  const LegendSymbol = ({ shape, fill, stroke, color }) => {
    const size = 14;
    const mid = size / 2;
    const f = fill ?? color;
    const s = stroke ?? "none";
    switch (shape) {
      case "circle":
        return (
          <svg width={size} height={size} style={{ flexShrink: 0 }}>
            <circle cx={mid} cy={mid} r={4.5} fill={f} stroke={s} strokeWidth={1.5} />
          </svg>
        );
      case "square":
        return (
          <svg width={size} height={size} style={{ flexShrink: 0 }}>
            <rect x={2} y={2} width={10} height={10} fill={f} stroke={s} strokeWidth={1.5} />
          </svg>
        );
      case "triangle":
        return (
          <svg width={size} height={size} style={{ flexShrink: 0 }}>
            <polygon
              points={`${mid},2 ${size - 1},${size - 2} 1,${size - 2}`}
              fill={f}
              stroke={s}
              strokeWidth={1.5}
            />
          </svg>
        );
      case "cross":
        return (
          <svg width={size} height={size} style={{ flexShrink: 0 }}>
            <line
              x1={mid}
              y1={1}
              x2={mid}
              y2={size - 1}
              stroke={color}
              strokeWidth={2}
            />
            <line
              x1={1}
              y1={mid}
              x2={size - 1}
              y2={mid}
              stroke={color}
              strokeWidth={2}
            />
          </svg>
        );
      case "line":
        return (
          <svg width={size} height={size} style={{ flexShrink: 0 }}>
            <line
              x1={0}
              y1={mid}
              x2={size}
              y2={mid}
              stroke={color}
              strokeWidth={2.5}
            />
          </svg>
        );
      case "text":
        return (
          <svg width={size} height={size} style={{ flexShrink: 0 }}>
            <text
              x={mid}
              y={mid + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={color}
              fontSize={8}
              fontWeight="600"
              letterSpacing="1"
            >
              AB
            </text>
          </svg>
        );
      default:
        return (
          <span
            style={{
              display: "inline-block",
              width: size,
              height: size,
              background: color,
              flexShrink: 0,
            }}
          />
        );
    }
  };

  return (
    <div className="flex w-full">
      {/* Photo panel — left half when a photo dot is hovered */}
      {photoPanel && (
        <div className="w-1/2 bg-black flex flex-col items-center justify-center gap-4 p-6 overflow-y-auto" style={{ minHeight: "600px" }}>
          <p className="text-white/60 text-sm font-medium">{photoPanel.dateStr}</p>
          <div className="flex flex-col items-center gap-6 w-full">
            {photoPanel.photos.map((p, i) => (
              <div key={i} className="text-center">
                <img
                  src={p.path}
                  alt="Trail photo"
                  className="max-w-full object-contain rounded"
                  style={{ maxHeight: "75vh" }}
                />
                {photoPanel.photos.length > 1 && (
                  <p className="text-white/40 text-xs mt-1">{p.timeStr}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Map panel */}
      <div className={`relative ${photoPanel ? "w-1/2" : "w-full"}`}>
        {/* Layer toggle panel */}
        <div
          className={`absolute top-100 left-3 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-md p-3 text-xs ${notoSans.className}`}
        >
        <p className="font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Legend
        </p>
        <div className="space-y-1.5">
          {LAYERS.map(({ key, label, fill, stroke, shape }) => (
            <label
              key={key}
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                className="toggle toggle-xs"
                checked={visibility[key]}
                onChange={() =>
                  setVisibility((v) => ({ ...v, [key]: !v[key] }))
                }
              />
              <LegendSymbol shape={shape} fill={fill} stroke={stroke} />
              <span className="text-gray-700 dark:text-gray-300">{label}</span>
            </label>
          ))}
          {STATIC_LAYERS.map(({ label, color, shape }) => (
            <div
              key={label}
              className="flex items-center gap-2 select-none"
              style={{ paddingLeft: "36px" }}
            >
              <LegendSymbol shape={shape} color={color} />
              <span className="text-gray-700 dark:text-gray-300">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <svg ref={ref}></svg>
      <div
        id="message-panel"
        style={{
          display: "none",
          position: "fixed",
          zIndex: 50,
          backgroundColor: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          padding: "12px 16px",
          fontSize: "14px",
          color: "#4b5563",
          maxWidth: "320px",
          pointerEvents: "none",
          lineHeight: "1.6",
        }}
      />
      </div>{/* end map panel */}
    </div>
  );
}
