import type { cleanNode } from '@cave/shared-domain';

export interface CleanArchInfoAccessInterface {
  getValidOutNeighbours(): Promise<Record<cleanNode, cleanNode[]>>;
}
