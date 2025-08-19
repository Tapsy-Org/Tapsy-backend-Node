import { Router } from 'express';

import { assignMultipleSubcategoriesToUser } from '../controllers/individualUserSubCategory.controller';

const individualUserSubCategoryRouter = Router();

individualUserSubCategoryRouter.post(
  '/assign-multiple-subcategories',
  assignMultipleSubcategoriesToUser,
);

export default individualUserSubCategoryRouter;
