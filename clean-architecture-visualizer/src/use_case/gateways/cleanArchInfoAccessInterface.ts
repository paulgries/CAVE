import type { cleanNode } from '../../entity/cleanNode.js';

export interface CleanArchInfoAccessInterface {
  getValidOutNeighbours(): Promise<Record<cleanNode, cleanNode[]>>;
}
