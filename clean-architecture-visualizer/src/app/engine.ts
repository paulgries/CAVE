import { stopServer } from '../server/server.js';

import type { FileAccessInterface } from '../data_access/fileAccessInterface.js';
import type { CleanArchInfoAccessInterface } from '../data_access/cleanArchInfoAccessInterface.js';
import type { SessionDBAccessInterface } from '../data_access/sessionDBAccessInterface.js';

import { GraphVerificationController } from '../interface_adapter/graphVerification/graphVerificationController.js';
import { GraphVerificationOutputData } from '../use_case/graphVerification/graphVerificationOutputData.js';
import { GraphVerificationInputData } from '../use_case/graphVerification/graphVerificationInputData.js';
import { GraphVerificationPresenter } from '../interface_adapter/graphVerification/graphVerificationPresenter.js';
import { GraphVerificationInteractor } from '../use_case/graphVerification/graphVerificationInteractor.js';

import { InitProjectController } from '../interface_adapter/initProject/initProjectController.js';
import { InitProjectOutputData } from '../use_case/initProject/initProjectOutputData.js';
import { InitProjectInputData } from '../use_case/initProject/initProjectInputData.js';
import { InitProjectPresenter } from '../interface_adapter/initProject/initProjectPresenter.js';
import { InitProjectInteractor } from '../use_case/initProject/initProjectInteractor.js';

import { InitModuleProjectController } from '../interface_adapter/initModuleProject/initModuleProjectController.js';
import { InitModuleProjectOutputData } from '../use_case/initModuleProject/initModuleProjectOutputData.js';
import { InitModuleProjectInputData } from '../use_case/initModuleProject/initModuleProjectInputData.js';
import { InitModuleProjectPresenter } from '../interface_adapter/initModuleProject/initModuleProjectPresenter.js';
import { InitModuleProjectInteractor } from '../use_case/initModuleProject/initModuleProjectInteractor.js';

import { CreateUseCaseController } from '../interface_adapter/createUseCase/createUseCaseController.js';
import { CreateUseCaseOutputData } from '../use_case/createUseCase/createUseCaseOutputData.js';
import { CreateUseCaseInputData } from '../use_case/createUseCase/createUseCaseInputData.js';
import { CreateUseCasePresenter } from '../interface_adapter/createUseCase/createUseCasePresenter.js';
import { CreateUseCaseInteractor } from '../use_case/createUseCase/createUseCaseInteractor.js';

import { CreateFeatureController } from '../interface_adapter/createFeature/createFeatureController.js';
import { CreateFeatureOutputData } from '../use_case/createFeature/createFeatureOutputData.js';
import { CreateFeatureInputData } from '../use_case/createFeature/createFeatureInputData.js';
import { CreateFeaturePresenter } from '../interface_adapter/createFeature/createFeaturePresenter.js';
import { CreateFeatureInteractor } from '../use_case/createFeature/createFeatureInteractor.js';

import { CreateModuleUseCaseController } from '../interface_adapter/CreateModuleUseCase/createModuleUseCaseController.js';
import { CreateModuleUseCaseOutputData } from '../use_case/createModuleUseCase/createModuleUseCaseOutputData.js';
import { CreateModuleUseCaseInputData } from '../use_case/createModuleUseCase/createModuleUseCaseInputData.js';
import { CreateModuleUseCasePresenter } from '../interface_adapter/CreateModuleUseCase/createModuleUseCasePresenter.js';
import { CreateModuleUseCaseInteractor } from '../use_case/createModuleUseCase/createModuleUseCaseInteractor.js';

import { GetProjectSummaryController } from '../interface_adapter/getProjectSummary/getProjectSummaryController.js';
import { GetProjectSummaryOutputData } from '../use_case/getProjectSummary/getProjectSummaryOutputData.js';
import { GetProjectSummaryPresenter } from '../interface_adapter/getProjectSummary/getProjectSummaryPresenter.js';
import { GetProjectSummaryInteractor } from '../use_case/getProjectSummary/getProjectSummaryInteractor.js';

import { GetUseCaseInfoController } from '../interface_adapter/getUseCaseInfo/getUseCaseInfoController.js';
import { GetUseCaseInfoOutputData } from '../use_case/getUseCaseInfo/getUseCaseInfoOutputData.js';
import { GetUseCaseInfoInputData } from '../use_case/getUseCaseInfo/getUseCaseInfoInputData.js';
import { GetUseCaseInfoPresenter } from '../interface_adapter/getUseCaseInfo/getUseCaseInfoPresenter.js';
import { GetUseCaseInfoInteractor } from '../use_case/getUseCaseInfo/getUseCaseInfoInteractor.js';

import { GetViolationsController } from '../interface_adapter/getViolations/getViolationsController.js';
import { GetViolationsOutputData } from '../use_case/getViolations/GetViolationsOutputData.js';
import { GetViolationsInputData } from '../use_case/getViolations/GetViolationsInputData.js';
import { GetViolationsPresenter } from '../interface_adapter/getViolations/getViolationsPresenter.js';
import { GetViolationsInteractor } from '../use_case/getViolations/GetViolationsInteractor.js';

