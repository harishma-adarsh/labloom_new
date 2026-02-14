# Labloom API Endpoints

**Base URL:** `https://labloom-malabar.vercel.app`

---

## 🔐 Authentication

```
POST   /api/auth/signup
POST   /api/auth/request-otp
POST   /api/auth/verify-otp
POST   /api/auth/refresh-token
POST   /api/auth/logout
```

---

## 👤 Patient Portal

```
GET    /api/patients/dashboard
GET    /api/patients/me
PATCH  /api/patients/me
GET    /api/patients/health-metrics?type={type}
POST   /api/patients/health-metrics
GET    /api/patients/appointments/me
POST   /api/patients/appointments
GET    /api/patients/bookings/me
POST   /api/patients/bookings
GET    /api/patients/doctors?query={q}&specialization={spec}
GET    /api/patients/labs?city={city}
GET    /api/patients/reports
GET    /api/patients/prescriptions
```

---

## 👨‍⚕️ Doctor Portal

```
GET    /api/doctor/appointments?status={status}&date={date}
GET    /api/doctor/appointments/{id}
PATCH  /api/doctor/appointments/{id}/status
GET    /api/doctor/patients?search={query}
GET    /api/doctor/patients/{id}/history
POST   /api/doctor/consultations/{appointmentId}/records
POST   /api/doctor/consultations/{appointmentId}/prescribe
```

---

## 🔬 Lab Portal

```
GET    /api/lab/bookings?status={status}
POST   /api/lab/bookings
PATCH  /api/lab/bookings/{id}/status
POST   /api/lab/reports/upload
POST   /api/lab/reports/{id}/validate
GET    /api/lab/staff
POST   /api/lab/staff
PATCH  /api/lab/settings
```

---

## 🏥 Hospital Portal

```
GET    /api/hospital/patients?status={status}
POST   /api/hospital/patients/admit
POST   /api/hospital/patients/{id}/discharge
GET    /api/hospital/beds
PATCH  /api/hospital/beds/{id}
```

---

## 🛡️ Admin Portal

```
GET    /api/admin/pending-hospitals
POST   /api/admin/approve-hospital/{id}
GET    /api/admin/pending-labs
POST   /api/admin/approve-lab/{id}
GET    /api/admin/users?search={query}
PATCH  /api/admin/users/{id}/status
GET    /api/admin/reports/system
```

---

## 🛠️ Utilities

```
GET    /api/utils/cities?query={query}
GET    /api/tests
GET    /api/notifications
GET    /api/payments/methods
```

---

## 📝 Notes

- **Auth Required:** All endpoints except Authentication and some Utilities require `Authorization: Bearer {token}` header
- **Content-Type:** `application/json` for all requests (except file uploads use `multipart/form-data`)
