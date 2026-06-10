# New Features API — Complete Reference (cURL + Responses + Errors)

**Base URL:** `http://localhost:8080/api/v1`  
**Auth:** `Authorization: Bearer <access_token>` on all endpoints below (except login).

Set variables before running curls:

```bash
export BASE_URL="http://localhost:8080/api/v1"
export TOKEN="<your_jwt_access_token>"
```

---

## Standard Response Envelope

All endpoints return:

```json
{
  "data": { },
  "result": {
    "responseCode": 200,
    "responseDescription": "OK"
  },
  "errorFields": null
}
```

**Error example:**

```json
{
  "data": null,
  "result": {
    "responseCode": 401,
    "responseDescription": "Unauthorised"
  },
  "errorFields": [
    { "field": null, "message": "Token not found" }
  ]
}
```

---

## Common Error Codes

| HTTP | responseCode | Description | When |
|------|--------------|-------------|------|
| 401 | 100114 | Token not found | Missing `Authorization` header |
| 401 | 401 | Unauthorised | Invalid/expired JWT or missing permission |
| 400 | 100117 | organizationId is required | JWT missing org (non–super-admin) |
| 400 | 100129 | Valid user id is required | Invalid user in token |
| 400 | 100130 | No editable fields provided | Empty PUT /profile body |
| 400 | 400 | Bad request | Invalid date range, invalid id, missing file |
| 404 | 404 | Resource not found | User/student not found |
| 405 | 405 | Method not allowed | Wrong HTTP method |
| 500 | 500 | Internal server error | Server/DB failure |
| 503 | 503 | Database connection error | DB unavailable |

> Permission denials return **401** (not 403) in this API.

---

# 1. Profile APIs (3)

## 1.1 GET /profile

Get current user profile (extended with avatar, bio, social links).

**Auth:** Any authenticated user with `organizationId` in JWT.

```bash
curl -s -X GET "$BASE_URL/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq
```

**Success (200):**

```json
{
  "data": {
    "id": 1,
    "email": "admin@example.com",
    "firstName": "Raj",
    "lastName": "Kumar",
    "phone": "9876543210",
    "dob": "1990-01-15",
    "avatarUrl": "https://bucket.s3.amazonaws.com/avatars/1.jpg",
    "bio": "JEE educator with 10+ years experience",
    "youtubeUrl": "https://youtube.com/@channel",
    "websiteUrl": "https://example.com",
    "status": 1,
    "isExaminee": false,
    "organization": { "id": 1, "name": "Acme Coaching", "slug": "acme" },
    "roles": [{ "id": 2, "name": "Organization Admin" }]
  },
  "result": { "responseCode": 200, "responseDescription": "OK" },
  "errorFields": null
}
```

**Errors:** 401 (no/invalid token), 400 (100117 org required), 404 (user not found)

**FE:** `authApi.getProfile()` · `src/api/authApi.js`

---

## 1.2 PUT /profile

Update profile fields. At least one field required.

**Body fields (all optional):** `firstName`, `lastName`, `phone`, `dob`, `bio`, `youtubeUrl`, `websiteUrl`, `avatarUrl`  
Aliases accepted: `avatar_url`, `youtube_url`, `website_url`

```bash
curl -s -X PUT "$BASE_URL/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Raj",
    "lastName": "Kumar",
    "phone": "9876543210",
    "bio": "JEE educator",
    "youtubeUrl": "https://youtube.com/@channel",
    "websiteUrl": "https://example.com"
  }' | jq
```

**Success (200):** Full updated user object (same shape as GET /profile, may include roles/modules).

**Errors:** 401, 400 (100130 empty body), 400 (100117), 404

**FE:** `profileApi.updateProfile(data)` · `src/api/profileApi.js`

---

## 1.3 POST /profile/avatar

Upload avatar image. **multipart/form-data**, field name: `avatar`. Max 10 MB.

```bash
curl -s -X POST "$BASE_URL/profile/avatar" \
  -H "Authorization: Bearer $TOKEN" \
  -F "avatar=@/path/to/photo.jpg" | jq
```

**Success (200):**

```json
{
  "data": {
    "avatarUrl": "https://bucket.s3.amazonaws.com/avatars/user-1-abc.jpg",
    "message": "Avatar uploaded successfully"
  },
  "result": { "responseCode": 200, "responseDescription": "OK" },
  "errorFields": null
}
```

**Errors:** 401, 400 (100117), 400 (missing file), 404, 500 (S3 upload failure)

**FE:** `profileApi.uploadAvatar(file)` · `src/pages/Profile.jsx`

---

# 2. Creator Dashboard APIs (7)

**Auth:** JWT + `organizationId` in token (`requireOrgInToken`). No separate module permission.

## 2.1 GET /dashboard/creator/summary

