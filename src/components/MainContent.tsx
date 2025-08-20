// MainContent.tsx
import React, { useState, FC } from 'react';
import UMAPSettings from './UMAPSettings.tsx';
import UMAPChart from './UMAPChart.tsx';
import * as d3 from 'd3';

// Type definitions
interface UMAPParams {
  nNeighbors: number;
  minDist: number;
  epochs: number;
  supervised: boolean;
  pointSize: number;
}

interface MainContentProps {
  embedding: number[][] | null;
  labels: (string | null)[];
  shapeLabels: (string | null)[];
  activeCategories: Set<string>;
  activeShapes: Set<string>;
  setActiveCategories: React.Dispatch<React.SetStateAction<Set<string>>>;
  setActiveShapes: React.Dispatch<React.SetStateAction<Set<string>>>;
  umapParams: UMAPParams;
  setUmapParams: React.Dispatch<React.SetStateAction<UMAPParams>>;
  hasUsableLabels: () => boolean;
  rawData: RawData;
  selectedTooltipIndices: number[];
}

const MainContent: FC<MainContentProps> = ({
  embedding,
  labels,
  shapeLabels,
  activeCategories,
  activeShapes,
  umapParams,
  setUmapParams,
  hasUsableLabels,
  rawData,
  selectedTooltipIndices,
}) => {
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [currentTransform, setCurrentTransform] = useState<d3.ZoomTransform | null>(null);

  const resetView = () => {
    setCurrentTransform(null);
  };

  const exportSVG = () => {
    const node = document.getElementById('chart');
    if (!node) return;
    const w = node.clientWidth || 960;
    const h = node.clientHeight || 600;
    const clone = node.cloneNode(true) as SVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', w.toString());
    clone.setAttribute('height', h.toString());
    const s = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${s}`], { type: 'image/svg+xml;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'umap.svg';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <section className="rounded-2xl bg-white border shadow-sm relative overflow-hidden min-h-0">
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        <button onClick={exportSVG} id="exportBtn" className="p-2 rounded-lg border bg-white hover:bg-gray-50" title="Download SVG">
          <i className="fa-solid fa-download"></i>
        </button>
        <button onClick={resetView} id="resetBtn" className="p-2 rounded-lg border bg-white hover:bg-gray-50" title="Reset View">
          <i className="fa-solid fa-rotate-left"></i>
        </button>
        <div className="relative">
          <button onClick={() => setShowSettings(!showSettings)} id="cogBtn" className="p-2 rounded-lg border bg-white hover:bg-gray-50" title="UMAP Settings">
            <i className="fa-solid fa-gear"></i>
          </button>
          {showSettings && (
            <UMAPSettings
              umapParams={umapParams}
              setUmapParams={setUmapParams}
              onClose={() => setShowSettings(false)}
              hasUsableLabels={hasUsableLabels}
            />
          )}
        </div>
      </div>

      <UMAPChart
        embedding={embedding}
        labels={labels}
        shapeLabels={shapeLabels}
        activeCategories={activeCategories}
        activeShapes={activeShapes}
        pointSize={umapParams.pointSize}
        currentTransform={currentTransform}
        setCurrentTransform={setCurrentTransform}
        rawData={rawData}
        selectedTooltipIndices={selectedTooltipIndices}
      />
    </section>
  );
};

export default MainContent;