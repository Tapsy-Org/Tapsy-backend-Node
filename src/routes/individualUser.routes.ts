import { Router } from 'express';

import IndividualUserController from '../controllers/individualUser.controller';

const individualUserRouter = Router();

individualUserRouter.post('/register', IndividualUserController.register);
individualUserRouter.post('/login', IndividualUserController.login);
individualUserRouter.get('/:id', IndividualUserController.getById);
individualUserRouter.patch('/:id', IndividualUserController.update);
individualUserRouter.delete('/:id', IndividualUserController.softDelete);
individualUserRouter.post('/:id/restore', IndividualUserController.restore);

export default individualUserRouter;
