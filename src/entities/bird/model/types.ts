export type Bird = {
  id: number;
  name: string;
  /**
   * Null while the question is open: the family is what the level-two hint
   * sells, so it reaches the client with the result instead.
   */
  family?: string | null;
  difficulty: string;
  habitat?: string;
  biome?: string;
  imageUrl: string;
};
