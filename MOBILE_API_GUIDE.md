# دليل API للموبايل - الفيديوهات والامتحانات
# Mobile API Guide - Videos and Exams

## 📹 Endpoint 1: عرض محتوى الدورة (الفيديوهات والمحتوى)
## 📹 Endpoint 1: Get Course Content (Videos and Content)

### الطلب / Request
```
GET /api/mobile/student/courses/:courseId/content
```

### Headers
```
Authorization: Bearer {token}
```

### Response Structure
```json
{
  "success": true,
  "data": {
    "course": {
      "id": "course-uuid",
      "titleAr": "عنوان الدورة",
      "titleEn": "Course Title",
      "teacher": {
        "nameAr": "اسم المدرس",
        "nameEn": "Teacher Name"
      }
    },
    "content": [
      {
        "id": "content-uuid",
        "type": "VIDEO",
        "titleAr": "عنوان الفيديو",
        "titleEn": "Video Title",
        "descriptionAr": "وصف الفيديو",
        "descriptionEn": "Video Description",
        "videoUrl": "https://192.168.1.19:5005/uploads/videos/video.mp4",
        "duration": 15,
        "order": 0,
        "isFree": false,
        "isIntroVideo": true,
        "isAccessible": true,
        "studentProgress": {
          "watched": true,
          "watchedAt": "2025-01-10T10:00:00.000Z",
          "progress": 100
        },
        "quiz": null
      },
      {
        "id": "content-uuid-2",
        "type": "FILE",
        "titleAr": "ملف PDF",
        "titleEn": "PDF File",
        "fileUrl": "https://192.168.1.19:5005/uploads/files/file.pdf",
        "order": 1,
        "isFree": false,
        "isAccessible": true,
        "studentProgress": {
          "watched": false,
          "watchedAt": null,
          "progress": 0
        }
      }
    ],
    "chapters": [
      {
        "id": "chapter-uuid",
        "titleAr": "الفصل الأول",
        "titleEn": "Chapter 1",
        "order": 1,
        "content": [
          {
            "id": "content-uuid-3",
            "type": "VIDEO",
            "titleAr": "فيديو الفصل",
            "titleEn": "Chapter Video",
            "videoUrl": "https://192.168.1.19:5005/uploads/videos/chapter-video.mp4",
            "duration": 20,
            "order": 100,
            "isFree": true,
            "isAccessible": true,
            "studentProgress": {
              "watched": true,
              "watchedAt": "2025-01-10T11:00:00.000Z",
              "progress": 100
            }
          }
        ]
      }
    ],
    "exams": [
      {
        "id": "exam-uuid",
        "titleAr": "امتحان نهائي",
        "titleEn": "Final Exam",
        "descriptionAr": "وصف الامتحان",
        "descriptionEn": "Exam Description",
        "duration": 60,
        "passingScore": 60,
        "examTypes": ["multiple-choice", "true-false"],
        "questionsCount": 10,
        "result": null
      }
    ]
  }
}
```

### Flutter/Dart Example
```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class CourseContentService {
  final String baseUrl = 'https://192.168.1.19:5005/api/mobile/student';
  final String token;

  CourseContentService(this.token);

  Future<Map<String, dynamic>> getCourseContent(String courseId) async {
    final url = Uri.parse('$baseUrl/courses/$courseId/content');
    
    final response = await http.get(
      url,
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return data;
    } else {
      throw Exception('Failed to load course content: ${response.statusCode}');
    }
  }
}

// Usage
void main() async {
  final service = CourseContentService('your-auth-token');
  
  try {
    final content = await service.getCourseContent('course-uuid');
    
    // Access videos
    final videos = content['data']['content']
        .where((item) => item['type'] == 'VIDEO')
        .toList();
    
    // Access chapters
    final chapters = content['data']['chapters'];
    
    // Access exams
    final exams = content['data']['exams'];
    
    print('Videos: ${videos.length}');
    print('Chapters: ${chapters.length}');
    print('Exams: ${exams.length}');
  } catch (e) {
    print('Error: $e');
  }
}
```

### React Native Example
```javascript
import axios from 'axios';

const API_BASE_URL = 'https://192.168.1.19:5005/api/mobile/student';

export const getCourseContent = async (courseId, token) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/courses/${courseId}/content`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching course content:', error);
    throw error;
  }
};

