// import { lusitana } from "@/app/ui/fonts";

import React, { useRef, useEffect, useMemo } from "react";

import * as d3 from "d3";

import { width, height, cities, colors } from "./constants";

import {
  getAlternatingColor,
  checkForCampsite,
  handleMouseOver,
  handleMouseMove,
  handleMouseOut,
} from "./utils";

// interface CDTmapProps {
//   user: any; // 👈 Replace `any` with your actual user type if available
// }

export default function CDTmap() {
  const ref = useRef();
  const gRef = useRef(null);

  // ✅ Define projection + path WITHIN component and memoize
  const projection = useMemo(() => {
    return d3
      .geoAlbersUsa()
      .scale(2000)
      .translate([width * 0.9, height * 0.625]);
  }, []);

  const path = useMemo(() => d3.geoPath().projection(projection), [projection]);

  useEffect(() => {
    const svg = d3
      .select(ref.current)
      .attr("id", "CDTmap")
      .attr("width", width)
      .attr("height", height)
      .attr("stroke", "rgb(127, 127, 127)")
      .attr("stroke-width", "1px");

    svg.selectAll("*").remove();

    const g = svg.append("g").attr("class", "mapLayer");
    gRef.current = g; // ✅ store g in a ref for later access

    // Add zoom behavior
    const zoom = d3
      .zoom()
      .scaleExtent([1, 500])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        g.selectAll("circle").attr("r", 6 / event.transform.k);
        g.selectAll("text").attr("font-size", 12 / event.transform.k);
        g.selectAll("line").attr("stroke-width", 1 / event.transform.k);

        const newSize = 128 / (event.transform.k * event.transform.k);

        const zoomableSquare = d3.symbol().type(d3.symbolSquare).size(newSize);
        const zoomableTriangle = d3
          .symbol()
          .type(d3.symbolTriangle)
          .size(newSize);
        const zoomableCross = d3.symbol().type(d3.symbolCross).size(newSize); // adjust size as needed

        g.selectAll(".campPoints").attr("d", zoomableTriangle);
        g.selectAll(".messagePoints").attr("d", zoomableSquare);
        g.selectAll(".cityPoints").attr("d", zoomableCross);
        g.selectAll(".trail").attr("stroke-width", 2 / event.transform.k);
      });

    svg.call(zoom);

    svg.on("click", (event) => {
      if (!event.target.classList.contains("state-clickable")) {
        svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
      }
    });

    /* -----------------------------------------------------
    *  Track mapping functionality
    ----------------------------------------------------- */

    d3.json("/CDT_complete_tracks.json").then((data) => {
      g.selectAll(".trail")
        .data(data.features)
        .enter()
        .append("path")
        .attr("class", "trail")
        .attr("d", d3.geoPath().projection(projection))
        .attr("fill", "none")
        .attr("stroke", (d) => getAlternatingColor(d.properties))
        .attr("stroke-width", 2)
        .attr("fill", "none")
        .on("mouseover", handleMouseOver(user))
        .on("mousemove", handleMouseMove)
        .on("mouseout", handleMouseOut);
    });

    /* -----------------------------------------------------
    *  State outline mapping functionality
    ----------------------------------------------------- */
    // geojson data from: https://github.com/johan/world.geo.json/tree/master
    d3.json("CDTstates.json").then((stateData) => {
      g.selectAll(".state")
        .data(stateData.features)
        .enter()
        .append("path")
        .attr("class", "state state-clickable")
        .attr("fill", "transparent")
        .attr("stroke", "gray")
        .attr("stroke-width", "1px")
        .attr("d", path)
        // .lower()
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
            Math.min(8, 0.9 / Math.max(dx / width, dy / height))
          );
          const translate = [width / 2 - scale * x, height / 2 - scale * y];

          svg
            .transition()
            .duration(750)
            .call(
              zoom.transform,
              d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
            );
        });
    });

    /* -----------------------------------------------------
    *  Plotting Garmin Data
    ----------------------------------------------------- */

    const square = d3.symbol().type(d3.symbolSquare).size(128);
    const triangle = d3.symbol().type(d3.symbolTriangle).size(128); // adjust size as needed

    d3.json("cdtInreachData_withCoords.geojson").then((inReachdata) => {
      const points = inReachdata.features.filter(
        (d) =>
          d.geometry?.type === "Point" &&
          Array.isArray(d.geometry.coordinates) &&
          d.geometry.coordinates.length === 2
      );
      const validPoints = points.filter((d) =>
        projection(d.geometry.coordinates)
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

      // Plot the message sites using squares

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
        .attr("stroke", "none")
        .on("mouseover", handleMouseOver(user))
        .on("mousemove", handleMouseMove)
        .on("mouseout", handleMouseOut);

      // Plot the campsites using a triangle symbol
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
        .attr("stroke", "none")
        .on("mouseover", handleMouseOver(user))
        .on("mousemove", handleMouseMove)
        .on("mouseout", handleMouseOut);
    });

    /* -----------------------------------------------------
    *  Take the cleaned photo geojson data and plot it
    ----------------------------------------------------- */

    d3.json("geoPhotos.geojson").then((photoData) => {
      const points = photoData.features.filter(
        (d) =>
          d.geometry?.type === "Photo" &&
          Array.isArray(d.geometry.coordinates) &&
          d.geometry.coordinates.length === 2
      );
      const validPhotoPoints = points.filter((d) =>
        projection(d.geometry.coordinates)
      );

      g.selectAll(".photoPoints")
        .data(validPhotoPoints)
        .enter()
        .append("circle")
        .attr("class", "photoPoints")
        .attr("cx", (d) => projection(d.geometry.coordinates)[0])
        .attr("cy", (d) => projection(d.geometry.coordinates)[1])
        .attr("r", 6)
        .attr("fill", colors.photos)
        .attr("stroke", "none")
        .on("mouseover", handleMouseOver(user))
        .on("mousemove", handleMouseMove)
        .on("mouseout", handleMouseOut);
    });

    /* -----------------------------------------------------
    *  City data
    ----------------------------------------------------- */

    const cityGroup = g.append("g").attr("class", "cities");

    const cross = d3.symbol().type(d3.symbolCross).size(128); // adjust size as needed

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
      .attr("fill", "black")
      .attr("stroke", "none");

    cityGroup
      .selectAll("line")
      .data(cities)
      .enter()
      .append("line")
      .attr("x1", (d) => projection([d.lon, d.lat])[0])
      .attr("y1", (d) => projection([d.lon, d.lat])[1])
      .attr("x2", (d) => projection([d.lon, d.lat])[0] + d.dx)
      .attr("y2", (d) => projection([d.lon, d.lat])[1] + d.dy)
      .attr("stroke", "black")
      .attr("stroke-width", 1);

    cityGroup
      .selectAll("text")
      .data(cities)
      .enter()
      .append("text")
      .attr("class", "city_labels")
      .attr("x", (d) => projection([d.lon, d.lat])[0] + d.dx)
      .attr("y", (d) => projection([d.lon, d.lat])[1] + d.dy)
      .text((d) => d.name)
      .attr("font-size", 12)
      .attr("text-anchor", (d) => (d.dx <= 0 ? "end" : "start"))
      .attr("fill", "black")
      .attr("stroke", "none");

    /* -----------------------------------------------------
 *  Legend
 ----------------------------------------------------- */

    g.append("path")
      .attr("d", square)
      .attr("transform", "translate(100,430)")
      .style("fill", colors.messages)
      .style("stroke", "none");
    g.append("path")
      .attr("d", triangle)
      .attr("transform", "translate(100,460)")
      .style("fill", colors.campSites)
      .style("stroke", "none");
    g.append("circle")
      .attr("cx", 100)
      .attr("cy", 490)
      .attr("r", 6)
      .style("fill", colors.photos)
      .style("stroke", "none");

    g.append("path")
      .attr("d", cross)
      .attr("transform", "translate(100,520)")
      .style("fill", "black")
      .style("stroke", "none");

    g.append("line")
      .attr("x1", 90)
      .attr("x2", 110)
      .attr("y1", 550)
      .attr("y2", 550)
      .attr("stroke", colors.evenDays) // Set the line color
      .attr("stroke-width", 3); // Set the line width
    g.append("line")
      .attr("x1", 90)
      .attr("x2", 110)
      .attr("y1", 580)
      .attr("y2", 580)
      .attr("stroke", colors.oddDays) // Set the line color
      .attr("stroke-width", 3); // Set the line width

    g.append("text")
      .attr("x", 120)
      .attr("y", 430)
      .text("Garmin Message Sent")
      .style("font-size", "15px")
      .attr("alignment-baseline", "middle");
    g.append("text")
      .attr("x", 120)
      .attr("y", 460)
      .text("Campsite Location")
      .style("font-size", "15px")
      .attr("alignment-baseline", "middle");
    g.append("text")
      .attr("x", 120)
      .attr("y", 490)
      .text("Photo Location")
      .style("font-size", "15px")
      .attr("alignment-baseline", "middle");
    g.append("text")
      .attr("x", 120)
      .attr("y", 520)
      .text("Resupply Stops")
      .style("font-size", "15px")
      .attr("alignment-baseline", "middle");
    g.append("text")
      .attr("x", 120)
      .attr("y", 550)
      .text("Even days")
      .style("font-size", "15px")
      .attr("alignment-baseline", "middle");
    g.append("text")
      .attr("x", 120)
      .attr("y", 580)
      .text("Odd days")
      .style("font-size", "15px")
      .attr("alignment-baseline", "middle");
  }, [path, projection, user]);

  return <svg ref={ref}></svg>;
}
