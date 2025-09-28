# THUNDER CLIENT TESTING GUIDE - STUDENT SCHEDULE SYSTEM

## ENVIRONMENT SETUP

### Prerequisites
1. MongoDB running on localhost:27017
2. Node.js and npm installed
3. Thunder Client extension installed in VS Code

### Setup Commands
```bash
# Run setup script
node scripts/setup-test-environment-fixed.js

# Start the server
npm run start:dev
```

### Verify Setup
- Visit: http://localhost:3000/api (should show Swagger docs)
- MongoDB should be running without errors

---

## THUNDER CLIENT ENVIRONMENT

Create a new environment in Thunder Client:

**Environment Name**: Student Schedule System
**Variables**:
```json
{
  "baseUrl": "http://localhost:3000",
  "studentEmail": "juan.perez@estudiante.edu",
  "studentCode": "SIS2024001",
  "authToken": ""
}
```

---

## TEST DATA OVERVIEW

The seeder creates:
- **Student**: Juan Perez (SIS2024001)
- **Faculty**: Faculty of Engineering
- **Program**: Systems Engineering
- **Period**: 2024-1 (Active, allows change requests)
- **Courses**: 5 courses with 2 groups each
- **Current Enrollments**: 2 courses (Differential Calculus A, Programming I A)
- **Historical Data**: 1 passed course, 1 failed course

---

## STEP-BY-STEP TESTING

### 1. AUTHENTICATION

**Request: Login**
- Method: `POST`
- URL: `{{baseUrl}}/auth/login`
- Headers:
  ```
  Content-Type: application/json
  ```
- Body (JSON):
  ```json
  {
    "email": "{{studentEmail}}",
    "password": "password123"
  }
  ```

