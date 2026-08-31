import type { cleanNode } from './cleanNode.js';
import type { cleanLayer } from './cleanLayer.js';

/**
 * A project file and its Clean Architecture classification. The relative
 * `filePath` encodes the layer structure (node/layer are derived from it), so
 * this is domain data, not a storage DTO.
 */
export type ProjectNode = {
  id: string;
  name?: string;
  filePath?: string;
  type: cleanNode;
  layer: cleanLayer;
  status: 'VALID' | 'VIOLATION' | 'MISSING';
};
