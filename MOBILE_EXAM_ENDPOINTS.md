# دليل Endpoints الامتحانات للموبايل
# Mobile Exam Endpoints Guide

## 📋 نظرة عامة / Overview

هذا الدليل يشرح endpoints الامتحانات للموبايل بشكل منظم وواضح مع أمثلة عملية.

This guide explains mobile exam endpoints in an organized and clear way with practical examples.

---

## 🔗 Endpoints List

### 1. جلب جميع امتحانات دورة معينة
### 1. Get All Exams for a Course

**Endpoint:** `GET /api/mobile/student/exams/course/:courseID`

**Description:** يعيد قائمة بجميع الامتحانات المتاحة لدورة معينة

**Headers:**
```
Authorization: Bearer {token}
```

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "examID": "exam-uuid-1",
      "title": "Final Exam",
      "titleAr": "امتحان نهائي",
      "titleEn": "Final Exam",
      "description": "Comprehensive exam covering all course material",
      "descriptionAr": "امتحان شامل يغطي جميع محتويات الدورة",
      "descriptionEn": "Comprehensive exam covering all course material",
      "types": ["multiple-choice", "true-false", "essay"],
      "questionsCount": 15,
      "duration": 60,
      "passingScore": 60,
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2025-12-31T23:59:59.000Z",
      "result": null
    },
    {
      "examID": "exam-uuid-2",
      "title": "Midterm Exam",
      "titleAr": "امتحان منتصف الفصل",
      "titleEn": "Midterm Exam",
      "description": "Midterm examination",
      "descriptionAr": "امتحان منتصف الفصل",
      "descriptionEn": "Midterm examination",
      "types": ["multiple-choice", "true-false"],
      "questionsCount": 10,
      "duration": 30,
      "passingScore": 50,
      "startDate": null,
      "endDate": null,
      "result": {
        "score": 8,
        "totalScore": 10,
        "percentage": 80,
        "passed": true,
        "submittedAt": "2025-01-15T10:30:00.000Z"
      }
    }
  ]
}
```

---

### 2. جلب محتوى الامتحان (الأسئلة)
### 2. Get Exam Content (Questions)

**Endpoint:** `GET /api/mobile/student/exams/:id`

**Description:** يعيد تفاصيل الامتحان مع جميع الأسئلة والخيارات (بدون الإجابات الصحيحة)

**Headers:**
```
Authorization: Bearer {token}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "exam": {
      "examID": "exam-uuid",
      "title": "Final Exam",
      "titleAr": "امتحان نهائي",
      "titleEn": "Final Exam",
      "description": "Comprehensive exam",
      "descriptionAr": "امتحان شامل",
      "descriptionEn": "Comprehensive exam",
      "types": ["multiple-choice", "true-false", "essay"],
      "questionsCount": 3,
      "duration": 60,
      "passingScore": 60,
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2025-12-31T23:59:59.000Z",
      "course": {
        "courseID": "course-uuid",
        "titleAr": "دورة القانون المدني",
        "titleEn": "Civil Law Course"
      },
      "questions": [
        {
          "questionID": "question-uuid-1",
          "type": "multiple-choice",
          "questionAr": "ما هو تعريف القانون الدستوري؟",
          "questionEn": "What is the definition of constitutional law?",
          "options": {
            "a": {
              "ar": "القانون الذي ينظم العلاقات بين الأفراد",
              "en": "Law that regulates relationships between individuals"
            },
            "b": {
              "ar": "القانون الذي ينظم السلطات العامة في الدولة",
              "en": "Law that regulates public authorities in the state"
            },
            "c": {
              "ar": "القانون الذي ينظم المعاملات التجارية",
              "en": "Law that regulates commercial transactions"
            },
            "d": {
              "ar": "القانون الذي ينظم الجرائم والعقوبات",
              "en": "Law that regulates crimes and penalties"
            }
          },
          "points": 2,
          "order": 1
        },
        {
          "questionID": "question-uuid-2",
          "type": "true-false",
          "questionAr": "القانون الدستوري هو أساس الدولة",
          "questionEn": "Constitutional law is the foundation of the state",
          "options": null,
          "points": 1,
          "order": 2
        },
        {
          "questionID": "question-uuid-3",
          "type": "essay",
          "questionAr": "اشرح مبادئ القانون المدني",
          "questionEn": "Explain the principles of civil law",
          "options": null,
          "points": 5,
          "order": 3
        }
      ]
    }
  }
}
```

**Important Notes:**
- ✅ الأسئلة مرتبة حسب `order`
- ✅ لا يتم إرجاع الإجابات الصحيحة في هذا الـ endpoint
- ✅ `options` يكون `null` للأسئلة من نوع `true-false` و `essay`
- ✅ `options` يكون object للأسئلة من نوع `multiple-choice`

---

### 3. إرسال إجابات الامتحان
### 3. Submit Exam Answers

**Endpoint:** `POST /api/mobile/student/exams/:examId/submit`

**Description:** إرسال إجابات الامتحان والحصول على النتائج

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "answers": [
    {
      "questionID": "question-uuid-1",
      "answerBody": "b"
    },
    {
      "questionID": "question-uuid-2",
      "answerBody": "true"
    },
    {
      "questionID": "question-uuid-3",
      "answerBody": "Civil law principles include..."
    }
  ]
}
```

