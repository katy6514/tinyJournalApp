"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { colors } from "@/app/journal/map/constants";
import { checkForCampsite } from "@/app/journal/map/utils";

const MAP_WIDTH = 500;
const MAP_HEIGHT = 350;
const PADDING = 40;

export default function EntryMiniMap({ legGeoJSON, date }) {
  const ref = useRef();

  useEffect(() => {
    if (!legGeoJSON?.features?.length) return;

    const svg = d3
      .select(ref.current)
      .attr("width", MAP_WIDTH)
      .attr("height", MAP_HEIGHT);

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
    });
  }, [legGeoJSON, date]);

  if (!legGeoJSON) return null;

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <svg ref={ref} className="w-full" />
    </div>
  );
}