Overview KPIs for last 30 days (default).

**Query:** `startDate`, `endDate` (YYYY-MM-DD, optional)

```bash
curl -s -X GET "$BASE_URL/dashboard/creator/summary?startDate=2026-05-01&endDate=2026-06-09" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Success (200):**

```json
{
  "data": {
    "dateRange": { "startDate": "2026-05-01", "endDate": "2026-06-09" },
    "revenue": {
      "total": 45000,
      "testRevenue": 38000,
      "seriesRevenue": 7000,
      "percentChange": 12.5
    },
    "activeStudents": { "total": 42, "percentChange": 8.3 },
    "publishedTests": { "total": 5, "percentChange": 25 },
    "avgScore": { "value": 68.4, "percentChange": -2.1 }
  },
  "result": { "responseCode": 200, "responseDescription": "OK" },
  "errorFields": null
}
```

**Errors:** 401, 400 (100117), 400 (invalid dates)

**FE:** `creatorDashboardApi.getCreatorSummary()` · `src/pages/Dashboard.jsx`

---

## 2.2 GET /dashboard/creator/revenue

Revenue timeline. Default: last 90 days, grouped by day.

**Query:** `startDate`, `endDate`, `groupBy` = `day` | `week` | `month`

```bash
curl -s -X GET "$BASE_URL/dashboard/creator/revenue?groupBy=week" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Success (200):**

```json
{
  "data": {
    "dateRange": { "startDate": "2026-03-11", "endDate": "2026-06-09", "groupBy": "week" },
    "testRevenue": [
      { "period": "2026-03-10T00:00:00.000Z", "purchases": 12, "revenue": 6000 }
    ],
    "seriesRevenue": [
      { "period": "2026-03-10T00:00:00.000Z", "purchases": 3, "revenue": 1500 }
    ]
  },
  "result": { "responseCode": 200, "responseDescription": "OK" },
  "errorFields": null
}
```

**FE:** `creatorDashboardApi.getCreatorRevenue(params)`

---

## 2.3 GET /dashboard/creator/students/new

New student registrations over time.

**Query:** `startDate`, `endDate`, `groupBy` = `day` | `week` | `month`

```bash
curl -s -X GET "$BASE_URL/dashboard/creator/students/new?groupBy=month" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Success (200):**

```json
{
  "data": {
    "dateRange": { "startDate": "2026-03-11", "endDate": "2026-06-09", "groupBy": "month" },
    "total": 85,
    "timeline": [
      { "period": "2026-04-01T00:00:00.000Z", "newStudents": 32 }
    ]
  },
  "result": { "responseCode": 200, "responseDescription": "OK" },
  "errorFields": null
}
```

**FE:** `creatorDashboardApi.getCreatorNewStudents(params)`

---

## 2.4 GET /dashboard/creator/tests/performance

Per-test performance in date range.

**Query:** `startDate`, `endDate`, `limit` (default 10)

```bash
curl -s -X GET "$BASE_URL/dashboard/creator/tests/performance?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Success (200):**

```json
{
  "data": {
    "dateRange": { "startDate": "2026-03-11", "endDate": "2026-06-09" },
    "tests": [
      {
        "testId": 12,
        "name": "JEE Main Mock 1",
        "purchases": 45,
        "attempts": 38,
        "completed": 30,
        "avgScore": 72.5,
        "revenue": 22500,
        "completionRate": 78.95
      }
    ]
  },
  "result": { "responseCode": 200, "responseDescription": "OK" },
  "errorFields": null
}
```

**FE:** `creatorDashboardApi.getCreatorTestsPerformance(params)`

---

## 2.5 GET /dashboard/creator/categories/distribution

Test count and revenue by exam category (test type).

```bash
curl -s -X GET "$BASE_URL/dashboard/creator/categories/distribution" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Success (200):**

```json
{
  "data": {
    "total": 15,
    "categories": [
      {
        "category": "JEE Main",
        "code": "JEE_MAIN",
        "testCount": 8,
        "publishedCount": 5,
        "revenue": 40000,
        "percentage": 53.33
      }
    ]
  },
  "result": { "responseCode": 200, "responseDescription": "OK" },
  "errorFields": null
}
```

**FE:** `creatorDashboardApi.getCreatorCategoriesDistribution()`

---

## 2.6 GET /dashboard/creator/tests/top

Top published tests by revenue or purchases.

**Query:** `limit` (default 10), `sortBy` = `revenue` | `purchases`

```bash
curl -s -X GET "$BASE_URL/dashboard/creator/tests/top?sortBy=purchases&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Success (200):**

