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
import catchAsync from '../shared/catchAsync';
import { getDB } from '../../config/db';

const router = Router();

router.post('/jwt', createToken);
router.post('/register', validateRequest(userRegisterSchema), registerUser);
router.post('/login', validateRequest(userLoginSchema), loginUser);

// Protect sensitive admin endpoint
router.get('/', verifyToken, verifyAdmin, getAllUsers);

// Secure role endpoint for users to verify their own roles
router.get('/role/:email', verifyToken, getUserRole);

router.patch('/apply-rider/:email', verifyToken, catchAsync(async (req, res) => {
  const email = req.params.email;
  const applicationData = req.body;
  const db = getDB();
  if (!db) return res.status(500).json({ success: false, message: 'DB not connected' });
  
  await db.collection('users').updateOne(
    { email }, 
    { 
      $set: { 
        riderStatus: 'pending',
        riderApplication: applicationData
      } 
    }
  );
  res.json({ success: true, message: 'Rider application submitted successfully' });
}));

router.get('/:id', getUserProfile);
router.put('/:id', updateUserProfile);

export const UserRoutes = router;
