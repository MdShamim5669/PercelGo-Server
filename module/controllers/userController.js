const { 
  getAllUsersService,
  getUserProfileService, 
  updateUserProfileService, 
  registerUserService, 
  loginUserService 
} = require('../sevices/userService');

const getAllUsers = async (req, res, next) => {
  try {
    const role = req.query.role;
    const result = await getAllUsersService(role);
    res.send(result);
  } catch (error) {
    next(error);
  }
};

const getUserProfile = async (req, res, next) => {
  try {
    const result = await getUserProfileService(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.send(result);
  } catch (error) {
    next(error);
  }
};

const updateUserProfile = async (req, res, next) => {
  try {
    const result = await updateUserProfileService(req.params.id, req.body);
    res.send(result);
  } catch (error) {
    next(error);
  }
};

const registerUser = async (req, res, next) => {
  try {
    const result = await registerUserService(req.body);
    if (result && result.status) {
      return res.status(result.status).json({ message: result.message });
    }
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await loginUserService(email, password);
    if (result && result.status) {
      return res.status(result.status).json({ message: result.message });
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserProfile,
  updateUserProfile,
  registerUser,
  loginUser
};