```json
{
  "data": {
    "sortBy": "purchases",
    "tests": [
      {
        "rank": 1,
        "testId": 12,
        "name": "JEE Main Mock 1",
        "price": 500,
        "totalQuestions": 90,
        "durationMin": 180,
        "purchaseCount": 45,
        "revenue": 22500,
        "avgScore": 72.5
      }
    ]
  },
  "result": { "responseCode": 200, "responseDescription": "OK" },
  "errorFields": null
}
```

**FE:** `creatorDashboardApi.getCreatorTopTests(params)` · `src/pages/Dashboard.jsx`

---

## 2.7 GET /dashboard/creator/purchases/recent

Latest test and series purchases.

**Query:** `limit` (default 20)

```bash
curl -s -X GET "$BASE_URL/dashboard/creator/purchases/recent?limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Success (200):**

```json
{
  "data": {
    "purchases": [
      {
        "id": 101,
        "type": "test",
        "itemId": 12,
        "itemName": "JEE Main Mock 1",
        "pricePaid": 500,
        "currency": "INR",
        "purchaseDate": "2026-06-08T10:30:00.000Z",
        "student": {
          "id": 55,
          "email": "student@example.com",
          "firstName": "Amit",
          "lastName": "Sharma"
        }
      }
    ]
  },
  "result": { "responseCode": 200, "responseDescription": "OK" },
  "errorFields": null
}
```

**FE:** `creatorDashboardApi.getCreatorRecentPurchases(params)` · `src/pages/Dashboard.jsx`

---

# 3. My Tests Cards API (1)

## 3.1 GET /tests/admin/cards

Paginated test cards with stats for admin "My Tests" view.

**Auth:** JWT + `quizzes.read` permission.

**Query:** `pageNo` (0-based), `pageSize` (1–100), `sortOrder` (`ASC`|`DESC`), `search`

```bash
curl -s -X GET "$BASE_URL/tests/admin/cards?pageNo=0&pageSize=10&search=jee" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Success (200):**

```json
{
  "data": {
    "pageNo": 0,
    "pageSize": 10,
    "total": 25,
    "totalPages": 3,
    "cards": [
      {
        "id": 12,
        "name": "JEE Main Mock 1",
        "status": "published",
        "questions": 90,
        "totalQuestions": 90,
        "durationMin": 180,
        "students": 45,
        "revenue": 22500,
        "avgScore": 72.5,
        "price": 500,
        "createdAt": "2026-01-10T08:00:00.000Z",
        "updatedAt": "2026-06-01T12:00:00.000Z"
      }
    ]
  },
  "result": { "responseCode": 200, "responseDescription": "OK" },
  "errorFields": null
}
```

**Errors:** 401 (no token / no `quizzes.read`), 405

**FE:** `testsApi.listAdminTestCards(params)` · `src/pages/TestList.jsx`

---

# 4. Test Formats API (1)

## 4.1 GET /test-formats

All exam types and templates from `public.test_types` / `public.test_templates` (SQL seed in migration 001).

**Auth:** JWT only (no org/permission check).

```bash
curl -s -X GET "$BASE_URL/test-formats" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Success (200):**

```json
{
  "data": {
    "formats": [
      {
        "id": 1,
        "code": "JEE_MAIN",
        "name": "JEE Main",
        "description": "JEE Main style engineering entrance test",
        "templates": [
          {
            "id": 1,
            "templateSlug": "jee_main_full_360",
            "name": "JEE Main Full Syllabus Test",
            "description": "Full syllabus JEE Main style mock test (PCM)",
            "totalQuestions": 90,
            "totalMarks": 360,
            "durationMin": 180
          }
        ]
      },
      {
        "id": 11,
        "code": "CAT_MAIN",
        "name": "CAT",
        "description": "Common Admission Test",
        "templates": [
          {
            "id": 11,
            "templateSlug": "cat_main_full_198",
            "name": "CAT Main Full Syllabus Test",
            "description": "Full syllabus CAT style mock test",
            "totalQuestions": 66,
            "totalMarks": 198,
            "durationMin": 120
          }
        ]
      }
    ]
  },
  "result": { "responseCode": 200, "responseDescription": "OK" },
  "errorFields": null
}
```

**19 formats seeded:** JEE_MAIN, JEE_ADV, NEET_UG, NEET_PG, FOUND_8–10, CBSE_11/12, OLYMPIAD, CAT_MAIN, GATE_MAIN, UPSC_PRELIMS, SSC_CGL, CLAT_MAIN, NDA_MAIN, IBPS_PO, RRB_NTPC, STATE_PCS

**Errors:** 401, 405, 500

**FE:** `testFormatsApi.listTestFormats()` · `src/components/quiz/TemplateSelector.jsx`

---

# 5. Students APIs (2)

**Auth:** JWT + `organizationId` + `examinee.read` permission.

## 5.1 GET /students

Paginated student list with spending and performance.

**Query:** `pageNo`, `pageSize`, `search` (or `searchTerm`), `sortOrder`

```bash
curl -s -X GET "$BASE_URL/students?pageNo=0&pageSize=10&search=amit" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Success (200):**

