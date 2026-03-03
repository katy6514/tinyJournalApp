"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { colors } from "@/app/journal/map/constants";
import { checkForCampsite } from "@/app/journal/map/utils";

const MAP_WIDTH = 500;
const MAP_HEIGHT = 350;
const PADDING = 40;

export default function EntryMiniMap({ legGeoJSON, date, start, end }) {
  const ref = useRef();

  useEffect(() => {
    if (!legGeoJSON?.features?.length) return;

    const svg = d3
      .select(ref.current)
      .attr("viewBox", `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`)
      .attr("width", "100%");

    svg.selectAll("*").remove();

    const projection = d3
      .geoAlbersUsa()
      .fitExtent(
        [[PADDING, PADDING], [MAP_WIDTH - PADDING, MAP_HEIGHT - PADDING]],
        legGeoJSON
      );

    const path = d3.geoPath().projection(projection);

    const square = d3.symbol().type(d3.symbolSquare).size(80);
    const triangle = d3.symbol().type(d3.symbolTriangle).size(80);

    Promise.all([
      d3.json("/api/states"),
      d3.json("/data/cdtInreachData_withCoords.geojson"),
    ]).then(([stateData, inReachData]) => {
      // State outlines for context
      svg
        .selectAll(".state")
        .data(stateData.features)
        .enter()
        .append("path")
        .attr("class", "state")
        .attr("fill", "transparent")
        .attr("stroke", "#d1d5db")
        .attr("stroke-width", "1px")
        .attr("d", path);

      // Leg trail
      svg
        .selectAll(".trail")
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
        (d) => d.properties?.MessageText && checkForCampsite(d)
      );
      const messages = dayPoints.filter(
        (d) => !d.properties?.MessageText || !checkForCampsite(d)
      );

      svg
        .selectAll(".messagePoints")
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

      svg
        .selectAll(".campPoints")
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

      // Start / end labels
      const coords = legGeoJSON.features[0]?.geometry?.coordinates;
      if (coords?.length > 0) {
        const OFFSET = 24;

        const addLabel = (coord, label, neighborCoord, awayFromNeighbor) => {
          const pos = projection(coord);
          if (!pos) return;

          // Compute offset direction: away from the track at this endpoint
          let dx = 0, dy = -OFFSET;
          const neighborPos = projection(neighborCoord);
          if (neighborPos) {
            const dirX = awayFromNeighbor
              ? pos[0] - neighborPos[0]
              : neighborPos[0] - pos[0];
            const dirY = awayFromNeighbor
              ? pos[1] - neighborPos[1]
              : neighborPos[1] - pos[1];
            const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
            dx = (dirX / len) * OFFSET;
            dy = (dirY / len) * OFFSET;
          }

          const color = awayFromNeighbor ? "#dc2626" : "#16a34a";

          svg.append("circle")
            .attr("cx", pos[0])
            .attr("cy", pos[1])
            .attr("r", 5)
            .attr("fill", color)
            .attr("stroke", "white")
            .attr("stroke-width", 1.5);

          // White halo so text is readable over the map
          svg.append("text")
            .attr("x", pos[0] + dx)
            .attr("y", pos[1] + dy)
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

        if (start) addLabel(coords[0], start, coords[1], false);
        if (end) addLabel(coords[coords.length - 1], end, coords[coords.length - 2], true);
      }
    });
  }, [legGeoJSON, date, start, end]);

  if (!legGeoJSON) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white">
      <svg ref={ref} />
    </div>
  );
}