**Response Example:**
```json
{
  "success": true,
  "message": "Exam submitted successfully",
  "messageAr": "تم إرسال الامتحان بنجاح",
  "data": {
    "resultID": "result-uuid",
    "finalScore": 85.5,
    "score": 12.75,
    "totalScore": 15,
    "percentage": 85.5,
    "passed": true,
    "detailedResults": [
      {
        "questionID": "question-uuid-1",
        "yourAnswer": "b",
        "correctAnswer": "b",
        "isCorrect": true,
        "points": 2,
        "earnedPoints": 2
      },
      {
        "questionID": "question-uuid-2",
        "yourAnswer": "true",
        "correctAnswer": "true",
        "isCorrect": true,
        "points": 1,
        "earnedPoints": 1
      },
      {
        "questionID": "question-uuid-3",
        "yourAnswer": "Civil law principles include...",
        "correctAnswer": "Manual grading required",
        "isCorrect": true,
        "points": 5,
        "earnedPoints": 5
      }
    ]
  }
}
```

**Answer Format by Question Type:**

1. **Multiple Choice (MCQ):**
   ```json
   {
     "questionID": "question-uuid",
     "answerBody": "a"  // or "b", "c", "d"
   }
   ```

2. **True/False:**
   ```json
   {
     "questionID": "question-uuid",
     "answerBody": "true"  // or "false"
   }
   ```

3. **Essay:**
   ```json
   {
     "questionID": "question-uuid",
     "answerBody": "Your essay answer text here..."
   }
   ```

---

### 4. جلب نتيجة الامتحان
### 4. Get Exam Result

**Endpoint:** `GET /api/mobile/student/exams/:id/result`

**Description:** جلب نتيجة امتحان تم إرساله مسبقاً

**Headers:**
```
Authorization: Bearer {token}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "result": {
      "id": "result-uuid",
      "score": 12.75,
      "totalScore": 15,
      "percentage": 85.5,
      "passed": true,
      "startedAt": "2025-01-15T10:00:00.000Z",
      "submittedAt": "2025-01-15T10:30:00.000Z",
      "exam": {
        "id": "exam-uuid",
        "titleAr": "امتحان نهائي",
        "titleEn": "Final Exam",
        "course": {
          "titleAr": "دورة القانون المدني",
          "titleEn": "Civil Law Course"
        }
      },
      "answers": [
        {
          "id": "answer-uuid",
          "answer": "b",
          "isCorrect": true,
          "points": 2,
          "question": {
            "id": "question-uuid",
            "questionAr": "ما هو تعريف القانون الدستوري؟",
            "questionEn": "What is the definition of constitutional law?",
            "correctAnswer": "b",
            "points": 2,
            "type": "MCQ"
          }
        }
      ]
    }
  }
}
```

