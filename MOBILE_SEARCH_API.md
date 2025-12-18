# دليل API البحث للموبايل
# Mobile Search API Guide

## 🔍 Endpoint: البحث في الكورسات والكتيجوريات
## 🔍 Endpoint: Search Courses and Categories

### الطلب / Request
```
GET /api/mobile/student/search
```

### Headers
```
Authorization: Bearer {token}
```

### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `q` | string | نص البحث (في عنوان الكورس، الوصف، اسم المدرس، اسم الكتيجوري) | `"قانون"` |
| `categoryId` | string | فلترة حسب ID الكتيجوري | `"category-uuid"` |
| `categoryName` | string | البحث في أسماء الكتيجوريات | `"القانون المدني"` |
| `level` | string | فلترة حسب المستوى (BEGINNER, INTERMEDIATE, ADVANCED) | `"ADVANCED"` |
| `isBasic` | boolean | فلترة حسب الكورسات الأساسية | `true` |
| `isFeatured` | boolean | فلترة حسب الكورسات المميزة | `true` |
| `minPrice` | number | الحد الأدنى للسعر | `50` |
| `maxPrice` | number | الحد الأقصى للسعر | `200` |
| `minRating` | number | الحد الأدنى للتقييم (0-5) | `4` |
| `sortBy` | string | ترتيب النتائج (popular, newest, price_asc, price_desc, rating) | `"popular"` |
| `page` | number | رقم الصفحة (افتراضي: 1) | `1` |
| `limit` | number | عدد النتائج في الصفحة (افتراضي: 10) | `10` |

### Response Example

```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": "course-uuid",
        "titleAr": "دورة القانون المدني",
        "titleEn": "Civil Law Course",
        "descriptionAr": "دورة شاملة في القانون المدني",
        "descriptionEn": "Comprehensive course in civil law",
        "price": "100",
        "discount": "20",
        "finalPrice": "80",
        "coverImage": "https://yourdomain.com/uploads/images/cover.jpg",
        "level": "ADVANCED",
        "isBasic": false,
        "isFeatured": true,
        "targetYear": 3,
        "teacher": {
          "id": "teacher-uuid",
          "nameAr": "د. أحمد محمد",
          "nameEn": "Dr. Ahmed Mohamed",
          "avatar": "https://yourdomain.com/uploads/avatars/avatar.jpg"
        },
        "category": {
          "id": "category-uuid",
          "nameAr": "القانون المدني",
          "nameEn": "Civil Law",
          "image": "https://yourdomain.com/uploads/images/category.jpg"
        },
        "isPurchased": false,
        "averageRating": 4.5,
        "ratingCount": 25,
        "_count": {
          "purchases": 150,
          "ratings": 25,
          "content": 20
        }
      }
    ],
    "categories": [
      {
        "id": "category-uuid",
        "nameAr": "القانون المدني",
        "nameEn": "Civil Law",
        "image": "https://yourdomain.com/uploads/images/category.jpg",
        "isBasic": true,
        "_count": {
          "courses": {
            "status": "PUBLISHED"
          }
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalAll": 50,
      "pages": 1
    },
    "filters": {
      "applied": {
        "q": "قانون",
        "categoryId": null,
        "categoryName": null,
        "level": "ADVANCED",
        "isBasic": null,
        "isFeatured": true,
        "minPrice": null,
        "maxPrice": null,
        "minRating": null,
        "sortBy": "popular"
      }
    }
  }
}
```

---

## 📋 أمثلة الاستخدام / Usage Examples

### 1. البحث البسيط
### 1. Simple Search

```
GET /api/mobile/student/search?q=قانون
```

يبحث في:
- عنوان الكورس (عربي/إنجليزي)
- وصف الكورس (عربي/إنجليزي)
- اسم المدرس (عربي/إنجليزي)
- اسم الكتيجوري (عربي/إنجليزي)

---

### 2. البحث مع فلترة حسب الكتيجوري
### 2. Search with Category Filter

```
GET /api/mobile/student/search?q=قانون&categoryId=category-uuid
```

أو البحث في اسم الكتيجوري:
```
GET /api/mobile/student/search?categoryName=القانون المدني
```

---

### 3. البحث مع فلترة حسب النوع
### 3. Search with Type Filter

