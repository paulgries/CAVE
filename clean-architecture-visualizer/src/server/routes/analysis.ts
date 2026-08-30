import { Router } from 'express';
import { engine } from '../../app/compositionRoot.js';

const router = Router();

router.get('/analysis/summary', async (_req, res) => {
  await engine.getProjectSummary.run();
  const result = engine.getProjectSummary.getOutputData();

  if (!result) {
    res
      .status(404)
      .json({ error: `Failure in collecting the Project Summary` });
    return;
  }

  res.json(result);
});

router.get('/analysis/interaction/:id', async (req, res) => {
  await engine.getUseCaseInfo.run(req.params.id);
  const result = engine.getUseCaseInfo.getOutputData();

  if (!result) {
    res
      .status(404)
      .json({ error: `Interaction '${req.params.id}' not found.` });
    return;
  }

  res.json(result);
});

router.get('/analysis/violations/:interactionId', async (req, res) => {
  await engine.getViolations.run(req.params.interactionId);
  const result = engine.getViolations.getOutputData();
  if (!result) {
    res
      .status(404)
      .json({ error: `Interaction '${req.params.interactionId}' not found.` });
    return;
  }

  res.json(result);
});

router.get('/analysis/files-with-violations', async (_req, res) => {
  await engine.getFilesWithViolations.run();
  const result = engine.getFilesWithViolations.getOutputData();

  res.json(result);
});

export default router;
