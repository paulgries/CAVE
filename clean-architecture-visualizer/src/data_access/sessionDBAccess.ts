import type {
  SessionData,
  FileStorage,
  EdgeStorage,
  NodeStorage,
} from '../types/sessionData.js';
import type { useCaseGraph } from '../entity/useCaseGraph.js';
import type { SessionDBAccessInterface } from '../use_case/gateways/sessionDBAccessInterface.js';
import { SessionDB } from '../database/sessionDb.js';
import { CollectionRepository } from './collectionRepository.js';
import type { cleanNode } from '../entity/cleanNode.js';
import type { cleanLayer } from '../entity/cleanLayer.js';

type UseCaseEntry = SessionData['useCases'][number];

export class SessionDBAccess implements SessionDBAccessInterface {
  private readonly db: SessionDB<SessionData>;
  private readonly useCases = new CollectionRepository<UseCaseEntry>(
    (uc) => uc.id
  );
  private readonly files = new CollectionRepository<FileStorage>(
    (f) => f.filePath
  );
  private readonly edges = new CollectionRepository<EdgeStorage>((e) => e.id);
  private readonly nodes = new CollectionRepository<NodeStorage>((n) => n.id);

  constructor() {
    this.db = new SessionDB<SessionData>();
    this.db.load();
    this.useCases.set(this.db.get('useCases') ?? []);
    this.files.set(this.db.get('files') ?? []);
    this.edges.set(this.db.get('edges') ?? []);
    this.nodes.set(this.db.get('nodes') ?? []);
  }

  private persistUseCases(): void {
    this.db.set('useCases', this.useCases.getAll());
  }
  private persistFiles(): void {
    this.db.set('files', this.files.getAll());
  }
  private persistEdges(): void {
    this.db.set('edges', this.edges.getAll());
  }
  private persistNodes(): void {
    this.db.set('nodes', this.nodes.getAll());
  }

  // Setters

  setProjectName(name: string): void {
    this.db.set('projectName', name);
  }

  setNumUseCases(count: number): void {
    this.db.set('numUseCases', count);
  }

  setNumViolations(count: number): void {
    this.db.set('numViolations', count);
  }

  // Setters - useCases

  setUseCases(useCaseList: useCaseGraph[], files: FileStorage[]): void {
    const existingFiles = this.files.getAll();
    const existingFilePaths = new Set(existingFiles.map((f) => f.filePath));

    const newFiles = files.filter((f) => !existingFilePaths.has(f.filePath));
    this.files.set([...existingFiles, ...newFiles]);

    this.useCases.set(
      useCaseList.map((useCase, index) => ({
        id: `uc-${index}`,
        name: useCase.getName(),
        outNeighbours: useCase.getNeighbourMap(),
        fileKeys: [...useCase.getFiles().keys()],
        violationEdges: useCase.getViolationEdges(),
        missingNodes: useCase.getMissingNodes(),
      }))
    );

    this.persistFiles();
    this.persistUseCases();
  }

  /** Append or overwrite a single use-case entry (matched by id). */
  upsertUseCase(entry: UseCaseEntry): void {
    this.useCases.upsert(entry);
    this.persistUseCases();
  }

  removeUseCase(id: string): void {
    this.useCases.remove(id);
    this.persistUseCases();
  }

  // Setters — files

  /** Replace the entire files array. */
  setFiles(files: FileStorage[]): void {
    this.files.set(files);
    this.persistFiles();
  }

  /** Insert or overwrite a single file entry matched by filePath. */
  upsertFile(file: FileStorage): void {
    this.files.upsert(file);
    this.persistFiles();
  }

  removeFile(filePath: string): void {
    this.files.remove(filePath);
    this.persistFiles();
  }

  // Setters — edges

  /** Replace the entire edges array. */
  setEdges(edges: EdgeStorage[]): void {
    this.edges.set(edges);
    this.persistEdges();
  }

  /** Insert or overwrite a single edge entry matched by id. */
  upsertEdge(edge: EdgeStorage): void {
    this.edges.upsert(edge);
    this.persistEdges();
  }

