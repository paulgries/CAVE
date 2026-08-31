import type { neighbourMap } from './neighbourMap.js';
import type { cleanNode } from './cleanNode.js';

/**
 * A use case in a session, as domain data. Serialized projection of the
 * information the interactors need (id, name, neighbours, files, violations,
 * missing nodes) — not a storage DTO.
 */
export type UseCaseRecord = {
  id: string;
  name: string;
  outNeighbours: neighbourMap;
  fileKeys: string[];
  violationEdges: [cleanNode, cleanNode][];
  missingNodes: cleanNode[];
};