**الكورسات الأساسية:**
```
GET /api/mobile/student/search?isBasic=true
```

**الكورسات المميزة:**
```
GET /api/mobile/student/search?isFeatured=true
```

**حسب المستوى:**
```
GET /api/mobile/student/search?level=ADVANCED
```

---

### 4. البحث مع فلترة حسب السعر
### 4. Search with Price Filter

```
GET /api/mobile/student/search?minPrice=50&maxPrice=200
```

---

### 5. البحث مع فلترة حسب التقييم
### 5. Search with Rating Filter

```
GET /api/mobile/student/search?minRating=4
```

---

### 6. ترتيب النتائج
### 6. Sort Results

**الأكثر شعبية:**
```
GET /api/mobile/student/search?sortBy=popular
```

**الأحدث:**
```
GET /api/mobile/student/search?sortBy=newest
```

**السعر من الأقل للأعلى:**
```
GET /api/mobile/student/search?sortBy=price_asc
```

**السعر من الأعلى للأقل:**
```
GET /api/mobile/student/search?sortBy=price_desc
```

**الأعلى تقييماً:**
```
GET /api/mobile/student/search?sortBy=rating
```

---

### 7. بحث متقدم (جميع الفلاتر)
### 7. Advanced Search (All Filters)

```
GET /api/mobile/student/search?q=قانون&categoryId=category-uuid&level=ADVANCED&isFeatured=true&minPrice=50&maxPrice=200&minRating=4&sortBy=popular&page=1&limit=10
```

---

## 💻 أمثلة الكود / Code Examples

### Flutter/Dart Example

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class SearchService {
  final String baseUrl = 'https://yourdomain.com/api/mobile/student';
  final String token;

  SearchService(this.token);

  Future<Map<String, dynamic>> searchCourses({
    String? query,
    String? categoryId,
    String? categoryName,
    String? level,
    bool? isBasic,
    bool? isFeatured,
    double? minPrice,
    double? maxPrice,
    double? minRating,
    String sortBy = 'newest',
    int page = 1,
    int limit = 10,
  }) async {
    // Build query parameters
    final queryParams = <String, String>{};
    
    if (query != null && query.isNotEmpty) {
      queryParams['q'] = query;
    }
    if (categoryId != null) queryParams['categoryId'] = categoryId;
    if (categoryName != null) queryParams['categoryName'] = categoryName;
    if (level != null) queryParams['level'] = level;
    if (isBasic != null) queryParams['isBasic'] = isBasic.toString();
    if (isFeatured != null) queryParams['isFeatured'] = isFeatured.toString();
    if (minPrice != null) queryParams['minPrice'] = minPrice.toString();
    if (maxPrice != null) queryParams['maxPrice'] = maxPrice.toString();
    if (minRating != null) queryParams['minRating'] = minRating.toString();
    
    queryParams['sortBy'] = sortBy;
    queryParams['page'] = page.toString();
    queryParams['limit'] = limit.toString();

    final uri = Uri.parse('$baseUrl/search').replace(queryParameters: queryParams);
    
    final response = await http.get(
      uri,
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to search courses: ${response.statusCode}');
    }
  }
}

// Usage
void main() async {
  final searchService = SearchService('your-auth-token');
  
  try {
    // Simple search
    final result1 = await searchService.searchCourses(query: 'قانون');
    print('Found ${result1['data']['courses'].length} courses');
    
    // Advanced search
    final result2 = await searchService.searchCourses(
      query: 'قانون',
      categoryId: 'category-uuid',
      level: 'ADVANCED',
      isFeatured: true,
      minPrice: 50,
      maxPrice: 200,
      minRating: 4,
      sortBy: 'popular',
    );
    
    print('Total: ${result2['data']['pagination']['total']}');
    print('Pages: ${result2['data']['pagination']['pages']}');
    
    // Get categories
    final categories = result2['data']['categories'];
    print('Categories: ${categories.length}');
  } catch (e) {
    print('Error: $e');
  }
}
```

### React Native Example

```javascript
import axios from 'axios';

const API_BASE_URL = 'https://yourdomain.com/api/mobile/student';

class SearchService {
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

