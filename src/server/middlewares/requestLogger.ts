import { NextFunction, Request, Response } from 'express'
import logger from '../config/logger.js'

const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  logger.info(`Incoming request: ${req.method} ${req.originalUrl}`);

  res.on('finish', () => {
    logger.info(
      `Request ${req.method} ${req.originalUrl} finished with status ${res.statusCode}`
    );
  });

  next();
};

export default requestLogger;
