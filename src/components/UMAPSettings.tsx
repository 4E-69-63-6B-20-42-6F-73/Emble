import React, { useRef, useEffect, FC } from 'react';

// Type definitions
interface UMAPParams {
  nNeighbors: number;
  minDist: number;
  epochs: number;
  supervised: boolean;
  pointSize: number;
}

interface UMAPSettingsProps {
  umapParams: UMAPParams;
  setUmapParams: React.Dispatch<React.SetStateAction<UMAPParams>>;
  onClose: () => void;
  hasUsableLabels: () => boolean;
}

const UMAPSettings: FC<UMAPSettingsProps> = ({ umapParams, setUmapParams, onClose }) => {
  const popupRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node) && (event.target as HTMLElement).id !== 'cogBtn') {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setUmapParams((prevParams) => ({
      ...prevParams,
      [id]: type === 'checkbox' ? checked : +value,
    }));
  };

  return (
    <div ref={popupRef} id="paramsPopup" className="absolute right-0 mt-2 w-72 bg-white border rounded-xl shadow-lg p-3 space-y-3">
      <div className="text-xs uppercase text-gray-500">UMAP Parameters</div>
      <label className="text-sm flex items-center justify-between gap-2">nNeighbors
        <input id="nNeighbors" type="range" min="2" max="50" step="1" value={umapParams.nNeighbors} onChange={handleInputChange} className="w-36" />
        <span id="neighborsVal" className="text-xs w-6 text-right">{umapParams.nNeighbors}</span>
      </label>
      <label className="text-sm flex items-center justify-between gap-2">minDist
        <input id="minDist" type="range" min="0" max="0.99" step="0.01" value={umapParams.minDist} onChange={handleInputChange} className="w-36" />
        <span id="minDistVal" className="text-xs w-12 text-right">{umapParams.minDist.toFixed(2)}</span>
      </label>
      <label className="text-sm flex items-center justify-between gap-2">Epochs
        <input id="epochs" type="range" min="50" max="1000" step="10" value={umapParams.epochs} onChange={handleInputChange} className="w-36" />
        <span id="epochsVal" className="text-xs w-10 text-right">{umapParams.epochs}</span>
      </label>
      <label className="text-sm flex items-center justify-between gap-2">Point size
        <input id="pointSize" type="range" min="1" max="8" step="1" value={umapParams.pointSize} onChange={handleInputChange} className="w-36" />
        <span id="rVal" className="text-xs w-6 text-right">{umapParams.pointSize}</span>
      </label>
    </div>
  );
};

export default UMAPSettings;