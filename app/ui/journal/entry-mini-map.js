"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { colors } from "@/app/journal/map/constants";
import { checkForCampsite } from "@/app/journal/map/utils";
import { notoSans } from "@/app/ui/fonts";

const MAP_WIDTH = 500;
const MAP_HEIGHT = 350;
const PADDING = 40;

export default function EntryMiniMap({ legGeoJSON, date, start, end }) {
  const ref = useRef();
  const tooltipRef = useRef();
  const tooltipImgRef = useRef();

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
        const msgDate = new Date(f.properties.GPSTime);
        return msgDate.toISOString().split("T")[0] === date;
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
        .attr("stroke", "none");

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
        .attr("fill", colors.campSites)
        .attr("stroke", "none");

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
        const normalized = f.properties.dateTime.replace(
          /^(\d{4}):(\d{2}):(\d{2})/,
          "$1-$2-$3",
        );
        return new Date(normalized).toISOString().split("T")[0] === date;
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
        .attr("stroke", "white")
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

      // Start / end labels
      const coords = legGeoJSON.features[0]?.geometry?.coordinates;
      if (coords?.length > 0) {
        const LABEL_OFFSET = 50;

        const addLabel = (coord, label, neighborCoord, color) => {
          const pos = projection(coord);
          if (!pos) return;

          // Direction: away from the neighbor, i.e. outside the track at this endpoint
          let dx = 0,
            dy = -LABEL_OFFSET;
          const neighborPos = projection(neighborCoord);
          if (neighborPos) {
            const vx = pos[0] - neighborPos[0];
            const vy = pos[1] - neighborPos[1];
            const len = Math.sqrt(vx * vx + vy * vy) || 1;
            dx = (vx / len) * LABEL_OFFSET;
            dy = (vy / len) * LABEL_OFFSET;
          }

          // Clamp label to stay within SVG viewBox
          const MARGIN = 15;
          const labelX = Math.max(MARGIN, Math.min(MAP_WIDTH - MARGIN, pos[0] + dx));
          const labelY = Math.max(MARGIN, Math.min(MAP_HEIGHT - MARGIN, pos[1] + dy));

          // Leader line from endpoint to label
          g.append("line")
            .attr("x1", pos[0])
            .attr("y1", pos[1])
            .attr("x2", labelX)
            .attr("y2", labelY)
            .attr("stroke", color)
            .attr("stroke-width", 1)
            .attr("stroke-opacity", 0.6)
            .attr("vector-effect", "non-scaling-stroke");

          // Label with white halo
          g.append("text")
            .attr("x", labelX)
            .attr("y", labelY)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("font-size", "10px")
            .attr("font-weight", "600")
            .attr("stroke", "white")
            .attr("stroke-width", 3)
            .attr("stroke-linejoin", "round")
            .attr("fill", color)
            .attr("paint-order", "stroke")
            .text(label);
        };

        if (start) addLabel(coords[0], start, coords[1], "#16a34a");
        if (end)
          addLabel(
            coords[coords.length - 1],
            end,
            coords[coords.length - 2],
            "#dc2626",
          );
      }

      // Scale symbols and photo circles as zoom level changes
      zoom.on("end", (event) => {
        const k = event.transform.k;
        const newSize = 80 / (k * k);
        g.selectAll(".photoPoints").attr("r", 6 / k);
        g.selectAll(".campPoints").attr("d", triangle.size(newSize));
        g.selectAll(".messagePoints").attr("d", square.size(newSize));
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
        ref={tooltipRef}
        style={{
          display: "none",
          position: "absolute",
          top: 0,
          right: "100%",
          paddingRight: "12px",
          width: "100%",
          zIndex: 10,
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
            borderRadius: "8px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
          }}
        />
      </div>
    </div>
  );
}
