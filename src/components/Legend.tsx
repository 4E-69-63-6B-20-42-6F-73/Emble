import React, { FC, useMemo } from 'react';
import * as d3 from 'd3';
import { PALETTE, SHAPES } from '../constants';

// Type definitions
type LegendType = 'color' | 'shape';

interface LegendProps {
  labels: (string | number | null)[];
  activeLabels: Set<string>;
  setActiveLabels: React.Dispatch<React.SetStateAction<Set<string>>>;
  type: LegendType;
}

const Legend: FC<LegendProps> = ({ labels, activeLabels, setActiveLabels, type }) => {
  if (!labels || labels.length === 0) {
    return null;
  }

  const numericLabels = useMemo(() => labels.filter(d => typeof d === 'number') as number[], [labels]);
  const isNumeric = numericLabels.length > 0;

  const uniqueLabels = useMemo(() => Array.from(new Set(labels)).filter(label => label !== null) as (string | number)[], [labels]);

  const colorScale = useMemo(() => {
    if (isNumeric) {
      const colorDomain = d3.extent(numericLabels) as [number, number];
      return d3.scaleSequential(d3.interpolateViridis).domain(colorDomain);
    } else {
      const stringLabels = uniqueLabels as string[];
      return d3.scaleOrdinal<string, string>().domain(stringLabels).range(PALETTE);
    }
  }, [uniqueLabels, isNumeric, numericLabels]);

  const shapeScale = useMemo(() => {
    const stringLabels = uniqueLabels as string[];
    return d3.scaleOrdinal<string, d3.SymbolType>().domain(stringLabels).range(SHAPES);
  }, [uniqueLabels]);


  const handleToggle = (label: string) => {
    setActiveLabels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  const renderCategoricalItem = (label: string) => {
    const isActive = activeLabels.size === 0 || activeLabels.has(label);
    const baseClasses = 'flex items-center gap-2 text-xs px-2 py-1 rounded border transition-colors';
    const activeClasses = 'bg-white';
    const inactiveClasses = 'bg-gray-100 opacity-60';
    const itemClass = `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;

    if (type === 'color' && !isNumeric) {
      const colorScaleTyped = colorScale as d3.ScaleOrdinal<string, string>;
      return (
        <button key={label} type="button" className={itemClass} onClick={() => handleToggle(label)}>
          <span className="w-3 h-3 rounded" style={{ backgroundColor: colorScaleTyped(label) }}></span>
          <span>{label}</span>
        </button>
      );
    } else if (type === 'shape') {
      const shapeScaleTyped = shapeScale as d3.ScaleOrdinal<string, d3.SymbolType>;
      const pathData = d3.symbol().type(shapeScaleTyped(label) || d3.symbolCircle).size(60)();
      const fillColor = '#6b7280';
      const strokeColor = '#9ca3af';

      return (
        <button key={label} type="button" className={itemClass} onClick={() => handleToggle(label)}>
          <svg width="16" height="16">
            <path
              d={pathData || undefined}
              transform="translate(8,8)"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="1"
            />
          </svg>
          <span>{label}</span>
        </button>
      );
    }
    return null;
  };

  const renderContinuousLegend = () => {
    const minVal = d3.min(numericLabels);
    const maxVal = d3.max(numericLabels);

    return (
      <div className="flex items-center gap-2 text-sm w-full">
        <div className="text-gray-500">{minVal?.toFixed(2)}</div>
        <div className="flex-1 h-3 rounded bg-gradient-to-r from-purple-700 to-yellow-300 w-full"></div>
        <div className="text-gray-500">{maxVal?.toFixed(2)}</div>
      </div>
    );
  };

  return (
    <div id={`${type}Legend`} className="flex flex-wrap gap-2">
      {isNumeric && type === 'color' ? renderContinuousLegend() : uniqueLabels.map(label => renderCategoricalItem(label as string))}
    </div>
  );
};

export default Legend;