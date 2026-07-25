import { Router } from 'express';
import { 
  getAllUsers,
  getUserProfile,
  getUserRole,
  updateUserProfile, 
  registerUser, 
  loginUser,
  createToken
} from './user.controller';
import { validateRequest } from '../middleware/validateRequest';
import { userRegisterSchema, userLoginSchema } from './user.validation';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware';

const router = Router();

router.post('/jwt', createToken);
router.post('/register', validateRequest(userRegisterSchema), registerUser);
router.post('/login', validateRequest(userLoginSchema), loginUser);

// Protect sensitive admin endpoint
router.get('/', verifyToken, verifyAdmin, getAllUsers);

// Secure role endpoint for users to verify their own roles
router.get('/role/:email', verifyToken, getUserRole);

router.get('/:id', getUserProfile);
router.put('/:id', updateUserProfile);

export const UserRoutes = router;
