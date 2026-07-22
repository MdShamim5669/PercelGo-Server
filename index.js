const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./config/db');
const parcelRoutes = require('./module/routes/parcelRoutes');
const userRoutes = require('./module/routes/userRoutes');
const adminRoutes = require('./module/routes/adminRoutes');
const trackingRoutes = require('./module/routes/trackingRoutes');
const riderRoutes = require('./module/routes/riderRoutes');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/', parcelRoutes);
app.use('/users', userRoutes);
app.use('/admin', adminRoutes);
app.use('/tracking', trackingRoutes);
app.use('/riders', riderRoutes);

app.get('/', (req, res) => {
  res.send('PerCelGo Server is running successfully with MVC architecture.');
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error'
  });
});

// Connect Database & Start Server
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`PerCelGo server running on port ${port}`);
  });
}).catch(console.error);