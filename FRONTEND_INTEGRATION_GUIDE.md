# Labloom Frontend Integration Guide

**Version:** 1.0.0  
**Base URL:** `https://labloom-new.onrender.com`  
**Last Updated:** February 9, 2026

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication Flow](#authentication-flow)
3. [Patient Portal](#patient-portal)
4. [Doctor Portal](#doctor-portal)
5. [Lab Portal](#lab-portal)
6. [Hospital Portal](#hospital-portal)
7. [Admin Portal](#admin-portal)
8. [Common Utilities](#common-utilities)
9. [Error Handling](#error-handling)
10. [Best Practices](#best-practices)

---

## 🚀 Getting Started

### Base Configuration

```javascript
const API_BASE_URL = 'https://labloom-new.onrender.com';

// Axios configuration example
import axios from 'axios';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, {
          refreshToken,
        });
        
        localStorage.setItem('accessToken', data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        // Redirect to login
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

---

## 🔐 Authentication Flow

### 1. User Registration (Signup)

**Endpoint:** `POST /api/auth/signup`

```javascript
// Register a new user
const signup = async (userData) => {
  try {
    const response = await api.post('/api/auth/signup', {
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      password: userData.password,
      role: userData.role, // 'patient', 'doctor', 'lab', 'hospital'
      privacyPolicyAccepted: true, // Required for patients. For others, this is forced to false until admin approval.
    });
    
    // NOTE: For 'doctor', 'lab', and 'hospital', this will return a 201 status 
    // but without tokens, as they require Admin Approval first.
    
    if (response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    localStorage.setItem('user', JSON.stringify(response.data));
    
    return response.data;
  } catch (error) {
    console.error('Signup error:', error.response?.data);
    throw error;
  }
};
```

> **⚠️ Important Notice on Registration:**
> - **Patients:** Can log in immediately after signup.
> - **Doctors, Labs, Hospitals:** Registration creates a "Pending Approval" account. These users **cannot** request OTPs or Log In until an Administrator approves their account in the Admin Portal. Attempting to log in early will result in a `403 Forbidden` error.

**Response:**
```json
{
  "_id": "65ab123...",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "role": "patient",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "a1b2c3d4e5f6..."
}
```

### 2. OTP-Based Login (Mobile)

**Step 1: Request OTP**

**Endpoint:** `POST /api/auth/request-otp`

```javascript
const requestOTP = async (phone) => {
  try {
    const response = await api.post('/api/auth/request-otp', { phone });
    return response.data;
  } catch (error) {
    // 403 error means account is pending admin approval
    if (error.response?.status === 403) {
      alert("Your account is pending admin approval.");
    }
    console.error('OTP request error:', error.response?.data);
    throw error;
  }
};
```

**Step 2: Verify OTP**

**Endpoint:** `POST /api/auth/verify-otp`

```javascript
const verifyOTP = async (phone, otp) => {
  try {
    const response = await api.post('/api/auth/verify-otp', { phone, otp });
    
    // Store tokens
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.data));
    
    return response.data;
  } catch (error) {
    console.error('OTP verification error:', error.response?.data);
    throw error;
  }
};
```

### 3. Refresh Access Token

**Endpoint:** `POST /api/auth/refresh-token`

```javascript
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, {
      refreshToken,
    });
    
    localStorage.setItem('accessToken', response.data.accessToken);
    return response.data.accessToken;
  } catch (error) {
    // Refresh token expired, logout user
    localStorage.clear();
    window.location.href = '/login';
    throw error;
  }
};
```

### 4. Logout

**Endpoint:** `POST /api/auth/logout`

```javascript
const logout = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  try {
    await api.post('/api/auth/logout', { refreshToken });
  } finally {
    localStorage.clear();
    window.location.href = '/login';
  }
};
```

---

## 👤 Patient Portal

### Dashboard

**Endpoint:** `GET /api/patients/dashboard`  
**Auth:** Required

```javascript
const getPatientDashboard = async () => {
  const response = await api.get('/api/patients/dashboard');
  return response.data;
};
```

**Response:**
```json
{
  "upcomingAppointments": [...],
  "recentTests": [...],
  "healthMetricsSummary": {
    "bloodPressure": "120/80",
    "weight": "72 kg",
    "lastUpdated": "2024-10-20"
  },
  "pendingPrescriptions": 2
}
```

### Profile Management

**Get Profile:** `GET /api/patients/me`

```javascript
const getMyProfile = async () => {
  const response = await api.get('/api/patients/me');
  return response.data;
};
```

**Update Profile:** `PATCH /api/patients/me`

```javascript
const updateMyProfile = async (updates) => {
  const response = await api.patch('/api/patients/me', {
    name: updates.name,
    email: updates.email,
    phone: updates.phone,
    address: updates.address,
    dateOfBirth: updates.dateOfBirth,
    gender: updates.gender,
  });
  return response.data;
};
```

### Health Metrics

**Get Metrics History:** `GET /api/patients/health-metrics?type={type}`

```javascript
const getHealthMetrics = async (type = 'all') => {
  // type: 'Blood Pressure', 'Weight', 'Oxygen Saturation', 'all'
  const response = await api.get(`/api/patients/health-metrics?type=${type}`);
  return response.data;
};
```

**Add New Metric:** `POST /api/patients/health-metrics`

```javascript
const addHealthMetric = async (metricData) => {
  const response = await api.post('/api/patients/health-metrics', {
    type: metricData.type, // 'Blood Pressure', 'Weight', etc.
    value: metricData.value,
    unit: metricData.unit,
    notes: metricData.notes,
  });
  return response.data;
};
```

### Appointments

**Get My Appointments:** `GET /api/patients/appointments/me`

```javascript
const getMyAppointments = async () => {
  const response = await api.get('/api/patients/appointments/me');
  return response.data;
};
```

**Book Appointment:** `POST /api/patients/appointments`

```javascript
const bookAppointment = async (appointmentData) => {
  const response = await api.post('/api/patients/appointments', {
    doctorId: appointmentData.doctorId,
    date: appointmentData.date, // "2024-10-25"
    time: appointmentData.time, // "10:30 AM"
    appointmentMode: appointmentData.mode, // "Video call", "In-person"
    reason: appointmentData.reason,
  });
  return response.data;
};
```

### Lab Test Bookings

**Get My Bookings:** `GET /api/patients/bookings/me`

```javascript
const getMyLabBookings = async () => {
  const response = await api.get('/api/patients/bookings/me');
  return response.data;
};
```

**Book Lab Test:** `POST /api/patients/bookings`

```javascript
const bookLabTest = async (bookingData) => {
  const response = await api.post('/api/patients/bookings', {
    labId: bookingData.labId,
    testId: bookingData.testId,
    date: bookingData.date,
    time: bookingData.time,
    patientInfo: {
      name: bookingData.patientName,
      age: bookingData.age,
      gender: bookingData.gender,
    },
  });
  return response.data;
};
```

### Medical Records

**Get Lab Reports:** `GET /api/patients/reports`

```javascript
const getLabReports = async () => {
  const response = await api.get('/api/patients/reports');
  return response.data;
};
```

**Get Prescriptions:** `GET /api/patients/prescriptions`

```javascript
const getPrescriptions = async () => {
  const response = await api.get('/api/patients/prescriptions');
  return response.data;
};
```

### Search & Discovery

**Search Doctors:** `GET /api/patients/doctors?query={query}&specialization={spec}`

```javascript
const searchDoctors = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.query) params.append('query', filters.query);
  if (filters.specialization) params.append('specialization', filters.specialization);
  if (filters.sort) params.append('sort', filters.sort);
  
  const response = await api.get(`/api/patients/doctors?${params.toString()}`);
  return response.data;
};
```

**Find Labs:** `GET /api/patients/labs?city={city}`

```javascript
const findLabs = async (city) => {
  const response = await api.get(`/api/patients/labs?city=${city}`);
  return response.data;
};
```

---

## 👨‍⚕️ Doctor Portal

### Appointments Management

**Get Doctor's Appointments:** `GET /api/doctor/appointments?status={status}&date={date}`

```javascript
const getDoctorAppointments = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.date) params.append('date', filters.date);
  
  const response = await api.get(`/api/doctor/appointments?${params.toString()}`);
  return response.data;
};
```

**Get Appointment Details:** `GET /api/doctor/appointments/{id}`

```javascript
const getAppointmentDetails = async (appointmentId) => {
  const response = await api.get(`/api/doctor/appointments/${appointmentId}`);
  return response.data;
};
```

**Update Appointment Status:** `PATCH /api/doctor/appointments/{id}/status`

```javascript
const updateAppointmentStatus = async (appointmentId, status, reason = '') => {
  // status: 'accepted', 'completed', 'cancelled'
  const response = await api.patch(`/api/doctor/appointments/${appointmentId}/status`, {
    status,
    reason,
  });
  return response.data;
};
```

### Patient Management

**Get Doctor's Patients:** `GET /api/doctor/patients?search={query}`

```javascript
const getDoctorPatients = async (searchQuery = '') => {
  const response = await api.get(`/api/doctor/patients?search=${searchQuery}`);
  return response.data;
};
```

**Get Patient History:** `GET /api/doctor/patients/{id}/history`

```javascript
const getPatientHistory = async (patientId) => {
  const response = await api.get(`/api/doctor/patients/${patientId}/history`);
  return response.data;
};
```

### Consultation Records

**Save Consultation Notes:** `POST /api/doctor/consultations/{appointmentId}/records`

```javascript
const saveConsultationRecords = async (appointmentId, recordData) => {
  const response = await api.post(`/api/doctor/consultations/${appointmentId}/records`, {
    diagnosis: recordData.diagnosis,
    symptoms: recordData.symptoms,
    clinicalNotes: recordData.notes,
    vitalSigns: recordData.vitals,
  });
  return response.data;
};
```

**Issue Prescription:** `POST /api/doctor/consultations/{appointmentId}/prescribe`

```javascript
const issuePrescription = async (appointmentId, prescriptionData) => {
  const response = await api.post(`/api/doctor/consultations/${appointmentId}/prescribe`, {
    prescriptions: [
      {
        medication: 'Amoxicillin',
        dosage: '500mg',
        frequency: 'Twice daily',
        duration: '7 days',
        instructions: 'Take after meals',
      },
      // ... more medications
    ],
  });
  return response.data;
};
```

---

## 🔬 Lab Portal

### Booking Management

**Get Lab Bookings:** `GET /api/lab/bookings?status={status}`

```javascript
const getLabBookings = async (status = '') => {
  const response = await api.get(`/api/lab/bookings?status=${status}`);
  return response.data;
};
```

**Add Offline Booking:** `POST /api/lab/bookings`

```javascript
const addOfflineBooking = async (bookingData) => {
  const response = await api.post('/api/lab/bookings', {
    patientName: bookingData.patientName,
    phone: bookingData.phone,
    testId: bookingData.testId,
    date: bookingData.date,
    paymentStatus: bookingData.paymentStatus,
  });
  return response.data;
};
```

**Update Sample Status:** `PATCH /api/lab/bookings/{id}/status`

```javascript
const updateLabStatus = async (bookingId, status) => {
  // status: 'sample_collected', 'in_lab', 'processing', 'completed'
  const response = await api.patch(`/api/lab/bookings/${bookingId}/status`, {
    status,
  });
  return response.data;
};
```

### Report Management

**Upload Report:** `POST /api/lab/reports/upload`

```javascript
const uploadReport = async (reportData) => {
  const formData = new FormData();
  formData.append('bookingId', reportData.bookingId);
  formData.append('reportFile', reportData.file);
  formData.append('results', JSON.stringify(reportData.results));
  
  const response = await api.post('/api/lab/reports/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
```

**Validate Report:** `POST /api/lab/reports/{id}/validate`

```javascript
const validateReport = async (reportId) => {
  const response = await api.post(`/api/lab/reports/${reportId}/validate`);
  return response.data;
};
```

### Staff Management

**Get Lab Staff:** `GET /api/lab/staff`

```javascript
const getLabStaff = async () => {
  const response = await api.get('/api/lab/staff');
  return response.data;
};
```

**Add Staff Member:** `POST /api/lab/staff`

```javascript
const addLabStaff = async (staffData) => {
  const response = await api.post('/api/lab/staff', {
    name: staffData.name,
    role: staffData.role, // 'technician', 'pathologist'
    email: staffData.email,
    phone: staffData.phone,
    qualifications: staffData.qualifications,
  });
  return response.data;
};
```

**Update Lab Settings:** `PATCH /api/lab/settings`

```javascript
const updateLabSettings = async (settings) => {
  const response = await api.patch('/api/lab/settings', {
    operatingHours: settings.operatingHours,
    availableTests: settings.availableTests,
    contactInfo: settings.contactInfo,
  });
  return response.data;
};
```

---

## 🏥 Hospital Portal

### Patient Management

**Get Hospital Patients:** `GET /api/hospital/patients?status={status}`

```javascript
const getHospitalPatients = async (status = '') => {
  const response = await api.get(`/api/hospital/patients?status=${status}`);
  return response.data;
};
```

**Admit Patient:** `POST /api/hospital/patients/admit`

```javascript
const admitPatient = async (patientData) => {
  const response = await api.post('/api/hospital/patients/admit', {
    patientId: patientData.patientId,
    department: patientData.department,
    admissionType: patientData.admissionType, // 'emergency', 'planned'
    assignedDoctor: patientData.doctorId,
    reason: patientData.reason,
  });
  return response.data;
};
```

**Discharge Patient:** `POST /api/hospital/patients/{id}/discharge`

```javascript
const dischargePatient = async (patientId, dischargeData) => {
  const response = await api.post(`/api/hospital/patients/${patientId}/discharge`, {
    dischargeSummary: dischargeData.summary,
    followUpInstructions: dischargeData.instructions,
    medications: dischargeData.medications,
  });
  return response.data;
};
```

### Bed Management

**Get Bed Availability:** `GET /api/hospital/beds`

```javascript
const getBedAvailability = async () => {
  const response = await api.get('/api/hospital/beds');
  return response.data;
};
```

**Update Bed Status:** `PATCH /api/hospital/beds/{id}`

```javascript
const updateBedStatus = async (bedId, status) => {
  // status: 'available', 'occupied', 'maintenance'
  const response = await api.patch(`/api/hospital/beds/${bedId}`, {
    status,
  });
  return response.data;
};
```

---

## 🛡️ Admin Portal

### Approval Management

**Get Pending Hospitals:** `GET /api/admin/pending-hospitals`

```javascript
const getPendingHospitals = async () => {
  const response = await api.get('/api/admin/pending-hospitals');
  return response.data;
};
```

**Approve Hospital:** `POST /api/admin/approve-hospital/{id}`

```javascript
const approveHospital = async (hospitalId) => {
  const response = await api.post(`/api/admin/approve-hospital/${hospitalId}`);
  return response.data;
};
```

**Get Pending Labs:** `GET /api/admin/pending-labs`

```javascript
const getPendingLabs = async () => {
  const response = await api.get('/api/admin/pending-labs');
  return response.data;
};
```

**Approve Lab:** `POST /api/admin/approve-lab/{id}`

```javascript
const approveLab = async (labId) => {
  const response = await api.post(`/api/admin/approve-lab/${labId}`);
  return response.data;
};
```

### User Management

**Get All Users:** `GET /api/admin/users?search={query}`

```javascript
const getAllUsers = async (searchQuery = '') => {
  const response = await api.get(`/api/admin/users?search=${searchQuery}`);
  return response.data;
};
```

**Update User Status:** `PATCH /api/admin/users/{id}/status`

```javascript
const updateUserStatus = async (userId, isActive) => {
  const response = await api.patch(`/api/admin/users/${userId}/status`, {
    isActive,
  });
  return response.data;
};
```

### Analytics

**Get System Analytics:** `GET /api/admin/reports/system`

```javascript
const getSystemAnalytics = async () => {
  const response = await api.get('/api/admin/reports/system');
  return response.data;
};
```

---

## 🛠️ Common Utilities

### Search Cities

**Endpoint:** `GET /api/utils/cities?query={query}`

```javascript
const searchCities = async (query) => {
  const response = await api.get(`/api/utils/cities?query=${query}`);
  return response.data;
};
```

### Get All Tests

**Endpoint:** `GET /api/tests`

```javascript
const getAllTests = async () => {
  const response = await api.get('/api/tests');
  return response.data;
};
```

### Notifications

**Get Notifications:** `GET /api/notifications`

```javascript
const getNotifications = async () => {
  const response = await api.get('/api/notifications');
  return response.data;
};
```

### Payment Methods

**Get Payment Methods:** `GET /api/payments/methods`

```javascript
const getPaymentMethods = async () => {
  const response = await api.get('/api/payments/methods');
  return response.data;
};
```

---

## ⚠️ Error Handling

### Standard Error Response Format

```json
{
  "message": "Error description",
  "error": "Detailed error message (in development)"
}
```

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| **200** | Success | Process response data |
| **201** | Created | Resource created successfully |
| **400** | Bad Request | Check request body/parameters |
| **401** | Unauthorized | Refresh token or redirect to login |
| **403** | Forbidden | User doesn't have permission |
| **404** | Not Found | Resource doesn't exist |
| **500** | Server Error | Show error message, retry later |

### Error Handling Example

```javascript
const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return { error: 'Invalid request. Please check your input.' };
      case 401:
        // Token expired, handled by interceptor
        return { error: 'Session expired. Please login again.' };
      case 403:
        return { error: 'You do not have permission to perform this action.' };
      case 404:
        return { error: 'Resource not found.' };
      case 500:
        return { error: 'Server error. Please try again later.' };
      default:
        return { error: data.message || 'An error occurred.' };
    }
  } else if (error.request) {
    // Request made but no response
    return { error: 'Network error. Please check your connection.' };
  } else {
    // Something else happened
    return { error: 'An unexpected error occurred.' };
  }
};

