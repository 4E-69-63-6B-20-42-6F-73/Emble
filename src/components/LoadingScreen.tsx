import { FC } from 'react';

interface LoadingScreenProps {
  progress: number;
}

const LoadingScreen: FC<LoadingScreenProps> = ({ progress }) => {
  return (
    <section className="rounded-2xl bg-white border shadow-sm relative overflow-hidden flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 w-64">
        <div className="text-xl font-medium text-gray-800">
          Calculating UMAP...
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-blue-600 h-2.5 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="text-sm text-gray-600">
          Progress: {progress}%
        </div>
      </div>
    </section>
  );
};

export default LoadingScreen;