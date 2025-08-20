import React, { useState, useEffect, FC } from 'react';
import Sidebar from './components/Sidebar.tsx';
import MainContent from './components/MainContent.tsx';
import UIMain from './components/UIMain.tsx';
import LoadingScreen from './components/LoadingScreen.tsx';
import EmptyState from './components/EmptyState.tsx';
import { useUMAP } from './hooks/useUMAP.ts';

// Type definitions
interface UMAPParams {
  nNeighbors: number;
  minDist: number;
  epochs: number;
  supervised: boolean;
  pointSize: number;
}

function parseCSV(text: string): RawData {
  const delim = text.includes('\t') ? '\t' : ',';
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0].split(delim).map((s) => s.trim().replace(/"/g, ''));
  const rows = lines.slice(1).filter((l) => l.trim().length > 0).map((l) =>
    l.split(delim).map(cell => {
      const trimmedCell = cell.trim().replace(/"/g, '');
      if (trimmedCell === '') {
        return "";
      }
      const numValue = +trimmedCell;
      if (Number.isFinite(numValue)) {
        return numValue;
      }
      return trimmedCell;
    })
  );
  return { header, rows };
}

function detectNumericColumns(header: string[], rows: string[][]): number[] {
  const idx: number[] = [];
  header.forEach((_h, i) => {
    let ok = true;
    for (const r of rows) {
      const v = r[i];
      if (v == null || v === '') continue;
      const n = +v;
      if (!Number.isFinite(n)) {
        ok = false;
        break;
      }
    }
    if (ok) idx.push(i);
  });
  return idx;
}

// Helper function to map strings to numbers
function mapStringsToNumbers(values: (string | null)[]): number[] {
  const valueMap = new Map<string, number>();
  return values.map(val => {
    if (val === null || val === '') return -1;
    if (!valueMap.has(val)) {
      valueMap.set(val, valueMap.size);
    }
    return valueMap.get(val)!;
  });
}

const App: FC = () => {
  const [rawData, setRawData] = useState<RawData>({ header: [], rows: [] });
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null);
  const [data, setData] = useState<number[][]>([]);
  const [labels, setLabels] = useState<(string | null)[]>([]);
  const [shapeLabels, setShapeLabels] = useState<(string | null)[]>([]);
  const [selectedFeatureIndices, setSelectedFeatureIndices] = useState<number[]>([]);
  const [selectedTooltipIndices, setSelectedTooltipIndices] = useState<number[]>([])

  const [selectedColorIndex, setSelectedColorIndex] = useState<number>(-1);
  const [selectedShapeIndex, setSelectedShapeIndex] = useState<number>(-1);
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set());
  const [activeShapes, setActiveShapes] = useState<Set<string>>(new Set());
  const [isSupervised, setIsSupervised] = useState<boolean>(false);
  const [supervisedColumnIndex, setSupervisedColumnIndex] = useState<number>(-1);
  const [umapParams, setUmapParams] = useState<UMAPParams>({
    nNeighbors: 15,
    minDist: 0.1,
    epochs: 400,
    supervised: isSupervised,
    pointSize: 3,
  });

  const { embedding, isLoading, progress } = useUMAP(data, labels, umapParams);

  const handleFileLoad = async (file: File | null): Promise<void> => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      setRawData(parsed);
      setLoadedFileName(file.name);
      const numericIndices = detectNumericColumns(parsed.header, parsed.rows);
      setSelectedFeatureIndices(numericIndices);
      setSelectedColorIndex(-1);
      setSelectedShapeIndex(-1);
      setSupervisedColumnIndex(-1);
    } catch (error) {
      console.error('Failed to load file:', error);
      setLoadedFileName(null);
    }
  };

  const handleApplyColumns = (): void => {
    if (rawData.rows.length === 0) return;
    
    // Convert raw data to numeric features
    const feats = rawData.rows.map(row => 
      selectedFeatureIndices.map(colIndex => {
        const value = row[colIndex];
        const numValue = +value;
        if (Number.isFinite(numValue)) {
          return numValue;
        } else {
          // If not a number, create a string-to-number mapping
          const allValues = rawData.rows.map(r => r[colIndex]);
          const mappedValues = mapStringsToNumbers(allValues);
          return mappedValues[rawData.rows.indexOf(row)];
        }
      })
    );
    setData(feats);

    let umapLabels: (string | null)[];
    if (isSupervised && supervisedColumnIndex >= 0) {
      const rawLabels = rawData.rows.map((r) => r[supervisedColumnIndex] ?? null);
      const mappedLabels = mapStringsToNumbers(rawLabels);
      umapLabels = mappedLabels.map(l => l.toString());
    } else {
      umapLabels = Array(rawData.rows.length).fill(null);
    }
    setLabels(umapLabels);
    
    setUmapParams((prev) => ({ ...prev, supervised: isSupervised }));
  };

  const handleColorChange = (idx: number): void => {
    setSelectedColorIndex(idx);
    setActiveCategories(new Set());
  };

  const handleShapeChange = (idx: number): void => {
    setSelectedShapeIndex(idx);
    const shapeLabels = idx >= 0
    ? rawData.rows.map((r) => r[idx] ?? null)
    : Array(rawData.rows.length).fill(null);
    setShapeLabels(shapeLabels);
    setActiveShapes(new Set());
  };

  const handleSupervisedChange = (checked: boolean) => {
    setIsSupervised(checked);
    setUmapParams((prev) => ({ ...prev, supervised: checked }));
  };

  const handleSupervisedColumnChange = (idx: number) => {
    setSupervisedColumnIndex(idx);
  };

  useEffect(() => {
    if (rawData.rows.length > 0) {
      handleApplyColumns();
    }
  }, [selectedFeatureIndices, isSupervised, supervisedColumnIndex, rawData]);

  const colorLabels = selectedColorIndex >= 0
    ? rawData.rows.map((r) => r[selectedColorIndex] ?? null)
    : Array(rawData.rows.length).fill(null);

  const hasUsableLabels = (): boolean => new Set(labels.filter(Boolean)).size > 1 && labels.length === data.length;

  const hasData = rawData.rows.length > 0;

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-white border-b">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight">Emble</h1>
        </div>
      </header>

      <main className={`flex-1 min-h-0 grid gap-4 p-4 ${hasData ? 'lg:grid-cols-[18rem_minmax(0,1fr)_18rem] grid-cols-1' : 'grid-cols-1'}`}>
        {hasData && (
          <Sidebar
            handleFileLoad={handleFileLoad}
            rawData={rawData}
            loadedFileName={loadedFileName}
            selectedFeatureIndices={selectedFeatureIndices}
            setSelectedFeatureIndices={setSelectedFeatureIndices}
            selectedTooltipIndices={selectedTooltipIndices}
            setSelectedTooltipIndices={setSelectedTooltipIndices}
            isSupervised={isSupervised}
            supervisedColumnIndex={supervisedColumnIndex}
            handleSupervisedChange={handleSupervisedChange}
            handleSupervisedColumnChange={handleSupervisedColumnChange}
          />
        )}

        {isLoading ? (
          <LoadingScreen progress={progress} />
        ) : embedding ? (
          <MainContent
            embedding={embedding}
            labels={colorLabels}
            shapeLabels={shapeLabels}
            activeCategories={activeCategories}
            activeShapes={activeShapes}
            setActiveCategories={setActiveCategories}
            setActiveShapes={setActiveShapes}
            umapParams={umapParams}
            setUmapParams={setUmapParams}
            hasUsableLabels={hasUsableLabels}
            selectedTooltipIndices={selectedTooltipIndices}
            rawData={rawData}
          />
        ) : (
          <EmptyState handleFileLoad={handleFileLoad} />
        )}

        {hasData && (
          <UIMain
            rawData={rawData}
            handleColorChange={handleColorChange}
            handleShapeChange={handleShapeChange}
            selectedColorIndex={selectedColorIndex}
            selectedShapeIndex={selectedShapeIndex}
            activeCategories={activeCategories}
            activeShapes={activeShapes}
            setActiveCategories={setActiveCategories}
            setActiveShapes={setActiveShapes}
              selectedTooltipIndices={selectedTooltipIndices}
              setSelectedTooltipIndices={setSelectedTooltipIndices}
          />
        )}
      </main>
    </div>
  );
};

export default App;
