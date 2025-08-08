import { Router } from 'express';

import { getWelcomeData } from '../controllers/welcome.controller';

const welcomeRouter = Router();

welcomeRouter.get('/welcome', getWelcomeData);

export default welcomeRouter;
