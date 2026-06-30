"use client";

import React, { useRef, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

import * as d3 from "d3";

import { width, height, cities, colors } from "./constants";
import { updatePhotoCaption } from "@/app/lib/actions/photos";
import { notoSans, notoSerif } from "@/app/ui/fonts";

import {
  getAlternatingColor,
  checkForCampsite,
  normalizeExifDate,
  parseGPSTime,
  handleMouseMove,
  handleMouseOut,
  handleMouseOver,
} from "./utils";
import { MapIcon, MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

const clusterRadius = (count, k) => (9 + Math.log(count + 1) * 5) / k;

const CLUSTER_RADIUS = 20;
const MAX_CLUSTER_ZOOM = 500;
// At this zoom and above, photo clusters are force-dissolved into individual points.
const PHOTO_FORCE_DISSOLVE_ZOOM = 250;

// Minimum zoom scale at which the two farthest points in a cluster would
// exceed CLUSTER_RADIUS screen pixels apart (i.e. the cluster starts to break).
// Returns Infinity for perfectly co-located points.
function clusterDissolveScale(points, projection) {
  let maxDist = 0;
  for (let i = 0; i < points.length; i++) {
    const [ax, ay] = projection(points[i].geometry.coordinates);
    for (let j = i + 1; j < points.length; j++) {
      const [bx, by] = projection(points[j].geometry.coordinates);
      maxDist = Math.max(maxDist, Math.hypot(ax - bx, ay - by));
    }
  }
  return maxDist > 0 ? CLUSTER_RADIUS / maxDist : Infinity;
}

// Target zoom scale for a cluster click: past dissolve point, at least 8, capped at max.
function clusterZoomTarget(points, currentK, projection) {
  const dissolveK = clusterDissolveScale(points, projection);
  return Math.min(MAX_CLUSTER_ZOOM, Math.max(dissolveK * 1.4, currentK, 8));
}

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

  const [visibility, setVisibility] = useState({
    photos: true,
    campsites: true,
    messages: true,
    contours: true,

  });
  const visibilityRef = useRef(visibility);
  visibilityRef.current = visibility;

  const [clusterPanel, setClusterPanel] = useState(null);
  const clusterPanelRef = useRef(clusterPanel);
  clusterPanelRef.current = clusterPanel;
  const zoomRef = useRef(null);

  const [messagePanel, setMessagePanel] = useState(null);
  const messagePanelRef = useRef(messagePanel);
  messagePanelRef.current = messagePanel;

  const updateActiveHighlightRef = useRef(() => {});
  const closeAllPanelsRef = useRef(() => {});

  // Floating photo popout: shown when a photo point or cluster is clicked
  const [photoPopout, setPhotoPopout] = useState(null);

  // Read ref so D3 closures can read the current photoPopout value
  const photoPopoutRef = useRef(photoPopout);
  photoPopoutRef.current = photoPopout;

  // All valid photo features sorted by dateTime — populated when D3 loads photoData
  const allPhotosRef = useRef([]);
  // Re-assigned each render so buttons/keyboard always call the latest version
  const navigatePhotoRef = useRef(() => {});

  // Pending popout: set immediately on click; photoPopout is set after pan completes
  const [pendingPhotoPopout, setPendingPhotoPopout] = useState(null);
  const panTimerRef = useRef(null);

  // Scale at the last cluster re-render; used to skip re-renders on pure pans
  const lastRenderedScaleRef = useRef(null);

  // Disambiguation menu: shown when a photo dot overlaps a camp/message point
  const [disambigMenu, setDisambigMenu] = useState(null);

  const [legPanel, setLegPanel] = useState(null);
  const legPanelRef = useRef(legPanel);
  legPanelRef.current = legPanel;

  const [scaleBar, setScaleBar] = useState(null);
  const updateScaleBarRef = useRef(() => {});

  const [exploreOpen, setExploreOpen] = useState(false);
  const [exploreData, setExploreData] = useState(null);
  const [mapMessageCount, setMapMessageCount] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const stateDataRef = useRef(null);
  const zoomToStateRef = useRef(() => {});
  const trackDataRef = useRef(null);
  const openLegByEntryIdRef = useRef(() => {});
  const pendingLegTitleRef = useRef(null);
  const searchParams = useSearchParams();
  const initialEntryId = useRef(searchParams.get("entry_id"));

  const [captionDraft, setCaptionDraft] = useState("");
  const [captionSaved, setCaptionSaved] = useState(false);
  const lastSavedCaptionRef = useRef("");

  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mq.matches);
    const handler = (e) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    fetch("/api/explore").then((r) => r.json()).then(setExploreData);
  }, []);

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
      ".photoPoints, .photoHitAreas, .photoCluster, .photoClusterHit, .photoClusterLabel, .photoThumbGroup",
    ).attr("display", visibility.photos ? null : "none");
    g.selectAll(
      ".campPoints, .campCluster, .campClusterHit, .campClusterLabel",
    ).attr("display", visibility.campsites ? null : "none");
    g.selectAll(
      ".messagePoints, .msgCluster, .msgClusterHit, .msgClusterLabel",
    ).attr("display", visibility.messages ? null : "none");
    g.selectAll(".contour").attr("display", visibility.contours ? null : "none");

  }, [visibility]);

  // When a cluster is clicked, zoom to the next pre-set level centered on the cluster centroid.
  useEffect(() => {
    if (!clusterPanel) return;
    if (!zoomRef.current || !ref.current) return;

    const targetScale = clusterPanel.scale ?? MAX_CLUSTER_ZOOM;

    const xs = clusterPanel.projPoints.map((p) => p[0]);
    const ys = clusterPanel.projPoints.map((p) => p[1]);
    const x0 = Math.min(...xs),
      x1 = Math.max(...xs);
    const y0 = Math.min(...ys),
      y1 = Math.max(...ys);

    // Center on bounding box midpoint (better than mean for asymmetric clusters)
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;

    // Zoom to dissolve target, but at least enough to fit all points in view.
    const pad = 80;
    const fitScale = Math.min(
      (width - pad * 2) / Math.max(x1 - x0, 1),
      (height - pad * 2) / Math.max(y1 - y0, 1),
    );
    const scale = Math.max(targetScale, fitScale, 8);

    // Check whether the cluster centroid is near an edge of the visible area.
    // If not, zoom in place (no pan) rather than re-centering the map.
    const svgRect = ref.current.getBoundingClientRect();
    const t = currentTransformRef.current ?? d3.zoomIdentity;
    const rs = Math.min(svgRect.width / width, svgRect.height / height);
    const ox = (svgRect.width - width * rs) / 2;
    const oy = (svgRect.height - height * rs) / 2;
    const [lx, ly] = t.apply([cx, cy]);
    const sx_screen = svgRect.left + ox + lx * rs;
    const sy_screen = svgRect.top + oy + ly * rs;
    const PAD = 60;
    const nearEdge =
      sx_screen < svgRect.left + PAD ||
      sx_screen > svgRect.right - PAD ||
      sy_screen < svgRect.top + PAD ||
      sy_screen > svgRect.bottom - PAD;

    // Near edge: pan to center. Otherwise: zoom in place around the centroid.
    const newT = nearEdge
      ? d3.zoomIdentity.translate(width / 2 - scale * cx, height / 2 - scale * cy).scale(scale)
      : d3.zoomIdentity.translate(lx - scale * cx, ly - scale * cy).scale(scale);

    d3.select(ref.current)
      .transition()
      .duration(1200)
      .ease(d3.easeCubicInOut)
      .call(zoomRef.current.transform, newT);
  }, [clusterPanel]);

  // When a dot is clicked, pan the map first; reveal the photo panel after.
  // If switching between photos (prevOpen), skip the pan unless the dot is
  // within 30 screen-px of a visible-area edge (including the panel boundary).
  useEffect(() => {
    clearTimeout(panTimerRef.current);
    if (!pendingPhotoPopout) return;
    const { item, prevOpen } = pendingPhotoPopout;
    const [px, py] = projection(item.geometry.coordinates);
    const onReveal = () => {
      setPhotoPopout(pendingPhotoPopout);
      setMessagePanel(null);
    };
    if (prevOpen) {
      const svgEl = ref.current;
      const svgRect = svgEl?.getBoundingClientRect();
      if (svgEl && svgRect) {
        const t = currentTransformRef.current ?? d3.zoomIdentity;
        const rs = Math.min(svgRect.width / width, svgRect.height / height);
        const ox = (svgRect.width - width * rs) / 2;
        const oy = (svgRect.height - height * rs) / 2;
        const [lx, ly] = t.apply([px, py]);
        const sx_screen = svgRect.left + ox + lx * rs;
        const sy_screen = svgRect.top + oy + ly * rs;
        const cRect = svgEl.parentElement?.getBoundingClientRect() ?? svgRect;
        const panelRight = cRect.left + cRect.width / 2;
        const PAD = 60;
        const nearEdge =
          sx_screen < panelRight + PAD ||
          sx_screen > svgRect.right - PAD ||
          sy_screen < svgRect.top + PAD ||
          sy_screen > svgRect.bottom - PAD;
        if (!nearEdge) {
          onReveal();
          return () => {};
        }
      }
    }
    panThenReveal(ref.current, zoomRef.current, px, py, panTimerRef, onReveal);
    return () => clearTimeout(panTimerRef.current);
  }, [pendingPhotoPopout]); // projection omitted: memoized with [] so never changes

  // When a trail leg panel opens, zoom to show the leg on the right half.
  // When it closes, reset to the identity transform.
  useEffect(() => {
    if (!legPanel) return;
    if (!zoomRef.current || !ref.current) return;

    const svgRect = ref.current.getBoundingClientRect();
    const rs = Math.min(svgRect.width / width, svgRect.height / height);
    const ox = (svgRect.width - width * rs) / 2;
    const oy = (svgRect.height - height * rs) / 2;

    const projected = legPanel.coordinates.map((c) => projection(c));
    const xs = projected.map((p) => p[0]);
    const ys = projected.map((p) => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    const y0 = Math.min(...ys), y1 = Math.max(...ys);
    const legW = x1 - x0;
    const legH = y1 - y0;
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;

    // Fit the leg into the right half of the viewport with padding.
    const PAD = 80;
    const availW = svgRect.width * (1 - PANEL_FRACTION) - PAD * 2;
    const availH = svgRect.height - PAD * 2;
    const k = Math.max(1, Math.min(
      legW > 0 ? availW / (legW * rs) : 500,
      legH > 0 ? availH / (legH * rs) : 500,
      500,
    ));

    // Target: center of the right (non-panel) half in SVG viewport units.
    const targetVBX = (svgRect.width * (1 + PANEL_FRACTION) / 2 - ox) / rs;
    const targetVBY = (svgRect.height / 2 - oy) / rs;
    const newT = d3.zoomIdentity.translate(targetVBX - k * cx, targetVBY - k * cy).scale(k);

    d3.select(ref.current)
      .transition()
      .duration(1000)
      .ease(d3.easeCubicInOut)
      .call(zoomRef.current.transform, newT);
  }, [legPanel]); // projection stable (memoized with [])

  // Re-apply active highlight whenever selection changes.
  useEffect(() => {
    updateActiveHighlightRef.current();
  }, [photoPopout]);

  useEffect(() => {
    updateActiveHighlightRef.current();
  }, [messagePanel]);

  useEffect(() => {
    updateActiveHighlightRef.current();
  }, [legPanel]);

  const [captionModalOpen, setCaptionModalOpen] = useState(false);

  // Reset caption draft and close modal whenever a new photo is selected.
  useEffect(() => {
    const val = photoPopout?.item?.properties?.caption ?? "";
    setCaptionDraft(val);
    lastSavedCaptionRef.current = val;
    setCaptionSaved(false);
    setCaptionModalOpen(false);
  }, [photoPopout]);

  // Arrow-key navigation through photos when the popout is open
  useEffect(() => {
    function handleKeyDown(e) {
      if (!photoPopoutRef.current) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      navigatePhotoRef.current(e.key === "ArrowRight" ? 1 : -1);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []); // stable — reads only from refs

  navigatePhotoRef.current = (dir) => {
    const photos = allPhotosRef.current;
    if (!photos.length || !photoPopoutRef.current) return;
    const currentPath = photoPopoutRef.current.item?.properties?.path;
    const idx = photos.findIndex((p) => p.properties.path === currentPath);
    if (idx === -1) return;
    const nextIdx = Math.max(0, Math.min(photos.length - 1, idx + dir));
    if (nextIdx !== idx) setPhotoPopout({ item: photos[nextIdx], prevOpen: true });
  };

  // Re-assigned on every render so D3 closures (registered once) always call
  // the latest version, which holds stable React setters and the panTimerRef.
  closeAllPanelsRef.current = () => {
    clearTimeout(panTimerRef.current);
    setPendingPhotoPopout(null);
    setPhotoPopout(null);
    setMessagePanel(null);
    setClusterPanel(null);
    setLegPanel(null);
    setDisambigMenu(null);
  };

  openLegByEntryIdRef.current = (entryId) => {
    const feature = trackDataRef.current?.find(
      (f) => f.properties.entry_id === entryId,
    );
    if (!feature) return;

    const raw = feature.properties.date;
    const dateStr = raw
      ? new Date(raw + "T00:00:00").toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : null;
    const panelData = {
      title: feature.properties.title,
      date: dateStr,
      name: feature.properties.description || "",
      text: feature.properties.text || null,
      entryId: feature.properties.entry_id || null,
      color: getAlternatingColor(feature.properties),
      coordinates: feature.geometry.coordinates,
    };

    closeAllPanelsRef.current();
    setExploreOpen(false);

    // Start pulsing the trail immediately so it's visible during the zoom.
    // pendingLegTitleRef is read by updateActiveHighlight on every zoom tick.
    pendingLegTitleRef.current = panelData.title;

    // Zoom to leg — same math as the legPanel useEffect.
    if (ref.current && zoomRef.current) {
      const svgRect = ref.current.getBoundingClientRect();
      const rs = Math.min(svgRect.width / width, svgRect.height / height);
      const ox = (svgRect.width - width * rs) / 2;
      const oy = (svgRect.height - height * rs) / 2;
      const projected = panelData.coordinates.map((c) => projection(c));
      const xs = projected.map((p) => p[0]);
      const ys = projected.map((p) => p[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs);
      const y0 = Math.min(...ys), y1 = Math.max(...ys);
      const legW = x1 - x0, legH = y1 - y0;
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      const PAD = 80;
      const availW = svgRect.width * (1 - PANEL_FRACTION) - PAD * 2;
      const availH = svgRect.height - PAD * 2;
      const k = Math.max(1, Math.min(
        legW > 0 ? availW / (legW * rs) : 500,
        legH > 0 ? availH / (legH * rs) : 500,
        500,
      ));
      const targetVBX = (svgRect.width * (1 + PANEL_FRACTION) / 2 - ox) / rs;
      const targetVBY = (svgRect.height / 2 - oy) / rs;
      const newT = d3.zoomIdentity.translate(targetVBX - k * cx, targetVBY - k * cy).scale(k);
      d3.select(ref.current)
        .transition()
        .duration(1000)
        .ease(d3.easeCubicInOut)
        .call(zoomRef.current.transform, newT);
    }

    // Open the panel after the zoom finishes, then clear the pending title
    // (legPanel useEffect will re-run zoom but it's already at the right position).
    setTimeout(() => {
      pendingLegTitleRef.current = null;
      setLegPanel(panelData);
    }, 1100);
  };

  zoomToStateRef.current = (stateName) => {
    const svgEl = ref.current;
    if (!svgEl || !zoomRef.current || !stateDataRef.current) return;
    const feature = stateDataRef.current.find((f) => f.properties.name === stateName);
    if (!feature) return;
    const [[x0, y0], [x1, y1]] = path.bounds(feature);
    const dx = x1 - x0;
    const dy = y1 - y0;
    const x = (x0 + x1) / 2;
    const y = (y0 + y1) / 2;
    const scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height)));
    const translate = [width / 2 - scale * x, height / 2 - scale * y];
    d3.select(svgEl)
      .transition()
      .duration(750)
      .call(
        zoomRef.current.transform,
        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale),
      );
  };

  const MI_STEPS = [0.1, 0.25, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
  updateScaleBarRef.current = (transform) => {
    if (!ref.current || !projection.invert) return;
    const svgRect = ref.current.getBoundingClientRect();
    const k = transform.k;
    const rs = svgRect.width / width;
    const cx = (width / 2 - transform.x) / k;
    const cy = (height / 2 - transform.y) / k;
    const p1 = projection.invert([cx, cy]);
    const p2 = projection.invert([cx + 1, cy]);
    if (!p1 || !p2) return;
    const miPerGPx = d3.geoDistance(p1, p2) * 3959;
    if (!miPerGPx) return;
    const miPerCssPx = miPerGPx / (k * rs);
    const targetMi = 140 * miPerCssPx;
    const niceMi = MI_STEPS.find((d) => d >= targetMi) ?? MI_STEPS[MI_STEPS.length - 1];
    const widthPx = Math.round(niceMi / miPerCssPx);
    if (widthPx < 20 || widthPx > 500) return;
    setScaleBar({
      widthPx,
      label: niceMi >= 1 ? `${niceMi} mi` : `${Math.round(niceMi * 5280)} ft`,
    });
  };

  // Fraction of the viewport width occupied by left-side panels (w-1/2).
  // Update here if any panel container's width class changes.
  const PANEL_FRACTION = 0.5;
  // Shared shadow for all three panel inner cards — heavier on the right edge.
  const PANEL_SHADOW = "8px 0 40px rgba(0,0,0,0.28), 0 4px 24px rgba(0,0,0,0.15), 28px 0 60px rgba(0,0,0,0.18)";

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
    const thinCrossType = {
      draw(context, size) {
        const r = Math.sqrt(size) / 2;
        context.moveTo(0, -r);
        context.lineTo(0, r);
        context.moveTo(-r, 0);
        context.lineTo(r, 0);
      },
    };
    const cross = d3.symbol().type(thinCrossType).size(169);

    // Shared greedy clustering: groups sites whose screen-space positions are
    // within CLUSTER_RADIUS pixels of each other at the current transform.
    // Returns { solos, groups } where groups carry projection-space centroids.
    function computeClusters(sites, transform) {
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
            if (Math.hypot(dx, dy) <= CLUSTER_RADIUS) {
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

    // Tracks force-displaced positions so the photo click handler can test
    // against visual positions rather than original projection coordinates.
    const displacedPositions = new Map();
    // Cluster positions keyed by centroid string ("cx,cy") so they survive
    // the data-object churn caused by renderPhotoClusters re-creating elements
    // on every pan (cluster objects are new instances each time, so identity
    // matching via displacedPositions fails for them).
    const displacedClusterPositions = new Map();

    // Separate overlapping solo points using per-hotspot force simulations.
    // Points are first grouped into geographic hotspots via BFS; each hotspot
    // with >1 node gets its own simulation anchored to the hotspot centroid
    // rather than individual origins, so nodes spread freely without the anchor
    // force fighting the collision force.
    function separateOverlappingPoints(transform) {
      const k = transform.k;
      leaderLinesGroup.selectAll("*").remove();
      displacedPositions.clear();
      displacedClusterPositions.clear();
      if (k < 4) return;

      // Match the visual radii used in renderPhotoClusters / zoom handler
      const photoR = 18 / k;
      const symbolR = Math.sqrt(256 / Math.PI) / k; // ≈ 9/k
      const clusterR = (d) => clusterRadius(d.count, k);

      const nodes = [];

      // Movable solo points (plain circles + thumbnail groups)
      g.selectAll(".photoPoints, .photoThumbGroup").each(function (d) {
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
          .tick(80);
      });

      nodes.forEach(({ type, data, x, y, ox, oy }) => {
        if (Math.abs(x - ox) < 0.01 && Math.abs(y - oy) < 0.01) return;
        if (type !== "msg-cluster" && type !== "camp-cluster") {
          displacedPositions.set(data, { x, y });
        }
        if (type === "photo-cluster") {
          displacedClusterPositions.set(`${ox},${oy}`, { x, y });
        }

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
          g.selectAll(".photoThumbGroup")
            .filter((d) => d === data)
            .attr("transform", `translate(${x}, ${y})`);
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

    function applyRaiseOrder() {
      g.selectAll(".messagePoints, .campPoints").raise();
      g.selectAll(".photoThumbGroup").raise();
      g.selectAll(".photoHitAreas, .photoClusterHit").raise();
      g.selectAll(".msgClusterHit, .campClusterHit").raise();
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
          cls?.contains("photoHitAreas") ||
          cls?.contains("msgClusterHit") ||
          cls?.contains("campClusterHit")
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

        // State lines — keep visually constant thickness
        g.selectAll(".state").attr("stroke-width", 1 / k);

        // State labels — center within visible portion of state (state bounds ∩ viewport)
        g.selectAll(".state-label").each(function () {
          const el = d3.select(this);
          const feature = el.datum();
          const angle = +el.attr("data-angle");

          // State bounding box in screen space
          const [sbx0, sby0] = t.apply([
            +el.attr("data-bx0"),
            +el.attr("data-by0"),
          ]);
          const [sbx1, sby1] = t.apply([
            +el.attr("data-bx1"),
            +el.attr("data-by1"),
          ]);

          // Intersect state bounds with viewport
          const visL = Math.max(0, sbx0);
          const visR = Math.min(width, sbx1);
          const visT = Math.max(0, sby0);
          const visB = Math.min(height, sby1);

          // Hide label if state is entirely off-screen
          if (visL >= visR || visT >= visB) {
            el.attr("display", "none");
            return;
          }

          // Prefer the bounding-box center; fall back to the geographic centroid
          // if the bbox center lands outside the actual state polygon (e.g. Idaho).
          let sx = (visL + visR) / 2;
          let sy = (visT + visB) / 2;
          const geoPt = projection.invert(t.invert([sx, sy]));
          if (!geoPt || !d3.geoContains(feature, geoPt)) {
            // Clamp geographic centroid to the visible slice instead
            let [gcsx, gcsy] = t.apply([
              +el.attr("data-gcx"),
              +el.attr("data-gcy"),
            ]);
            sx = Math.max(visL, Math.min(visR, gcsx));
            sy = Math.max(visT, Math.min(visB, gcsy));
          }

          const [px, py] = t.invert([sx, sy]);
          el.attr("display", null)
            .attr("x", px)
            .attr("y", py)
            .attr("font-size", 20 / k)
            .attr("letter-spacing", 3 / k)
            .attr("transform", `rotate(${angle}, ${px}, ${py})`);
        });

        // City crosses
        const citySymbolSize = 169 / (k * k);
        g.selectAll(".cityPoints")
          .attr("d", cross.size(citySymbolSize))
          .attr("stroke-width", 1.5 / k);

        // Photos
        const photoR = 18 / k;
        g.selectAll(".photoPoints").attr("r", photoR);
        g.selectAll(".photoHitAreas").attr("r", (18 + 5 / rs) / k);
        g.selectAll(".photoThumbGroup").each(function () {
          const el = d3.select(this);
          el.select("clipPath circle").attr("r", photoR);
          el.select("image")
            .attr("x", -photoR)
            .attr("y", -photoR)
            .attr("width", photoR * 2)
            .attr("height", photoR * 2);
          el.select(".photoThumbBorder").attr("r", photoR);
        });
        g.selectAll(".photoCluster").attr("r", (d) =>
          clusterRadius(d.count, k),
        );
        g.selectAll(".photoClusterHit").attr(
          "r",
          (d) => clusterRadius(d.count, k) + 5 / (rs * k),
        );
        g.selectAll(".photoClusterLabel").attr("font-size", 11 / k);

        for (const [solo, cluster, hit, label, sym] of [
          [
            "messagePoints",
            "msgCluster",
            "msgClusterHit",
            "msgClusterLabel",
            square,
          ],
          [
            "campPoints",
            "campCluster",
            "campClusterHit",
            "campClusterLabel",
            triangle,
          ],
        ]) {
          g.selectAll(`.${solo}`).attr("d", sym.size(symbolSize));
          g.selectAll(`.${cluster}, .${hit}`).each(function (d) {
            const r = clusterRadius(d.count, k);
            d3.select(this).attr(
              "d",
              this.classList.contains(cluster)
                ? sym.size(r * r * 2)()
                : sym.size((r * Math.SQRT2 + hitPad) ** 2)(),
            );
          });
          g.selectAll(`.${label}`).attr("font-size", 11 / k);
        }
      })

      .on("end", (event) => {
        const t = event.transform;
        const prevK = lastRenderedScaleRef.current;
        lastRenderedScaleRef.current = t.k;

        // Photo clusters re-render on every pan (viewport-dependent thumbnail
        // split). Message/camp clusters only re-render when scale changes.
        renderPhotoClusters(t);

        if (t.k !== prevK) {
          // Scale changed: full re-render + force simulation.
          renderMessageClusters(t);
          renderCampClusters(t);
          applyRaiseOrder();
          separateOverlappingPoints(t);
        } else {
          // Pure pan: photo elements were recreated at geographic coords.
          // Restore their displaced positions from the last force simulation
          // without re-running it (leader lines are in g's local space and
          // pan correctly with the SVG transform — no redraw needed).
          displacedPositions.forEach(({ x, y }, data) => {
            g.selectAll(".photoPoints, .photoHitAreas")
              .filter((d) => d === data)
              .attr("cx", x)
              .attr("cy", y);
            g.selectAll(".photoThumbGroup")
              .filter((d) => d === data)
              .attr("transform", `translate(${x}, ${y})`);
          });
          // Clusters are re-created with new data objects on every pan, so
          // identity matching fails. Look up by centroid string instead.
          g.selectAll(".photoCluster, .photoClusterHit").each(function (d) {
            const pos = displacedClusterPositions.get(`${d.cx},${d.cy}`);
            if (pos) d3.select(this).attr("cx", pos.x).attr("cy", pos.y);
          });
          g.selectAll(".photoClusterLabel").each(function (d) {
            const pos = displacedClusterPositions.get(`${d.cx},${d.cy}`);
            if (pos) d3.select(this).attr("x", pos.x).attr("y", pos.y);
          });
          applyRaiseOrder();
        }
        updateActiveHighlightRef.current();
        updateScaleBarRef.current(event.transform);
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    // Leader lines and origin dots — rendered behind all data points.
    const leaderLinesGroup = g.append("g").attr("class", "leaderLinesGroup");

    // Adds/removes the active-pulse CSS class on the selected data point so the
    // border strokes thick-and-thin in place (avoids the displacement mismatch
    // that a separate ring element would have).
    function updateActiveHighlight() {
      g.selectAll(".photoPoints, .photoThumbBorder, .msgCluster, .photoCluster").classed(
        "active-pulse",
        false,
      );
      g.selectAll(".trail").classed("trail-active-pulse", false);
      g.selectAll(".photoClusterLabel").text((d) => d.count);

      const photo = photoPopoutRef.current;
      if (photo) {
        g.selectAll(".photoPoints")
          .filter((d) => d === photo.item)
          .classed("active-pulse", true);
        g.selectAll(".photoThumbGroup")
          .filter((d) => d === photo.item)
          .select(".photoThumbBorder")
          .classed("active-pulse", true);

        // If the photo is inside an un-dissolved cluster, pulse the cluster
        // circle and replace its count label with a position counter.
        g.selectAll(".photoCluster")
          .filter((d) => d.points.includes(photo.item))
          .classed("active-pulse", true);
        g.selectAll(".photoClusterLabel")
          .filter((d) => d.points.includes(photo.item))
          .text((d) => `${d.points.indexOf(photo.item) + 1}/${d.count}`);
      }

      const panel = messagePanelRef.current;
      if (panel?.datum) {
        const activePoints = new Set(panel.datum.points);
        g.selectAll(".msgCluster")
          .filter((d) =>
            d.points.length === activePoints.size &&
            d.points.every((p) => activePoints.has(p)),
          )
          .classed("active-pulse", true);
      }

      const activeTitle = legPanelRef.current?.title ?? pendingLegTitleRef.current;
      if (activeTitle) {
        g.selectAll(".trail")
          .filter((d) => d.properties.title === activeTitle)
          .classed("trail-active-pulse", true);
      }
    }
    updateActiveHighlightRef.current = updateActiveHighlight;

    svg.on("click", (event) => {
      setExploreOpen(false);
      if (!event.target.classList.contains("state-clickable")) {
        // Zoom out if a zoom-altering panel was open, or if nothing was open.
        // Non-zoom panels (message, photo) don't reset the zoom on close.
        const hadZoomPanel = clusterPanelRef.current || legPanelRef.current;
        const nothingOpen =
          !clusterPanelRef.current &&
          !legPanelRef.current &&
          !messagePanelRef.current &&
          !photoPopoutRef.current;
        if (hadZoomPanel || nothingOpen) {
          svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
        }
        closeAllPanelsRef.current();
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
      d3.json("/contours.geojson"),
    ]).then(([trackData, stateData, inReachData, photoData, contourData]) => {
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
        .attr("stroke-width", 1)
        .attr("d", path)
        .on("click", function (event, d) {
          event.stopPropagation();
          closeAllPanelsRef.current();

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

        const [[bx0, by0], [bx1, by1]] = path.bounds(d);

        g.append("text")
          .datum(d)
          .attr("class", "state-label")
          .attr("x", pos[0])
          .attr("y", pos[1])
          .attr("data-gcx", pos[0])
          .attr("data-gcy", pos[1])
          .attr("data-angle", angle)
          .attr("data-bx0", bx0)
          .attr("data-by0", by0)
          .attr("data-bx1", bx1)
          .attr("data-by1", by1)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("transform", `rotate(${angle}, ${pos[0]}, ${pos[1]})`)
          .attr("fill", "gray")
          .attr("stroke", "none")
          .attr("font-size", 20)
          .attr("font-weight", "400")
          .attr("letter-spacing", 3)
          .attr("pointer-events", "none")
          .text(d.properties.name.toUpperCase());
      });

      /* -----------------------------------------------------
      *  Contour lines (below all data layers)
      ----------------------------------------------------- */
      if (contourData?.features?.length) {
        g.selectAll(".contour")
          .data(contourData.features)
          .enter()
          .append("path")
          .attr("class", "contour")
          .attr("d", path)
          .attr("fill", "none")
          .attr("stroke", (d) => d.properties.index ? "#9a7040" : "#c4a882")
          .attr("stroke-width", (d) => d.properties.index ? 0.9 : 0.35)
          .attr("vector-effect", "non-scaling-stroke")
          .attr("pointer-events", "none")
          .attr("display", visibilityRef.current.contours ? null : "none");
      }

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

      stateDataRef.current = stateData.features;
      setMapMessageCount(messageSites.length);

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
          closeAllPanelsRef.current();
          const currentK = currentTransformRef.current?.k ?? 1;
          const dissolveK = clusterDissolveScale(d.points, projection);

          if (dissolveK > MAX_CLUSTER_ZOOM || currentK >= MAX_CLUSTER_ZOOM) {
            // Co-located (will never dissolve) or already at max zoom: open panel.
            const sorted = [...d.points].sort(
              (a, b) =>
                parseGPSTime(a.properties.GPSTime) -
                parseGPSTime(b.properties.GPSTime),
            );
            setMessagePanel({ items: sorted, datum: d });
            // Pan+zoom only if the cluster is near an edge of the visible area.
            if (ref.current && zoomRef.current) {
              const svgRect = ref.current.getBoundingClientRect();
              const cRect =
                ref.current.parentElement?.getBoundingClientRect() ?? svgRect;
              const panelRight = cRect.left + cRect.width / 2;
              const t = currentTransformRef.current ?? d3.zoomIdentity;
              const rs = Math.min(svgRect.width / width, svgRect.height / height);
              const ox = (svgRect.width - width * rs) / 2;
              const oy = (svgRect.height - height * rs) / 2;
              const [lx, ly] = t.apply([d.cx, d.cy]);
              const sx_screen = svgRect.left + ox + lx * rs;
              const sy_screen = svgRect.top + oy + ly * rs;
              const PAD = 60;
              const nearEdge =
                sx_screen < panelRight + PAD ||
                sx_screen > svgRect.right - PAD ||
                sy_screen < svgRect.top + PAD ||
                sy_screen > svgRect.bottom - PAD;
              if (nearEdge) {
                const newK = Math.min(MAX_CLUSTER_ZOOM, Math.max(currentK * 3, 8));
                const [targetX, targetY] = panelRight < svgRect.right
                  ? panTarget(svgRect, panelRight)
                  : [width / 2, height / 2];
                const newT = d3.zoomIdentity
                  .translate(targetX - newK * d.cx, targetY - newK * d.cy)
                  .scale(newK);
                d3.select(ref.current)
                  .transition()
                  .duration(600)
                  .ease(d3.easeCubicInOut)
                  .call(zoomRef.current.transform, newT);
              }
            }
          } else {
            // Spread cluster: step zoom 3× to progressively dissolve into sub-clusters.
            clearTimeout(panTimerRef.current);
            setPendingPhotoPopout(null);
            setPhotoPopout(null);
            const scale = Math.min(MAX_CLUSTER_ZOOM, Math.max(currentK * 3, 8));
            setClusterPanel({
              type: "message",
              scale,
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
        onClusterClick: (d) => {
          closeAllPanelsRef.current();
          const currentK = currentTransformRef.current?.k ?? 1;
          const dissolveK = clusterDissolveScale(d.points, projection);

          if (dissolveK > MAX_CLUSTER_ZOOM || currentK >= MAX_CLUSTER_ZOOM) {
            // Co-located or at max zoom: zoom+pan to full viewport center if near an edge.
            if (ref.current && zoomRef.current) {
              const svgRect = ref.current.getBoundingClientRect();
              const t = currentTransformRef.current ?? d3.zoomIdentity;
              const rs = Math.min(svgRect.width / width, svgRect.height / height);
              const ox = (svgRect.width - width * rs) / 2;
              const oy = (svgRect.height - height * rs) / 2;
              const [lx, ly] = t.apply([d.cx, d.cy]);
              const sx_screen = svgRect.left + ox + lx * rs;
              const sy_screen = svgRect.top + oy + ly * rs;
              const PAD = 60;
              const nearEdge =
                sx_screen < svgRect.left + PAD ||
                sx_screen > svgRect.right - PAD ||
                sy_screen < svgRect.top + PAD ||
                sy_screen > svgRect.bottom - PAD;
              if (nearEdge) {
                const newK = Math.min(MAX_CLUSTER_ZOOM, Math.max(currentK * 3, 8));
                const newT = d3.zoomIdentity
                  .translate(width / 2 - newK * d.cx, height / 2 - newK * d.cy)
                  .scale(newK);
                d3.select(ref.current)
                  .transition()
                  .duration(600)
                  .ease(d3.easeCubicInOut)
                  .call(zoomRef.current.transform, newT);
              }
            }
          } else {
            // Spread cluster: step zoom 3× to progressively dissolve.
            const scale = Math.min(MAX_CLUSTER_ZOOM, Math.max(currentK * 3, 8));
            setClusterPanel({
              type: "camp",
              scale,
              items: d.points,
              projPoints: d.points.map((p) => projection(p.geometry.coordinates)),
            });
          }
        },
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

      // Keep a sorted snapshot for keyboard/button navigation
      allPhotosRef.current = [...validPhotoPoints].sort((a, b) =>
        (a.properties?.dateTime ?? "").localeCompare(b.properties?.dateTime ?? ""),
      );

      /* -----------------------------------------------------
      *  Photo points — clustered by zoom level
      ----------------------------------------------------- */

      renderPhotoClusters = function (transform) {
        const k = transform.k;
        const rs = ref.current?.getBoundingClientRect().width / width || 1;

        g.selectAll(
          ".photoPoints, .photoHitAreas, .photoCluster, .photoClusterHit, .photoClusterLabel, .photoThumbGroup",
        ).remove();

        const { solos, groups } =
          k >= PHOTO_FORCE_DISSOLVE_ZOOM
            ? { solos: validPhotoPoints, groups: [] }
            : computeClusters(validPhotoPoints, transform);
        const photoR = 18 / k;

        // Split solos: visible ones get thumbnail images; off-screen ones get plain circles.
        // Use a buffer so dots near the edge that get force-displaced into view still
        // receive thumbnails. Buffer is in SVG coordinate space (~29 units per collision
        // pair × up to ~5 nodes ≈ 150 units of worst-case spread).
        const thumbBuffer = 150;
        const visibleSolos = [];
        const hiddenSolos = [];
        for (const d of solos) {
          const [px, py] = projection(d.geometry.coordinates);
          const [sx, sy] = transform.apply([px, py]);
          if (
            sx >= -thumbBuffer && sx <= width + thumbBuffer &&
            sy >= -thumbBuffer && sy <= height + thumbBuffer
          ) {
            visibleSolos.push(d);
          } else {
            hiddenSolos.push(d);
          }
        }

        // Hidden solos — plain colored circles, no image load
        g.selectAll(".photoPoints")
          .data(hiddenSolos)
          .enter()
          .append("circle")
          .attr("class", "photoPoints")
          .attr("cx", (d) => projection(d.geometry.coordinates)[0])
          .attr("cy", (d) => projection(d.geometry.coordinates)[1])
          .attr("r", photoR)
          .attr("fill", colors.photos)
          .attr("stroke", colors.photosDark)
          .attr("stroke-width", 1.5)
          .attr("vector-effect", "non-scaling-stroke")
          .attr("pointer-events", "none");

        // Visible solos — thumbnail image clipped to a circle
        visibleSolos.forEach((d) => {
          const [px, py] = projection(d.geometry.coordinates);
          const clipId = `photo-clip-${d.properties.photo_id}`;
          const thumbUrl = `/_next/image?url=${encodeURIComponent(d.properties.path)}&w=96&q=60`;

          const grp = g
            .append("g")
            .attr("class", "photoThumbGroup")
            .datum(d)
            .attr("transform", `translate(${px}, ${py})`);

          grp
            .append("clipPath")
            .attr("id", clipId)
            .append("circle")
            .attr("r", photoR);

          grp
            .append("image")
            .attr("href", thumbUrl)
            .attr("x", -photoR)
            .attr("y", -photoR)
            .attr("width", photoR * 2)
            .attr("height", photoR * 2)
            .attr("clip-path", `url(#${clipId})`)
            .attr("preserveAspectRatio", "xMidYMid slice")
            .attr("pointer-events", "none");

          grp
            .append("circle")
            .attr("class", "photoThumbBorder")
            .attr("r", photoR)
            .attr("fill", "none")
            .attr("stroke", colors.photosDark)
            .attr("stroke-width", 1.5)
            .attr("vector-effect", "non-scaling-stroke")
            .attr("pointer-events", "none");
        });

        g.selectAll(".photoHitAreas")
          .data(solos)
          .enter()
          .append("circle")
          .attr("class", "photoHitAreas")
          .attr("cx", (d) => projection(d.geometry.coordinates)[0])
          .attr("cy", (d) => projection(d.geometry.coordinates)[1])
          .attr("r", (18 + 5 / rs) / k)
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
              const prevOpen = photoPopoutRef.current !== null;
              closeAllPanelsRef.current();
              setPendingPhotoPopout({ item: d, prevOpen });
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
              closeAllPanelsRef.current();
              setDisambigMenu({
                x: event.clientX,
                y: event.clientY,
                photo: d,
                others,
              });
            } else {
              const wasOpen = photoPopoutRef.current !== null;
              closeAllPanelsRef.current();
              setPendingPhotoPopout({ item: d, prevOpen: wasOpen });
            }
          });

        function openPhotoClusterPanel(d) {
          handleMouseOut();
          closeAllPanelsRef.current();
          const currentK = currentTransformRef.current?.k ?? 1;
          const scale = clusterZoomTarget(d.points, currentK, projection);
          setClusterPanel({
            type: "photo",
            scale,
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
            ".photoPoints, .photoHitAreas, .photoCluster, .photoClusterHit, .photoClusterLabel, .photoThumbGroup",
          ).attr("display", "none");
        }
      };

      // Initial render order matches zoom-end order: photos → messages → campsites
      renderPhotoClusters(currentTransformRef.current ?? d3.zoomIdentity);
      renderMessageClusters(currentTransformRef.current ?? d3.zoomIdentity);
      renderCampClusters(currentTransformRef.current ?? d3.zoomIdentity);
      applyRaiseOrder();
      separateOverlappingPoints(currentTransformRef.current ?? d3.zoomIdentity);

      /* -----------------------------------------------------
      *  Track mapping functionality (rendered last = on top)
      ----------------------------------------------------- */

      const trailFeatures = trackData.features.filter(
        (d) =>
          Array.isArray(d.geometry?.coordinates) &&
          d.geometry.coordinates.length > 0,
      );
      trackDataRef.current = trailFeatures;
      if (initialEntryId.current) {
        const id = initialEntryId.current;
        initialEntryId.current = null;
        openLegByEntryIdRef.current(id);
      }

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
          if ((currentTransformRef.current?.k ?? 0) <= 2.35) return;
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
          g.selectAll(".trail")
            .filter((td) => td === d)
            .attr("stroke-width", 4);
        })
        .on("mousemove", handleMouseMove)
        .on("mouseout", function (_event, d) {
          handleMouseOut();
          g.selectAll(".trail")
            .filter((td) => td === d)
            .attr("stroke-width", 2);
        })
        .on("click", function (event, d) {
          if ((currentTransformRef.current?.k ?? 0) <= 2.35) return;
          event.stopPropagation();
          handleMouseOut();
          g.selectAll(".trail").filter((td) => td === d).attr("stroke-width", 2);
          const raw = d.properties.date;
          const dateStr = raw
            ? new Date(raw + "T00:00:00").toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })
            : null;
          closeAllPanelsRef.current();
          setLegPanel({
            title: d.properties.title,
            date: dateStr,
            name: d.properties.description || "",
            text: d.properties.text || null,
            entryId: d.properties.entry_id || null,
            color: getAlternatingColor(d.properties),
            coordinates: d.geometry.coordinates,
          });
        })
        .style("cursor", "pointer")
        .attr("display", "none");

      // Raise leader lines and origin dots above the trail layer
      leaderLinesGroup.raise();

      /* -----------------------------------------------------
      *  City labels (rendered last so they float above state lines)
      ----------------------------------------------------- */

      // City label overlay is appended to svg (not g) so it is not affected by
      // the zoom transform — positions are updated manually on every zoom tick.
      const cityLabelsGroup = svg.append("g").attr("class", "city_label_layer");

      cityLabelsGroup
        .selectAll("text")
        .data(cities.map((d) => ({ ...d, pos: projection([d.lon, d.lat]) })))
        .enter()
        .append("text")
        .attr("class", "city_labels")
        .attr("display", "none")
        .attr("data-dot-x", (d) => d.pos[0])
        .attr("data-dot-y", (d) => d.pos[1])
        .attr("data-side", (d) => (d.dx > 0 ? 1 : -1))
        .attr("x", (d) => d.pos[0])
        .attr("y", (d) => d.pos[1])
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

      updateScaleBarRef.current(currentTransformRef.current ?? d3.zoomIdentity);
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
      .attr("fill", "none")
      .attr("stroke", colors.black)
      .attr("stroke-width", 1.5)
      .attr("stroke-linecap", "round");
  }, [path, projection]);

  useEffect(() => {
    if (!ref.current) return;
    const svg = d3.select(ref.current);
    const fg = isDark ? "#ffffff" : colors.black;
    const halo = isDark ? "rgba(0,0,0,0.6)" : "white";
    svg.selectAll(".city_labels").attr("fill", fg).attr("stroke", halo);
    svg.selectAll(".cityPoints").attr("stroke", fg);
  }, [isDark]);

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
    {
      key: "contours",
      label: "Contours",
      fill: "none",
      stroke: "#c4a882",
      shape: "line",
    },

  ];

  const STATIC_LAYERS = [
    {
      label: "Resupply Stops",
      color: isDark ? "#ffffff" : colors.black,
      shape: "cross",
    },
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

  const currentPhotoIdx = displayedPopout
    ? allPhotosRef.current.findIndex(
        (p) => p.properties.path === displayedPopout.item?.properties?.path,
      )
    : -1;
  const hasPrev = currentPhotoIdx > 0;
  const hasNext = currentPhotoIdx >= 0 && currentPhotoIdx < allPhotosRef.current.length - 1;

  return (
    <div className="relative w-full h-full overflow-hidden">
      <style>{`
        @keyframes border-pulse { 0%, 100% { stroke-width: 1.5; } 50% { stroke-width: 10; } }
        .active-pulse { animation: border-pulse 1.5s ease-in-out infinite; }
        @keyframes trail-pulse { 0%, 100% { stroke-width: 2; } 50% { stroke-width: 7; } }
        .trail-active-pulse { animation: trail-pulse 1.5s ease-in-out infinite; }
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

      {/* Photo panel — overlays the left half, styled like garmin/leg panels */}
      {displayedPopout && (
        <div
          className={`absolute inset-y-0 left-0 w-1/2 z-10 p-10 flex items-center justify-center ${notoSans.className}`}
          style={{
            animation: photoPopout
              ? "photo-fade-in 0.3s ease-in-out forwards"
              : "photo-fade-out 0.3s ease-in-out forwards",
            pointerEvents: "none",
          }}
        >
          <div
            className="flex flex-col max-w-full rounded-xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.97)", pointerEvents: "auto", boxShadow: PANEL_SHADOW }}
          >
            {/* Header — date as title, time as subtitle */}
            <div
              className="flex items-center justify-between px-5 py-3 flex-shrink-0"
              style={{ background: colors.photos }}
            >
              <div>
                {popoutDate.dateStr && (
                  <p className="font-semibold text-white text-sm uppercase tracking-wide">
                    {popoutDate.dateStr}
                  </p>
                )}
                {popoutDate.timeStr && (
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.8)" }}>
                    {popoutDate.timeStr}
                  </p>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); navigatePhotoRef.current(-1); }}
                  aria-label="Previous photo"
                  disabled={!hasPrev}
                  style={{
                    color: "#fff",
                    background: hasPrev ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.08)",
                    borderRadius: "50%",
                    width: 28,
                    height: 28,
                    border: "none",
                    cursor: hasPrev ? "pointer" : "default",
                    fontSize: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: hasPrev ? 1 : 0.35,
                  }}
                >
                  ‹
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); navigatePhotoRef.current(1); }}
                  aria-label="Next photo"
                  disabled={!hasNext}
                  style={{
                    color: "#fff",
                    background: hasNext ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.08)",
                    borderRadius: "50%",
                    width: 28,
                    height: 28,
                    border: "none",
                    cursor: hasNext ? "pointer" : "default",
                    fontSize: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: hasNext ? 1 : 0.35,
                  }}
                >
                  ›
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeAllPanelsRef.current();
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
            </div>

            {/* Photo body with caption overlay */}
            <div className="overflow-hidden relative">
              <img
                src={popoutProps?.path}
                alt="Trail photo"
                style={{
                  display: "block",
                  width: "auto",
                  height: "auto",
                  maxWidth: "100%",
                  maxHeight: "calc(100vh - 9rem)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                  padding: "40px 16px 12px",
                  color: "#fff",
                  pointerEvents: "none",
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCaptionModalOpen(true);
                  }}
                  style={{
                    pointerEvents: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    width: "100%",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      color: "#fff",
                      fontSize: 11,
                      opacity: 0.75,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                      fontStyle: captionDraft ? "normal" : "italic",
                    }}
                  >
                    {captionDraft ? captionDraft.split("\n")[0] : "Add a caption…"}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={11}
                    height={11}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="rgba(255,255,255,0.75)"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ flexShrink: 0 }}
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Caption edit modal */}
      {captionModalOpen && displayedPopout && (
        <dialog
          className={`modal modal-open ${notoSans.className}`}
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            background: "rgba(107,114,128,0.25)",
          }}
          onClick={() => setCaptionModalOpen(false)}
        >
          <div
            className="modal-box"
            style={{
              marginBottom: "8vh",
              width: "60vw",
              maxWidth: "60vw",
              padding: "20px 24px 16px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-semibold text-sm">{popoutDate.dateStr}</p>
            <p className="text-xs text-gray-400 mb-3">{popoutDate.timeStr}</p>
            <textarea
              autoFocus
              value={captionDraft}
              onChange={(e) => {
                setCaptionDraft(e.target.value);
                setCaptionSaved(false);
              }}
              onBlur={async () => {
                const photoId = displayedPopout?.item?.properties?.photo_id;
                if (photoId == null) return;
                if (captionDraft === lastSavedCaptionRef.current) return;
                await updatePhotoCaption(String(photoId), captionDraft);
                lastSavedCaptionRef.current = captionDraft;
                setCaptionSaved(true);
              }}
              placeholder="Add a caption…"
              rows={3}
              className="textarea textarea-bordered w-full text-sm"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-success">
                {captionSaved ? "Saved" : ""}
              </span>
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => setCaptionModalOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </dialog>
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
              className={`absolute inset-y-0 left-0 w-1/2 z-10 p-10 flex items-center ${notoSans.className}`}
              style={{ animation: "photo-fade-in 0.3s ease-in-out forwards", pointerEvents: "none" }}
            >
              <div
                className="flex flex-col w-full max-h-full rounded-xl overflow-hidden"
                style={{ background: "rgba(255,255,255,0.97)", pointerEvents: "auto", boxShadow: PANEL_SHADOW }}
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
                      setLegPanel(null);
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
              const wasOpen = photoPopout !== null;
              closeAllPanelsRef.current();
              setPendingPhotoPopout({ item: disambigMenu.photo, prevOpen: wasOpen });
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

      {/* Leg entry panel — shown when a trail segment is clicked */}
      {legPanel && (
        <div
          className={`absolute inset-y-0 left-0 w-1/2 z-10 p-10 flex items-center ${notoSans.className}`}
          style={{ animation: "photo-fade-in 0.3s ease-in-out forwards", pointerEvents: "none" }}
        >
          <div
            className="flex flex-col w-full max-h-full rounded-xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.97)", pointerEvents: "auto", boxShadow: PANEL_SHADOW }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-3 flex-shrink-0"
              style={{ background: legPanel.color }}
            >
              <div>
                <p className="font-semibold text-white text-sm uppercase tracking-wide">
                  {legPanel.name}
                </p>
                {legPanel.date && (
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.8)" }}>
                    {legPanel.date}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setLegPanel(null);
                  if (zoomRef.current && ref.current) {
                    d3.select(ref.current).transition().duration(750).ease(d3.easeCubicInOut).call(zoomRef.current.transform, d3.zoomIdentity);
                  }
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

            {/* Entry text */}
            <div className="overflow-y-auto px-5 py-4 flex-1 min-h-0">
              {legPanel.text ? (
                <p className={`${notoSerif.className} whitespace-pre-wrap text-sm leading-relaxed text-gray-800`}>
                  {legPanel.text}
                </p>
              ) : (
                <p className="text-sm text-gray-400 italic">No journal entry for this day.</p>
              )}
            </div>

            {/* Footer */}
            {legPanel.entryId && currentUserRef.current && (
              <div className="px-5 py-3 flex-shrink-0 border-t border-gray-100 flex justify-end">
                <button
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  onClick={() => {
                    setLegPanel(null);
                    router.push(`/journal/${legPanel.entryId}`);
                  }}
                >
                  Read full entry →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Explore panel — top left floating */}
      {(() => {
        const CDT_STATES = [
          { name: "New Mexico", abbr: "NM" },
          { name: "Colorado", abbr: "CO" },
          { name: "Wyoming", abbr: "WY" },
          { name: "Idaho", abbr: "ID" },
          { name: "Montana", abbr: "MT" },
        ];

        const formatDateLabel = (dateStr) => {
          const [year, month, day] = dateStr.split("-");
          const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
          return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year}`;
        };

        const trailYear = exploreData?.stats?.start_date?.substring(0, 4);
        const today = new Date();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        const onThisDayDate = trailYear ? `${trailYear}-${mm}-${dd}` : null;
        const onThisDayEntry = onThisDayDate
          ? exploreData?.dates?.find((d) => d.date === onThisDayDate)
          : null;
        const trailStart = exploreData?.stats?.start_date;
        const trailEnd = exploreData?.stats?.end_date;
        const onThisDayInRange =
          onThisDayDate && trailStart && trailEnd
            ? onThisDayDate >= trailStart && onThisDayDate <= trailEnd
            : false;
        const onThisDayDisabled = !onThisDayEntry;
        const onThisDayTooltip = !onThisDayDate
          ? "Loading…"
          : !onThisDayInRange
          ? `Trail wasn't active on this calendar date in ${trailYear}`
          : !onThisDayEntry
          ? "No entry recorded for this date"
          : undefined;

        const totalDays = exploreData?.stats?.total_days;
        const totalPhotos = exploreData?.stats?.total_photos;

        const handleRandomDay = () => {
          const dates = exploreData?.dates;
          if (!dates?.length) return;
          const pick = dates[Math.floor(Math.random() * dates.length)];
          openLegByEntryIdRef.current(pick.entry_id);
        };

        const handleSearch = (e) => {
          e.preventDefault();
          if (!searchQuery.trim()) return;
          router.push(`/journal/listView?query=${encodeURIComponent(searchQuery.trim())}`);
        };

        return (
          <div className={`absolute top-3 left-3 z-30 ${notoSans.className}`}>
            {/* Trigger */}
            <button
              onClick={(e) => { e.stopPropagation(); setExploreOpen((o) => !o); }}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-md hover:bg-white dark:hover:bg-gray-900 transition-colors"
            >
              <MapIcon className="w-4 h-4 shrink-0" />
              explore the map…
            </button>

            {/* Dropdown panel */}
            {exploreOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="mt-1.5 w-72 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Explore the map
                  </p>
                  <button
                    onClick={() => setExploreOpen(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 space-y-4 max-h-[70vh] overflow-y-auto">

                  {/* Go to date */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Go to date</p>
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) openLegByEntryIdRef.current(e.target.value);
                      }}
                      className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="" disabled>Select a date…</option>
                      {(() => {
                        const groups = [];
                        const seen = new Map();
                        for (const d of (exploreData?.dates ?? [])) {
                          const key = d.state ?? "Other";
                          if (!seen.has(key)) {
                            seen.set(key, []);
                            groups.push({ state: key, dates: seen.get(key) });
                          }
                          seen.get(key).push(d);
                        }
                        return groups.map(({ state, dates }) => (
                          <optgroup key={state} label={state}>
                            {dates.map((d) => (
                              <option key={d.entry_id} value={d.entry_id}>
                                {formatDateLabel(d.date)}
                              </option>
                            ))}
                          </optgroup>
                        ));
                      })()}
                    </select>
                  </div>

                  {/* Search */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Search entries</p>
                    <form onSubmit={handleSearch} className="flex gap-1.5">
                      <label className="flex-1 flex items-center gap-1.5 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 focus-within:ring-2 focus-within:ring-blue-400">
                        <MagnifyingGlassIcon className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search entries…"
                          className="flex-1 text-sm bg-transparent outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400"
                        />
                      </label>
                      <button
                        type="submit"
                        className="px-2.5 py-1.5 text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                      >
                        Go
                      </button>
                    </form>
                  </div>

                  {/* Random + quick actions */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Quick picks</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={handleRandomDay}
                        disabled={!exploreData?.dates?.length}
                        className="px-2 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-center"
                      >
                        🎲 Random day
                      </button>
                      <button
                        onClick={() => exploreData?.longestDay && router.push(`/journal/${exploreData.longestDay.entry_id}`)}
                        disabled={!exploreData?.longestDay}
                        title={exploreData?.longestDay ? `${formatDateLabel(exploreData.longestDay.date)} — ${Number(exploreData.longestDay.mileage).toFixed(1)} mi` : undefined}
                        className="px-2 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-center"
                      >
                        ↑ Longest day
                      </button>
                      <button
                        onClick={() => exploreData?.shortestDay && router.push(`/journal/${exploreData.shortestDay.entry_id}`)}
                        disabled={!exploreData?.shortestDay}
                        title={exploreData?.shortestDay ? `${formatDateLabel(exploreData.shortestDay.date)} — ${Number(exploreData.shortestDay.mileage).toFixed(1)} mi` : undefined}
                        className="px-2 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-center"
                      >
                        ↓ Shortest day
                      </button>
                      <button
                        onClick={() => onThisDayEntry && router.push(`/journal/${onThisDayEntry.entry_id}`)}
                        disabled={onThisDayDisabled}
                        title={onThisDayTooltip}
                        className="px-2 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-center"
                      >
                        📅 On this day{trailYear ? ` in ${trailYear}` : ""}
                      </button>
                    </div>
                  </div>

                  {/* Zoom to state */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Zoom to state</p>
                    <div className="flex gap-1">
                      {CDT_STATES.map(({ name, abbr }) => (
                        <button
                          key={name}
                          onClick={() => zoomToStateRef.current(name)}
                          className="flex-1 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                        >
                          {abbr}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  {(totalDays || totalPhotos || mapMessageCount !== null) && (
                    <div className="pt-1 border-t border-gray-100 dark:border-gray-800">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Trail stats</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {totalDays && (
                          <div>
                            <p className="text-lg font-semibold text-gray-800 dark:text-gray-100 leading-tight">{totalDays}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">days</p>
                          </div>
                        )}
                        {totalPhotos && (
                          <div>
                            <p className="text-lg font-semibold text-gray-800 dark:text-gray-100 leading-tight">{totalPhotos}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">photos</p>
                          </div>
                        )}
                        {mapMessageCount !== null && (
                          <div>
                            <p className="text-lg font-semibold text-gray-800 dark:text-gray-100 leading-tight">{mapMessageCount}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">messages</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Scale bar — bottom left */}
      {scaleBar && (
        <div
          className={`absolute bottom-3 left-3 z-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-2 ${notoSans.className}`}
          style={{ minWidth: scaleBar.widthPx + 24 }}
        >
          <div
            className="border-l-2 border-r-2 border-b-2 border-gray-500 dark:border-gray-400 mb-1 mx-auto"
            style={{ width: scaleBar.widthPx, height: 7 }}
          />
          <p className="text-xs text-center text-gray-600 dark:text-gray-400 leading-none">
            {scaleBar.label}
          </p>
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