---

## 💻 أمثلة الكود / Code Examples

### Flutter/Dart Example

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class ExamService {
  final String baseUrl = 'https://yourdomain.com/api/mobile/student';
  final String token;

  ExamService(this.token);

  // 1. Get all exams for a course
  Future<List<dynamic>> getExamsByCourse(String courseId) async {
    final url = Uri.parse('$baseUrl/exams/course/$courseId');
    final response = await http.get(
      url,
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return data['data'];
    } else {
      throw Exception('Failed to load exams: ${response.statusCode}');
    }
  }

  // 2. Get exam content with questions
  Future<Map<String, dynamic>> getExamContent(String examId) async {
    final url = Uri.parse('$baseUrl/exams/$examId');
    final response = await http.get(
      url,
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return data['data']['exam'];
    } else {
      throw Exception('Failed to load exam: ${response.statusCode}');
    }
  }

  // 3. Submit exam answers
  Future<Map<String, dynamic>> submitExam(
    String examId,
    List<Map<String, dynamic>> answers,
  ) async {
    final url = Uri.parse('$baseUrl/exams/$examId/submit');
    final response = await http.post(
      url,
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'answers': answers,
      }),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return data['data'];
    } else {
      throw Exception('Failed to submit exam: ${response.statusCode}');
    }
  }

  // 4. Get exam result
  Future<Map<String, dynamic>> getExamResult(String examId) async {
    final url = Uri.parse('$baseUrl/exams/$examId/result');
    final response = await http.get(
      url,
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return data['data']['result'];
    } else {
      throw Exception('Failed to load result: ${response.statusCode}');
    }
  }
}

// Usage Example
void main() async {
  final examService = ExamService('your-auth-token');
  
  try {
    // Step 1: Get all exams for a course
    final exams = await examService.getExamsByCourse('course-uuid');
    print('Found ${exams.length} exams');
    
    if (exams.isNotEmpty) {
      final examId = exams[0]['examID'];
      
      // Step 2: Get exam content
      final examContent = await examService.getExamContent(examId);
      print('Exam: ${examContent['title']}');
      print('Questions: ${examContent['questionsCount']}');
      
      // Step 3: Prepare answers (from user input)
      final answers = <Map<String, dynamic>>[];
      
      for (var question in examContent['questions']) {
        String answer = '';
        
        if (question['type'] == 'multiple-choice') {
          // User selected option 'b'
          answer = 'b';
        } else if (question['type'] == 'true-false') {
          // User selected true
          answer = 'true';
        } else if (question['type'] == 'essay') {
          // User wrote essay answer
          answer = 'This is my essay answer...';
        }
        
        answers.add({
          'questionID': question['questionID'],
          'answerBody': answer,
        });
      }
      
      // Step 4: Submit exam
      final result = await examService.submitExam(examId, answers);
      
      print('Score: ${result['finalScore']}%');
      print('Passed: ${result['passed']}');
      print('Total: ${result['score']}/${result['totalScore']}');
      
      // Show detailed results
      for (var detail in result['detailedResults']) {
        print('Question ${detail['questionID']}:');
        print('  Your Answer: ${detail['yourAnswer']}');
        print('  Correct Answer: ${detail['correctAnswer']}');
        print('  Is Correct: ${detail['isCorrect']}');
        print('  Points: ${detail['earnedPoints']}/${detail['points']}');
      }
    }
  } catch (e) {
    print('Error: $e');
  }
}
```

### React Native Example

```javascript
import axios from 'axios';

const API_BASE_URL = 'https://yourdomain.com/api/mobile/student';

