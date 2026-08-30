import { FileAccess } from '../data_access/fileAccess.js';
import { CleanArchAccess } from '../data_access/cleanArchInfoAccess.js';
import { SessionDBAccess } from '../data_access/sessionDBAccess.js';

import { Engine } from './engine.js';

/**
 * The composition root. It builds the dependencies once and returns an
 * assembled `Engine` holding every ready-to-run use case. The CLI
 * (`src/app/index.ts`) and the Express routes (`src/server/routes/*`)
 * consume this same Engine, so dependency wiring lives in exactly one place.
 */
export class CompositionRoot {
  build(): Engine {
    const fileAccess = new FileAccess();
    const cleanArchAccess = new CleanArchAccess();
    const db = new SessionDBAccess();
    return new Engine({ fileAccess, cleanArchAccess, db });
  }
}

/**
 * The single shared Engine. The CLI (`src/app/index.ts`) and the Express routes
 * (`src/server/routes/*`) consume this same instance, so the in-memory session
 * DB and all dependencies live in exactly one place.
 */
export const engine = new CompositionRoot().build();