  async searchCourses({
    q,
    categoryId,
    categoryName,
    level,
    isBasic,
    isFeatured,
    minPrice,
    maxPrice,
    minRating,
    sortBy = 'newest',
    page = 1,
    limit = 10,
  }) {
    try {
      const params = {};
      
      if (q) params.q = q;
      if (categoryId) params.categoryId = categoryId;
      if (categoryName) params.categoryName = categoryName;
      if (level) params.level = level;
      if (isBasic !== undefined) params.isBasic = isBasic;
      if (isFeatured !== undefined) params.isFeatured = isFeatured;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (minRating) params.minRating = minRating;
      
      params.sortBy = sortBy;
      params.page = page;
      params.limit = limit;

      const response = await this.api.get('/search', { params });
      return response.data;
    } catch (error) {
      console.error('Error searching courses:', error);
      throw error;
    }
  }
}

// Usage
const searchCourses = async () => {
  const searchService = new SearchService('your-auth-token');
  
  try {
    // Simple search
    const result1 = await searchService.searchCourses({ q: 'قانون' });
    console.log('Found', result1.data.courses.length, 'courses');
    
    // Advanced search
    const result2 = await searchService.searchCourses({
      q: 'قانون',
      categoryId: 'category-uuid',
      level: 'ADVANCED',
      isFeatured: true,
      minPrice: 50,
      maxPrice: 200,
      minRating: 4,
      sortBy: 'popular',
    });
    
    console.log('Total:', result2.data.pagination.total);
    console.log('Pages:', result2.data.pagination.pages);
    
    // Get categories
    const categories = result2.data.categories;
    console.log('Categories:', categories.length);
  } catch (error) {
    console.error('Error:', error);
  }
};

export default SearchService;
```

---

## 📊 Response Fields Explanation

### Course Object
- `id`: معرف الكورس
- `titleAr`, `titleEn`: عنوان الكورس
- `descriptionAr`, `descriptionEn`: وصف الكورس
- `price`: السعر الأصلي
- `discount`: الخصم
- `finalPrice`: السعر النهائي
- `coverImage`: صورة الغلاف (URL كامل)
- `level`: المستوى (BEGINNER, INTERMEDIATE, ADVANCED)
- `isBasic`: هل الكورس أساسي
- `isFeatured`: هل الكورس مميز
- `targetYear`: السنة المستهدفة
- `teacher`: معلومات المدرس
- `category`: معلومات الكتيجوري
- `isPurchased`: هل تم شراء الكورس
- `averageRating`: متوسط التقييم (0-5)
- `ratingCount`: عدد التقييمات
- `_count`: إحصائيات (purchases, ratings, content)

### Category Object
- `id`: معرف الكتيجوري
- `nameAr`, `nameEn`: اسم الكتيجوري
- `image`: صورة الكتيجوري (URL كامل)
- `isBasic`: هل الكتيجوري أساسي
- `_count.courses`: عدد الكورسات في هذا الكتيجوري

### Pagination Object
- `page`: الصفحة الحالية
- `limit`: عدد النتائج في الصفحة
- `total`: إجمالي النتائج بعد تطبيق الفلاتر
- `totalAll`: إجمالي النتائج قبل تطبيق الفلاتر
- `pages`: عدد الصفحات

---

## ⚠️ ملاحظات مهمة / Important Notes

1. **المصادقة / Authentication:** الـ endpoint يتطلب `Authorization: Bearer {token}`

2. **البحث / Search:** البحث غير حساس لحالة الأحرف (case-insensitive)

3. **الفلترة / Filtering:** يمكن استخدام عدة فلاتر معاً

4. **الترتيب / Sorting:** 
   - `popular`: حسب عدد المشتريات
   - `newest`: حسب تاريخ الإنشاء
   - `price_asc`: السعر من الأقل للأعلى
   - `price_desc`: السعر من الأعلى للأقل
   - `rating`: حسب متوسط التقييم

5. **النتائج / Results:** النتائج تشمل:
   - الكورسات المطابقة للبحث
   - جميع الكتيجوريات (للعرض في الفلاتر)
   - معلومات الـ pagination
   - الفلاتر المطبقة

---

## 🔗 Base URL

```
https://yourdomain.com/api/mobile/student
```

استبدل `yourdomain.com` بـ domain الخاص بك.

Replace `yourdomain.com` with your actual domain.











