import React, { FC, useEffect } from 'react';

interface ColumnSelectionProps {
  name:string;
  autoSelect:Boolean;
  rawData: RawData;
  selectedFeatureIndices: number[];
  setSelectedFeatureIndices: React.Dispatch<React.SetStateAction<number[]>>;
}

interface ColumnInfo {
  name: string;
  index: number;
  isPurelyNumeric: boolean;
}

function getFeatureColumns(header: string[], rows: any[][]): ColumnInfo[] {
  if (header.length === 0 || rows.length === 0) return [];

  return header.map((name, index) => {
    let isPurelyNumeric = true;

    for (const r of rows) {
      const v = r[index];
      if (v == null || v === '') continue;
      
      const numValue = +v;
      if (!Number.isFinite(numValue)) {
        isPurelyNumeric = false;
        break;
      }
    }
    
    return { name, index, isPurelyNumeric };
  }).filter(col => {
    // A column is a feature column if it's purely numeric, or if it has a small number of unique values.
    // The latter case allows for columns like "category 1", "category 2" to be used.
    if (col.isPurelyNumeric) return true;
    
    const uniqueValues = new Set(rows.map(r => r[col.index]).filter(v => v != null && v !== ''));
    return uniqueValues.size > 0 && uniqueValues.size <= rows.length;
  });
}

const ColumnSelection: FC<ColumnSelectionProps> = ({
  name,
  autoSelect,
  rawData,
  selectedFeatureIndices,
  setSelectedFeatureIndices,
}) => {
  const featureColumns = getFeatureColumns(rawData.header, rawData.rows);

  useEffect(() => {
    if(autoSelect){
    const defaultSelection = [];
    for (const col of featureColumns) {
      if (col.isPurelyNumeric) {
        defaultSelection.push(col.index);
      } else {
        break;
      }
    }
    setSelectedFeatureIndices(defaultSelection);}
  }, [rawData.header, setSelectedFeatureIndices, autoSelect]);

  const handleSelect = (index: number) => {
    setSelectedFeatureIndices((prevIndices) => {
      if (prevIndices.includes(index)) {
        return prevIndices.filter((i) => i !== index);
      } else {
        return [...prevIndices, index];
      }
    });
  };

  return (
    <div className="space-y-2 border-t pt-3">
      <div className="text-xs uppercase text-gray-500">{name}</div>
      <div className="max-h-56 overflow-y-auto space-y-1">
        {featureColumns.length > 0 ? (
          featureColumns.map((col) => (
            <label
              key={col.index}
              className="flex items-center gap-2 p-1 rounded-md cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedFeatureIndices.includes(col.index)}
                onChange={() => handleSelect(col.index)}
              />
              <span className="text-sm">{col.name}</span>
            </label>
          ))
        ) : (
          <div className="text-xs text-gray-500">No suitable columns found.</div>
        )}
      </div>
    </div>
  );
};

export default ColumnSelection;