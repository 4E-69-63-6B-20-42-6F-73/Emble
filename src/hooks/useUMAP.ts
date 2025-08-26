import { useState, useEffect, useRef, useCallback } from 'react';
import { UMAP } from 'umap-js';
import seedrandom from 'seedrandom';
import { euclidean, cosine } from 'umap-js/dist/umap';
import { UMAPParams } from './UMAPParams';

interface UseUMAPResult {
  embedding: number[][] | null;
  isLoading: boolean;
  progress: number;
  runUMAP: () => void;
}

export const useUMAP = (data: number[][], labels: number[], umapParams: UMAPParams): UseUMAPResult => {
  const [embedding, setEmbedding] = useState<number[][] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const currentRunRef = useRef<number>(0);

  const runUMAP = useCallback(async () => {
    if (data.length === 0) return;
    currentRunRef.current += 1;
    const myRun = currentRunRef.current;
    setIsLoading(true);
    setProgress(0);

    const { nNeighbors, minDist, epochs, supervised, metric } = umapParams;
    const rng = seedrandom("42")
    const umap = new UMAP({ nNeighbors, minDist, nEpochs: epochs, random:rng, distanceFn: metric === 'euclidean' ? euclidean : cosine });

    const hasUsableLabels = new Set(labels.filter(Boolean)).size > 1 && labels.length === data.length;
    if (supervised && hasUsableLabels) {
      umap.setSupervisedProjection(labels);
    }

    const emb = await umap.fitAsync(data, (epc: number) => {
      if (myRun !== currentRunRef.current) return false;
      const pct = Math.min(100, Math.round((epc / epochs) * 100));
      setProgress(pct);
    });

    if (myRun !== currentRunRef.current) return;
    setEmbedding(emb);
    setIsLoading(false);
    setProgress(100);
  }, [data, labels, umapParams]);

  const debounceTimeout = useRef<any | null>(null);
  const debouncedRun = useCallback(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      runUMAP();
    }, 250);
  }, [runUMAP]);

  useEffect(() => {
    if (data.length > 0) {
      debouncedRun();
    }
  }, [data, umapParams.nNeighbors, umapParams.minDist, umapParams.epochs, umapParams.supervised, debouncedRun]);

  return { embedding, isLoading, progress, runUMAP };
};