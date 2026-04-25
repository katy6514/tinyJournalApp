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

  const [visibility, setVisibility] = useState({
    photos: true,
    campsites: true,
    messages: true,
    cities: true,
    trail: true,
    stateLabels: true,
  });
  const visibilityRef = useRef(visibility);
  visibilityRef.current = visibility;

  const [clusterPanel, setClusterPanel] = useState(null);
  const clusterPanelRef = useRef(clusterPanel);
  clusterPanelRef.current = clusterPanel;
  const zoomRef = useRef(null);

  const [activeItem, setActiveItem] = useState(null);
  const activeItemRef = useRef(activeItem);
  activeItemRef.current = activeItem;
  const updateConnectorLineRef = useRef(() => {});

  // Sync visibility state → D3 element display whenever toggles change
  useEffect(() => {
    const g = gRef.current;
    if (!g) return;
    const photoDisplay = visibility.photos ? null : "none";
    g.selectAll(
      ".photoPoints, .photoHitAreas, .photoCluster, .photoClusterHit, .photoClusterLabel",
    ).attr("display", photoDisplay);
    g.selectAll(
      ".campPoints, .campCluster, .campClusterHit, .campClusterLabel",
    ).attr("display", visibility.campsites ? null : "none");
    g.selectAll(
      ".messagePoints, .msgCluster, .msgClusterHit, .msgClusterLabel",
    ).attr("display", visibility.messages ? null : "none");
    g.selectAll(".cities").attr("display", visibility.cities ? null : "none");
    d3.select(ref.current)
      .selectAll(".city_label_layer")
      .attr("display", visibility.cities ? null : "none");
    g.selectAll(".trail").attr("display", visibility.trail ? null : "none");
    g.selectAll(".state-label").attr(
      "display",
      visibility.stateLabels ? null : "none",
    );
  }, [visibility]);

  // When a cluster panel opens, zoom the map to fit all its points and set first active item.
  // When it closes, clear the active item.
  useEffect(() => {
    if (!clusterPanel) {
      setActiveItem(null);
      return;
    }
    if (!zoomRef.current || !ref.current) return;

    // Set first item (chronological) as the active item shown on the left
    const getTime = (item) =>
      clusterPanel.type === "photo"
        ? new Date(item.properties.dateTime.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3"))
        : parseGPSTime(item.properties.GPSTime);
    const first = clusterPanel.items.slice().sort((a, b) => getTime(a) - getTime(b))[0];
    setActiveItem(first);

    // Hide data points for the duration of the zoom transition — their sizes
    // are fixed in projection space and balloon visually as the transform scales
    // up. The zoom "end" handler re-renders them at the correct size.
    if (gRef.current) {
      gRef.current.selectAll(
        ".photoPoints, .photoHitAreas, .photoCluster, .photoClusterHit, .photoClusterLabel," +
        ".messagePoints, .msgCluster, .msgClusterHit, .msgClusterLabel," +
        ".campPoints, .campCluster, .campClusterHit, .campClusterLabel"
      ).attr("display", "none");
    }

    const xs = clusterPanel.projPoints.map((p) => p[0]);
    const ys = clusterPanel.projPoints.map((p) => p[1]);
    const minX = Math.min(...xs),
      maxX = Math.max(...xs);
    const minY = Math.min(...ys),
      maxY = Math.max(...ys);
    const PADDING = 80;
    // The overlay panel covers the left half of the SVG viewBox.
    // Fit the cluster into the visible right half and center it there.
    const visibleLeft = width / 2;
    const visibleWidth = width / 2;
    const scale = Math.min(
      (visibleWidth - 2 * PADDING) / Math.max(maxX - minX, 10),
      (height - 2 * PADDING) / Math.max(maxY - minY, 10),
      200,
    );
    const visibleCenterX = visibleLeft + visibleWidth / 2; // 675
    const tx = visibleCenterX - (scale * (minX + maxX)) / 2;
    const ty = height / 2 - (scale * (minY + maxY)) / 2;
    d3.select(ref.current)
      .transition()
      .duration(1200)
      .ease(d3.easeCubicInOut)
      .call(
        zoomRef.current.transform,
        d3.zoomIdentity.translate(tx, ty).scale(scale),
      );
  }, [clusterPanel]);

  // Keep connector line in sync whenever activeItem changes
  useEffect(() => {
    updateConnectorLineRef.current();
  }, [activeItem]);

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

    // Placeholders — assigned inside Promise.all so zoom "end" can call them
    let renderMessageClusters = () => {};
    let renderPhotoClusters = () => {};
    let renderCampClusters = () => {};

    // Add zoom behavior
    const zoom = d3
      .zoom()
      .scaleExtent([1, 500])
      .filter(function (event) {
        // Don't let zoom intercept drag gestures on interactive data elements —
        // otherwise D3 zoom suppresses the subsequent click event via a
        // capture-phase handler it registers after any pointer movement.
        const cls = event.target?.classList;
        if (
          cls?.contains("photoClusterHit") ||
          cls?.contains("msgClusterHit") ||
          cls?.contains("campClusterHit") ||
          cls?.contains("photoHitAreas")
        ) {
          return false;
        }
        return (!event.ctrlKey || event.type === "wheel") && !event.button;
      })
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        currentTransformRef.current = event.transform;

        // Reposition city labels/lines and show only those whose dot is in the viewport
        const t = event.transform;
        const MARGIN = 10;
        const showLabels = t.k > 2.35;

        g.selectAll(".trail, .trail-hit").attr(
          "display",
          showLabels ? null : "none",
        );

        svg.selectAll(".city_labels").each(function () {
          const el = d3.select(this);
          const [dotSx, dotSy] = t.apply([
            +el.attr("data-dot-x"),
            +el.attr("data-dot-y"),
          ]);
          const inViewport =
            dotSx >= 0 && dotSx <= width && dotSy >= 0 && dotSy <= height;
          if (showLabels && inViewport) {
            const [sx, sy] = t.apply([
              +el.attr("data-bx"),
              +el.attr("data-by"),
            ]);
            el.attr("x", Math.max(MARGIN, Math.min(width - MARGIN, sx)))
              .attr("y", Math.max(MARGIN, Math.min(height - MARGIN, sy)))
              .attr("display", null);
          } else {
            el.attr("display", "none");
          }
        });

        svg.selectAll(".city_lines").each(function () {
          const el = d3.select(this);
          const [x1, y1] = t.apply([
            +el.attr("data-dot-x"),
            +el.attr("data-dot-y"),
          ]);
          const inViewport = x1 >= 0 && x1 <= width && y1 >= 0 && y1 <= height;
          if (showLabels && inViewport) {
            const [lx, ly] = t.apply([
              +el.attr("data-label-x"),
              +el.attr("data-label-y"),
            ]);
            el.attr("x1", x1)
              .attr("y1", y1)
              .attr("x2", Math.max(MARGIN, Math.min(width - MARGIN, lx)))
              .attr("y2", Math.max(MARGIN, Math.min(height - MARGIN, ly)))
              .attr("display", null);
          } else {
            el.attr("display", "none");
          }
        });

        updateConnectorLineRef.current();
      })

      .on("end", (event) => {
        // console.log("Zoom level:", event.transform.k);
        const newSize = 128 / (event.transform.k * event.transform.k);
        renderPhotoClusters(event.transform);
        renderMessageClusters(event.transform);
        renderCampClusters(event.transform);
        g.selectAll(".cityPoints").attr("d", cross.size(newSize));
        g.selectAll(".state-label").attr("font-size", 20 / event.transform.k);
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    // Connector line: lives on svg (not g) so it isn't affected by the zoom
    // transform on g — its coordinates are always in SVG viewBox space.
    const connectorLine = svg
      .append("line")
      .attr("class", "connector-line")
      .attr("stroke", "#9ca3af")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "5,4")
      .attr("pointer-events", "none")
      .attr("display", "none");

    function updateConnectorLine(item) {
      const activeI = item !== undefined ? item : activeItemRef.current;
      if (!activeI || !clusterPanelRef.current) {
        connectorLine.attr("display", "none");
        return;
      }
      const coords = activeI.geometry.coordinates;
      const projected = projection(coords);
      if (!projected) { connectorLine.attr("display", "none"); return; }
      const t = currentTransformRef.current ?? d3.zoomIdentity;
      const [sx, sy] = t.apply(projected);
      if (sx < 0 || sx > width || sy < 0 || sy > height) {
        connectorLine.attr("display", "none");
        return;
      }
      connectorLine
        .attr("display", null)
        .attr("x1", sx).attr("y1", sy)
        .attr("x2", 0).attr("y2", sy);
    }
    updateConnectorLineRef.current = updateConnectorLine;

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

      renderMessageClusters = function (transform) {
        const k = transform.k;
        const CLUSTER_RADIUS = 20;

        g.selectAll(
          ".messagePoints, .msgCluster, .msgClusterHit, .msgClusterLabel",
        ).remove();

        const positions = messageSites.map((p) => {
          const [px, py] = projection(p.geometry.coordinates);
          const [sx, sy] = transform.apply([px, py]);
          return { px, py, sx, sy };
        });

        const assigned = new Set();
        const solos = [];
        const groups = [];

        for (let i = 0; i < messageSites.length; i++) {
          if (assigned.has(i)) continue;
          const members = [i];
          assigned.add(i);
          for (let j = i + 1; j < messageSites.length; j++) {
            if (assigned.has(j)) continue;
            const dx = positions[j].sx - positions[i].sx;
            const dy = positions[j].sy - positions[i].sy;
            if (Math.sqrt(dx * dx + dy * dy) <= CLUSTER_RADIUS) {
              members.push(j);
              assigned.add(j);
            }
          }
          if (members.length === 1) {
            solos.push(messageSites[members[0]]);
          } else {
            const cx =
              members.reduce((s, i) => s + positions[i].px, 0) / members.length;
            const cy =
              members.reduce((s, i) => s + positions[i].py, 0) / members.length;
            groups.push({
              points: members.map((i) => messageSites[i]),
              cx,
              cy,
              count: members.length,
            });
          }
        }

        const newSize = 128 / (k * k);

        g.selectAll(".messagePoints")
          .data(solos)
          .enter()
          .append("path")
          .attr("class", "messagePoints")
          .attr("d", square.size(newSize))
          .attr("transform", (d) => {
            const [x, y] = projection(d.geometry.coordinates);
            return `translate(${x}, ${y})`;
          })
          .attr("fill", colors.messages)
          .attr("stroke", colors.messagesDark)
          .attr("stroke-width", 1.5)
          .attr("vector-effect", "non-scaling-stroke")
          .on("mouseover", function (event, d) {
            if (clusterPanelRef.current?.type === "message") {
              setActiveItem(d);
              updateConnectorLine(d);
            } else {
              showMessagePanel(event, d, currentUserRef.current);
            }
          })
          .on("mousemove", moveMessagePanel)
          .on("mouseout", hideMessagePanel);

        g.selectAll(".msgCluster")
          .data(groups)
          .enter()
          .append("path")
          .attr("class", "msgCluster")
          .attr("d", (d) => {
            const r = (6 + Math.log(d.count + 1) * 4) / k;
            return square.size(r * r * 2)();
          })
          .attr("transform", (d) => `translate(${d.cx}, ${d.cy})`)
          .attr("fill", colors.messages)
          .attr("stroke", colors.messagesDark)
          .attr("stroke-width", 1.5)
          .attr("vector-effect", "non-scaling-stroke")
          .attr("pointer-events", "none");

        g.selectAll(".msgClusterHit")
          .data(groups)
          .enter()
          .append("path")
          .attr("class", "msgClusterHit")
          .attr("d", (d) => {
            const r = (6 + Math.log(d.count + 1) * 4) / k;
            return square.size(r * r * 2)();
          })
          .attr("transform", (d) => `translate(${d.cx}, ${d.cy})`)
          .attr("fill", "transparent")
          .attr("stroke", "none")
          .attr("pointer-events", "all")
          .style("cursor", "pointer")
          .on("mouseover", function (_event, d) {
            const tooltip = document.getElementById("tooltip");
            tooltip.classList.remove("invisible", "opacity-0");
            tooltip.classList.add("visible", "opacity-100");
            tooltip.innerHTML = `<p style="font-weight:600">${d.count} messages</p>`;
          })
          .on("mousemove", handleMouseMove)
          .on("mouseout", handleMouseOut)
          .on("click", function (event, d) {
            event.stopPropagation();
            handleMouseOut();
            setClusterPanel({
              type: "message",
              items: d.points,
              projPoints: d.points.map((p) =>
                projection(p.geometry.coordinates),
              ),
            });
          });

        g.selectAll(".msgClusterLabel")
          .data(groups)
          .enter()
          .append("text")
          .attr("class", "msgClusterLabel")
          .attr("x", (d) => d.cx)
          .attr("y", (d) => d.cy)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("font-size", 8 / k)
          .attr("fill", "white")
          .attr("stroke", "none")
          .attr("pointer-events", "none")
          .text((d) => d.count);

        if (!visibilityRef.current.messages) {
          g.selectAll(
            ".messagePoints, .msgCluster, .msgClusterHit, .msgClusterLabel",
          ).attr("display", "none");
        }
      };

      // initial call deferred — rendered in order below alongside photos and campsites

      renderCampClusters = function (transform) {
        const k = transform.k;
        const CLUSTER_RADIUS = 20;

        g.selectAll(
          ".campPoints, .campCluster, .campClusterHit, .campClusterLabel",
        ).remove();

        const positions = campSites.map((p) => {
          const [px, py] = projection(p.geometry.coordinates);
          const [sx, sy] = transform.apply([px, py]);
          return { px, py, sx, sy };
        });

        const assigned = new Set();
        const solos = [];
        const groups = [];

        for (let i = 0; i < campSites.length; i++) {
          if (assigned.has(i)) continue;
          const members = [i];
          assigned.add(i);
          for (let j = i + 1; j < campSites.length; j++) {
            if (assigned.has(j)) continue;
            const dx = positions[j].sx - positions[i].sx;
            const dy = positions[j].sy - positions[i].sy;
            if (Math.sqrt(dx * dx + dy * dy) <= CLUSTER_RADIUS) {
              members.push(j);
              assigned.add(j);
            }
          }
          if (members.length === 1) {
            solos.push(campSites[members[0]]);
          } else {
            const cx =
              members.reduce((s, i) => s + positions[i].px, 0) / members.length;
            const cy =
              members.reduce((s, i) => s + positions[i].py, 0) / members.length;
            groups.push({
              points: members.map((i) => campSites[i]),
              cx,
              cy,
              count: members.length,
            });
          }
        }

        const newSize = 128 / (k * k);

        g.selectAll(".campPoints")
          .data(solos)
          .enter()
          .append("path")
          .attr("class", "campPoints")
          .attr("d", triangle.size(newSize))
          .attr("transform", (d) => {
            const [x, y] = projection(d.geometry.coordinates);
            return `translate(${x}, ${y})`;
          })
          .attr("fill", colors.campSitesLight)
          .attr("stroke", colors.campSites)
          .attr("stroke-width", 1.5)
          .attr("vector-effect", "non-scaling-stroke")
          .on("mouseover", function (event, d) {
            if (clusterPanelRef.current?.type === "campsite") {
              setActiveItem(d);
              updateConnectorLine(d);
            } else {
              showMessagePanel(event, d, currentUserRef.current);
            }
          })
          .on("mousemove", moveMessagePanel)
          .on("mouseout", hideMessagePanel);

        g.selectAll(".campCluster")
          .data(groups)
          .enter()
          .append("path")
          .attr("class", "campCluster")
          .attr("d", (d) => {
            const r = (6 + Math.log(d.count + 1) * 4) / k;
            return triangle.size(r * r * 2)();
          })
          .attr("transform", (d) => `translate(${d.cx}, ${d.cy})`)
          .attr("fill", colors.campSitesLight)
          .attr("stroke", colors.campSites)
          .attr("stroke-width", 1.5)
          .attr("vector-effect", "non-scaling-stroke")
          .attr("pointer-events", "none");

        g.selectAll(".campClusterHit")
          .data(groups)
          .enter()
          .append("path")
          .attr("class", "campClusterHit")
          .attr("d", (d) => {
            const r = (6 + Math.log(d.count + 1) * 4) / k;
            return triangle.size(r * r * 2)();
          })
          .attr("transform", (d) => `translate(${d.cx}, ${d.cy})`)
          .attr("fill", "transparent")
          .attr("stroke", "none")
          .attr("pointer-events", "all")
          .style("cursor", "pointer")
          .on("mouseover", function (_event, d) {
            const tooltip = document.getElementById("tooltip");
            tooltip.classList.remove("invisible", "opacity-0");
            tooltip.classList.add("visible", "opacity-100");
            tooltip.innerHTML = `<p style="font-weight:600">${d.count} campsites</p>`;
          })
          .on("mousemove", handleMouseMove)
          .on("mouseout", handleMouseOut)
          .on("click", function (event, d) {
            event.stopPropagation();
            handleMouseOut();
            setClusterPanel({
              type: "campsite",
              items: d.points,
              projPoints: d.points.map((p) =>
                projection(p.geometry.coordinates),
              ),
            });
          });

        g.selectAll(".campClusterLabel")
          .data(groups)
          .enter()
          .append("text")
          .attr("class", "campClusterLabel")
          .attr("x", (d) => d.cx)
          .attr("y", (d) => d.cy)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("font-size", 8 / k)
          .attr("fill", "white")
          .attr("stroke", "none")
          .attr("pointer-events", "none")
          .text((d) => d.count);

        if (!visibilityRef.current.campsites) {
          g.selectAll(
            ".campPoints, .campCluster, .campClusterHit, .campClusterLabel",
          ).attr("display", "none");
        }
      };

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

      /* -----------------------------------------------------
      *  Photo points — clustered by zoom level
      ----------------------------------------------------- */

      function showPhotoTooltip(d) {
        const { path: photoPath, dateTime } = d.properties;
        const normalized = dateTime.replace(
          /^(\d{4}):(\d{2}):(\d{2})/,
          "$1-$2-$3",
        );
        const photoDate = new Date(normalized);
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
        const tooltip = document.getElementById("tooltip");
        tooltip.classList.remove("invisible", "opacity-0");
        tooltip.classList.add("visible", "opacity-100");
        tooltip.innerHTML = `<img src="${photoPath}" width="200" style="display:block;border-radius:4px"><p style="margin-top:6px"><strong>${dateStr}</strong></p><p>${timeStr}</p>`;
      }

      function showClusterTooltip(_event, d) {
        const { path: photoPath, dateTime } = d.points[0].properties;
        const normalized = dateTime.replace(
          /^(\d{4}):(\d{2}):(\d{2})/,
          "$1-$2-$3",
        );
        const dateStr = new Date(normalized).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        const tooltip = document.getElementById("tooltip");
        tooltip.classList.remove("invisible", "opacity-0");
        tooltip.classList.add("visible", "opacity-100");
        tooltip.innerHTML = `<img src="${photoPath}" width="200" style="display:block;border-radius:4px"><p style="margin-top:6px;font-weight:600">${d.count} photos</p><p>${dateStr}</p>`;
      }

      const CLUSTER_RADIUS = 20; // screen pixels — clusters dissolve naturally as zoom increases

      renderPhotoClusters = function (transform) {
        const k = transform.k;

        // Remove previous photo layers entirely and re-render from scratch
        g.selectAll(
          ".photoPoints, .photoHitAreas, .photoCluster, .photoClusterHit, .photoClusterLabel",
        ).remove();

        // Pre-compute both screen-space and projection-space positions
        const positions = validPhotoPoints.map((p) => {
          const [px, py] = projection(p.geometry.coordinates);
          const [sx, sy] = transform.apply([px, py]);
          return { px, py, sx, sy };
        });

        // Greedy single-pass clustering in screen-pixel space
        const assigned = new Set();
        const solos = [];
        const groups = [];

        for (let i = 0; i < validPhotoPoints.length; i++) {
          if (assigned.has(i)) continue;
          const members = [i];
          assigned.add(i);
          for (let j = i + 1; j < validPhotoPoints.length; j++) {
            if (assigned.has(j)) continue;
            const dx = positions[j].sx - positions[i].sx;
            const dy = positions[j].sy - positions[i].sy;
            if (Math.sqrt(dx * dx + dy * dy) <= CLUSTER_RADIUS) {
              members.push(j);
              assigned.add(j);
            }
          }
          if (members.length === 1) {
            solos.push(validPhotoPoints[members[0]]);
          } else {
            // Centroid in projection space so the circle stays stable across zoom
            const cx =
              members.reduce((s, i) => s + positions[i].px, 0) / members.length;
            const cy =
              members.reduce((s, i) => s + positions[i].py, 0) / members.length;
            groups.push({
              points: members.map((i) => validPhotoPoints[i]),
              cx,
              cy,
              count: members.length,
            });
          }
        }

        // Individual dots (pointer events on hit areas)
        g.selectAll(".photoPoints")
          .data(solos)
          .enter()
          .append("circle")
          .attr("class", "photoPoints")
          .attr("cx", (d) => projection(d.geometry.coordinates)[0])
          .attr("cy", (d) => projection(d.geometry.coordinates)[1])
          .attr("r", 6 / k)
          .attr("fill", colors.photos)
          .attr("stroke", colors.photosDark)
          .attr("stroke-width", 1.5)
          .attr("vector-effect", "non-scaling-stroke")
          .attr("pointer-events", "none");

        g.selectAll(".photoHitAreas")
          .data(solos)
          .enter()
          .append("circle")
          .attr("class", "photoHitAreas")
          .attr("cx", (d) => projection(d.geometry.coordinates)[0])
          .attr("cy", (d) => projection(d.geometry.coordinates)[1])
          .attr("r", 14 / k)
          .attr("fill", "transparent")
          .attr("stroke", "none")
          .on("mouseover", function (_event, d) {
            if (clusterPanelRef.current?.type === "photo") {
              setActiveItem(d);
              updateConnectorLine(d);
            } else {
              showPhotoTooltip(d);
            }
          })
          .on("mousemove", handleMouseMove)
          .on("mouseout", handleMouseOut);

        // Cluster circles — radius grows with log of count so large clusters
        // don't dwarf individual dots
        g.selectAll(".photoCluster")
          .data(groups)
          .enter()
          .append("circle")
          .attr("class", "photoCluster")
          .attr("cx", (d) => d.cx)
          .attr("cy", (d) => d.cy)
          .attr("r", (d) => (6 + Math.log(d.count + 1) * 4) / k)
          .attr("fill", colors.photos)
          .attr("stroke", colors.photosDark)
          .attr("stroke-width", 1.5)
          .attr("vector-effect", "non-scaling-stroke")
          .attr("pointer-events", "none");

        g.selectAll(".photoClusterHit")
          .data(groups)
          .enter()
          .append("circle")
          .attr("class", "photoClusterHit")
          .attr("cx", (d) => d.cx)
          .attr("cy", (d) => d.cy)
          .attr("r", (d) => (6 + Math.log(d.count + 1) * 4 + 8) / k)
          .attr("fill", "transparent")
          .attr("stroke", "none")
          .style("cursor", "pointer")
          .on("mouseover", function (event, d) {
            showClusterTooltip(event, d);
          })
          .on("mousemove", handleMouseMove)
          .on("mouseout", handleMouseOut)
          .on("click", function (event, d) {
            event.stopPropagation();
            handleMouseOut();
            setClusterPanel({
              type: "photo",
              items: d.points,
              projPoints: d.points.map((p) =>
                projection(p.geometry.coordinates),
              ),
            });
          });

        g.selectAll(".photoClusterLabel")
          .data(groups)
          .enter()
          .append("text")
          .attr("class", "photoClusterLabel")
          .attr("x", (d) => d.cx)
          .attr("y", (d) => d.cy)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("font-size", 8 / k)
          .attr("fill", "white")
          .attr("stroke", "none")
          .attr("pointer-events", "none")
          .text((d) => d.count);

        // Honour current visibility toggle
        if (!visibilityRef.current.photos) {
          g.selectAll(
            ".photoPoints, .photoHitAreas, .photoCluster, .photoClusterHit, .photoClusterLabel",
          ).attr("display", "none");
        }
      };

      // Initial render order matches zoom-end order: photos → messages → campsites
      renderPhotoClusters(currentTransformRef.current ?? d3.zoomIdentity);
      renderMessageClusters(currentTransformRef.current ?? d3.zoomIdentity);
      renderCampClusters(currentTransformRef.current ?? d3.zoomIdentity);

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
        .attr("pointer-events", "none")
        .attr("display", "none");

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
        .style("cursor", (d) => (d.properties.entry_id ? "pointer" : "default"))
        .attr("display", "none");

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

  }, [path, projection]);

  const LAYERS = [
    {
      key: "photos",
      label: "Photos",
      fill: colors.photos,
      stroke: colors.photosDark,
      shape: "circle",
    },
    {
      key: "campsites",
      label: "Campsites",
      fill: colors.campSitesLight,
      stroke: colors.campSites,
      shape: "triangle",
    },
    {
      key: "messages",
      label: "Messages",
      fill: colors.messages,
      stroke: colors.messagesDark,
      shape: "square",
    },
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
            <circle
              cx={mid}
              cy={mid}
              r={4.5}
              fill={f}
              stroke={s}
              strokeWidth={1.5}
            />
          </svg>
        );
      case "square":
        return (
          <svg width={size} height={size} style={{ flexShrink: 0 }}>
            <rect
              x={2}
              y={2}
              width={10}
              height={10}
              fill={f}
              stroke={s}
              strokeWidth={1.5}
            />
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

  // Render the single active item in the left panel
  const renderAgendaItem = (item) => {
    if (!item || !clusterPanel) return null;
    if (clusterPanel.type === "photo") {
      const { path: photoPath, dateTime } = item.properties;
      const normalized = dateTime.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3");
      const dt = new Date(normalized);
      const dateStr = dt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      const timeStr = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
      return (
        <div className="flex flex-col">
          <img src={photoPath} alt="Trail photo" className="w-full rounded-lg object-cover" />
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-3">{dateStr}</p>
          <p className="text-xs text-gray-500">{timeStr}</p>
        </div>
      );
    }
    const { GPSTime, MessageText, Recipients } = item.properties;
    const dt = parseGPSTime(GPSTime);
    const dateStr = dt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const timeStr = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    const isOwner = currentUserRef.current?.email === "katy6514@gmail.com";
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{dateStr}</p>
        <p className="text-xs text-gray-500">{timeStr}</p>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
          {isOwner ? MessageText : <span className="italic text-gray-400">Message hidden</span>}
        </p>
        {Recipients && <p className="text-xs text-gray-400">To: {Recipients}</p>}
      </div>
    );
  };

  const panelTypeLabel = clusterPanel
    ? clusterPanel.type === "photo"
      ? "Photos"
      : clusterPanel.type === "message"
        ? "Messages"
        : "Campsites"
    : "";

  return (
    <div className="relative w-full">
      {/* SVG always full width — never shrinks when panel opens */}
      <svg ref={ref}></svg>

      {/* Agenda panel — overlays the left half when a cluster is clicked */}
      {clusterPanel && (
        <div
          className={`absolute inset-y-0 left-0 w-1/2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm flex flex-col border-r border-gray-200 dark:border-gray-700 z-10 ${notoSans.className}`}
        >
          <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-800 dark:text-gray-200">
              {clusterPanel.items.length} {panelTypeLabel}
            </h2>
            <button
              onClick={() => setClusterPanel(null)}
              className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl leading-none px-1"
              aria-label="Close panel"
            >
              ×
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            {activeItem
              ? renderAgendaItem(activeItem)
              : <p className="text-sm text-gray-400 italic text-center mt-8">Hover over a point on the map</p>
            }
          </div>
        </div>
      )}

      {/* Legend — top right, above the panel if panel is open */}
      <div
        className={`absolute top-3 right-3 z-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-md p-3 text-xs ${notoSans.className}`}
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
    </div>
  );
}
