"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import * as d3 from "d3";
import { colors } from "@/app/journal/map/constants";
import { checkForCampsite, parseGPSTime } from "@/app/journal/map/utils";
import { notoSans } from "@/app/ui/fonts";

const MAP_WIDTH = 500;
const MAP_HEIGHT = 350;
const PADDING = 40;

export default function EntryMiniMap({ legGeoJSON, date, start, end }) {
  const ref = useRef();
  const tooltipRef = useRef();
  const tooltipImgRef = useRef();
  const msgTooltipRef = useRef();

  const { data: session } = useSession();
  const currentUserRef = useRef(null);
  currentUserRef.current = session?.user ?? null;

  useEffect(() => {
    if (!legGeoJSON?.features?.length) return;

    const svg = d3
      .select(ref.current)
      .attr("viewBox", `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`)
      .attr("width", "100%")
      .attr("font-family", notoSans.style.fontFamily)
      .style("cursor", "grab");

    svg.selectAll("*").remove();

    // All content goes inside this group so zoom transforms it as a unit
    const g = svg.append("g").attr("class", "zoom-layer");

    const projection = d3.geoAlbersUsa().fitExtent(
      [
        [PADDING, PADDING],
        [MAP_WIDTH - PADDING, MAP_HEIGHT - PADDING],
      ],
      legGeoJSON,
    );

    const path = d3.geoPath().projection(projection);

    const square = d3.symbol().type(d3.symbolSquare).size(80);
    const triangle = d3.symbol().type(d3.symbolTriangle).size(80);

    // Zoom: scroll/pinch to zoom, drag to pan, double-click resets
    const zoom = d3
      .zoom()
      .scaleExtent([1, 12])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);
    svg.on("mousedown.cursor", () => svg.style("cursor", "grabbing"));
    svg.on("mouseup.cursor mouseleave.cursor", () =>
      svg.style("cursor", "grab"),
    );
    svg.on("dblclick.zoom", () => {
      svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity);
    });

    function showMsgTooltip(event, d) {
      const panel = msgTooltipRef.current;
      if (!panel) return;
      const msgDate = parseGPSTime(d.properties.GPSTime);
      const dateStr = msgDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      const timeStr = msgDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
      const isOwner = currentUserRef.current?.email === "katy6514@gmail.com";
      const messageText = isOwner ? d.properties.MessageText : "Message hidden";
      panel.innerHTML = `
        <p style="font-weight:600;margin-bottom:6px;">Garmin Message</p>
        <p><strong>Date:</strong> ${dateStr}</p>
        <p><strong>Time:</strong> ${timeStr}</p>
        <p><strong>To:</strong> ${d.properties.Recipients}</p>
        <p style="margin-top:6px;padding-top:6px;border-top:1px solid #e5e7eb;">${messageText}</p>
      `;
      panel.style.display = "block";
      panel.style.left = event.pageX + 15 + "px";
      panel.style.top = event.pageY - 50 + "px";
    }

    function moveMsgTooltip(event) {
      const panel = msgTooltipRef.current;
      if (!panel) return;
      panel.style.left = event.pageX + 15 + "px";
      panel.style.top = event.pageY - 50 + "px";
    }

    function hideMsgTooltip() {
      const panel = msgTooltipRef.current;
      if (panel) panel.style.display = "none";
    }

    Promise.all([
      d3.json("/api/states"),
      d3.json("/data/cdtInreachData_withCoords.geojson"),
      d3.json("/api/photos"),
    ]).then(([stateData, inReachData, photoData]) => {
      // State outlines for context
      g.selectAll(".state")
        .data(stateData.features)
        .enter()
        .append("path")
        .attr("class", "state")
        .attr("fill", "transparent")
        .attr("stroke", "#d1d5db")
        .attr("stroke-width", "1px")
        .attr("d", path);

      // Leg trail
      g.selectAll(".trail")
        .data(legGeoJSON.features)
        .enter()
        .append("path")
        .attr("class", "trail")
        .attr("d", path)
        .attr("fill", "none")
        .attr("stroke", colors.evenDays)
        .attr("stroke-width", 3)
        .attr("vector-effect", "non-scaling-stroke");

      // GPS messages filtered to this date
      const dayPoints = inReachData.features.filter((f) => {
        if (f.geometry?.type !== "Point") return false;
        if (!f.properties?.GPSTime) return false;
        if (!projection(f.geometry.coordinates)) return false;
        // Use local date parts — toISOString() returns UTC, which shifts
        // late-evening messages (e.g. 22:00 MT = 04:00 UTC next day) to the
        // wrong calendar day.
        const msgDate = parseGPSTime(f.properties.GPSTime);
        const localDate = [
          msgDate.getFullYear(),
          String(msgDate.getMonth() + 1).padStart(2, "0"),
          String(msgDate.getDate()).padStart(2, "0"),
        ].join("-");
        return localDate === date;
      });

      const campSites = dayPoints.filter(
        (d) => d.properties?.MessageText && checkForCampsite(d),
      );
      const messages = dayPoints.filter(
        (d) => !d.properties?.MessageText || !checkForCampsite(d),
      );

      g.selectAll(".messagePoints")
        .data(messages)
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
        .on("mouseover", showMsgTooltip)
        .on("mousemove", moveMsgTooltip)
        .on("mouseout", hideMsgTooltip);

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
        .on("mouseover", showMsgTooltip)
        .on("mousemove", moveMsgTooltip)
        .on("mouseout", hideMsgTooltip);

      // Photo points filtered to this date
      const photoPoints = photoData.features.filter((f) => {
        if (f.geometry?.type !== "Photo") return false;
        if (!f.properties?.dateTime) return false;
        if (
          !Array.isArray(f.geometry.coordinates) ||
          f.geometry.coordinates.length !== 2
        )
          return false;
        if (!projection(f.geometry.coordinates)) return false;
        // Compare date strings directly — avoids UTC conversion shifting
        // late-evening photos (≥18:00 MT) to the next calendar day.
        const dateOnly = f.properties.dateTime.slice(0, 10).replace(/:/g, "-");
        return dateOnly === date;
      });

      g.selectAll(".photoPoints")
        .data(photoPoints)
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
        .style("cursor", "pointer")
        .on("mouseover", function (_event, d) {
          if (tooltipImgRef.current && tooltipRef.current) {
            tooltipImgRef.current.src = d.properties.path;
            tooltipRef.current.style.display = "block";
          }
        })
        .on("mouseout", function () {
          if (tooltipRef.current) {
            tooltipRef.current.style.display = "none";
          }
        });

      // Start (green circle) and end (red square) markers
      const coords = legGeoJSON.features[0]?.geometry?.coordinates;
      if (coords?.length > 0) {
        const startPos = projection(coords[0]);
        const endPos = projection(coords[coords.length - 1]);

        if (startPos) {
          g.append("circle")
            .attr("class", "startMarker")
            .attr("cx", startPos[0])
            .attr("cy", startPos[1])
            .attr("r", 6)
            .attr("fill", "#16a34a")
            .attr("stroke", "white")
            .attr("stroke-width", 1.5)
            .attr("vector-effect", "non-scaling-stroke");
        }

        if (endPos) {
          g.append("rect")
            .attr("class", "endMarker")
            .attr("data-cx", endPos[0])
            .attr("data-cy", endPos[1])
            .attr("x", endPos[0] - 5)
            .attr("y", endPos[1] - 5)
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", "#dc2626")
            .attr("stroke", "white")
            .attr("stroke-width", 1.5)
            .attr("vector-effect", "non-scaling-stroke");
        }
      }

      // Scale symbols and photo circles as zoom level changes
      zoom.on("end", (event) => {
        const k = event.transform.k;
        const newSize = 80 / (k * k);
        g.selectAll(".photoPoints").attr("r", 6 / k);
        g.selectAll(".campPoints").attr("d", triangle.size(newSize));
        g.selectAll(".messagePoints").attr("d", square.size(newSize));
        g.selectAll(".startMarker").attr("r", 6 / k).attr("stroke-width", 1.5 / k);
        g.selectAll(".endMarker")
          .attr("x", function () { return +d3.select(this).attr("data-cx") - 5 / k; })
          .attr("y", function () { return +d3.select(this).attr("data-cy") - 5 / k; })
          .attr("width", 10 / k)
          .attr("height", 10 / k)
          .attr("stroke-width", 1.5 / k);
      });
    });
  }, [legGeoJSON, date, start, end]);

  if (!legGeoJSON) return null;

  return (
    <div className="relative" style={{ overflow: "visible" }}>
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white">
        <svg ref={ref} />
      </div>
      {/* Photo tooltip — positioned to the left of the map, covering the metadata */}
      <div
        ref={msgTooltipRef}
        style={{
          display: "none",
          position: "fixed",
          zIndex: 50,
          backgroundColor: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          padding: "10px 14px",
          fontSize: "13px",
          color: "#4b5563",
          maxWidth: "280px",
          pointerEvents: "none",
          lineHeight: "1.5",
        }}
      />
      <div
        ref={tooltipRef}
        style={{
          display: "none",
          position: "fixed",
          top: "50%",
          left: "2rem",
          transform: "translateY(-50%)",
          width: "min(45vw, 680px)",
          maxHeight: "80vh",
          zIndex: 50,
          pointerEvents: "none",
        }}
      >
        <img
          ref={tooltipImgRef}
          src={null}
          alt="Trail photo"
          style={{
            width: "100%",
            height: "auto",
            maxHeight: "80vh",
            objectFit: "contain",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
          }}
        />
      </div>
    </div>
  );
}
