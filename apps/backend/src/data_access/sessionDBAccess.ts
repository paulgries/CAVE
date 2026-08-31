import type { SessionData, FileStorage } from '../types/sessionData.js';
import type { SessionDBAccessInterface } from '../use_case/gateways/sessionDBAccessInterface.js';
import { SessionDB } from '../database/sessionDb.js';
import { CollectionRepository } from './collectionRepository.js';
import type { UseCaseRecord } from '../entity/useCaseRecord.js';
import type { ProjectNode } from '../entity/projectNode.js';
import type { EdgeDescriptor } from '../entity/edgeDescriptor.js';

export class SessionDBAccess implements SessionDBAccessInterface {
  private readonly db: SessionDB<SessionData>;
  private readonly useCases = new CollectionRepository<UseCaseRecord>(
    (uc) => uc.id
  );
  private readonly nodes = new CollectionRepository<ProjectNode>((n) => n.id);
  private readonly edges = new CollectionRepository<EdgeDescriptor>(
    (e) => `${e.source}->${e.target}`
  );
  private readonly files = new CollectionRepository<FileStorage>(
    (f) => f.filePath
  );

  constructor() {
    this.db = new SessionDB<SessionData>();
    this.db.load();
    this.useCases.set(this.db.get('useCases') ?? []);
    this.nodes.set(this.db.get('nodes') ?? []);
    this.edges.set(this.db.get('edges') ?? []);
    this.files.set(this.db.get('files') ?? []);
  }

  private persistUseCases(): void {
    this.db.set('useCases', this.useCases.getAll());
  }
  private persistNodes(): void {
    this.db.set('nodes', this.nodes.getAll());
  }
  private persistEdges(): void {
    this.db.set('edges', this.edges.getAll());
  }
  private persistFiles(): void {
    this.db.set('files', this.files.getAll());
  }

  // ---- Interface: writes ----

  setProjectName(name: string): void {
    this.db.set('projectName', name);
  }

  setNumUseCases(count: number): void {
    this.db.set('numUseCases', count);
  }

  setNumViolations(count: number): void {
    this.db.set('numViolations', count);
  }

  setUseCaseRecords(records: UseCaseRecord[]): void {
    this.useCases.set(records);
    this.persistUseCases();
  }

  setNodes(nodes: ProjectNode[]): void {
    this.nodes.set(nodes);
    this.persistNodes();
  }

  setEdges(edges: EdgeDescriptor[]): void {
    this.edges.set(edges);
    this.persistEdges();
  }

  // ---- Interface: reads ----

  getUseCase(id: string): UseCaseRecord | undefined {
    return this.useCases.getByKey(id);
  }

  getUseCases(): UseCaseRecord[] {
    return this.useCases.getAll();
  }

  getNodes(): ProjectNode[] {
    return this.nodes.getAll();
  }

  getNodesForUseCase(id: string): ProjectNode[] {
    const uc = this.getUseCase(id);
    if (!uc) return [];
    const result: ProjectNode[] = [];
    for (const fileKey of uc.fileKeys) {
      const node = this.nodes
        .getAll()
        .find((n) => n.filePath && n.filePath.includes(fileKey));
      if (node) result.push(node);
    }
    return result;
  }

  getNodesByStatus(status: 'VALID' | 'VIOLATION' | 'MISSING'): ProjectNode[] {
    return this.nodes.find((n) => n.status === status);
  }

  getEdges(): EdgeDescriptor[] {
    return this.edges.getAll();
  }

  // ---- Interface: scalars ----

  getProjectName(): string {
    return this.db.get('projectName') ?? '';
  }

  getNumUseCases(): number {
    return this.db.get('numUseCases') ?? 0;
  }

  getNumViolations(): number {
    return this.db.get('numViolations') ?? 0;
  }

  // ---- Interface: lifecycle ----

  resetDB(): undefined {
    this.useCases.set([]);
    this.nodes.set([]);
    this.edges.set([]);
    this.files.set([]);
    this.db.clear();
  }

  // ---- Concrete-only seeding helpers (not on the gateway; used by tests) ----

  upsertUseCase(entry: UseCaseRecord): void {
    this.useCases.upsert(entry);
    this.persistUseCases();
  }

  upsertNode(node: ProjectNode): void {
    this.nodes.upsert(node);
    this.persistNodes();
  }

  upsertEdge(edge: EdgeDescriptor): void {
    this.edges.upsert(edge);
    this.persistEdges();
  }

  upsertFile(file: FileStorage): void {
    this.files.upsert(file);
    this.persistFiles();
  }
}