```json
{
  "data": {
    "pageNo": 0,
    "pageSize": 10,
    "total": 50,
    "totalPages": 5,
    "students": [
      {
        "id": 7,
        "userId": 55,
        "email": "amit@example.com",
        "firstName": "Amit",
        "lastName": "Sharma",
        "phone": "9876543210",
        "registeredAt": "2026-01-15T10:00:00.000Z",
        "totalSpent": 2500,
        "totalPurchases": 5,
        "lastActivity": "2026-06-08T14:30:00.000Z",
        "avgScore": 68.5,
        "testsCompleted": 4
      }
    ]
  },
  "result": { "responseCode": 200, "responseDescription": "OK" },
  "errorFields": null
}
```

**Errors:** 401 (no `examinee.read`), 400 (100117), 405

**FE:** `studentsApi.listStudents(params)` · `src/pages/ExamineeList.jsx`

---

## 5.2 GET /students/:id

Student detail by **examinee id** (not user id).

```bash
curl -s -X GET "$BASE_URL/students/7" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Success (200):**

```json
{
  "data": {
    "id": 7,
    "userId": 55,
    "email": "amit@example.com",
    "firstName": "Amit",
    "lastName": "Sharma",
    "phone": "9876543210",
    "dob": "2005-03-20",
    "registeredAt": "2026-01-15T10:00:00.000Z",
    "totalSpent": 2500,
    "testSpent": 2000,
    "seriesSpent": 500,
    "avgScore": 68.5,
    "lastActivity": "2026-06-08T14:30:00.000Z",
    "purchases": {
      "tests": [
        {
          "id": 101,
          "testId": 12,
          "testName": "JEE Main Mock 1",
          "pricePaid": 500,
          "currency": "INR",
          "purchaseDate": "2026-02-01T10:00:00.000Z",
          "expiryDate": "2027-02-01T10:00:00.000Z"
        }
      ],
      "series": []
    },
    "recentAttempts": [
      {
        "id": 200,
        "testId": 12,
        "testName": "JEE Main Mock 1",
        "status": 3,
        "percentageScore": 72.5,
        "startedAt": "2026-06-08T10:00:00.000Z",
        "submittedAt": "2026-06-08T13:00:00.000Z"
      }
    ]
  },
  "result": { "responseCode": 200, "responseDescription": "OK" },
  "errorFields": null
}
```

**Errors:** 401, 400 (100117), 400 (invalid id), 404 (`Student not found`)

**FE:** `studentsApi.getStudent(id)` · `src/pages/StudentDetail.jsx` · route `/examinees/:id`

---

# Quick Login (get TOKEN)

**Staff login:**

```bash
curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"yourpassword"}' | jq

export TOKEN="<accessToken from response.data>"
```

---

# Frontend Integration Map (Quiz-FE)

| API | FE Module | Page/Component |
|-----|-----------|----------------|
| GET/PUT /profile, POST /profile/avatar | `profileApi.js`, `authApi.js` | `Profile.jsx` |
| Creator dashboard (7) | `creatorDashboardApi.js` | `Dashboard.jsx` |
| GET /tests/admin/cards | `testsApi.js` | `TestList.jsx` |
| GET /test-formats | `testFormatsApi.js` | `TemplateSelector.jsx` |
| GET /students, GET /students/:id | `studentsApi.js` | `ExamineeList.jsx`, `StudentDetail.jsx` |

**Constants:** `Quiz-FE/src/constants/constants.js` → `API_ENDPOINTS`  
**Barrel export:** `Quiz-FE/src/api/index.js`

---

# Endpoint Summary (14 total)

| # | Method | Path | Permission |
|---|--------|------|------------|
| 1 | GET | `/profile` | Auth |
| 2 | PUT | `/profile` | Auth |
| 3 | POST | `/profile/avatar` | Auth |
| 4 | GET | `/dashboard/creator/summary` | Org in token |
| 5 | GET | `/dashboard/creator/revenue` | Org in token |
| 6 | GET | `/dashboard/creator/students/new` | Org in token |
| 7 | GET | `/dashboard/creator/tests/performance` | Org in token |
| 8 | GET | `/dashboard/creator/categories/distribution` | Org in token |
| 9 | GET | `/dashboard/creator/tests/top` | Org in token |
| 10 | GET | `/dashboard/creator/purchases/recent` | Org in token |
| 11 | GET | `/tests/admin/cards` | `quizzes.read` |
| 12 | GET | `/test-formats` | Auth |
| 13 | GET | `/students` | `examinee.read` |
| 14 | GET | `/students/:id` | `examinee.read` |
