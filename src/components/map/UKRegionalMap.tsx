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
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const onRegionSelectRef = useRef(onRegionSelect);
  onRegionSelectRef.current = onRegionSelect;
  const geoJsonRef = useRef<{ type: string; features: GeoFeature[] } | null>(null);

  // Stable lookup — only recreated when data changes
  const regionMap = useMemo(() => new Map(data.regions.map(r => [r.regionId, r])), [data]);

  // Draw map once — never re-fetches on hover/selection
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
        .attr('rx', 8);

      const features: GeoFeature[] = geojson.features ?? [];

      // fitExtent auto-calculates scale+translate so all 14 regions fit
      const projection = d3.geoAlbers()
        .center([0, 55.4])
        .rotate([4.4, 0])
        .parallels([50, 60])
        .fitExtent(
          [[16, 16], [width - 16, height - 16]],
          { type: 'FeatureCollection', features } as d3.GeoPermissibleObjects,
        );

      const pathGenerator = d3.geoPath().projection(projection);

      const g = svg.append('g').attr('class', 'map-g');

      // Region paths
      g.selectAll('path')
        .data(features)
        .enter()
        .append('path')
        .attr('d', (d) => pathGenerator(d.geometry as d3.GeoPermissibleObjects) ?? '')
        .attr('fill', (d) => {
          const region = regionMap.get(d.properties.regionId);
          return region ? ciToColor(region.avgCI) : '#1e293b';
        })
        .attr('fill-opacity', 0.85)
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

      // Region labels
      g.selectAll('text')
        .data(features)
        .enter()
        .append('text')
        .attr('transform', (d) => {
          const centroid = pathGenerator.centroid(d.geometry as d3.GeoPermissibleObjects);
          return centroid?.[0] && centroid?.[1]
            ? `translate(${centroid[0]},${centroid[1]})`
            : 'translate(-9999,-9999)';
        })
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '6.5px')
        .attr('font-family', 'system-ui, sans-serif')
        .attr('fill', 'rgba(255,255,255,0.6)')
        .attr('pointer-events', 'none')
        .text((d) => {
          const region = regionMap.get(d.properties.regionId);
          if (!region) return '';
          const word = region.shortName.split(' ')[0];
          return word.length > 9 ? '' : word;
        });

      // Zoom + pan
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([1, 8])
        .translateExtent([[0, 0], [width, height]])
        .on('zoom', (event) => {
          g.attr('transform', event.transform.toString());
        });

      svg.call(zoom);
      // Double-click resets zoom
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
        return 0.75;
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
          const col = region ? ciToColor(region.avgCI) : '#f97316';
          return `drop-shadow(0 0 4px ${col})`;
        }
        return 'none';
      });
  }, [hoveredId, selectedRegionId, regionMap]);

  return (
    <div ref={containerRef} className="relative w-full rounded-lg overflow-hidden" style={{ paddingBottom: '140%' }}>
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: 'block' }}
      />
      <div className="absolute bottom-2 right-2 text-[9px] font-mono text-slate-700 pointer-events-none select-none">
        scroll · zoom · drag
      </div>
    </div>
  );
}