import { GetFilesWithViolationsController } from '../interface_adapter/getFilesWithViolations/getFilesWithViolationsController.js';
import { GetFilesWithViolationsOutputData } from '../use_case/getFilesWithViolations/getFilesWithViolationsOutputData.js';
import { GetFilesWithViolationsPresenter } from '../interface_adapter/getFilesWithViolations/getFilesWithViolationsPresenter.js';
import { GetFilesWithViolationsInteractor } from '../use_case/getFilesWithViolations/getFilesWithViolationsInteractor.js';

/** Dependencies the composition root hands to the Engine. */
export interface EngineDeps {
  fileAccess: FileAccessInterface;
  cleanArchAccess: CleanArchInfoAccessInterface;
  db: SessionDBAccessInterface;
}

/**
 * A ready-to-run use case. Each instance holds the wiring for its use case
 * (InputData/OutputData/Interactor/Controller/Presenter) and exposes a `run`
 * method that executes it. Both the CLI and the Express routes consume the same
 * instances from the Engine, so dependency wiring lives in one place.
 */
export class GraphVerificationUseCase {
  constructor(
    private readonly fileAccess: FileAccessInterface,
    private readonly cleanArchAccess: CleanArchInfoAccessInterface,
    private readonly db: SessionDBAccessInterface
  ) {}

  /**
   * Run the graph-verification use case.
   * @param toCommandLine whether output should be formatted for the CLI.
   */
  async run(toCommandLine: boolean): Promise<void> {
    const inputData = new GraphVerificationInputData(toCommandLine);
    const outputData = new GraphVerificationOutputData();
    const presenter = new GraphVerificationPresenter(outputData);
    const interactor = new GraphVerificationInteractor(
      this.fileAccess,
      this.cleanArchAccess,
      this.db,
      presenter,
      [],
      outputData,
      inputData
    );
    await new GraphVerificationController(interactor).execute();
  }
}

export class InitProjectUseCase {
  private lastOutputData?: InitProjectOutputData;

  constructor(private readonly fileAccess: FileAccessInterface) {}

  async run(language: string): Promise<void> {
    const outputData = new InitProjectOutputData();
    const presenter = new InitProjectPresenter(outputData);
    const inputData = new InitProjectInputData(language);
    const interactor = new InitProjectInteractor(
      this.fileAccess,
      inputData,
      outputData
    );
    await new InitProjectController(interactor).execute();
    this.lastOutputData = outputData;
  }

  getOutputData(): boolean {
    return this.lastOutputData?.getOutputData() ?? false;
  }
}

export class InitModuleProjectUseCase {
  private lastOutputData?: InitModuleProjectOutputData;

  constructor(private readonly fileAccess: FileAccessInterface) {}

  async run(language: string): Promise<void> {
    const outputData = new InitModuleProjectOutputData();
    const presenter = new InitModuleProjectPresenter(outputData);
    const inputData = new InitModuleProjectInputData(language);
    const interactor = new InitModuleProjectInteractor(
      this.fileAccess,
      inputData,
      outputData
    );
    await new InitModuleProjectController(interactor).execute();
    this.lastOutputData = outputData;
  }

  getOutputData(): boolean {
    return this.lastOutputData?.getOutputData() ?? false;
  }
}

export class CreateUseCaseUseCase {
  private lastPresenter?: CreateUseCasePresenter;

  constructor(private readonly fileAccess: FileAccessInterface) {}

  async run(name: string): Promise<void> {
    const outputData = new CreateUseCaseOutputData();
    const presenter = new CreateUseCasePresenter(outputData);
    const inputData = new CreateUseCaseInputData(name);
    const interactor = new CreateUseCaseInteractor(
      this.fileAccess,
      presenter,
      inputData,
      outputData
    );
    await new CreateUseCaseController(interactor).execute();
    this.lastPresenter = presenter;
  }

  getError(): string | null {
    return this.lastPresenter?.getError() ?? null;
  }
}

export class CreateFeatureUseCase {
  private lastPresenter?: CreateFeaturePresenter;

  constructor(private readonly fileAccess: FileAccessInterface) {}

  async run(feature: string): Promise<void> {
    const outputData = new CreateFeatureOutputData();
    const presenter = new CreateFeaturePresenter(outputData);
    const inputData = new CreateFeatureInputData(feature);
    const interactor = new CreateFeatureInteractor(
      this.fileAccess,
      presenter,
      inputData,
      outputData
    );
    await new CreateFeatureController(interactor).execute();
    this.lastPresenter = presenter;
  }

  getError(): string | null {
    return this.lastPresenter?.getError() ?? null;
  }
}

export class CreateModuleUseCaseUseCase {
  private lastPresenter?: CreateModuleUseCasePresenter;

  constructor(private readonly fileAccess: FileAccessInterface) {}

  async run(feature: string, name: string): Promise<void> {
    const outputData = new CreateModuleUseCaseOutputData();
    const presenter = new CreateModuleUseCasePresenter(outputData);
    const inputData = new CreateModuleUseCaseInputData(feature, name);
    const interactor = new CreateModuleUseCaseInteractor(
      this.fileAccess,
      presenter,
      inputData,
      outputData
    );
    await new CreateModuleUseCaseController(interactor).execute();
    this.lastPresenter = presenter;
  }