// Usage
const loadCourseContent = async () => {
  try {
    const data = await getCourseContent('course-uuid', 'your-token');
    
    // Get all videos
    const videos = data.data.content.filter(item => item.type === 'VIDEO');
    
    // Get chapters
    const chapters = data.data.chapters;
    
    // Get exams
    const exams = data.data.exams;
    
    console.log('Videos:', videos.length);
    console.log('Chapters:', chapters.length);
    console.log('Exams:', exams.length);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## 📝 Endpoint 2: عرض الامتحانات والإجابة عليها
## 📝 Endpoint 2: Get Exams and Submit Answers

### 2.1: جلب جميع امتحانات دورة معينة
### 2.1: Get All Exams for a Course

#### الطلب / Request
```
GET /api/mobile/student/exams/course/:courseID
```

#### Response
```json
{
  "success": true,
  "data": [
    {
      "examID": "exam-uuid",
      "title": "Final Exam",
      "titleAr": "امتحان نهائي",
      "titleEn": "Final Exam",
      "description": "Comprehensive exam",
      "descriptionAr": "امتحان شامل",
      "descriptionEn": "Comprehensive exam",
      "types": ["multiple-choice", "true-false", "essay"],
      "questionsCount": 15,
      "duration": 60,
      "passingScore": 60,
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2025-12-31T23:59:59.000Z",
      "result": null
    }
  ]
}
```

---

### 2.2: جلب محتوى امتحان معين (الأسئلة)
### 2.2: Get Exam Details (Questions)

#### الطلب / Request
```
GET /api/mobile/student/exams/:id
```

#### Response
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
      "questionsCount": 15,
      "duration": 60,
      "passingScore": 60,
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2025-12-31T23:59:59.000Z",
      "course": {
        "id": "course-uuid",
        "titleAr": "عنوان الدورة",
        "titleEn": "Course Title"
      },
      "questions": [
        {
          "questionID": "question-uuid-1",
          "type": "multiple-choice",
          "questionAr": "ما هو تعريف القانون؟",
          "questionEn": "What is the definition of law?",
          "options": {
            "a": {
              "ar": "مجموعة القواعد",
              "en": "Set of rules"
            },
            "b": {
              "ar": "نظام الحكم",
              "en": "System of governance"
            },
            "c": {
              "ar": "القوانين المدنية",
              "en": "Civil laws"
            },
            "d": {
              "ar": "جميع ما سبق",
              "en": "All of the above"
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

---

### 2.3: إرسال إجابات الامتحان
### 2.3: Submit Exam Answers

#### الطلب / Request
```
POST /api/mobile/student/exams/:examId/submit
```

#### Request Body
```json
{
  "answers": [
    {
      "questionID": "question-uuid-1",
      "answerBody": "a"
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

#### Response
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
        "yourAnswer": "a",
        "correctAnswer": "a",
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

---

### Flutter/Dart Complete Example
```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class ExamService {
  final String baseUrl = 'https://192.168.1.19:5005/api/mobile/student';
  final String token;

  ExamService(this.token);

  // Get all exams for a course
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

  // Get exam details with questions
  Future<Map<String, dynamic>> getExamDetails(String examId) async {
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
      throw Exception('Failed to load exam details: ${response.statusCode}');
    }
  }

  // Submit exam answers
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
      
      // Step 2: Get exam details with questions
      final examDetails = await examService.getExamDetails(examId);
      print('Exam: ${examDetails['title']}');
      print('Questions: ${examDetails['questionsCount']}');
      
      // Step 3: Prepare answers
      final answers = <Map<String, dynamic>>[];
      
      for (var question in examDetails['questions']) {
        String answer = '';
        
        if (question['type'] == 'multiple-choice') {
          // User selected option 'a'
          answer = 'a';
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
      print('Total Score: ${result['score']}/${result['totalScore']}');
      
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

### React Native Complete Example
```javascript
import axios from 'axios';

const API_BASE_URL = 'https://192.168.1.19:5005/api/mobile/student';

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

  // Get all exams for a course
  async getExamsByCourse(courseId) {
    try {
      const response = await this.api.get(`/exams/course/${courseId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching exams:', error);
      throw error;
    }
  }

  // Get exam details with questions
  async getExamDetails(examId) {
    try {
      const response = await this.api.get(`/exams/${examId}`);
      return response.data.data.exam;
    } catch (error) {
      console.error('Error fetching exam details:', error);
      throw error;
    }
  }

  // Submit exam answers
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
      
      // Step 2: Get exam details with questions
      const examDetails = await examService.getExamDetails(examId);
      console.log('Exam:', examDetails.title);
      console.log('Questions:', examDetails.questionsCount);
      
      // Step 3: Prepare answers (from user input)
      const answers = examDetails.questions.map((question) => {
        let answer = '';
        
        if (question.type === 'multiple-choice') {
          // User selected option 'a'
          answer = 'a';
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
      console.log('Total Score:', result.score + '/' + result.totalScore);
      
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

## 📋 ملخص الـ Endpoints
## 📋 Endpoints Summary

### الفيديوهات / Videos
- **GET** `/api/mobile/student/courses/:courseId/content` - جلب محتوى الدورة (فيديوهات، ملفات، فصول)

### الامتحانات / Exams
- **GET** `/api/mobile/student/exams/course/:courseID` - جلب جميع امتحانات دورة معينة
- **GET** `/api/mobile/student/exams/:id` - جلب تفاصيل امتحان مع الأسئلة
- **POST** `/api/mobile/student/exams/:examId/submit` - إرسال إجابات الامتحان

---

## ⚠️ ملاحظات مهمة
## ⚠️ Important Notes

1. **المصادقة / Authentication**: جميع الـ endpoints تتطلب `Authorization: Bearer {token}` في الـ headers
2. **الصلاحيات / Permissions**: يجب أن يكون الطالب قد اشترى الدورة (payment status = COMPLETED)
3. **أنواع الأسئلة / Question Types**:
   - `multiple-choice`: الإجابة تكون حرف (a, b, c, d) أو رقم الفهرس
   - `true-false`: الإجابة تكون `true` أو `false`
   - `essay`: الإجابة تكون نص طويل
4. **النتائج / Results**: بعد إرسال الامتحان، يمكنك الحصول على النتائج التفصيلية مباشرة من الـ response
5. **URLs الكاملة / Full URLs**: جميع روابط الفيديوهات والملفات تكون URLs كاملة (full URLs)

---

## 🔗 Base URL
```
https://192.168.1.19:5005/api/mobile/student
```

استبدل `192.168.1.19:5005` بـ domain الخاص بك.

Replace `192.168.1.19:5005` with your actual domain.

