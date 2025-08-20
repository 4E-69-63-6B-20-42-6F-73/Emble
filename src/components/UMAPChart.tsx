// UMAPChart.tsx
import React, { useRef, useEffect, FC } from 'react';
import * as d3 from 'd3';
import { PALETTE, SHAPES } from '../constants';

// Type definitions
interface PointData {
  x: number;
  y: number;
  i: number;
  c: string | number | null;
  s: string | null;
}

interface UMAPChartProps {
  embedding: number[][] | null;
  labels: (string | number | null)[];
  shapeLabels: (string | null)[];
  activeCategories: Set<string>;
  activeShapes: Set<string>;
  pointSize: number;
  currentTransform: d3.ZoomTransform | null;
  setCurrentTransform: React.Dispatch<React.SetStateAction<d3.ZoomTransform | null>>;
  rawData: RawData;
  selectedTooltipIndices: number[];
}

const UMAPChart: FC<UMAPChartProps> = ({
  embedding,
  labels,
  shapeLabels,
  activeCategories,
  activeShapes,
  pointSize,
  currentTransform,
  setCurrentTransform,
  rawData,
  selectedTooltipIndices,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const viewportRef = useRef<SVGGElement | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const margin = { top: 10, right: 10, bottom: 10, left: 10 };

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const tooltip = d3.select(tooltipRef.current);

    if (!embedding || embedding.length === 0) {
      if (viewportRef.current) d3.select(viewportRef.current).selectAll('*').remove();
      return;
    }

    const { width, height } = svgRef.current?.getBoundingClientRect() ?? { width: 200, height: 200 };
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    if (!viewportRef.current) {
      viewportRef.current = svg.append('g').attr('class', 'viewport').node();
    }
    const g = d3.select(viewportRef.current);

    const xExtent = d3.extent(embedding, (d) => d[0]) as [number, number];
    const yExtent = d3.extent(embedding, (d) => d[1]) as [number, number];
    const x = d3.scaleLinear().domain(xExtent).range([margin.left, width - margin.right]);
    const y = d3.scaleLinear().domain(yExtent).range([height - margin.bottom, margin.top]);

    if (!zoomRef.current) {
      const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.5, 20]).on('zoom', (e) => {
        setCurrentTransform(e.transform);
        g.attr('transform', e.transform as any);
      });
      svg.call(zoom as any);
      zoomRef.current = zoom;
    }

    if (currentTransform) {
      svg.call(zoomRef.current.transform as any, currentTransform);
    } else {
      svg.call(zoomRef.current.transform as any, d3.zoomIdentity);
    }

    g.selectAll('*').remove();

    const hasNumericLabels = labels.some(d => typeof d === 'number');
    let color: d3.ScaleOrdinal<string, string> | d3.ScaleSequential<string>;

    if (hasNumericLabels) {
      const numericLabels = labels.filter(d => typeof d === 'number') as number[];
      const colorDomain = d3.extent(numericLabels) as [number, number];
      color = d3.scaleSequential(d3.interpolateViridis).domain(colorDomain);
    } else {
      const categories = Array.from(new Set((labels || []).filter(d => d !== null))) as string[];
      color = d3.scaleOrdinal<string, string>().domain(categories).range(PALETTE);
    }

    const shapeCategories = Array.from(new Set((shapeLabels || []).filter(Boolean))) as string[];
    const shapeScale = d3.scaleOrdinal<string, d3.SymbolType>().domain(shapeCategories).range(SHAPES);

    const pr = +pointSize;
    const size = Math.max(10, Math.PI * pr * pr * 6);
    const symbolFor = (d: PointData) => (d.s && shapeScale(d.s) ? shapeScale(d.s) : d3.symbolCircle);

    const ptsData: PointData[] = embedding.map((p, i) => ({
      x: x(p[0]),
      y: y(p[1]),
      i,
      c: labels?.[i] ?? null,
      s: shapeLabels?.[i] ?? null,
    }));

    const points = g.append('g').attr('class', 'points').selectAll<SVGPathElement, PointData>('path').data(ptsData).join('path')
      .attr('transform', (d) => `translate(${d.x},${d.y})`)
      .attr('d', (d) => d3.symbol().type(symbolFor(d)).size(size)())
      .attr('stroke', 'white')
      .attr('stroke-width', 0.5)
      .on('mouseover', (_, d) => {
        tooltip.classed('hidden', false);
        let tooltipContent = `<div class="flex items-center gap-2">`;
        if (d.c !== null) {
          const colorValue = typeof d.c === 'number' ? d.c.toFixed(2) : d.c;
          tooltipContent += `<span class="w-3 h-3 rounded" style="background-color: ${color(d.c as any)}"></span><span class="font-medium">${colorValue}</span>`;
        }
        if (d.s) {
          tooltipContent += `<span>(${d.s})</span>`;
        }
        tooltipContent += `</div>`;
        
        selectedTooltipIndices.forEach(index => {
          const header = rawData.header[index];
          const value = rawData.rows[d.i][index];
          if (header && value) {
            tooltipContent += `<div class="flex items-center gap-2 mt-1"><span class="text-xs text-gray-500">${header}:</span><span class="text-sm">${value}</span></div>`;
          }
        });

        tooltip.html(tooltipContent);
      })
      .on('mousemove', (e) => {
        const pad = 8;
        const rect = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
        tooltip.style('left', `${e.clientX - rect.left + pad}px`).style('top', `${e.clientY - rect.top + pad}px`);
      })
      .on('mouseout', () => tooltip.classed('hidden', true));

    // Update point visibility and color based on active categories and shapes
    points.each(function (d) {
      const colorOk = activeCategories.size === 0 || (d.c && activeCategories.has(d.c as string));
      const shapeOk = activeShapes.size === 0 || (d.s && activeShapes.has(d.s));
      const on = colorOk && shapeOk;
      d3.select(this)
        .attr('fill', on ? (d.c !== null ? color(d.c as any) : '#111827') : '#cccccc')
        .attr('fill-opacity', on ? 0.9 : 0.2)
        .attr('display', null);
    });

  }, [embedding, labels, shapeLabels, pointSize, activeCategories, activeShapes, currentTransform, setCurrentTransform, rawData, selectedTooltipIndices]);

  return (
    <div id="chartWrap" className="absolute inset-0">
      <svg id="chart" ref={svgRef} className="w-full h-full"></svg>
      <div id="tooltip" ref={tooltipRef} className="hidden absolute bg-white/90 backdrop-blur px-2 py-1 text-xs rounded border shadow"></div>
    </div>
  );
};

export default UMAPChart;