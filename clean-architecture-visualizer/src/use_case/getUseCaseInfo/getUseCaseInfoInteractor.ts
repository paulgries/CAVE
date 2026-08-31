import type { SessionDBAccessInterface } from '../../use_case/gateways/sessionDBAccessInterface.js';
import type { cleanLayer } from '../../entity/cleanLayer.js';
import type { cleanNode } from '../../entity/cleanNode.js';
import type { ProjectNode } from '../../entity/projectNode.js';
import type { EdgeDescriptor } from '../../entity/edgeDescriptor.js';
import type { UseCaseRecord } from '../../entity/useCaseRecord.js';
import type { GetUseCaseInfoInputBoundary } from './getUseCaseInfoInputBoundary.js';
import type { GetUseCaseInfoInputData } from './getUseCaseInfoInputData.js';
import type { GetUseCaseInfoOutputData } from './getUseCaseInfoOutputData.js';

export type UseCaseInfoResponse = {
  interaction_name: string;
  nodes: UseCaseNodeResponse[];
  edges: UseCaseEdgeResponse[];
  decoupling: boolean;
};

type UseCaseNodeResponse = {
  id: string;
  name?: string;
  type: cleanNode;
  layer: cleanLayer;
  file_path?: string;
  status: 'VALID' | 'MISSING' | 'VIOLATION';
};

type UseCaseEdgeResponse = {
  id: string;
  source: string;
  target: string;
  type: 'DEPENDENCY';
  status: 'VALID' | 'INCORRECT_DEPENDENCY';
};

export class GetUseCaseInfoInteractor implements GetUseCaseInfoInputBoundary {
  constructor(
    private readonly db: SessionDBAccessInterface,
    private readonly inputData: GetUseCaseInfoInputData,
    private readonly outputData: GetUseCaseInfoOutputData
  ) {}

  async execute(): Promise<void> {
    const id = this.inputData.getInteractionId();
    const useCase = this.db.getUseCase(id);

    if (!useCase) return;

    const nodes = this.buildNodes(useCase);
    const edges = this.buildEdges(useCase);

    const result: UseCaseInfoResponse = {
      interaction_name: useCase.name,
      nodes: nodes,
      edges: edges,
      decoupling: false,
    };

    // const allNodes = this.db.getNodes();

    /**
     * Checking for sub use case.
     * If an edge points to another node that is a use case interactor, then that edge represents a subuse case.
     */

    const hasSubCase = edges.some(
      (edge) =>
        edge.source !== edge.target && edge.target === 'useCaseInteractor'
    );

    if (hasSubCase) {
      result.decoupling = true;
    }

    this.outputData.setOutputData(result);
  }

  /**
   * Build the node list for a use case.
   * - VALID / VIOLATION nodes come from the use case's file nodes.
   * - MISSING nodes come from the use case's missingNodes list.
   */
  private buildNodes(useCase: UseCaseRecord): UseCaseNodeResponse[] {
    const result: UseCaseNodeResponse[] = [];

    // useCase file keys that correspond to actual files in the DB
    const fileNodes = this.db.getNodesForUseCase(useCase.id);
    for (const node of fileNodes) {
      result.push(this.formatNode(node));
    }

    // Missing nodes — one entry per missing cleanNode type
    for (const missingType of useCase.missingNodes) {
      const existing = this.db
        .getNodesByStatus('MISSING')
        .find((n) => n.type === missingType);

      if (existing) {
        result.push(this.formatNode(existing));
      }
    }

    return result;
  }

  /**
   * Build the edge list for a use case by collecting all source→target
   * pairs present in the use case's outNeighbours map, then looking them
   * up in the edges for status information.
   */
  private buildEdges(useCase: UseCaseRecord): UseCaseEdgeResponse[] {
    const result: UseCaseEdgeResponse[] = [];

    for (const [source, targets] of Object.entries(useCase.outNeighbours)) {
      for (const target of targets) {
        const edge = this.db
          .getEdges()
          .find((e) => e.source === source && e.target === target);
        if (!edge) continue;

        result.push(this.formatEdge(edge));
      }
    }

    return result;
  }

  private formatNodeName(node: ProjectNode): string {
    // convert from camelCase to PascalCase and add spaces between words
    // e.g. "dataAccessInterface" -> "Data Access Interface"
    const nodeNamePascalCase =
      node.type.charAt(0).toUpperCase() + node.type.slice(1);
    const words: string[] = [];

    for (let i = 0; i < nodeNamePascalCase.length; i++) {
      const char = nodeNamePascalCase[i];
      if (char === char.toUpperCase()) {
        words.push(char);
      } else {
        words[words.length - 1] += char;
      }
    }

    const nodeName = words.join(' ');

    if (node.status === 'MISSING') {
      return nodeName + ' (Missing)';
    } else {
      return nodeName;
    }
  }

  private formatNode(node: ProjectNode): UseCaseNodeResponse {
    return {
      id: node.type,
      name: node.name ?? this.formatNodeName(node),
      type: node.type,
      layer: node.layer,
      ...(node.filePath && { file_path: node.filePath }),
      status: node.status,
    };
  }

  private formatEdge(edge: EdgeDescriptor): UseCaseEdgeResponse {
    return {
      id: `${edge.source}->${edge.target}`,
      source: edge.source,
      target: edge.target,
      type: 'DEPENDENCY',
      status: edge.status,
    };
  }
}
