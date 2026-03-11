'use client';

import { useEffect, useRef, useState } from 'react';
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

  const regionMap = new Map(data.regions.map(r => [r.regionId, r]));

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const width = svg.clientWidth || 340;
    const height = svg.clientHeight || 480;

    // Clear previous render
    d3.select(svg).selectAll('*').remove();

    // AlbersUK-style projection centered on Great Britain
    const projection = d3.geoAlbers()
      .center([0, 55.4])
      .rotate([4.4, 0])
      .parallels([50, 60])
      .scale(Math.min(width, height) * 4.8)
      .translate([width / 2, height / 2]);

    const pathGenerator = d3.geoPath().projection(projection);

    // Fetch and render GeoJSON
    fetch('/data/uk_dno_regions.json')
      .then(r => r.json())
      .then((geojson) => {
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
          .attr('fill-opacity', (d) => {
            if (selectedRegionId === d.properties.regionId) return 1;
            if (hoveredId === d.properties.regionId) return 0.95;
            return 0.7;
          })
          .attr('stroke', (d) => {
            if (selectedRegionId === d.properties.regionId) return '#00fff5';
            if (hoveredId === d.properties.regionId) return '#ffffff';
            return 'rgba(2,6,23,0.8)';
          })
          .attr('stroke-width', (d) => {
            if (selectedRegionId === d.properties.regionId) return 2;
            return 0.8;
          })
          .style('cursor', 'pointer')
          .style('transition', 'fill-opacity 200ms, stroke 200ms')
          .style('filter', (d) => {
            if (selectedRegionId === d.properties.regionId) {
              const region = regionMap.get(d.properties.regionId);
              const col = region ? ciToColor(region.avgCI) : '#00fff5';
              return `drop-shadow(0 0 8px ${col})`;
            }
            return 'none';
          })
          .on('mouseenter', function (_, d) {
            setHoveredId(d.properties.regionId);
            d3.select(this).raise();
          })
          .on('mouseleave', function () {
            setHoveredId(null);
          })
          .on('click', (_, d) => {
            const region = regionMap.get(d.properties.regionId) ?? null;
            onRegionSelectRef.current(region);
          });

        // Region labels for larger regions
        g.selectAll('text')
          .data(features)
          .enter()
          .append('text')
          .attr('transform', (d) => {
            const centroid = pathGenerator.centroid(d.geometry as d3.GeoPermissibleObjects);
            return centroid && centroid[0] && centroid[1] ? `translate(${centroid})` : '';
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
            // Only label larger regions
            const short = region.shortName.split(' ')[0];
            return short.length > 8 ? '' : short;
          });
      })
      .catch(console.error);
  }, [data, selectedRegionId, hoveredId, regionMap]);

  // Re-render on hover changes (lightweight)
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
        if (selectedRegionId === d.properties.regionId) return '#00fff5';
        if (hoveredId === d.properties.regionId) return 'rgba(255,255,255,0.8)';
        return 'rgba(2,6,23,0.8)';
      })
      .attr('stroke-width', (d) => {
        if (selectedRegionId === d.properties.regionId) return 2;
        if (hoveredId === d.properties.regionId) return 1.5;
        return 0.8;
      });
  }, [hoveredId, selectedRegionId]);

  return (
    <div className="relative w-full" style={{ paddingBottom: '130%' }}>
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full"
        style={{ filter: 'drop-shadow(0 0 40px rgba(0,255,245,0.06))' }}
      />
    </div>
  );
}
