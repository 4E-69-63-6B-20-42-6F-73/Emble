import React, { FC } from 'react';
import Legend from './Legend.tsx';
import ColumnSelection from './ColumnSelection.tsx';

interface UIMainProps {
  rawData: RawData;
  handleColorChange: (idx: number) => void;
  handleShapeChange: (idx: number) => void;
  selectedColorIndex: number;
  selectedShapeIndex: number;
  activeCategories: Set<string>;
  activeShapes: Set<string>;
  setActiveCategories: React.Dispatch<React.SetStateAction<Set<string>>>;
  setActiveShapes: React.Dispatch<React.SetStateAction<Set<string>>>;
  selectedTooltipIndices: number[];
  setSelectedTooltipIndices: React.Dispatch<React.SetStateAction<number[]>>;
}

function getNonNumericColumns(header: string[], rows: any[][]): { name: string; index: number }[] {
  const numericIndices = new Set(header.map((_h, i) => {
    for (const r of rows) {
      const v = r[i];
      if (v == null || v === '') continue;
      if (!Number.isFinite(+v)) return null;
    }
    return i;
  }).filter(idx => idx !== null));

  return header.map((name, index) => ({ name, index })).filter((col) => !numericIndices.has(col.index));
}

const UIMain: FC<UIMainProps> = ({
  rawData,
  handleColorChange,
  handleShapeChange,
  selectedColorIndex,
  selectedShapeIndex,
  activeCategories,
  activeShapes,
  setActiveCategories,
  setActiveShapes,
  selectedTooltipIndices,
  setSelectedTooltipIndices

}) => {
  const nonNumericColumns = getNonNumericColumns(rawData.header, rawData.rows);
  const colorLabels = selectedColorIndex >= 0
    ? rawData.rows.map(r => r[selectedColorIndex] ?? null)
    : [];
  const shapeLabels = selectedShapeIndex >= 0
    ? rawData.rows.map(r => r[selectedShapeIndex] ?? null)
    : [];

  return (
    <aside className="rounded-2xl bg-white border shadow-sm p-4 space-y-5">
      <div className="space-y-2">
        <div className="text-xs uppercase text-gray-500">Color by</div>
        <select
          id="color-select"
          className="border rounded px-2 py-1 text-sm w-full"
          value={selectedColorIndex}
          onChange={(e) => handleColorChange(+e.target.value)}
          disabled={!rawData.header.length}
        >
          <option value="-1">None</option>
          {rawData.header.map((v, i) => (
            <option key={i} value={i}>{v}</option>
          ))}
        </select>
        {selectedColorIndex >= 0 && (
          <Legend
            type="color"
            labels={colorLabels}
            activeLabels={activeCategories}
            setActiveLabels={setActiveCategories}
          />
        )}
      </div>

      <div className="space-y-2">
        <div className="text-xs uppercase text-gray-500">Shape by</div>
        <select
          id="shape-select"
          className="border rounded px-2 py-1 text-sm w-full"
          value={selectedShapeIndex}
          onChange={(e) => handleShapeChange(+e.target.value)}
          disabled={!rawData.header.length}
        >
          <option value="-1">None</option>
          {nonNumericColumns.map((col, i) => (
            <option key={i} value={col.index}>{col.name}</option>
          ))}
        </select>
        {selectedShapeIndex >= 0 && (
          <Legend
            type="shape"
            labels={shapeLabels}
            activeLabels={activeShapes}
            setActiveLabels={setActiveShapes}
          />
        )}
      </div>

      <ColumnSelection
        name='Tooltip'
        autoSelect={false}
        rawData={rawData}
        selectedFeatureIndices={selectedTooltipIndices}
        setSelectedFeatureIndices={setSelectedTooltipIndices}
      />
    </aside>
  );
};

export default UIMain;