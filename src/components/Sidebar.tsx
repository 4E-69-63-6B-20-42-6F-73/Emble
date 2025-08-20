// Sidebar.tsx
import React, { FC, useEffect } from 'react';
import ColumnSelection from './ColumnSelection.tsx';

interface SidebarProps {
  handleFileLoad: (file: File | null) => Promise<void>;
  rawData: RawData;
  loadedFileName: string | null;
  selectedFeatureIndices: number[];
  setSelectedFeatureIndices: React.Dispatch<React.SetStateAction<number[]>>;
  isSupervised: boolean;
  supervisedColumnIndex: number;
  handleSupervisedChange: (checked: boolean) => void;
  handleSupervisedColumnChange: (idx: number) => void;
  selectedTooltipIndices: number[];
  setSelectedTooltipIndices: React.Dispatch<React.SetStateAction<number[]>>;
}

function getNonNumericColumns(header: string[], rows: any[][]): { name: string; index: number }[] {
  if (header.length === 0 || rows.length === 0) return [];
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

const Sidebar: FC<SidebarProps> = ({
  rawData,
  loadedFileName,
  selectedFeatureIndices,
  setSelectedFeatureIndices,
  isSupervised,
  supervisedColumnIndex,
  handleSupervisedChange,
  handleSupervisedColumnChange
}) => {
  const nonNumericColumns = getNonNumericColumns(rawData.header, rawData.rows);

  useEffect(() => {
    if (isSupervised && supervisedColumnIndex === -1 && nonNumericColumns.length > 0) {
      handleSupervisedColumnChange(nonNumericColumns[0].index);
    }
  }, [isSupervised, supervisedColumnIndex, nonNumericColumns, handleSupervisedColumnChange]);

  return (
    <aside className="rounded-2xl bg-white border shadow-sm p-4 space-y-5">
      <div className="space-y-2">
        <div className="text-xs uppercase text-gray-500">Data Info</div>
        <div className="space-y-1">
          {loadedFileName && (
            <div className="text-sm text-gray-700">File: <span className="font-medium">{loadedFileName}</span></div>
          )}
          {rawData.rows.length > 0 && (
            <div className="text-sm text-gray-700">Rows: <span className="font-medium">{rawData.rows.length}</span></div>
          )}
          {rawData.header.length > 0 && (
            <div className="text-sm text-gray-700">Columns: <span className="font-medium">{rawData.header.length}</span></div>
          )}
        </div>
      </div>

      <ColumnSelection
        name='Features'
        autoSelect={true}
        rawData={rawData}
        selectedFeatureIndices={selectedFeatureIndices}
        setSelectedFeatureIndices={setSelectedFeatureIndices}
      />
      
      <div className="border-t pt-3 space-y-2">
        <div className="text-xs uppercase text-gray-500">Supervised Learning</div>
        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            id="supervised-toggle"
            className="rounded"
            checked={isSupervised}
            onChange={(e) => handleSupervisedChange(e.target.checked)}
          />
          <label htmlFor="supervised-toggle" className="text-sm text-gray-700">Enable supervised mode</label>
        </div>
        {isSupervised && (
          <div className="space-y-1">
            <label htmlFor="supervised-column-select" className="text-xs text-gray-600">Labels column</label>
            <select 
              id="supervised-column-select" 
              className="border rounded px-2 py-1 text-sm w-full" 
              value={supervisedColumnIndex} 
              onChange={(e) => handleSupervisedColumnChange(+e.target.value)}
              disabled={nonNumericColumns.length === 0}
            >
              {nonNumericColumns.map((col, i) => (
                <option key={i} value={col.index}>{col.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;