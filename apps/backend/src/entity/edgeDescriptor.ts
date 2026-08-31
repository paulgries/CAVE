import type { cleanNode } from '@cave/shared-domain';

/**
 * A dependency edge between two clean nodes and its verification status.
 * Domain data; `id` (`source->target`) and `type` ('DEPENDENCY') are derivable.
 */
export type EdgeDescriptor = {
  source: cleanNode;
  target: cleanNode;
  status: 'VALID' | 'INCORRECT_DEPENDENCY';
};
