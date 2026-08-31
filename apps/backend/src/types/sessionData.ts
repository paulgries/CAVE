import type { cleanNode, cleanLayer } from '@cave/shared-domain';
import type { neighbourMap } from '../entity/neighbourMap.js';
import type { UseCaseRecord } from '../entity/useCaseRecord.js';
import type { ProjectNode } from '../entity/projectNode.js';
import type { EdgeDescriptor } from '../entity/edgeDescriptor.js';

export type SessionData = {
  projectName: string;
  numUseCases: number;
  numViolations: number;
  useCases: UseCaseRecord[];
  files: FileStorage[];
  edges: EdgeDescriptor[];
  nodes: ProjectNode[];
};

export type FileStorage = {
  filePath: string;
  fileType: 'java' | 'python' | 'javascript' | 'typescript' | 'unknown';
  layer: cleanLayer;
  node: cleanNode;
};