  getError(): string | null {
    return this.lastPresenter?.getError() ?? null;
  }
}

export class GetProjectSummaryUseCase {
  private lastPresenter?: GetProjectSummaryPresenter;

  constructor(private readonly db: SessionDBAccessInterface) {}

  async run(): Promise<void> {
    const outputData = new GetProjectSummaryOutputData();
    const presenter = new GetProjectSummaryPresenter(outputData);
    const interactor = new GetProjectSummaryInteractor(this.db, outputData);
    await new GetProjectSummaryController(interactor).execute();
    this.lastPresenter = presenter;
  }

  getOutputData(): object {
    return this.lastPresenter?.getOutputData() ?? {};
  }
}

export class GetUseCaseInfoUseCase {
  private lastPresenter?: GetUseCaseInfoPresenter;

  constructor(private readonly db: SessionDBAccessInterface) {}

  async run(interactionId: string): Promise<void> {
    const outputData = new GetUseCaseInfoOutputData();
    const presenter = new GetUseCaseInfoPresenter(outputData);
    const inputData = new GetUseCaseInfoInputData(interactionId);
    const interactor = new GetUseCaseInfoInteractor(
      this.db,
      inputData,
      outputData
    );
    await new GetUseCaseInfoController(interactor).execute();
    this.lastPresenter = presenter;
  }

  getOutputData(): object {
    return this.lastPresenter?.getOutputData() ?? {};
  }
}

export class GetViolationsUseCase {
  private lastPresenter?: GetViolationsPresenter;

  constructor(
    private readonly db: SessionDBAccessInterface,
    private readonly fileAccess: FileAccessInterface
  ) {}

  async run(interactionId: string): Promise<void> {
    const outputData = new GetViolationsOutputData();
    const presenter = new GetViolationsPresenter(outputData);
    const inputData = new GetViolationsInputData(interactionId);
    const interactor = new GetViolationsInteractor(
      this.db,
      this.fileAccess,
      inputData,
      outputData
    );
    await new GetViolationsController(interactor).execute();
    this.lastPresenter = presenter;
  }

  getOutputData(): object {
    return this.lastPresenter?.getOutputData() ?? {};
  }
}

export class GetFilesWithViolationsUseCase {
  private lastPresenter?: GetFilesWithViolationsPresenter;

  constructor(private readonly db: SessionDBAccessInterface) {}

  async run(): Promise<void> {
    const outputData = new GetFilesWithViolationsOutputData();
    const presenter = new GetFilesWithViolationsPresenter(outputData);
    const interactor = new GetFilesWithViolationsInteractor(
      this.db,
      outputData
    );
    await new GetFilesWithViolationsController(interactor).execute();
    this.lastPresenter = presenter;
  }

  getOutputData(): object {
    return this.lastPresenter?.getOutputData() ?? {};
  }
}

export class EndProjectUseCase {
  constructor(private readonly db: SessionDBAccessInterface) {}

  async run(): Promise<void> {
    this.db.resetDB();
    await stopServer();
  }
}

/**
 * The assembled engine: a single set of ready-to-run use cases shared by the
 * CLI (`src/app/index.ts`) and the Express routes (`src/server/routes/*`).
 * The composition root (`CompositionRoot.build()`) constructs the dependencies
 * and returns an Engine.
 */
export class Engine {
  readonly graphVerification: GraphVerificationUseCase;
  readonly initProject: InitProjectUseCase;
  readonly initModuleProject: InitModuleProjectUseCase;
  readonly createUseCase: CreateUseCaseUseCase;
  readonly createFeature: CreateFeatureUseCase;
  readonly createModuleUseCase: CreateModuleUseCaseUseCase;
  readonly getProjectSummary: GetProjectSummaryUseCase;
  readonly getUseCaseInfo: GetUseCaseInfoUseCase;
  readonly getViolations: GetViolationsUseCase;
  readonly getFilesWithViolations: GetFilesWithViolationsUseCase;
  readonly endProject: EndProjectUseCase;

  constructor(deps: EngineDeps) {
    this.graphVerification = new GraphVerificationUseCase(
      deps.fileAccess,
      deps.cleanArchAccess,
      deps.db
    );
    this.initProject = new InitProjectUseCase(deps.fileAccess);
    this.initModuleProject = new InitModuleProjectUseCase(deps.fileAccess);
    this.createUseCase = new CreateUseCaseUseCase(deps.fileAccess);
    this.createFeature = new CreateFeatureUseCase(deps.fileAccess);
    this.createModuleUseCase = new CreateModuleUseCaseUseCase(deps.fileAccess);
    this.getProjectSummary = new GetProjectSummaryUseCase(deps.db);
    this.getUseCaseInfo = new GetUseCaseInfoUseCase(deps.db);
    this.getViolations = new GetViolationsUseCase(deps.db, deps.fileAccess);
    this.getFilesWithViolations = new GetFilesWithViolationsUseCase(deps.db);
    this.endProject = new EndProjectUseCase(deps.db);
  }
}
