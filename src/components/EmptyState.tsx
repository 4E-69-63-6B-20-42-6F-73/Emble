import { FC, useRef, useEffect, ChangeEvent } from 'react';

interface EmptyStateProps {
  handleFileLoad: (file: File | null) => Promise<void>;
}

const EmptyState: FC<EmptyStateProps> = ({ handleFileLoad }) => {
  const dropZoneRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileLoad(e.target.files?.[0] || null);
  };

  useEffect(() => {
    const dropZone = dropZoneRef.current;
    if (!dropZone) return;

    const dragOver = (e: DragEvent) => {
      e.preventDefault();
      dropZone.classList.add('border-black');
    };
    const dragLeave = (e: DragEvent) => {
      e.preventDefault();
      dropZone.classList.remove('border-black');
    };
    const drop = (e: DragEvent) => {
      e.preventDefault();
      dropZone.classList.remove('border-black');
      if (e.dataTransfer?.files?.[0]) {
        handleFileLoad(e.dataTransfer.files[0]);
      }
    };

    dropZone.addEventListener('dragover', dragOver);
    dropZone.addEventListener('dragleave', dragLeave);
    dropZone.addEventListener('drop', drop);

    return () => {
      dropZone.removeEventListener('dragover', dragOver);
      dropZone.removeEventListener('dragleave', dragLeave);
      dropZone.removeEventListener('drop', drop);
    };
  }, [handleFileLoad]);

  return (
    <section 
      ref={dropZoneRef}
      onClick={handleClick}
      className="rounded-2xl bg-white border-2 border-dashed border-gray-300 shadow-sm relative overflow-hidden flex items-center justify-center transition-colors cursor-pointer"
    >
      <div className="text-center text-gray-500">
        <i className="fa-solid fa-file-arrow-up text-3xl mb-2"></i>
        <div className="font-medium">Click or drag and drop a file</div>
        <div className="text-xs">CSV or TSV file with headers</div>
      </div>
      <input 
        ref={fileInputRef} 
        type="file" 
        accept=".csv,.tsv,.txt"
        className="hidden" 
        onChange={handleFileChange} 
      />
    </section>
  );
};

export default EmptyState;