# Mobile Exam API Usage Example

## Overview
This document provides examples for using the exam API endpoints in a mobile application.

## API Endpoints

### 1. Get All Exams for a Course
**Endpoint:** `GET /api/mobile/student/exams/course/:courseID`

**Purpose:** Get list of all exams available in a specific course (without questions)

**Example Request:**
```http
GET http://192.168.1.19:5005/api/mobile/student/exams/course/b2b3e408-f978-4f4c-831b-11c8e81e5e43
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "examID": "fe445df3-905a-4c7d-ba63-a8240b60618a",
      "title": "maghwry exam",
      "titleAr": "مغاوري امتحان",
      "titleEn": "maghwry exam",
      "description": "maghwry exam description",
      "descriptionAr": "مغاوري وصف الامتحان",
      "descriptionEn": "maghwry exam description",
      "types": ["essay", "true-false", "multiple-choice"],
      "questionsCount": 3,
      "duration": 2,
      "passingScore": "100",
      "startDate": "2025-12-13T08:30:00.000Z",
      "endDate": "2025-12-13T08:31:00.000Z",
      "result": null
    }
  ]
}
```

**Use Case:** Display list of exams in course details screen

---

### 2. Get Exam Details with Questions
**Endpoint:** `GET /api/mobile/student/exams/:id`

**Purpose:** Get full exam details including all questions (without correct answers)

**Example Request:**
```http
GET http://192.168.1.19:5005/api/mobile/student/exams/fe445df3-905a-4c7d-ba63-a8240b60618a
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "exam": {
      "examID": "fe445df3-905a-4c7d-ba63-a8240b60618a",
      "title": "maghwry exam",
      "titleAr": "مغاوري امتحان",
      "titleEn": "maghwry exam",
      "description": "maghwry exam description",
      "descriptionAr": "مغاوري وصف الامتحان",
      "descriptionEn": "maghwry exam description",
      "duration": 2,
      "passingScore": "100",
      "startDate": "2025-12-13T08:30:00.000Z",
      "endDate": "2025-12-13T08:31:00.000Z",
      "course": {
        "id": "b2b3e408-f978-4f4c-831b-11c8e81e5e43",
        "titleAr": "دورة",
        "titleEn": "Course"
      },
      "questions": [
        {
          "questionID": "question-id-1",
          "type": "multiple-choice",
          "questionAr": "السؤال الأول؟",
          "questionEn": "First question?",
          "options": [
            { "textAr": "الخيار 1", "textEn": "Option 1" },
            { "textAr": "الخيار 2", "textEn": "Option 2" },
            { "textAr": "الخيار 3", "textEn": "Option 3" }
          ],
          "points": 10,
          "order": 1
        },
        {
          "questionID": "question-id-2",
          "type": "true-false",
          "questionAr": "السؤال الثاني؟",
          "questionEn": "Second question?",
          "options": null,
          "points": 5,
          "order": 2
        },
        {
          "questionID": "question-id-3",
          "type": "essay",
          "questionAr": "السؤال الثالث؟",
          "questionEn": "Third question?",
          "options": null,
          "points": 15,
          "order": 3
        }
      ]
    }
  }
}
```

**Use Case:** Display exam questions when student starts taking the exam

---

### 3. Submit Exam Answers
**Endpoint:** `POST /api/mobile/student/exams/:examId/submit`

**Purpose:** Submit exam answers and get results

