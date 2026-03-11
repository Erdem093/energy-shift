'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import type { RegionalIntensityData, RegionalData } from '@/lib/types';
import { ciToColor } from '@/lib/colorScale';

interface UKRegionalMapProps {
  data: RegionalIntensityData;
  selectedRegionId: number | null;
  onRegionSelect: (region: RegionalData | null) => void;
}

interface GeoFeature {
  type: string;
  properties: { regionId: number; shortName: string };
  geometry: object;
}

export default function UKRegionalMap({ data, selectedRegionId, onRegionSelect }: UKRegionalMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const onRegionSelectRef = useRef(onRegionSelect);
  onRegionSelectRef.current = onRegionSelect;
  const geoJsonRef = useRef<{ features: GeoFeature[] } | null>(null);

  // Stable map reference — only recreated when data changes
  const regionMap = useMemo(() => new Map(data.regions.map(r => [r.regionId, r])), [data]);

  // Draw map once (or when data changes) — never re-fetches on hover/selection
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const drawMap = (geojson: { features: GeoFeature[] }) => {
      d3.select(svg).selectAll('*').remove();

      const width = svg.clientWidth || 340;
      const height = svg.clientHeight || 480;

      const projection = d3.geoAlbers()
        .center([0, 55.4])
        .rotate([4.4, 0])
        .parallels([50, 60])
        .scale(Math.min(width, height) * 4.8)
        .translate([width / 2, height / 2]);

      const pathGenerator = d3.geoPath().projection(projection);
      const features: GeoFeature[] = geojson.features ?? [];

      const g = d3.select(svg).append('g');

      g.selectAll('path')
        .data(features)
        .enter()
        .append('path')
        .attr('d', (d) => pathGenerator(d.geometry as d3.GeoPermissibleObjects) ?? '')
        .attr('fill', (d) => {
          const region = regionMap.get(d.properties.regionId);
          return region ? ciToColor(region.avgCI) : '#1e293b';
        })
        .attr('fill-opacity', 0.7)
        .attr('stroke', 'rgba(2,6,23,0.8)')
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

      g.selectAll('text')
        .data(features)
        .enter()
        .append('text')
        .attr('transform', (d) => {
          const centroid = pathGenerator.centroid(d.geometry as d3.GeoPermissibleObjects);
          return centroid?.[0] && centroid?.[1] ? `translate(${centroid})` : '';
        })
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '7px')
        .attr('font-family', 'system-ui, sans-serif')
        .attr('fill', 'rgba(255,255,255,0.7)')
        .attr('pointer-events', 'none')
        .text((d) => {
          const region = regionMap.get(d.properties.regionId);
          if (!region) return '';
          const short = region.shortName.split(' ')[0];
          return short.length > 8 ? '' : short;
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
  }, [data, regionMap]);

  // Lightweight visual update — no re-fetch, no redraw
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    d3.select(svg).selectAll<SVGPathElement, GeoFeature>('path')
      .attr('fill-opacity', (d) => {
        if (selectedRegionId === d.properties.regionId) return 1;
        if (hoveredId === d.properties.regionId) return 0.9;
        return 0.65;
      })
      .attr('stroke', (d) => {
        if (selectedRegionId === d.properties.regionId) return '#00fff5';
        if (hoveredId === d.properties.regionId) return 'rgba(255,255,255,0.7)';
        return 'rgba(2,6,23,0.8)';
      })
      .attr('stroke-width', (d) => {
        if (selectedRegionId === d.properties.regionId) return 2;
        if (hoveredId === d.properties.regionId) return 1.2;
        return 0.8;
      })
      .style('filter', (d) => {
        if (selectedRegionId === d.properties.regionId) {
          const region = regionMap.get(d.properties.regionId);
          const col = region ? ciToColor(region.avgCI) : '#00fff5';
          return `drop-shadow(0 0 5px ${col})`;
        }
        return 'none';
      });
  }, [hoveredId, selectedRegionId, regionMap]);

  return (
    <div className="relative w-full" style={{ paddingBottom: '130%' }}>
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}
