const express = require('express');
const { 
  getAllUsers,
  getUserProfile, 
  updateUserProfile, 
  registerUser, 
  loginUser 
} = require('../controllers/userController');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/', getAllUsers);
router.get('/:id', getUserProfile);
router.put('/:id', updateUserProfile); // '/:id' is standard REST convention over '/:id/update'

module.exports = router;
