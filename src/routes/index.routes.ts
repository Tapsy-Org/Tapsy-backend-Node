import { Router } from 'express';

import adminRouter from './admin.routes';
import categoryRouter from './category.routes';
import locationRouter from './location.routes';
import userRouter from './user.routes';
import userCategoryRouter from './UserCategory.routes';
import welcomeRouter from './welcome.routes';

const mainRouter = Router();

mainRouter.use('/', welcomeRouter);
mainRouter.use('/admin', adminRouter);
mainRouter.use('/categories', categoryRouter);
mainRouter.use('/users', userRouter);
mainRouter.use('/user-categories', userCategoryRouter);
mainRouter.use('/locations', locationRouter);
// // Add user-subcategories as an alias to user-categories for backwards compatibility
// mainRouter.use('/user-subcategories', userCategoryRouter);

export default mainRouter;
