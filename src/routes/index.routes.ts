import { Router } from 'express';

import categoryRouter from './category.routes';
import individualUserRouter from './individualUser.routes';
import subCategoryRouter from './subCategory.routes';
import userCategoryAssignmentRouter from './userCategoryAssignment.routes';
import welcomeRouter from './welcome.routes';

const mainRouter = Router();

mainRouter.use('/', welcomeRouter);
mainRouter.use('/categories', categoryRouter);
mainRouter.use('/subcategories', subCategoryRouter);
mainRouter.use('/user-category-assignments', userCategoryAssignmentRouter);
mainRouter.use('/individual-user', individualUserRouter);

export default mainRouter;
