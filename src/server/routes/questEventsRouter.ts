import { Router } from 'express'
import * as questEventsService from '../services/questEventsService.js'

const router = Router();

router.get('/:questId/events', questEventsService.subscribe);

export default router;