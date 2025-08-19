import { Router } from 'express';

import categoryRouter from './category.routes';
import individualUserSubCategoryRouter from './individindividualUserSubCategory.routes';
import individualUserRouter from './individualUser.routes';
import individualUserCategoryRouter from './individualUserCategory.routes';
import welcomeRouter from './welcome.routes';

const mainRouter = Router();

mainRouter.use('/', welcomeRouter);
mainRouter.use('/categories', categoryRouter);
mainRouter.use('/individual-user', individualUserRouter);

mainRouter.use('/individual-user-categories', individualUserCategoryRouter);
mainRouter.use('/individual-user-subcategories', individualUserSubCategoryRouter);
export default mainRouter;
