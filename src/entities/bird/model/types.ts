export type Bird = {
  id: number;
  name: string;
  family: string | null;
  difficulty: string;
  habitat?: string;
  biome?: string;
  imageUrl: string;
};
