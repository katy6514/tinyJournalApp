"use client";

import React, { useRef, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import * as d3 from "d3";

import { width, height, cities, colors } from "./constants";
import { updatePhotoCaption } from "@/app/lib/actions/photos";
import { notoSans } from "@/app/ui/fonts";

import {
  getAlternatingColor,
  checkForCampsite,
  normalizeExifDate,
  parseGPSTime,
  handleMouseMove,
  handleMouseOut,
  handleMouseOver,
} from "./utils";

const clusterRadius = (count, k) => (9 + Math.log(count + 1) * 5) / k;

// Pre-set zoom levels for cluster clicks. Adjust these values to tune zoom depth.
const CLUSTER_ZOOM_PRESETS = [50, 300];

function panTarget(svgRect, panelRight) {
  const targetScreenX = (panelRight + svgRect.right) / 2;
  const targetScreenY = (svgRect.top + svgRect.bottom) / 2;
  const rs = Math.min(svgRect.width / width, svgRect.height / height);
  const ox = (svgRect.width - width * rs) / 2;
  const oy = (svgRect.height - height * rs) / 2;
  return [
    (targetScreenX - svgRect.left - ox) / rs,
    (targetScreenY - svgRect.top - oy) / rs,
  ];
}

function panThenReveal(svgEl, zoom, cx, cy, timerRef, onReveal) {
  if (!zoom || !svgEl) {
    onReveal();
    return;
  }
  const svgRect = svgEl.getBoundingClientRect();
  const cRect = svgEl.parentElement?.getBoundingClientRect() ?? svgRect;
  const panelRight = cRect.left + cRect.width / 2;
  if (panelRight >= svgRect.right) {
    onReveal();
    return;
  }
  const [targetX, targetY] = panTarget(svgRect, panelRight);
  d3.select(svgEl)
    .transition()
    .duration(400)
    .ease(d3.easeCubicInOut)
    .call(zoom.translateTo, cx, cy, [targetX, targetY]);
  timerRef.current = setTimeout(onReveal, 420);
}

function LegendSymbol({ shape, fill, stroke, color }) {
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
}

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
  });
  const visibilityRef = useRef(visibility);
  visibilityRef.current = visibility;

  const [clusterPanel, setClusterPanel] = useState(null);
  const clusterPanelRef = useRef(clusterPanel);
  clusterPanelRef.current = clusterPanel;
  const zoomRef = useRef(null);

  const [messagePanel, setMessagePanel] = useState(null);

  const updateActiveRingRef = useRef(() => {});
  const updateConnectingTriangleRef = useRef(() => {});

  // Floating photo popout: shown when a photo point or cluster is clicked
  const [photoPopout, setPhotoPopout] = useState(null);

  // Read ref so D3 closures can read the current photoPopout value
  const photoPopoutRef = useRef(photoPopout);
  photoPopoutRef.current = photoPopout;

  // Pending popout: set immediately on click; photoPopout is set after pan completes
  const [pendingPhotoPopout, setPendingPhotoPopout] = useState(null);
  const panTimerRef = useRef(null);

  // Scale at the last cluster re-render; used to skip re-renders on pure pans
  const lastRenderedScaleRef = useRef(null);

  // Disambiguation menu: shown when a photo dot overlaps a camp/message point
  const [disambigMenu, setDisambigMenu] = useState(null);

  const [captionDraft, setCaptionDraft] = useState("");
  const [captionSaved, setCaptionSaved] = useState(false);

  // displayedPopout lags behind photoPopout by ~320ms so the panel can fade
  // out before unmounting.
  const [displayedPopout, setDisplayedPopout] = useState(null);
  const fadeTimerRef = useRef(null);
  useEffect(() => {
    clearTimeout(fadeTimerRef.current);
    if (photoPopout) {
      setDisplayedPopout(photoPopout);
    } else {
      fadeTimerRef.current = setTimeout(() => setDisplayedPopout(null), 320);
    }
    return () => clearTimeout(fadeTimerRef.current);
  }, [photoPopout]);

  // Sync visibility state → D3 element display whenever toggles change
  useEffect(() => {
    const g = gRef.current;
    if (!g) return;
    g.selectAll(
      ".photoPoints, .photoHitAreas, .photoCluster, .photoClusterHit, .photoClusterLabel",
    ).attr("display", visibility.photos ? null : "none");
    g.selectAll(
      ".campPoints, .campCluster, .campClusterHit, .campClusterLabel",
    ).attr("display", visibility.campsites ? null : "none");
    g.selectAll(
      ".messagePoints, .msgCluster, .msgClusterHit, .msgClusterLabel",
    ).attr("display", visibility.messages ? null : "none");
  }, [visibility]);

  // When a cluster is clicked, zoom to the next pre-set level centered on the
  // cluster centroid. When the panel closes, reset to the identity transform.
  useEffect(() => {
    if (!clusterPanel) {
      if (zoomRef.current && ref.current) {
        d3.select(ref.current)
          .transition()
          .duration(750)
          .ease(d3.easeCubicInOut)
          .call(zoomRef.current.transform, d3.zoomIdentity);
      }
      return;
    }
    if (!zoomRef.current || !ref.current) return;

    const scale = clusterPanel.scale ?? CLUSTER_ZOOM_PRESETS[0];

    const xs = clusterPanel.projPoints.map((p) => p[0]);
    const ys = clusterPanel.projPoints.map((p) => p[1]);
    const cx = xs.reduce((s, x) => s + x, 0) / xs.length;
    const cy = ys.reduce((s, y) => s + y, 0) / ys.length;

    const tx = width / 2 - scale * cx;
    const ty = height / 2 - scale * cy;

    d3.select(ref.current)
      .transition()
      .duration(1200)
      .ease(d3.easeCubicInOut)
      .call(
        zoomRef.current.transform,
        d3.zoomIdentity.translate(tx, ty).scale(scale),
      );
  }, [clusterPanel]);

  // When a dot is clicked, pan the map first; reveal the photo panel after.
  useEffect(() => {
    clearTimeout(panTimerRef.current);
    if (!pendingPhotoPopout) return;
    const [px, py] = projection(pendingPhotoPopout.item.geometry.coordinates);
    panThenReveal(ref.current, zoomRef.current, px, py, panTimerRef, () =>
      setPhotoPopout(pendingPhotoPopout),
    );
    return () => clearTimeout(panTimerRef.current);
  }, [pendingPhotoPopout]); // projection omitted: memoized with [] so never changes

  // Once the photo is revealed, update the ring and triangle.
  useEffect(() => {
    updateActiveRingRef.current();
    updateConnectingTriangleRef.current();
  }, [photoPopout]);

  // Reset caption draft whenever a new photo is selected.
  useEffect(() => {
    setCaptionDraft(photoPopout?.item?.properties?.caption ?? "");
    setCaptionSaved(false);
  }, [photoPopout]);

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
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("stroke", "rgb(127, 127, 127)")
      .attr("stroke-width", "1px")
      .attr("font-family", notoSans.style.fontFamily);

    svg.selectAll("*").remove();

    const g = svg.append("g").attr("class", "mapLayer");
    gRef.current = g;

    const square = d3.symbol().type(d3.symbolSquare).size(256);
    const triangle = d3.symbol().type(d3.symbolTriangle).size(256);
    const cross = d3.symbol().type(d3.symbolCross).size(256);

    // Shared greedy clustering: groups sites whose screen-space positions are
    // within CLUSTER_RADIUS pixels of each other at the current transform.
    // Returns { solos, groups } where groups carry projection-space centroids.
    function computeClusters(sites, transform, CLUSTER_RADIUS = 10) {
      const positions = sites.map((p) => {
        const [px, py] = projection(p.geometry.coordinates);
        const [sx, sy] = transform.apply([px, py]);
        return { px, py, sx, sy };
      });
      const assigned = new Set();
      const solos = [];
      const groups = [];
      for (let i = 0; i < sites.length; i++) {
        if (assigned.has(i)) continue;
        assigned.add(i);
        const members = [i];
        // BFS: expand by checking all unassigned neighbors of each cluster member,
        // not just the seed. This correctly handles transitive proximity chains.
        for (let m = 0; m < members.length; m++) {
          const curr = members[m];
          for (let j = 0; j < sites.length; j++) {
            if (assigned.has(j)) continue;
            const dx = positions[j].sx - positions[curr].sx;
            const dy = positions[j].sy - positions[curr].sy;
            if (Math.sqrt(dx * dx + dy * dy) <= CLUSTER_RADIUS) {
              members.push(j);
              assigned.add(j);
            }
          }
        }
        if (members.length === 1) {
          solos.push(sites[members[0]]);
        } else {
          const cx =
            members.reduce((s, idx) => s + positions[idx].px, 0) /
            members.length;
          const cy =
            members.reduce((s, idx) => s + positions[idx].py, 0) /
            members.length;
          groups.push({
            points: members.map((idx) => sites[idx]),
            cx,
            cy,
            count: members.length,
          });
        }
      }
      return { solos, groups };
    }

    // Placeholders — assigned inside Promise.all so zoom "end" can call them
    let renderMessageClusters = () => {};
    let renderPhotoClusters = () => {};
    let renderCampClusters = () => {};
    let renderDebugHitAreas = () => {};

    // Tracks force-displaced positions so the photo click handler can test
    // against visual positions rather than original projection coordinates.
    const displacedPositions = new Map();

    // Separate overlapping solo points using per-hotspot force simulations.
    // Points are first grouped into geographic hotspots via BFS; each hotspot
    // with >1 node gets its own simulation anchored to the hotspot centroid
    // rather than individual origins, so nodes spread freely without the anchor
    // force fighting the collision force.
    function separateOverlappingPoints(transform) {
      const k = transform.k;
      leaderLinesGroup.selectAll("*").remove();
      displacedPositions.clear();
      if (k < 2) return;

      // Match the visual radii used in renderPhotoClusters / zoom handler
      const photoR = 9 / k;
      const symbolR = Math.sqrt(256 / Math.PI) / k; // ≈ 9/k
      const clusterR = (d) => clusterRadius(d.count, k);

      const nodes = [];

      // Movable solo points
      g.selectAll(".photoPoints").each(function (d) {
        const [px, py] = projection(d.geometry.coordinates);
        nodes.push({
          type: "photo",
          data: d,
          x: px,
          y: py,
          ox: px,
          oy: py,
          r: photoR,
        });
      });
      g.selectAll(".campPoints").each(function (d) {
        const [px, py] = projection(d.geometry.coordinates);
        nodes.push({
          type: "camp",
          data: d,
          x: px,
          y: py,
          ox: px,
          oy: py,
          r: symbolR,
        });
      });
      g.selectAll(".messagePoints").each(function (d) {
        const [px, py] = projection(d.geometry.coordinates);
        nodes.push({
          type: "msg",
          data: d,
          x: px,
          y: py,
          ox: px,
          oy: py,
          r: symbolR,
        });
      });

      // Cluster bubbles — fully movable, same as solos
      g.selectAll(".photoCluster").each(function (d) {
        const r = clusterR(d);
        nodes.push({
          type: "photo-cluster",
          data: d,
          x: d.cx,
          y: d.cy,
          ox: d.cx,
          oy: d.cy,
          r,
        });
      });
      g.selectAll(".msgCluster").each(function (d) {
        const r = clusterR(d);
        nodes.push({
          type: "msg-cluster",
          data: d,
          x: d.cx,
          y: d.cy,
          ox: d.cx,
          oy: d.cy,
          r,
        });
      });
      g.selectAll(".campCluster").each(function (d) {
        const r = clusterR(d);
        nodes.push({
          type: "camp-cluster",
          data: d,
          x: d.cx,
          y: d.cy,
          ox: d.cx,
          oy: d.cy,
          r,
        });
      });

      if (nodes.length === 0) return;

      // BFS to find connected components (hotspots) of nearby nodes.
      // groupThresh is based on the largest node radius so clusters pull in
      // nearby solos regardless of their relative sizes.
      const maxR = Math.max(...nodes.map((n) => n.r));
      const groupThresh = maxR;
      const assigned = new Array(nodes.length).fill(-1);
      const hotspots = [];
      for (let i = 0; i < nodes.length; i++) {
        if (assigned[i] !== -1) continue;
        const queue = [i];
        assigned[i] = hotspots.length;
        const members = [];
        let qi = 0;
        while (qi < queue.length) {
          const curr = queue[qi++];
          members.push(curr);
          for (let j = 0; j < nodes.length; j++) {
            if (assigned[j] !== -1) continue;
            const dx = nodes[j].ox - nodes[curr].ox;
            const dy = nodes[j].oy - nodes[curr].oy;
            if (Math.hypot(dx, dy) <= groupThresh) {
              assigned[j] = hotspots.length;
              queue.push(j);
            }
          }
        }
        hotspots.push(members);
      }

      // Simulate each multi-node hotspot independently.
      hotspots.forEach((members) => {
        if (members.length <= 1) return;
        const hotNodes = members.map((i) => nodes[i]);
        const cx = hotNodes.reduce((s, n) => s + n.ox, 0) / hotNodes.length;
        const cy = hotNodes.reduce((s, n) => s + n.oy, 0) / hotNodes.length;
        d3.forceSimulation(hotNodes)
          .force(
            "collide",
            d3
              .forceCollide((d) => d.r * 1.6)
              .strength(1)
              .iterations(4),
          )
          .force(
            "charge",
            d3.forceManyBody().strength((d) => -(d.r * d.r) * 0.4),
          )
          .force("x", d3.forceX(cx).strength(0.2))
          .force("y", d3.forceY(cy).strength(0.2))
          .stop()
          .tick(150);
      });

      nodes.forEach(({ type, data, x, y, ox, oy }) => {
        if (Math.abs(x - ox) < 0.01 && Math.abs(y - oy) < 0.01) return;
        displacedPositions.set(data, { x, y });

        const lineColor =
          type === "photo" || type === "photo-cluster"
            ? colors.photosDark
            : type === "camp" || type === "camp-cluster"
              ? colors.campSites
              : colors.messagesDark;

        leaderLinesGroup
          .append("line")
          .attr("x1", ox)
          .attr("y1", oy)
          .attr("x2", x)
          .attr("y2", y)
          .attr("stroke", lineColor)
          .attr("stroke-width", 2)
          .attr("opacity", 0.6)
          .attr("vector-effect", "non-scaling-stroke")
          .attr("pointer-events", "none");

        leaderLinesGroup
          .append("circle")
          .attr("cx", ox)
          .attr("cy", oy)
          .attr("r", 3 / k)
          .attr("fill", lineColor)
          .attr("stroke", "white")
          .attr("stroke-width", 0.5)
          .attr("vector-effect", "non-scaling-stroke")
          .attr("pointer-events", "none");

        if (type === "photo") {
          g.selectAll(".photoPoints, .photoHitAreas")
            .filter((d) => d === data)
            .attr("cx", x)
            .attr("cy", y);
        } else if (type === "photo-cluster") {
          g.selectAll(".photoCluster, .photoClusterHit")
            .filter((d) => d === data)
            .attr("cx", x)
            .attr("cy", y);
          g.selectAll(".photoClusterLabel")
            .filter((d) => d === data)
            .attr("x", x)
            .attr("y", y);
        } else if (type === "msg-cluster") {
          g.selectAll(".msgCluster, .msgClusterHit")
            .filter((d) => d === data)
            .attr("transform", `translate(${x}, ${y})`);
          g.selectAll(".msgClusterLabel")
            .filter((d) => d === data)
            .attr("x", x)
            .attr("y", y);
        } else if (type === "camp-cluster") {
          g.selectAll(".campCluster, .campClusterHit")
            .filter((d) => d === data)
            .attr("transform", `translate(${x}, ${y})`);
          g.selectAll(".campClusterLabel")
            .filter((d) => d === data)
            .attr("x", x)
            .attr("y", y);
        } else {
          const ptClass = type === "camp" ? ".campPoints" : ".messagePoints";
          const hitClass = type === "camp" ? ".campHitArea" : ".msgHitArea";
          g.selectAll(`${ptClass}, ${hitClass}`)
            .filter((d) => d === data)
            .attr("transform", `translate(${x}, ${y})`);
        }
      });
    }

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
        const showLabels = t.k > 2.35;

        g.selectAll(".trail, .trail-hit").attr(
          "display",
          showLabels ? null : "none",
        );

        const LABEL_GAP = 10;
        const labelFontSize = Math.min(14, 8 * (t.k / 2.35));
        svg.selectAll(".city_labels").each(function () {
          const el = d3.select(this);
          const [dotSx, dotSy] = t.apply([
            +el.attr("data-dot-x"),
            +el.attr("data-dot-y"),
          ]);
          const inViewport =
            dotSx >= 0 && dotSx <= width && dotSy >= 0 && dotSy <= height;
          if (showLabels && inViewport) {
            const side = +el.attr("data-side");
            el.attr("x", dotSx + side * LABEL_GAP)
              .attr("y", dotSy)
              .attr("font-size", labelFontSize)
              .attr("display", null);
          } else {
            el.attr("display", "none");
          }
        });

        const k = t.k;
        const symbolSize = 256 / (k * k);
        // Normalize hit-area padding to ~5 screen pixels regardless of how large
        // the SVG is rendered (renderScale = CSS pixels per SVG viewport unit).
        const rs = ref.current?.getBoundingClientRect().width / width || 1;
        const hitPad = 10 / (k * rs); // g-space units → 5 screen px per side

        // City crosses
        g.selectAll(".cityPoints").attr("d", cross.size(symbolSize));
        g.selectAll(".state-label").attr("font-size", 20 / k);

        // Photos
        g.selectAll(".photoPoints").attr("r", 9 / k);
        g.selectAll(".photoHitAreas").attr("r", (9 + 5 / rs) / k);
        g.selectAll(".photoCluster").attr("r", (d) =>
          clusterRadius(d.count, k),
        );
        g.selectAll(".photoClusterHit").attr(
          "r",
          (d) => clusterRadius(d.count, k) + 5 / (rs * k),
        );
        g.selectAll(".photoClusterLabel").attr("font-size", 11 / k);

        // Messages
        g.selectAll(".messagePoints").attr("d", square.size(symbolSize));
        g.selectAll(".msgCluster").attr("d", (d) => {
          const r = clusterRadius(d.count, k);
          return square.size(r * r * 2)();
        });
        g.selectAll(".msgClusterHit").attr("d", (d) => {
          const r = clusterRadius(d.count, k);
          return square.size((r * Math.SQRT2 + hitPad) ** 2)();
        });
        g.selectAll(".msgClusterLabel").attr("font-size", 11 / k);

        // Campsites
        g.selectAll(".campPoints").attr("d", triangle.size(symbolSize));
        g.selectAll(".campCluster").attr("d", (d) => {
          const r = clusterRadius(d.count, k);
          return triangle.size(r * r * 2)();
        });
        g.selectAll(".campClusterHit").attr("d", (d) => {
          const r = clusterRadius(d.count, k);
          return triangle.size((r * Math.SQRT2 + hitPad) ** 2)();
        });
        g.selectAll(".campClusterLabel").attr("font-size", 11 / k);

        // Keep active ring scaled to constant visual size
        g.selectAll(".activeRing").attr("r", 13 / k);

        updateConnectingTriangleRef.current();
      })

      .on("end", (event) => {
        const t = event.transform;
        const prevK = lastRenderedScaleRef.current;
        lastRenderedScaleRef.current = t.k;

        // Skip re-clustering after a pure pan — cluster groupings only change
        // when the scale changes, so there is nothing to re-render.
        if (t.k === prevK) return;

        renderPhotoClusters(t);
        renderMessageClusters(t);
        renderCampClusters(t);
        g.selectAll(
          ".photoHitAreas, .photoClusterHit, .msgClusterHit, .campClusterHit",
        ).raise();
        g.selectAll(".messagePoints, .campPoints").raise();
        separateOverlappingPoints(t);
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    // Leader lines and origin dots — rendered behind all data points.
    const leaderLinesGroup = g.append("g").attr("class", "leaderLinesGroup");

    // Pulsing ring drawn in g-space (zoom-aware) around the active photo dot.
    const activeRing = g
      .append("circle")
      .attr("class", "activeRing")
      .attr("fill", "none")
      .attr("stroke", colors.photosDark)
      .attr("stroke-width", 2)
      .attr("vector-effect", "non-scaling-stroke")
      .attr("pointer-events", "none")
      .attr("display", "none");

    function updateActiveRing() {
      const photo = photoPopoutRef.current;
      const t = currentTransformRef.current ?? d3.zoomIdentity;
      if (!photo) {
        activeRing.attr("display", "none");
        return;
      }
      const [px, py] = projection(photo.item.geometry.coordinates);
      activeRing
        .attr("display", null)
        .attr("cx", px)
        .attr("cy", py)
        .attr("r", 13 / t.k);
    }
    updateActiveRingRef.current = updateActiveRing;

    // Connecting triangle: appended to the SVG viewport (not the zoom-transformed
    // g) so its coordinates stay in viewBox space.  The tip tracks the dot by
    // computing viewBox coords from the current zoom transform each frame.
    // Left vertices are fixed at viewBox x = -100 — always off-screen behind the
    // photo panel — with a constant visual height of 60 viewBox units.
    const connectingTriangle = svg
      .append("polygon")
      .attr("class", "connectingTriangle")
      .attr("fill", "rgba(128,128,128,0.22)")
      .attr("stroke", "none")
      .attr("pointer-events", "none")
      .attr("display", "none");

    function updateConnectingTriangle() {
      const photo = photoPopoutRef.current;
      const t = currentTransformRef.current ?? d3.zoomIdentity;
      if (!photo) {
        connectingTriangle.attr("display", "none");
        return;
      }
      const [px, py] = projection(photo.item.geometry.coordinates);
      // Tip in viewBox coords = zoom transform applied to the projection point
      const tipX = t.x + t.k * px;
      const tipY = t.y + t.k * py;
      const halfH = 150; // constant viewBox units — visually stable at any zoom
      connectingTriangle
        .attr("display", null)
        .attr(
          "points",
          `${tipX},${tipY} ${width / 2},${tipY - halfH} ${width / 2},${tipY + halfH}`,
        );
    }
    updateConnectingTriangleRef.current = updateConnectingTriangle;

    svg.on("click", (event) => {
      if (!event.target.classList.contains("state-clickable")) {
        if (clusterPanelRef.current) {
          setClusterPanel(null);
        } else {
          svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
        }
        clearTimeout(panTimerRef.current);
        setPendingPhotoPopout(null);
        setPhotoPopout(null);
        setDisambigMenu(null);
        setMessagePanel(null);
      }
    });

    function makeSymbolClusterRenderer({
      sites,
      symbol,
      soloClass,
      soloHitClass,
      clusterClass,
      hitClass,
      labelClass,
      fillColor,
      strokeColor,
      tooltipLabel,
      visKey,
      onClusterClick = null,
    }) {
      return function (transform) {
        const k = transform.k;
        const allClasses = [
          `.${soloClass}`,
          soloHitClass ? `.${soloHitClass}` : null,
          `.${clusterClass}`,
          `.${hitClass}`,
          `.${labelClass}`,
        ]
          .filter(Boolean)
          .join(", ");
        g.selectAll(allClasses).remove();

        const { solos, groups } = computeClusters(sites, transform);
        const newSize = 256 / (k * k);
        const rs = ref.current?.getBoundingClientRect().width / width || 1;
        // Hit area: same shape, 5 screen-px padding on every side.
        // Divide by rs so the padding stays ~5px regardless of how wide the SVG
        // is rendered (large monitors have renderScale > 1).
        const hitPad = 10 / (k * rs);
        const hitSize = (Math.sqrt(newSize) + hitPad) ** 2;

        g.selectAll(`.${soloClass}`)
          .data(solos)
          .enter()
          .append("path")
          .attr("class", soloClass)
          .attr("d", symbol.size(newSize))
          .attr("transform", (d) => {
            const [x, y] = projection(d.geometry.coordinates);
            return `translate(${x}, ${y})`;
          })
          .attr("fill", fillColor)
          .attr("stroke", strokeColor)
          .attr("stroke-width", 1.5)
          .attr("vector-effect", "non-scaling-stroke")
          .attr("pointer-events", soloHitClass ? "none" : null)
          .style("pointer-events", soloHitClass ? "none" : null)
          .attr("aria-describedby", soloHitClass ? null : "tooltip")
          .style("cursor", soloHitClass ? null : "default")
          .on(
            "mouseover",
            soloHitClass
              ? null
              : function (event, d) {
                  handleMouseOver(currentUserRef.current)(event, d);
                },
          )
          .on("mousemove", soloHitClass ? null : handleMouseMove)
          .on("mouseout", soloHitClass ? null : handleMouseOut);

        if (soloHitClass) {
          g.selectAll(`.${soloHitClass}`)
            .data(solos)
            .enter()
            .append("path")
            .attr("class", soloHitClass)
            .attr("d", symbol.size(hitSize))
            .attr("transform", (d) => {
              const [x, y] = projection(d.geometry.coordinates);
              return `translate(${x}, ${y})`;
            })
            .attr("fill", "rgba(0,0,0,0.02)")
            .attr("stroke", "none")
            .attr("pointer-events", "all")
            .attr("aria-describedby", "tooltip")
            .style("cursor", "default")
            .on("mouseover", function (event, d) {
              handleMouseOver(currentUserRef.current)(event, d);
            })
            .on("mousemove", handleMouseMove)
            .on("mouseout", handleMouseOut);
        }

        g.selectAll(`.${clusterClass}`)
          .data(groups)
          .enter()
          .append("path")
          .attr("class", clusterClass)
          .attr("d", (d) => {
            const r = clusterRadius(d.count, k);
            return symbol.size(r * r * 2)();
          })
          .attr("transform", (d) => `translate(${d.cx}, ${d.cy})`)
          .attr("fill", fillColor)
          .attr("stroke", strokeColor)
          .attr("stroke-width", 1.5)
          .attr("vector-effect", "non-scaling-stroke")
          .attr("pointer-events", "none");

        g.selectAll(`.${hitClass}`)
          .data(groups)
          .enter()
          .append("path")
          .attr("class", hitClass)
          .attr("d", (d) => {
            const r = clusterRadius(d.count, k);
            const vSide = r * Math.SQRT2;
            return symbol.size((vSide + hitPad) ** 2)();
          })
          .attr("transform", (d) => `translate(${d.cx}, ${d.cy})`)
          .attr("fill", "rgba(0,0,0,0.02)")
          .attr("stroke", "none")
          .attr("vector-effect", "non-scaling-stroke")
          .attr("pointer-events", "all")
          .attr("aria-describedby", "tooltip")
          .on("mouseover", function (_event, d) {
            const tooltip = document.getElementById("tooltip");
            tooltip.classList.remove("invisible", "opacity-0");
            tooltip.classList.add("visible", "opacity-100");
            tooltip.innerHTML = `<p style="font-weight:600">${d.count} ${tooltipLabel}</p>`;
          })
          .on("mousemove", handleMouseMove)
          .on("mouseout", handleMouseOut)
          .on(
            "click",
            onClusterClick
              ? function (event, d) {
                  event.stopPropagation();
                  handleMouseOut();
                  onClusterClick(d);
                }
              : null,
          )
          .style("cursor", onClusterClick ? "pointer" : "default");

        g.selectAll(`.${labelClass}`)
          .data(groups)
          .enter()
          .append("text")
          .attr("class", labelClass)
          .attr("x", (d) => d.cx)
          .attr("y", (d) => d.cy)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("font-size", 11 / k)
          .attr("fill", "white")
          .attr("stroke", "none")
          .attr("pointer-events", "none")
          .text((d) => d.count);

        if (!visibilityRef.current[visKey])
          g.selectAll(allClasses).attr("display", "none");
      };
    }

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
        if (checkForCampsite(d)) {
          campSites.push(d);
        } else {
          messageSites.push(d);
        }
      });

      renderMessageClusters = makeSymbolClusterRenderer({
        sites: messageSites,
        symbol: square,
        soloClass: "messagePoints",
        clusterClass: "msgCluster",
        hitClass: "msgClusterHit",
        labelClass: "msgClusterLabel",
        fillColor: colors.messages,
        strokeColor: colors.messagesDark,
        tooltipLabel: "messages",
        visKey: "messages",
        onClusterClick: (d) => {
          const currentK = currentTransformRef.current?.k ?? 1;
          const maxPreset =
            CLUSTER_ZOOM_PRESETS[CLUSTER_ZOOM_PRESETS.length - 1];
          if (currentK >= maxPreset) {
            const sorted = [...d.points].sort(
              (a, b) =>
                parseGPSTime(a.properties.GPSTime) -
                parseGPSTime(b.properties.GPSTime),
            );
            setMessagePanel({ items: sorted });
            // Stop any running zoom transition (fires "interrupt", not "end")
            d3.select(ref.current).interrupt();
            // Pan the cluster into the right-half visible area by writing the
            // new transform directly onto the SVG — bypassing zoom.translateTo
            // so no zoom "end" event is dispatched and no blink fires.
            if (ref.current && gRef.current) {
              const svgRect = ref.current.getBoundingClientRect();
              const cRect =
                ref.current.parentElement?.getBoundingClientRect() ?? svgRect;
              const panelRight = cRect.left + cRect.width / 2;
              if (panelRight < svgRect.right) {
                const [targetX, targetY] = panTarget(svgRect, panelRight);
                const newT = d3.zoomIdentity
                  .translate(targetX - currentK * d.cx, targetY - currentK * d.cy)
                  .scale(currentK);
                ref.current.__zoom = newT;
                gRef.current.attr("transform", newT);
                currentTransformRef.current = newT;
              }
            }
          } else {
            const nextScale =
              CLUSTER_ZOOM_PRESETS.find((p) => p > currentK) ?? maxPreset;
            setClusterPanel({
              type: "message",
              scale: nextScale,
              items: d.points,
              projPoints: d.points.map((p) =>
                projection(p.geometry.coordinates),
              ),
            });
          }
        },
      });

      renderCampClusters = makeSymbolClusterRenderer({
        sites: campSites,
        symbol: triangle,
        soloClass: "campPoints",
        clusterClass: "campCluster",
        hitClass: "campClusterHit",
        labelClass: "campClusterLabel",
        fillColor: colors.campSitesLight,
        strokeColor: colors.campSites,
        tooltipLabel: "campsites",
        visKey: "campsites",
      });

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

      renderPhotoClusters = function (transform) {
        const k = transform.k;
        const rs = ref.current?.getBoundingClientRect().width / width || 1;

        g.selectAll(
          ".photoPoints, .photoHitAreas, .photoCluster, .photoClusterHit, .photoClusterLabel",
        ).remove();

        const { solos, groups } = computeClusters(validPhotoPoints, transform);

        g.selectAll(".photoPoints")
          .data(solos)
          .enter()
          .append("circle")
          .attr("class", "photoPoints")
          .attr("cx", (d) => projection(d.geometry.coordinates)[0])
          .attr("cy", (d) => projection(d.geometry.coordinates)[1])
          .attr("r", 9 / k)
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
          .attr("r", (9 + 5 / rs) / k)
          .attr("fill", "rgba(0,0,0,0.02)")
          .attr("stroke", "none")
          .attr("role", "button")
          .attr("tabindex", "0")
          .attr("aria-label", (d) => {
            const dt = d.properties?.dateTime;
            if (!dt) return "View photo";
            const dateStr = new Date(normalizeExifDate(dt)).toLocaleDateString(
              "en-US",
              {
                month: "long",
                day: "numeric",
                year: "numeric",
              },
            );
            return `View photo from ${dateStr}`;
          })
          .attr("aria-describedby", "tooltip")
          .style("cursor", "pointer")
          .style("outline", "none")
          .on("keydown", function (event, d) {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setMessagePanel(null);
              setPhotoPopout(null);
              setPendingPhotoPopout({ item: d });
            }
          })
          .on("click", function (event, d) {
            event.stopPropagation();
            const t = currentTransformRef.current ?? d3.zoomIdentity;
            const hitR = 20 / t.k;
            const dp = displacedPositions.get(d);
            const [dpx, dpy] = dp
              ? [dp.x, dp.y]
              : projection(d.geometry.coordinates);
            const others = [];
            for (const site of campSites) {
              const sp = displacedPositions.get(site);
              const pos = sp
                ? [sp.x, sp.y]
                : projection(site.geometry.coordinates);
              if (pos && Math.hypot(pos[0] - dpx, pos[1] - dpy) <= hitR)
                others.push({ kind: "campsite", data: site });
            }
            for (const site of messageSites) {
              const sp = displacedPositions.get(site);
              const pos = sp
                ? [sp.x, sp.y]
                : projection(site.geometry.coordinates);
              if (pos && Math.hypot(pos[0] - dpx, pos[1] - dpy) <= hitR)
                others.push({ kind: "message", data: site });
            }
            if (others.length > 0) {
              setDisambigMenu({
                x: event.clientX,
                y: event.clientY,
                photo: d,
                others,
              });
            } else {
              setMessagePanel(null);
              setPhotoPopout(null);
              setPendingPhotoPopout({ item: d });
            }
          });

        function openPhotoClusterPanel(d) {
          handleMouseOut();
          clearTimeout(panTimerRef.current);
          setPendingPhotoPopout(null);
          setPhotoPopout(null);
          const currentK = currentTransformRef.current?.k ?? 1;
          const nextScale =
            CLUSTER_ZOOM_PRESETS.find((p) => p > currentK) ??
            CLUSTER_ZOOM_PRESETS[CLUSTER_ZOOM_PRESETS.length - 1];
          setClusterPanel({
            type: "photo",
            scale: nextScale,
            items: d.points,
            projPoints: d.points.map((p) => projection(p.geometry.coordinates)),
          });
        }

        // Cluster circles — radius grows with log of count so large clusters
        // don't dwarf individual dots
        g.selectAll(".photoCluster")
          .data(groups)
          .enter()
          .append("circle")
          .attr("class", "photoCluster")
          .attr("cx", (d) => d.cx)
          .attr("cy", (d) => d.cy)
          .attr("r", (d) => clusterRadius(d.count, k))
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
          .attr("r", (d) => clusterRadius(d.count, k) + 5 / (rs * k))
          .attr("fill", "rgba(0,0,0,0.02)")
          .attr("stroke", "none")
          .attr("role", "button")
          .attr("tabindex", "0")
          .attr("aria-label", (d) => `View cluster of ${d.count} photos`)
          .attr("aria-describedby", "tooltip")
          .style("cursor", "pointer")
          .style("outline", "none")
          .on("mousemove", handleMouseMove)
          .on("mouseout", handleMouseOut)
          .on("keydown", function (event, d) {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openPhotoClusterPanel(d);
            }
          })
          .on("click", function (event, d) {
            event.stopPropagation();
            openPhotoClusterPanel(d);
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
          .attr("font-size", 11 / k)
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

      // Draws debug outlines by copying the exact path/circle of each hit element.
      renderDebugHitAreas = function () {
        g.selectAll(".debugHit").remove();

        const addPathCopy = (el, stroke) => {
          const s = d3.select(el);
          g.append("path")
            .attr("class", "debugHit")
            .attr("d", s.attr("d"))
            .attr("transform", s.attr("transform"))
            .attr("fill", "none")
            .attr("stroke", stroke)
            .attr("stroke-width", 2)
            .attr("pointer-events", "none")
            .attr("vector-effect", "non-scaling-stroke");
        };

        const addCircleCopy = (el, stroke) => {
          const s = d3.select(el);
          g.append("circle")
            .attr("class", "debugHit")
            .attr("cx", s.attr("cx"))
            .attr("cy", s.attr("cy"))
            .attr("r", s.attr("r"))
            .attr("fill", "none")
            .attr("stroke", stroke)
            .attr("stroke-width", 2)
            .attr("pointer-events", "none")
            .attr("vector-effect", "non-scaling-stroke");
        };

        g.selectAll(".photoHitAreas").each(function () {
          addCircleCopy(this, "blue");
        });
        g.selectAll(".photoClusterHit").each(function () {
          addCircleCopy(this, "cyan");
        });
        // White outlines over colored fills so the boundary is clearly visible
        g.selectAll(".msgHitArea").each(function () {
          addPathCopy(this, "white");
        });
        g.selectAll(".msgClusterHit").each(function () {
          addPathCopy(this, "orange");
        });
        g.selectAll(".campHitArea").each(function () {
          addPathCopy(this, "white");
        });
        g.selectAll(".campClusterHit").each(function () {
          addPathCopy(this, "limegreen");
        });
        // Purple = visual element boundary (should be inside the red/green filled hit area)
        g.selectAll(".messagePoints").each(function () {
          addPathCopy(this, "purple");
        });
        g.selectAll(".campPoints").each(function () {
          addPathCopy(this, "purple");
        });

        g.selectAll(".debugHit").raise();
      };

      // Initial render order matches zoom-end order: photos → messages → campsites
      renderPhotoClusters(currentTransformRef.current ?? d3.zoomIdentity);
      renderMessageClusters(currentTransformRef.current ?? d3.zoomIdentity);
      renderCampClusters(currentTransformRef.current ?? d3.zoomIdentity);
      g.selectAll(
        ".photoHitAreas, .photoClusterHit, .msgClusterHit, .campClusterHit",
      ).raise();
      g.selectAll(".messagePoints, .campPoints").raise();
      separateOverlappingPoints(currentTransformRef.current ?? d3.zoomIdentity);
      // renderDebugHitAreas(); // DEBUG: uncomment to overlay hit area outlines

      /* -----------------------------------------------------
      *  Track mapping functionality (rendered last = on top)
      ----------------------------------------------------- */

      const trailFeatures = trackData.features.filter(
        (d) =>
          Array.isArray(d.geometry?.coordinates) &&
          d.geometry.coordinates.length > 0,
      );

      g.selectAll(".trail")
        .data(trailFeatures)
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

      g.selectAll(".trail-hit")
        .data(trailFeatures)
        .enter()
        .append("path")
        .attr("class", "trail-hit")
        .attr("d", d3.geoPath().projection(projection))
        .attr("fill", "none")
        .attr("stroke", "transparent")
        .attr("stroke-width", 12)
        .attr("vector-effect", "non-scaling-stroke")
        .attr("aria-describedby", "tooltip")
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
          if (!currentUserRef.current) return;
          const entryId = d.properties.entry_id;
          if (!entryId) return;
          handleMouseOut();
          routerRef.current.push(`/journal/${entryId}`);
        })
        .style("cursor", (d) =>
          d.properties.entry_id && currentUserRef.current
            ? "pointer"
            : "default",
        )
        .attr("display", "none");

      // Raise leader lines and origin dots above the trail layer
      leaderLinesGroup.raise();
      // g.selectAll(".debugHit").raise(); // DEBUG: uncomment with renderDebugHitAreas

      /* -----------------------------------------------------
      *  City labels (rendered last so they float above state lines)
      ----------------------------------------------------- */

      // City label overlay is appended to svg (not g) so it is not affected by
      // the zoom transform — positions are updated manually on every zoom tick.
      const cityLabelsGroup = svg.append("g").attr("class", "city_label_layer");

      cityLabelsGroup
        .selectAll("text")
        .data(cities)
        .enter()
        .append("text")
        .attr("class", "city_labels")
        .attr("display", "none")
        .attr("data-dot-x", (d) => projection([d.lon, d.lat])[0])
        .attr("data-dot-y", (d) => projection([d.lon, d.lat])[1])
        .attr("data-side", (d) => (d.dx > 0 ? 1 : -1))
        .attr("x", (d) => projection([d.lon, d.lat])[0])
        .attr("y", (d) => projection([d.lon, d.lat])[1])
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

  // Use displayedPopout for rendering so content stays visible during fade-out
  const popoutProps = displayedPopout?.item?.properties ?? null;
  const popoutDate = useMemo(() => {
    if (!popoutProps?.dateTime) return { dateStr: "", timeStr: "" };
    const dt = new Date(normalizeExifDate(popoutProps.dateTime));
    return {
      dateStr: dt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      timeStr: dt.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    };
  }, [popoutProps]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <style>{`
        @keyframes ring-pulse { 0%, 100% { opacity: 0.9; } 50% { opacity: 0.2; } }
        .activeRing { animation: ring-pulse 1.5s ease-in-out infinite; }
        @keyframes photo-fade-in  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes photo-fade-out { from { opacity: 1; } to { opacity: 0; } }
      `}</style>
      <svg
        ref={ref}
        aria-label="Continental Divide Trail interactive map"
        style={{
          display: "block",
          width: "100%",
          height: "auto",
          maxHeight: "100%",
          aspectRatio: `${width} / ${height}`,
        }}
      ></svg>

      {/* Photo panel — overlays the left half, photo at natural proportions */}
      {displayedPopout && (
        <div
          className={`absolute inset-y-0 left-0 w-1/2 z-10 flex flex-col items-center justify-center gap-3 pl-6 pr-2 pt-6 pb-6 ${notoSans.className}`}
          style={{
            animation: photoPopout
              ? "photo-fade-in 0.3s ease-in-out forwards"
              : "photo-fade-out 0.3s ease-in-out forwards",
            pointerEvents: photoPopout ? "auto" : "none",
          }}
          onClick={() => {
            clearTimeout(panTimerRef.current);
            setPendingPhotoPopout(null);
            setPhotoPopout(null);
          }}
        >
          {/* Photo card — stopPropagation so clicks on the photo don't close the panel */}
          <div
            style={{
              position: "relative",
              maxWidth: "100%",
              maxHeight: "calc(100% - 80px)",
              borderRadius: 8,
              overflow: "hidden",
              flexShrink: 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearTimeout(panTimerRef.current);
                setPendingPhotoPopout(null);
                setPhotoPopout(null);
                setClusterPanel(null);
                setDisambigMenu(null);
              }}
              aria-label="Close"
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.5)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontSize: 18,
                lineHeight: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1,
              }}
            >
              ×
            </button>
            <img
              src={popoutProps?.path}
              alt="Trail photo"
              style={{
                display: "block",
                maxWidth: "100%",
                maxHeight: "100%",
                width: "auto",
                height: "auto",
              }}
            />
            {/* Date / time gradient overlay at the bottom edge of the photo */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                padding: "40px 16px 16px",
                color: "#fff",
                pointerEvents: "none",
              }}
            >
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                {popoutDate.dateStr}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.85 }}>
                {popoutDate.timeStr}
              </p>
            </div>
          </div>

          {/* Caption editor */}
          <div
            style={{ width: "100%", maxWidth: "100%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <textarea
              value={captionDraft}
              onChange={(e) => {
                setCaptionDraft(e.target.value);
                setCaptionSaved(false);
              }}
              onBlur={async () => {
                const photoId = displayedPopout?.item?.properties?.photo_id;
                if (photoId == null) return;
                const current =
                  displayedPopout?.item?.properties?.caption ?? "";
                if (captionDraft === current && !captionSaved) return;
                await updatePhotoCaption(String(photoId), captionDraft);
                setCaptionSaved(true);
              }}
              placeholder="Add a caption…"
              rows={2}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.92)",
                border: "1px solid rgba(0,0,0,0.15)",
                borderRadius: 6,
                fontSize: 13,
                padding: "8px 10px",
                resize: "none",
                outline: "none",
                color: "#222",
                boxSizing: "border-box",
              }}
            />
            {captionSaved && (
              <p
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.8)",
                  margin: "4px 0 0",
                }}
              >
                Saved
              </p>
            )}
          </div>
        </div>
      )}

      {/* Message panel — lists InReach messages in a cluster */}
      {messagePanel &&
        (() => {
          const firstDate = parseGPSTime(
            messagePanel.items[0].properties.GPSTime,
          );
          const lastDate = parseGPSTime(
            messagePanel.items[messagePanel.items.length - 1].properties
              .GPSTime,
          );
          const formatDate = (d) =>
            d.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            });
          const dateRangeStr =
            firstDate.toDateString() === lastDate.toDateString()
              ? formatDate(firstDate)
              : `${formatDate(firstDate)} – ${formatDate(lastDate)}`;

          return (
            <div
              className={`absolute inset-y-0 left-0 w-1/2 z-10 p-6 pr-0 ${notoSans.className}`}
              style={{ animation: "photo-fade-in 0.3s ease-in-out forwards" }}
            >
              <div
                className="flex flex-col h-full rounded-xl shadow-2xl overflow-hidden"
                style={{ background: "rgba(255,255,255,0.97)" }}
              >
                <div
                  className="flex items-center justify-between px-5 py-3 flex-shrink-0"
                  style={{ background: colors.messages }}
                >
                  <div>
                    <p className="font-semibold text-white text-sm uppercase tracking-wide">
                      InReach Messages
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "rgba(255,255,255,0.8)" }}
                    >
                      {messagePanel.items.length} message
                      {messagePanel.items.length !== 1 ? "s" : ""}
                      {" · "}
                      {dateRangeStr}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setMessagePanel(null);
                      setClusterPanel(null);
                    }}
                    aria-label="Close"
                    style={{
                      color: "#fff",
                      background: "rgba(0,0,0,0.2)",
                      borderRadius: "50%",
                      width: 28,
                      height: 28,
                      border: "none",
                      cursor: "pointer",
                      fontSize: 18,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ×
                  </button>
                </div>
                <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
                  {messagePanel.items.map((item, i) => {
                    const date = parseGPSTime(item.properties.GPSTime);
                    const dateStr = date.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    });
                    const timeStr = date.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    });
                    const text =
                      session?.user?.email === "katy6514@gmail.com"
                        ? item.properties.MessageText
                        : "Message hidden";
                    return (
                      <div key={i} className="px-5 py-3">
                        <p
                          className="text-xs font-medium"
                          style={{ color: colors.messagesDark }}
                        >
                          {dateStr} · {timeStr}
                        </p>
                        <p className="text-sm text-gray-800 mt-1">{text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

      {/* Disambiguation menu — shown when a photo dot overlaps another point type */}
      {disambigMenu && (
        <div
          className={`fixed z-50 rounded-lg shadow-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 overflow-hidden ${notoSans.className}`}
          style={{ left: disambigMenu.x + 8, top: disambigMenu.y - 8 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800">
            Select item
          </div>
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
            onClick={() => {
              setMessagePanel(null);
              setPhotoPopout(null);
              setPendingPhotoPopout({ item: disambigMenu.photo });
              setDisambigMenu(null);
            }}
          >
            <span style={{ color: colors.photosDark }}>●</span>
            <span>
              Photo
              {disambigMenu.photo.properties?.dateTime
                ? " — " +
                  new Date(
                    normalizeExifDate(disambigMenu.photo.properties.dateTime),
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : ""}
            </span>
          </button>
          {disambigMenu.others.map((item, i) => {
            const dt =
              item.data.properties?.dateTime ?? item.data.properties?.DateTime;
            const dateLabel = dt
              ? " — " +
                new Date(normalizeExifDate(dt)).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : "";
            return (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 select-none"
              >
                <span
                  style={{
                    color:
                      item.kind === "campsite"
                        ? colors.campSites
                        : colors.messagesDark,
                  }}
                >
                  {item.kind === "campsite" ? "▲" : "■"}
                </span>
                <span className="capitalize">
                  {item.kind}
                  {dateLabel}
                </span>
              </div>
            );
          })}
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
    </div>
  );
}