**Example Request:**
```http
POST http://192.168.1.19:5005/api/mobile/student/exams/fe445df3-905a-4c7d-ba63-a8240b60618a/submit
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "answers": [
    {
      "questionID": "question-id-1",
      "answerBody": "0"
    },
    {
      "questionID": "question-id-2",
      "answerBody": "true"
    },
    {
      "questionID": "question-id-3",
      "answerBody": "This is my essay answer..."
    }
  ]
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Exam submitted successfully",
  "messageAr": "تم إرسال الامتحان بنجاح",
  "data": {
    "resultID": "result-id-123",
    "finalScore": 75.5,
    "score": 15.0,
    "totalScore": 30.0,
    "percentage": 75.5,
    "passed": true,
    "detailedResults": [
      {
        "questionID": "question-id-1",
        "yourAnswer": "0",
        "correctAnswer": "0",
        "isCorrect": true,
        "points": 10,
        "earnedPoints": 10
      },
      {
        "questionID": "question-id-2",
        "yourAnswer": "true",
        "correctAnswer": "true",
        "isCorrect": true,
        "points": 5,
        "earnedPoints": 5
      },
      {
        "questionID": "question-id-3",
        "yourAnswer": "This is my essay answer...",
        "correctAnswer": "Manual grading required",
        "isCorrect": true,
        "points": 15,
        "earnedPoints": 0
      }
    ]
  }
}
```

**Use Case:** Submit exam and show results

---

### 4. Get Exam Result
**Endpoint:** `GET /api/mobile/student/exams/:id/result`

**Purpose:** Get detailed exam result after submission

**Example Request:**
```http
GET http://192.168.1.19:5005/api/mobile/student/exams/fe445df3-905a-4c7d-ba63-a8240b60618a/result
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Use Case:** View exam results screen

---

## Mobile Implementation Flow

### Step 1: Get Course Exams List
```dart
// Flutter/Dart Example
Future<List<Exam>> getCourseExams(String courseID) async {
  final response = await http.get(
    Uri.parse('http://192.168.1.19:5005/api/mobile/student/exams/course/$courseID'),
    headers: {
      'Authorization': 'Bearer $accessToken',
      'Content-Type': 'application/json',
    },
  );
  
  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    return (data['data'] as List)
        .map((exam) => Exam.fromJson(exam))
        .toList();
  }
  throw Exception('Failed to load exams');
}
```

### Step 2: Get Exam Questions
```dart
// Flutter/Dart Example
Future<ExamDetails> getExamDetails(String examID) async {
  final response = await http.get(
    Uri.parse('http://192.168.1.19:5005/api/mobile/student/exams/$examID'),
    headers: {
      'Authorization': 'Bearer $accessToken',
      'Content-Type': 'application/json',
    },
  );
  
  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    return ExamDetails.fromJson(data['data']['exam']);
  }
  throw Exception('Failed to load exam details');
}
```

### Step 3: Submit Exam Answers
```dart
// Flutter/Dart Example
Future<ExamResult> submitExam(String examID, List<Answer> answers) async {
  final response = await http.post(
    Uri.parse('http://192.168.1.19:5005/api/mobile/student/exams/$examID/submit'),
    headers: {
      'Authorization': 'Bearer $accessToken',
      'Content-Type': 'application/json',
    },
    body: json.encode({
      'answers': answers.map((a) => {
        'questionID': a.questionID,
        'answerBody': a.answerBody,
      }).toList(),
    }),
  );
  
  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    return ExamResult.fromJson(data['data']);
  }
  throw Exception('Failed to submit exam');
}
```

---

## Question Types Handling

### Multiple Choice (MCQ)
- **Answer Format:** String (index) or String (option text)
- **Example:** `"0"` or `"Option 1"`
- **Options:** Array of `{ textAr, textEn }`

### True/False
- **Answer Format:** String
- **Example:** `"true"` or `"false"` or `"1"` or `"0"`
- **Options:** null

### Essay
- **Answer Format:** String (text)
- **Example:** `"This is my essay answer..."`
- **Options:** null
- **Note:** Essay questions are manually graded, so `earnedPoints` will be 0 initially

---

## Important Notes

1. **Authentication:** All endpoints require Bearer token in Authorization header
2. **Course Purchase:** Student must have purchased the course to access exams
3. **Exam Submission:** Once submitted, exam cannot be retaken (check `result` field)
4. **Correct Answers:** Not included in exam questions until after submission
5. **Essay Grading:** Essay questions require manual grading by teacher

