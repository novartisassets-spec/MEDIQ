import { Router } from 'express';
import { AnalyzeController } from '../controllers/analyze.controller';

const router = Router();

router.post('/analyze', AnalyzeController.analyzeReport);
router.post('/chat', AnalyzeController.chat);
router.get('/sessions', AnalyzeController.getSessions);
router.get('/biomarkers/latest', AnalyzeController.getLatestBiomarkers);
router.get('/history/:sessionId', AnalyzeController.getHistory);
router.delete('/session/:sessionId', AnalyzeController.deleteSession);
router.get('/resolve-profile/:number', AnalyzeController.resolveProfile);
router.post('/send-welcome', AnalyzeController.sendWelcomeMessage);
router.put('/profile', AnalyzeController.updateProfile);
router.post('/nuke-user', AnalyzeController.nukeUser);

export default router;
