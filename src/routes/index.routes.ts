import { Router } from 'express';

import businessRouter from './business.routes';
import userRouter from './user.routes';
import userPersonalizationRouter from './userPersonalization.routes';
import welcomeRouter from './welcome.routes';
const mainRouter = Router();

mainRouter.use('/', welcomeRouter);
mainRouter.use('/auth', userRouter);
mainRouter.use('/business', businessRouter);
mainRouter.use('/user-personalization', userPersonalizationRouter);

export default mainRouter;
