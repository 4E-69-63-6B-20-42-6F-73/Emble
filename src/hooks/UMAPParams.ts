// Type definitions
export interface UMAPParams {
  nNeighbors: number;
  minDist: number;
  epochs: number;
  supervised: boolean;
  pointSize: number;
  metric: "euclidean" | "cosine";
}
