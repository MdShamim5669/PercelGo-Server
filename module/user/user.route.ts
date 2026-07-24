import { Router } from 'express';
import { 
  getAllUsers,
  getUserProfile, 
  updateUserProfile, 
  registerUser, 
  loginUser 
} from './user.controller';
import { validateRequest } from '../middleware/validateRequest';
import { userRegisterSchema, userLoginSchema } from './user.validation';

const router = Router();

router.post('/register', validateRequest(userRegisterSchema), registerUser);
router.post('/login', validateRequest(userLoginSchema), loginUser);

router.get('/', getAllUsers);
router.get('/:id', getUserProfile);
router.put('/:id', updateUserProfile); // '/:id' is standard REST convention over '/:id/update'

export const UserRoutes = router;
