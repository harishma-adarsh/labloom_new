const express = require('express');
const swaggerUi = require('swagger-ui-express');
// Use pre-generated swagger.json for Vercel/Serverless reliability
const specs = require('./swagger-output.json');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Swagger Documentation
const CSS_URL = "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui.min.css";
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCssUrl: CSS_URL
}));

app.use('/api/auth/v2', require('./routes/authV2Routes'));
app.use('/api/auth', require('./routes/authRoutes'));

app.use('/api/patients', require('./routes/patientPortalRoutes'));
app.use('/api/doctor', require('./routes/doctorPortalRoutes'));
app.use('/api/lab', require('./routes/labPortalRoutes'));
app.use('/api/hospital', require('./routes/hospitalPortalRoutes'));
app.use('/api/admin', require('./routes/adminPortalRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/tests', require('./routes/testRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/medical-records', require('./routes/medicalRecordRoutes'));
app.use('/api/metrics', require('./routes/metricRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/utils', require('./routes/utilRoutes'));

app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
