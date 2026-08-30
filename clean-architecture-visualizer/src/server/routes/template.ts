import { Router } from 'express';
import { engine } from '../../app/compositionRoot.js';

const router = Router();

router.post('/template/generate/:language', async (req, res) => {
  await engine.initProject.run(req.params.language);

  if (!engine.initProject.getOutputData()) {
    res.status(404).json({ error: `Failure to initiate project` });
    return;
  }

  res.status(201).json({ message: `Project initiated successfully` });
});

router.post('/template/module_generate/:language', async (req, res) => {
  await engine.initModuleProject.run(req.params.language);

  if (!engine.initModuleProject.getOutputData()) {
    res.status(404).json({ error: `Failure to initiate project` });
    return;
  }

  res.status(201).json({ message: `Project initiated successfully` });
});

router.post('/template/add/:useCaseName', async (req, res) => {
  await engine.createUseCase.run(req.params.useCaseName);

  if (engine.createUseCase.getError()) {
    res
      .status(404)
      .json({ error: `Could not make use case '${req.params.useCaseName}'` });
    return;
  }

  res.status(201).json({
    message: `Use case '${req.params.useCaseName}' created successfully`,
  });
});

router.post('/template/module_add/:featureName', async (req, res) => {
  await engine.createFeature.run(req.params.featureName);

  if (engine.createFeature.getError()) {
    res
      .status(404)
      .json({ error: `Could not make feature '${req.params.featureName}'` });
    return;
  }

  res.status(201).json({
    message: `Feature '${req.params.featureName}' created successfully`,
  });
});

router.post(
  '/template/module_add/:featureName/:useCaseName',
  async (req, res) => {
    await engine.createModuleUseCase.run(
      req.params.featureName,
      req.params.useCaseName
    );

    if (engine.createModuleUseCase.getError()) {
      res.status(404).json({
        error: `Could not make use case '${req.params.useCaseName}' in feature '${req.params.featureName}'`,
      });
      return;
    }

    res.status(201).json({
      message: `Use case '${req.params.useCaseName}' created successfully in feature '${req.params.featureName}'`,
    });
  }
);

export default router;
