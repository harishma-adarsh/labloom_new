# Labloom Multi-Role Platform - Implementation Plan

## Phase 1: Core Infrastructure (Priority: CRITICAL)

### 1.1 Enhanced Authentication System
- [ ] Add refresh token mechanism
- [ ] Implement role-based JWT tokens
- [ ] Create middleware for role verification
- [ ] Add session management

### 1.2 Extended User Models
- [ ] Create Doctor model (separate from User)
- [ ] Create Lab model
- [ ] Create Hospital model
- [ ] Update User model with role enum: ['patient', 'doctor', 'lab', 'hospital', 'admin']

### 1.3 RBAC Middleware
- [ ] Create `authorizeRoles` middleware
- [ ] Create `verifyDoctor` middleware
- [ ] Create `verifyLab` middleware
- [ ] Create `verifyHospital` middleware
- [ ] Create `verifyAdmin` middleware

---

## Phase 2: Doctor Portal (Priority: HIGH)

### 2.1 Doctor Profile & Management
- [ ] `GET /doctor/appointments` - Daily schedule
- [ ] `PATCH /appointments/:id/status` - Update appointment status
- [ ] `GET /appointments/:id` - View appointment details
- [ ] `GET /doctor/patients` - Patient list

### 2.2 Consultation Features
- [ ] `GET /patients/:id/history` - Patient medical history
- [ ] `POST /consultations/:appointmentId/records` - Save diagnosis
- [ ] `POST /consultations/:appointmentId/prescribe` - Issue prescription

### 2.3 Advanced Features
- [ ] `GET /reports/:reportId/ai-summary` - AI insights
- [ ] `GET /doctor/messages` - Patient communication

---

## Phase 3: Lab Portal (Priority: HIGH)

### 3.1 Test Management
- [ ] `GET /lab/bookings` - List test bookings
- [ ] `POST /lab/bookings` - Manual booking entry
- [ ] `PATCH /bookings/:id/status` - Update sample status

### 3.2 Reporting System
- [ ] `POST /lab/reports/upload` - Upload report files
- [ ] `POST /lab/reports/:id/validate` - Pathologist approval

### 3.3 Lab Administration
- [ ] `GET /lab/staff` - Manage staff
- [ ] `POST /lab/staff` - Register staff
- [ ] `PATCH /lab/settings` - Lab configuration

---

## Phase 4: Hospital Management (Priority: MEDIUM)

### 4.1 Staff Management
- [ ] `POST /hospital/add-doctor` - Associate doctor
- [ ] `GET /hospital/doctors` - List doctors
- [ ] `DELETE /hospital/doctors/:id` - Remove doctor

### 4.2 Business Insights
- [ ] `GET /hospital/dashboard` - Stats and analytics
- [ ] `GET /hospital/appointments` - Facility appointments

---

## Phase 5: Admin Portal (Priority: MEDIUM)

### 5.1 Governance
- [ ] `GET /admin/pending-hospitals` - Hospital verification queue
- [ ] `POST /admin/approve-hospital/:id` - Approve hospital
- [ ] `GET /admin/pending-labs` - Lab verification queue
- [ ] `POST /admin/approve-lab/:id` - Approve lab

### 5.2 User Management
- [ ] `GET /admin/users` - Search users
- [ ] `PATCH /admin/users/:id/status` - Suspend accounts

### 5.3 Analytics
- [ ] `GET /admin/reports/system` - Platform analytics

---

## Phase 6: Patient Enhancements (Priority: LOW)

### 6.1 Dashboard
- [ ] `GET /patients/dashboard` - Summary view

### 6.2 Enhanced Features
- [ ] `GET /patients/reports` - Download reports
- [ ] `GET /patients/prescriptions` - Digital prescriptions (already exists, needs enhancement)

---

## Database Schema Updates Needed

### New Models:
1. **Doctor** (extends User)
   - specialization, qualifications, experience
   - hospitalAffiliations, consultationFee
   - availability schedule

2. **Lab** 
   - name, location, contact
   - availableTests, equipment
   - staff, certifications

3. **Hospital**
   - name, location, departments
   - associatedDoctors, facilities
   - verificationStatus

4. **Consultation** (new)
   - appointmentId, diagnosis, notes
   - prescriptions, followUp

5. **RefreshToken** (new)
   - userId, token, expiresAt

---

## API Route Structure

```
/api/auth/*          - Authentication (all roles)
/api/patients/*      - Patient-specific endpoints
/api/doctor/*        - Doctor portal
/api/lab/*           - Lab portal
/api/hospital/*      - Hospital management
/api/admin/*         - Admin governance
/api/appointments/*  - Shared appointment management
/api/bookings/*      - Shared lab booking management
```

---

## Estimated Timeline
- Phase 1: 2-3 days
- Phase 2: 3-4 days
- Phase 3: 3-4 days
- Phase 4: 2-3 days
- Phase 5: 2-3 days
- Phase 6: 1-2 days

**Total: ~15-20 days for complete implementation**