// Usage
try {
  const data = await getMyProfile();
  // Process data
} catch (error) {
  const errorInfo = handleApiError(error);
  // Show error to user
  toast.error(errorInfo.error);
}
```

---

## 💡 Best Practices

### 1. Token Management

```javascript
// Store tokens securely
const storeTokens = (accessToken, refreshToken) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

// Clear tokens on logout
const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

// Check if user is authenticated
const isAuthenticated = () => {
  return !!localStorage.getItem('accessToken');
};
```

### 2. Request Debouncing (Search)

```javascript
import { debounce } from 'lodash';

const debouncedSearch = debounce(async (query) => {
  const results = await searchDoctors({ query });
  setSearchResults(results);
}, 300);

// Usage in React
const handleSearchChange = (e) => {
  const query = e.target.value;
  setSearchQuery(query);
  debouncedSearch(query);
};
```

### 3. Loading States

```javascript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [data, setData] = useState(null);

const fetchData = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const result = await getMyProfile();
    setData(result);
  } catch (err) {
    setError(handleApiError(err));
  } finally {
    setLoading(false);
  }
};
```

### 4. Form Validation

```javascript
const validateAppointmentForm = (formData) => {
  const errors = {};
  
  if (!formData.doctorId) {
    errors.doctorId = 'Please select a doctor';
  }
  
  if (!formData.date) {
    errors.date = 'Please select a date';
  } else {
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      errors.date = 'Date cannot be in the past';
    }
  }
  
  if (!formData.time) {
    errors.time = 'Please select a time';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
```

### 5. Date Formatting

```javascript
// Format date for API
const formatDateForAPI = (date) => {
  return new Date(date).toISOString().split('T')[0]; // "2024-10-25"
};

// Format date for display
const formatDateForDisplay = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Format time for display
const formatTimeForDisplay = (timeString) => {
  return new Date(`2000-01-01 ${timeString}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};
```

### 6. React Hook Example (Custom Hook)

```javascript
import { useState, useEffect } from 'react';

const useApi = (apiFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiFunction();
      setData(result);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, dependencies);

  return { data, loading, error, refetch };
};

// Usage
const MyComponent = () => {
  const { data, loading, error, refetch } = useApi(getMyProfile);
  
  if (loading) return <Spinner />;
  if (error) return <Error message={error.error} />;
  
  return <ProfileView data={data} onUpdate={refetch} />;
};
```

---

## 📱 Mobile App Integration (React Native)

### AsyncStorage for Token Management

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const storeTokens = async (accessToken, refreshToken) => {
  try {
    await AsyncStorage.multiSet([
      ['accessToken', accessToken],
      ['refreshToken', refreshToken],
    ]);
  } catch (error) {
    console.error('Error storing tokens:', error);
  }
};

const getAccessToken = async () => {
  try {
    return await AsyncStorage.getItem('accessToken');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};
```

### Axios Configuration for React Native

```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'https://labloom-malabar.vercel.app',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

---

## 🔄 WebSocket Integration (Future)

For real-time features like notifications, chat, or live updates:

```javascript
import io from 'socket.io-client';

const socket = io('https://labloom-malabar.vercel.app', {
  auth: {
    token: localStorage.getItem('accessToken'),
  },
});

// Listen for notifications
socket.on('notification', (data) => {
  console.log('New notification:', data);
  // Update UI
});

// Listen for appointment updates
socket.on('appointment:updated', (data) => {
  console.log('Appointment updated:', data);
  // Refresh appointment list
});
```

---

## 📞 Support

For technical support or API issues:
- **Email:** support@labloom.com
- **Documentation:** https://labloom-malabar.vercel.app/api-docs
- **GitHub Issues:** [Report a bug](https://github.com/harishma/labloom_new/issues)

---

*Last updated: February 9, 2026*
