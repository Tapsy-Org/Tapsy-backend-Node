import { Router } from 'express';

import categoryRouter from './category.routes';
import userRouter from './user.routes';
import userCategoryRouter from './UserCategory.routes';
import welcomeRouter from './welcome.routes';

const mainRouter = Router();

mainRouter.use('/', welcomeRouter);
mainRouter.use('/categories', categoryRouter);
mainRouter.use('/users', userRouter);
mainRouter.use('/user-categories', userCategoryRouter);

export default mainRouter;
