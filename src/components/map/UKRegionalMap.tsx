'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import type { RegionalIntensityData, RegionalData } from '@/lib/types';
import { ciToColor } from '@/lib/colorScale';
import type { Geometry, MultiPolygon, Polygon, Position } from 'geojson';

interface UKRegionalMapProps {
  data: RegionalIntensityData;
  selectedRegionId: number | null;
  onRegionSelect: (region: RegionalData | null) => void;
}

interface GeoFeature {
  type: string;
  properties: { regionId: number; shortName: string };
  geometry: Geometry;
}

const MIN_POLYGON_AREA = 0.015;

function closeRing(ring: Position[]): Position[] {
  if (ring.length < 3) return ring;
  const [fx, fy] = ring[0];
  const [lx, ly] = ring[ring.length - 1];
  if (fx === lx && fy === ly) return ring;
  return [...ring, ring[0]];
}

function orientRing(ring: Position[], clockwise: boolean): Position[] {
  const closed = closeRing(ring);
  const area = d3.polygonArea(closed as [number, number][]);
  const isClockwise = area < 0;
  return isClockwise === clockwise ? closed : [...closed].reverse();
}

function normalizePolygon(polygon: Position[][]): Position[][] | null {
  if (!Array.isArray(polygon) || polygon.length === 0) return null;
  const outer = polygon[0];
  if (!outer || outer.length < 4) return null;
  const outerClosed = closeRing(outer);
  if (Math.abs(d3.polygonArea(outerClosed as [number, number][])) < MIN_POLYGON_AREA) return null;

  const rings: Position[][] = [orientRing(outerClosed, false)];
  for (const hole of polygon.slice(1)) {
    if (!hole || hole.length < 4) continue;
    rings.push(orientRing(hole, true));
  }
  return rings;
}

function sanitizeGeometry(geometry: Geometry): Geometry | null {
  if (geometry.type === 'Polygon') {
    const normalized = normalizePolygon((geometry as Polygon).coordinates);
    if (!normalized) return null;
    return { type: 'Polygon', coordinates: normalized };
  }
  if (geometry.type === 'MultiPolygon') {
    const polygons = (geometry as MultiPolygon).coordinates
      .map((poly) => normalizePolygon(poly))
      .filter((poly): poly is Position[][] => Boolean(poly));
    if (polygons.length === 0) return null;
    return { type: 'MultiPolygon', coordinates: polygons };
  }
  return geometry;
}

export default function UKRegionalMap({ data, selectedRegionId, onRegionSelect }: UKRegionalMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const onRegionSelectRef = useRef(onRegionSelect);
  onRegionSelectRef.current = onRegionSelect;
  const geoJsonRef = useRef<{ type: string; features: GeoFeature[] } | null>(null);

  const regionMap = useMemo(() => new Map(data.regions.map(r => [r.regionId, r])), [data]);

  useEffect(() => {
    const svgEl = svgRef.current;
    const containerEl = containerRef.current;
    if (!svgEl || !containerEl) return;

    const drawMap = (geojson: { type: string; features: GeoFeature[] }) => {
      const svg = d3.select(svgEl);
      svg.selectAll('*').remove();

      const width = containerEl.clientWidth || 340;
      const height = containerEl.clientHeight || 480;

      svg.attr('width', width).attr('height', height);

      // Dark background
      svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', '#070d18')
        .attr('rx', 6);

      const features: GeoFeature[] = (geojson.features ?? [])
        .map((feature) => {
          const geometry = sanitizeGeometry(feature.geometry);
          return geometry ? { ...feature, geometry } : null;
        })
        .filter((feature): feature is GeoFeature => Boolean(feature));

      // Mercator with fitExtent — reliably fits all 14 DNO regions with no rotation gotchas
      const projection = d3.geoMercator()
        .fitExtent(
          [[12, 12], [width - 12, height - 12]],
          { type: 'FeatureCollection', features } as d3.GeoPermissibleObjects,
        );

      const pathGenerator = d3.geoPath().projection(projection);

      const g = svg.append('g').attr('class', 'map-g');

      g.selectAll('path')
        .data(features)
        .enter()
        .append('path')
        .attr('d', (d) => pathGenerator(d.geometry as d3.GeoPermissibleObjects) ?? '')
        .attr('fill', (d) => {
          const region = regionMap.get(d.properties.regionId);
          return region ? ciToColor(region.avgCI) : '#1e293b';
        })
        .attr('fill-opacity', 0.8)
        .attr('stroke', '#0a0f1e')
        .attr('stroke-width', 0.8)
        .style('cursor', 'pointer')
        .on('mouseenter', function (_, d) {
          setHoveredId(d.properties.regionId);
        })
        .on('mouseleave', function () {
          setHoveredId(null);
        })
        .on('click', (_, d) => {
          const region = regionMap.get(d.properties.regionId) ?? null;
          onRegionSelectRef.current(region);
        });

      // Zoom + pan
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([1, 10])
        .translateExtent([[0, 0], [width, height]])
        .on('zoom', (event) => {
          g.attr('transform', event.transform.toString());
        });

      svg.call(zoom);
      svg.on('dblclick.zoom', () => {
        svg.transition().duration(400).call(zoom.transform, d3.zoomIdentity);
      });
    };

    if (geoJsonRef.current) {
      drawMap(geoJsonRef.current);
    } else {
      fetch('/data/uk_dno_regions.json')
        .then(r => r.json())
        .then((geojson) => {
          geoJsonRef.current = geojson;
          drawMap(geojson);
        })
        .catch(console.error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, regionMap]);

  // Lightweight visual update — no redraw
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    d3.select(svg).selectAll<SVGPathElement, GeoFeature>('path')
      .attr('fill-opacity', (d) => {
        if (selectedRegionId === d.properties.regionId) return 1;
        if (hoveredId === d.properties.regionId) return 0.95;
        return 0.7;
      })
      .attr('stroke', (d) => {
        if (selectedRegionId === d.properties.regionId) return 'rgba(255,255,255,0.85)';
        if (hoveredId === d.properties.regionId) return 'rgba(255,255,255,0.4)';
        return '#0a0f1e';
      })
      .attr('stroke-width', (d) => {
        if (selectedRegionId === d.properties.regionId) return 1.5;
        if (hoveredId === d.properties.regionId) return 1;
        return 0.8;
      })
      .style('filter', (d) => {
        if (selectedRegionId === d.properties.regionId) {
          const region = regionMap.get(d.properties.regionId);
          const col = region ? ciToColor(region.avgCI) : '#00fff5';
          return `drop-shadow(0 0 4px ${col})`;
        }
        return 'none';
      });
  }, [hoveredId, selectedRegionId, regionMap]);

  return (
    <div ref={containerRef} className="relative w-full rounded-lg overflow-hidden" style={{ paddingBottom: '96%' }}>
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: 'block', touchAction: 'none' }}
      />
      <div className="absolute bottom-2 right-2 text-[9px] font-mono text-slate-700 pointer-events-none select-none">
        scroll · zoom · drag
      </div>
    </div>
  );
}
