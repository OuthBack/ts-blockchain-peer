export interface BlockModel {
  timestamp: number;
  hash: string;
  lastHash: string;
  data: string;
  nounce: number;
  difficulty: number;
}