  removeEdge(id: string): void {
    this.edges.remove(id);
    this.persistEdges();
  }

  // Setters — nodes

  /** Replace the entire nodes array. */
  setNodes(nodes: NodeStorage[]): void {
    this.nodes.set(nodes);
    this.persistNodes();
  }

  /** Insert or overwrite a single node entry matched by id. */
  upsertNode(node: NodeStorage): void {
    this.nodes.upsert(node);
    this.persistNodes();
  }

  removeNode(id: string): void {
    this.nodes.remove(id);
    this.persistNodes();
  }

  // Getters

  getProjectName(): string {
    return this.db.get('projectName') ?? '';
  }

  getNumUseCases(): number {
    return this.db.get('numUseCases') ?? 0;
  }

  getNumViolations(): number {
    return this.db.get('numViolations') ?? 0;
  }

  // Getters — useCases

  getAllUseCases(): SessionData['useCases'] {
    return this.useCases.getAll();
  }

  getUseCaseById(id: string): UseCaseEntry | undefined {
    return this.useCases.getByKey(id);
  }

  getUseCaseNeighbours(id: string): UseCaseEntry['outNeighbours'] | undefined {
    return this.getUseCaseById(id)?.outNeighbours;
  }

  getUseCaseFileKeys(id: string): string[] | undefined {
    return this.getUseCaseById(id)?.fileKeys;
  }

  getUseCaseViolationEdges(id: string): UseCaseEntry['violationEdges'] | undefined {
    return this.getUseCaseById(id)?.violationEdges;
  }

  getUseCaseMissingNodes(id: string): cleanNode[] | undefined {
    return this.getUseCaseById(id)?.missingNodes;
  }

  // Getters — files

  getAllFiles(): FileStorage[] {
    return this.files.getAll();
  }

  getFileByPath(filePath: string): FileStorage | undefined {
    return this.files.getByKey(filePath);
  }

  getFilesByLayer(layer: cleanLayer): FileStorage[] {
    return this.files.find((f) => f.layer === layer);
  }

  getFilesByType(fileType: FileStorage['fileType']): FileStorage[] {
    return this.files.find((f) => f.fileType === fileType);
  }

  getFilesByNode(node: cleanNode): FileStorage[] {
    return this.files.find((f) => f.node === node);
  }

  // Getters — edges

  getAllEdges(): EdgeStorage[] {
    return this.edges.getAll();
  }

  getEdgeById(id: string): EdgeStorage | undefined {
    return this.edges.getByKey(id);
  }

  getEdgesBySource(source: string): EdgeStorage[] {
    return this.edges.find((e) => e.source === source);
  }

  getEdgesByTarget(target: string): EdgeStorage[] {
    return this.edges.find((e) => e.target === target);
  }

  getEdgesByStatus(status: EdgeStorage['status']): EdgeStorage[] {
    return this.edges.find((e) => e.status === status);
  }

  // Getters — nodes

  getAllNodes(): NodeStorage[] {
    return this.nodes.getAll();
  }

  getNodeById(id: string): NodeStorage | undefined {
    return this.nodes.getByKey(id);
  }

  getNodesByType(type: cleanNode): NodeStorage[] {
    return this.nodes.find((n) => n.type === type);
  }

  getNodesByLayer(layer: cleanLayer): NodeStorage[] {
    return this.nodes.find((n) => n.layer === layer);
  }

  getNodesByStatus(status: NodeStorage['status']): NodeStorage[] {
    return this.nodes.find((n) => n.status === status);
  }

  getNodeByFilePath(filePath: string): NodeStorage | undefined {
    return this.nodes.findOne((n) => n.filePath === filePath);
  }

  getNodeByName(name: string): NodeStorage | undefined {
    return this.nodes.findOne((n) => n.name === name);
  }

  resetDB(): undefined {
    this.useCases.set([]);
    this.files.set([]);
    this.edges.set([]);
    this.nodes.set([]);
    this.db.clear();
  }
}
