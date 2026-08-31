import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

const serverModulePath = '../../../src/server/server.js';
const engineModulePath = '../../../src/app/engine.js';
const sessionDBAccessPath = '../../../src/data_access/sessionDBAccess.js';

let EndProjectUseCase: typeof import('../../../src/app/engine.js').EndProjectUseCase;
let SessionDBAccess: typeof import('../../../src/data_access/sessionDBAccess.js').SessionDBAccess;
let mockStopServer: jest.Mock;

describe('EndProjectUseCase', () => {
  let endProject: InstanceType<typeof EndProjectUseCase>;
  let mockDb: { resetDB: jest.Mock };

  beforeAll(async () => {
    jest.resetModules();

    jest.unstable_mockModule(serverModulePath, () => ({
      stopServer: jest.fn(async () => undefined),
    }));

    const engineModule = await import(engineModulePath);
    EndProjectUseCase = engineModule.EndProjectUseCase;

    const serverModule = await import(serverModulePath);
    mockStopServer = serverModule.stopServer as jest.Mock;

    const sessionDbModule = await import(sessionDBAccessPath);
    SessionDBAccess = sessionDbModule.SessionDBAccess;
  });

  beforeEach(() => {
    mockDb = { resetDB: jest.fn() };
    endProject = new EndProjectUseCase(mockDb as any);
    mockStopServer.mockReset();
  });

  it('resets the session database and closes the server', async () => {
    await endProject.run();

    expect(mockDb.resetDB).toHaveBeenCalledTimes(1);
    expect(mockStopServer).toHaveBeenCalledTimes(1);
  });

  it('actually clears stored session state when closing the server', async () => {
    const realDb = new SessionDBAccess();
    realDb.setProjectName('test-project');

    expect(realDb.getProjectName()).toBe('test-project');

    endProject = new EndProjectUseCase(realDb as any);

    await endProject.run();

    expect(realDb.getProjectName()).toBe('');
    expect(mockStopServer).toHaveBeenCalledTimes(1);
  });

  it('waits for stopServer to complete before resolving', async () => {
    let stopServerCalled = false;
    mockStopServer.mockImplementation(async () => {
      stopServerCalled = true;
      return new Promise<void>((resolve) => setTimeout(resolve, 10));
    });

    const promise = endProject.run();
    expect(stopServerCalled).toBe(true);
    await promise;
  });
});

describe('Server lifecycle', () => {
  it('closes the running server when endProject is called', async () => {
    jest.resetModules();
    jest.unstable_unmockModule(serverModulePath);

    const { startServer } = await import(serverModulePath);
    const { EndProjectUseCase } = await import(engineModulePath);
    const { SessionDBAccess } = await import(sessionDBAccessPath);

    const server = await startServer(true);
    const endProject = new EndProjectUseCase(new SessionDBAccess() as any);

    await endProject.run();

    expect(server.listening).toBe(false);
  });
});
