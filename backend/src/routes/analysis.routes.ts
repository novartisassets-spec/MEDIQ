import { Router } from 'express';
import { AnalyzeController } from '../controllers/analyze.controller';

const router = Router();

router.post('/analyze', AnalyzeController.analyzeReport);
router.post('/chat', AnalyzeController.chat);
router.get('/sessions', AnalyzeController.getSessions);
router.get('/history/:sessionId', AnalyzeController.getHistory);

export default router;
