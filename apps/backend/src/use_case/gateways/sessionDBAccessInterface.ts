import type { UseCaseRecord } from '../../entity/useCaseRecord.js';
import type { ProjectNode } from '../../entity/projectNode.js';
import type { EdgeDescriptor } from '../../entity/edgeDescriptor.js';

/**
 * Domain-shaped persistence gateway. Returns domain entities only
 * (`UseCaseRecord`, `ProjectNode`, `EdgeDescriptor`) — never storage DTOs.
 * No generic CRUD/GetAll; queries express the use case's need.
 */
export interface SessionDBAccessInterface {
  // Writes (accept domain entities)
  setProjectName(name: string): void;
  setNumUseCases(count: number): void;
  setNumViolations(count: number): void;
  setUseCaseRecords(records: UseCaseRecord[]): void;
  setNodes(nodes: ProjectNode[]): void;
  setEdges(edges: EdgeDescriptor[]): void;

  // Reads (domain-shaped)
  getUseCase(id: string): UseCaseRecord | undefined;
  getUseCases(): UseCaseRecord[];
  getNodes(): ProjectNode[];
  getNodesForUseCase(id: string): ProjectNode[];
  getNodesByStatus(status: 'VALID' | 'VIOLATION' | 'MISSING'): ProjectNode[];
  getEdges(): EdgeDescriptor[];

  // Scalars
  getProjectName(): string;
  getNumUseCases(): number;
  getNumViolations(): number;

  // Lifecycle
  resetDB(): undefined;
}