**Expected Response (200)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "email": "juan.perez@estudiante.edu",
    "displayName": "Juan Perez",
    "roles": ["STUDENT"]
  }
}
```

**Action**: Copy the `access_token` and update your environment variable `authToken`.

---

### 2. VIEW STUDENT SCHEDULE

**Request: Get Personal Schedule**
- Method: `GET`
- URL: `{{baseUrl}}/students/{{studentCode}}/schedule`
- Headers:
  ```
  Authorization: Bearer {{authToken}}
  ```

**Expected Response (200)**:
```json
{
  "studentId": "SIS2024001",
  "studentName": "Juan Perez",
  "currentSemester": 3,
  "period": "2024-1",
  "schedule": [
    {
      "dayOfWeek": 1,
      "dayName": "Monday",
      "classes": [
        {
          "courseCode": "MAT101",
          "courseName": "Differential Calculus",
          "groupNumber": "A",
          "startTime": "08:00",
          "endTime": "10:00",
          "room": "LAB-1",
          "professorName": null
        },
        {
          "courseCode": "PRG101",
          "courseName": "Programming I",
          "groupNumber": "A",
          "startTime": "14:00",
          "endTime": "16:00",
          "room": "LAB-2",
          "professorName": null
        }
      ]
    },
    {
      "dayOfWeek": 3,
      "dayName": "Wednesday",
      "classes": [
        {
          "courseCode": "MAT101",
          "courseName": "Differential Calculus",
          "groupNumber": "A",
          "startTime": "08:00",
          "endTime": "10:00",
          "room": "LAB-1",
          "professorName": null
        },
        {
          "courseCode": "PRG101",
          "courseName": "Programming I",
          "groupNumber": "A",
          "startTime": "14:00",
          "endTime": "16:00",
          "room": "LAB-2",
          "professorName": null
        }
      ]
    }
  ]
}
```

**Verification**:
- Student sees only their enrolled courses
- Schedule shows current period (2024-1)
- Days are organized correctly
- All course information is complete

---

### 3. VIEW ACADEMIC HISTORY

**Request: Get Academic History (Traffic Light)**
- Method: `GET`
- URL: `{{baseUrl}}/students/{{studentCode}}/academic-history`
- Headers:
  ```
  Authorization: Bearer {{authToken}}
  ```

**Expected Response (200)**:
```json
{
  "studentId": "SIS2024001",
  "currentSemester": 3,
  "academicHistory": {
    "currentCourses": [
      {
        "periodCode": "2024-1",
        "courseCode": "MAT101",
        "courseName": "Differential Calculus",
        "credits": 4,
        "status": "ENROLLED",
        "color": "yellow"
      },
      {
        "periodCode": "2024-1",
        "courseCode": "PRG101",
        "courseName": "Programming I",
        "credits": 4,
        "status": "ENROLLED",
        "color": "yellow"
      }
    ],
    "passedCourses": [
      {
        "periodCode": "2023-2",
        "courseCode": "FIS101",
        "courseName": "Physics I",
        "credits": 4,
        "grade": 4.2,
        "status": "PASSED",
        "color": "green"
      }
    ],
    "failedCourses": [
      {
        "periodCode": "2023-2",
        "courseCode": "MAT201",
        "courseName": "Integral Calculus",
        "credits": 4,
        "grade": 2.1,
        "status": "FAILED",
        "color": "red"
      }
    ]
  }
}
```

**Verification**:
- Yellow: Current enrolled courses
- Green: Passed courses with grades
- Red: Failed courses with grades
- Traffic light system working correctly

---

### 4. VIEW AVAILABLE GROUPS

**Request: Get Available Course Groups**
- Method: `GET`
- URL: `{{baseUrl}}/course-groups/available`
- Headers:
  ```
  Authorization: Bearer {{authToken}}
  ```

**Expected Response (200)**:
```json
[
  {
    "groupId": "673f...",
    "courseCode": "PRG101",
    "courseName": "Programming I",
    "groupNumber": "B",
    "maxStudents": 25,
    "currentEnrollments": 0,
    "availableSpots": 25,
    "schedule": [
      {
        "dayOfWeek": 2,
        "dayName": "Tuesday",
        "startTime": "14:00",
        "endTime": "16:00",
        "room": "LAB-3"
      },
      {
        "dayOfWeek": 4,
        "dayName": "Thursday",
        "startTime": "14:00",
        "endTime": "16:00",
        "room": "LAB-3"
      }
    ]
  },
  {
    "groupId": "674f...",
    "courseCode": "FIS101",
    "courseName": "Physics I",
    "groupNumber": "B",
    "maxStudents": 25,
    "currentEnrollments": 0,
    "availableSpots": 25,
    "schedule": [
      {
        "dayOfWeek": 2,
        "dayName": "Tuesday",
        "startTime": "08:00",
        "endTime": "10:00",
        "room": "LAB-FIS"
      },
      {
        "dayOfWeek": 4,
        "dayName": "Thursday",
        "startTime": "08:00",
        "endTime": "10:00",
        "room": "LAB-FIS"
      }
    ]
  }
]
```

**Note**: Copy group IDs for use in change requests. Look for groups where `availableSpots > 0`.

---

### 5. CREATE CHANGE REQUEST (SUCCESS CASE)

**Request: Create Valid Change Request**
- Method: `POST`
- URL: `{{baseUrl}}/change-requests`
- Headers:
  ```
  Content-Type: application/json
  Authorization: Bearer {{authToken}}
  ```
- Body (JSON):
  ```json
  {
    "sourceGroupId": "PROGRAMMING_I_GROUP_A_ID",
    "targetGroupId": "PROGRAMMING_I_GROUP_B_ID",
    "reason": "Schedule conflict with part-time job",
    "priority": 1,
    "observations": "Need to change due to work schedule"
  }
  ```

**Expected Response (201)**:
```json
{
  "id": "675f...",
  "radicado": "CR-202412-0001",
  "studentId": "SIS2024001",
  "studentName": "Juan Perez",
  "programName": "Systems Engineering",
  "periodCode": "2024-1",
  "sourceCourse": {
    "courseId": "676f...",
    "courseCode": "PRG101",
    "courseName": "Programming I",
    "groupNumber": "A",
    "schedule": [
      {
        "dayOfWeek": 1,
        "startTime": "14:00",
        "endTime": "16:00"
      },
      {
        "dayOfWeek": 3,
        "startTime": "14:00",
        "endTime": "16:00"
      }
    ]
  },
  "targetCourse": {
    "courseId": "676f...",
    "courseCode": "PRG101",
    "courseName": "Programming I",
    "groupNumber": "B",
    "schedule": [
      {
        "dayOfWeek": 2,
        "startTime": "14:00",
        "endTime": "16:00"
      },
      {
        "dayOfWeek": 4,
        "startTime": "14:00",
        "endTime": "16:00"
      }
    ]
  },
  "state": "PENDING",
  "priority": 1,
  "observations": "Need to change due to work schedule",
  "exceptional": false,
  "createdAt": "2024-12-27T10:30:00.000Z",
  "resolvedAt": null,
  "resolutionReason": null
}
```

**Verification**:
- Unique radicado generated
- State is PENDING
- Complete source and target information
- All validations passed

---

### 6. CREATE CHANGE REQUEST (CONFLICT CASE)

**Request: Create Conflicting Change Request**
- Method: `POST`
- URL: `{{baseUrl}}/change-requests`
- Headers:
  ```
  Content-Type: application/json
  Authorization: Bearer {{authToken}}
  ```
- Body (JSON):
  ```json
  {
    "sourceGroupId": "PROGRAMMING_I_GROUP_A_ID",
    "targetGroupId": "PHYSICS_I_GROUP_A_ID",
    "reason": "Testing schedule conflict detection"
  }
  ```

**Expected Response (400)**:
```json
{
  "statusCode": 400,
  "message": "Invalid change request",
  "errors": [
    "Schedule conflict: Monday from 15:00 to 17:00",
    "Schedule conflict: Wednesday from 15:00 to 17:00"
  ],
  "warnings": []
}
```

**Verification**:
- System detects schedule conflicts automatically
- Clear error messages
- Request not created when conflicts exist

---

### 7. VIEW CHANGE REQUEST DETAILS

**Request: Get Change Request Details**
- Method: `GET`
- URL: `{{baseUrl}}/change-requests/{REQUEST_ID}`
- Headers:
  ```
  Authorization: Bearer {{authToken}}
  ```

Replace `{REQUEST_ID}` with the ID from step 5.

**Expected Response (200)**:
```json
{
  "id": "675f...",
  "radicado": "CR-202412-0001",
  "studentId": "SIS2024001",
  "studentName": "Juan Perez",
  "programName": "Systems Engineering",
  "periodCode": "2024-1",
  "sourceCourse": { /* ... */ },
  "targetCourse": { /* ... */ },
  "state": "PENDING",
  "priority": 1,
  "observations": "Need to change due to work schedule",
  "exceptional": false,
  "createdAt": "2024-12-27T10:30:00.000Z",
  "resolvedAt": null,
  "resolutionReason": null
}
```

---

## SECURITY TESTING

### 8. UNAUTHORIZED ACCESS TEST

**Request: Access Without Token**
- Method: `GET`
- URL: `{{baseUrl}}/students/{{studentCode}}/schedule`
- Headers: None

**Expected Response (401)**:
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 9. INVALID TOKEN TEST

**Request: Access With Invalid Token**
- Method: `GET`
- URL: `{{baseUrl}}/students/{{studentCode}}/schedule`
- Headers:
  ```
  Authorization: Bearer invalid_token_here
  ```

**Expected Response (401)**:
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 10. FORBIDDEN ACCESS TEST

**Request: Try Admin Function (Should Fail)**
- Method: `POST`
- URL: `{{baseUrl}}/course-groups`
- Headers:
  ```
  Content-Type: application/json
  Authorization: Bearer {{authToken}}
  ```
- Body (JSON):
  ```json
  {
    "courseId": "test",
    "groupNumber": "C",
    "periodId": "test",
    "maxStudents": 30
  }
  ```

**Expected Response (403)**:
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

---

## TESTING CHECKLIST

### Authentication & Authorization
- [ ] Successful login with valid credentials
- [ ] JWT token received and stored
- [ ] Access denied without token (401)
- [ ] Access denied with invalid token (401)
- [ ] Access denied for admin functions (403)

### Student Schedule Management
- [ ] View personal schedule (only enrolled courses)
- [ ] Schedule organized by days
- [ ] Complete course information displayed
- [ ] Only current period shown

### Academic History (Traffic Light)
- [ ] Current courses shown in yellow
- [ ] Passed courses shown in green with grades
- [ ] Failed courses shown in red with grades
- [ ] Proper traffic light color coding

### Change Request System
- [ ] Create valid change request successfully
- [ ] Schedule conflict detection working
- [ ] Available spots validation working
- [ ] Unique radicado generation
- [ ] Request details retrieval
- [ ] Proper error messages for invalid requests

### Data Integrity
- [ ] Student only sees own data
- [ ] Cannot access other students' information
- [ ] Cannot perform unauthorized operations
- [ ] All validations working correctly

---

## TROUBLESHOOTING

### Problem: 401 Unauthorized on all requests
**Solution**: Re-login and update the `authToken` environment variable

### Problem: 404 Not Found on endpoints
**Solution**: Verify server is running on http://localhost:3000

### Problem: Empty or incorrect data
**Solution**: Re-run the seeder script: `node scripts/setup-test-environment-fixed.js`

### Problem: MongoDB connection errors
**Solution**: Ensure MongoDB is running on localhost:27017

### Problem: TypeScript compilation errors
**Solution**: Fix compilation errors before running tests

### Problem: Invalid group IDs in change requests
**Solution**: Use actual group IDs from the "available groups" endpoint

---

## SUCCESS CRITERIA

If all tests pass, you have successfully verified:

1. **Complete student schedule management system**
2. **Academic history with traffic light visualization**
3. **Intelligent change request system with validations**
4. **Robust security and permission system**
5. **Automatic conflict detection and prevention**
6. **Complete API functionality for student use cases**

The system is fully functional and ready for production use from a student perspective.