class ExamService {
  constructor(token) {
    this.token = token;
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  // 1. Get all exams for a course
  async getExamsByCourse(courseId) {
    try {
      const response = await this.api.get(`/exams/course/${courseId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching exams:', error);
      throw error;
    }
  }

  // 2. Get exam content with questions
  async getExamContent(examId) {
    try {
      const response = await this.api.get(`/exams/${examId}`);
      return response.data.data.exam;
    } catch (error) {
      console.error('Error fetching exam content:', error);
      throw error;
    }
  }

  // 3. Submit exam answers
  async submitExam(examId, answers) {
    try {
      const response = await this.api.post(`/exams/${examId}/submit`, {
        answers,
      });
      return response.data.data;
    } catch (error) {
      console.error('Error submitting exam:', error);
      throw error;
    }
  }

  // 4. Get exam result
  async getExamResult(examId) {
    try {
      const response = await this.api.get(`/exams/${examId}/result`);
      return response.data.data.result;
    } catch (error) {
      console.error('Error fetching exam result:', error);
      throw error;
    }
  }
}

// Usage Example
const takeExam = async () => {
  const examService = new ExamService('your-auth-token');
  
  try {
    // Step 1: Get all exams for a course
    const exams = await examService.getExamsByCourse('course-uuid');
    console.log('Found', exams.length, 'exams');
    
    if (exams.length > 0) {
      const examId = exams[0].examID;
      
      // Step 2: Get exam content
      const examContent = await examService.getExamContent(examId);
      console.log('Exam:', examContent.title);
      console.log('Questions:', examContent.questionsCount);
      
      // Step 3: Prepare answers (from user input)
      const answers = examContent.questions.map((question) => {
        let answer = '';
        
        if (question.type === 'multiple-choice') {
          // User selected option 'b'
          answer = 'b';
        } else if (question.type === 'true-false') {
          // User selected true
          answer = 'true';
        } else if (question.type === 'essay') {
          // User wrote essay answer
          answer = 'This is my essay answer...';
        }
        
        return {
          questionID: question.questionID,
          answerBody: answer,
        };
      });
      
      // Step 4: Submit exam
      const result = await examService.submitExam(examId, answers);
      
      console.log('Score:', result.finalScore + '%');
      console.log('Passed:', result.passed);
      console.log('Total:', result.score + '/' + result.totalScore);
      
      // Show detailed results
      result.detailedResults.forEach((detail) => {
        console.log('Question', detail.questionID + ':');
        console.log('  Your Answer:', detail.yourAnswer);
        console.log('  Correct Answer:', detail.correctAnswer);
        console.log('  Is Correct:', detail.isCorrect);
        console.log('  Points:', detail.earnedPoints + '/' + detail.points);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

export default ExamService;
```

---

## ⚠️ ملاحظات مهمة / Important Notes

1. **المصادقة / Authentication:** جميع الـ endpoints تتطلب `Authorization: Bearer {token}`

2. **الصلاحيات / Permissions:** يجب أن يكون الطالب قد اشترى الدورة (payment status = COMPLETED)

3. **أنواع الأسئلة / Question Types:**
   - `multiple-choice`: الإجابة تكون حرف (a, b, c, d)
   - `true-false`: الإجابة تكون `true` أو `false`
   - `essay`: الإجابة تكون نص طويل

4. **ترتيب الأسئلة / Question Order:** الأسئلة مرتبة حسب `order` field

5. **الإجابات الصحيحة / Correct Answers:** لا يتم إرجاع الإجابات الصحيحة إلا بعد إرسال الامتحان

6. **إرسال الامتحان مرة واحدة / One Submission:** لا يمكن إرسال الامتحان أكثر من مرة

---

## 🔗 Base URL

```
https://yourdomain.com/api/mobile/student
```

استبدل `yourdomain.com` بـ domain الخاص بك.

Replace `yourdomain.com` with your actual domain.

