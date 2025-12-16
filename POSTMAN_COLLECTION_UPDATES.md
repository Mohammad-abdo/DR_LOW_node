# Postman Collection Updates - Gender Field

## ✅ التحديثات المطبقة:

### 1. **Register Student** - تم التحديث
- ✅ إضافة حقل `gender` (اختياري: MALE أو FEMALE)
- ✅ تحديث بيانات الاختبار مع gender: MALE
- ✅ إضافة مثال إضافي: "Register Student (Female Example)" مع gender: FEMALE
- ✅ إضافة مثال إضافي: "Register Student (No Gender)" بدون gender

### 2. **Update Profile** - تم التحديث
- ✅ إضافة حقل `gender` في form-data
- ✅ إضافة جميع الحقول المسموح بها:
  - `nameAr` - الاسم بالعربية
  - `nameEn` - الاسم بالإنجليزية
  - `phone` - رقم الهاتف
  - `year` - السنة الدراسية
  - `semester` - الفصل الدراسي
  - `department` - القسم
  - `gender` - الجنس (MALE أو FEMALE)
  - `avatar` - صورة الملف الشخصي (file upload)
- ✅ بيانات اختبار جاهزة للاستخدام مع gender: MALE
- ✅ إضافة مثال إضافي: "Update Profile (Female Example)" مع gender: FEMALE

### 3. **Get Profile** - تم التحديث
- ✅ إضافة وصف يوضح أن gender متضمن في الاستجابة

### 4. **Get Current User** - تم التحديث
- ✅ إضافة وصف يوضح أن gender متضمن في الاستجابة

### 5. **Change Password** - تم التحديث
- ✅ تحديث بيانات الاختبار لتكون أكثر واقعية

## 📝 أمثلة بيانات الاختبار:

### Register Student - Male
```json
{
  "nameAr": "محمد أحمد",
  "nameEn": "Mohamed Ahmed",
  "email": "student.male@example.com",
  "phone": "+96512345678",
  "password": "password123",
  "repeatPassword": "password123",
  "gender": "MALE",
  "year": 3,
  "semester": 1,
  "department": "Law"
}
```

### Register Student - Female
```json
{
  "nameAr": "نورا سعيد",
  "nameEn": "Nora Saeed",
  "email": "student.female@example.com",
  "phone": "+96512345679",
  "password": "password123",
  "repeatPassword": "password123",
  "gender": "FEMALE",
  "year": 2,
  "semester": 2,
  "department": "Law"
}
```

### Register Student - Without Gender (Optional)
```json
{
  "nameAr": "علي خالد",
  "nameEn": "Ali Khalid",
  "email": "student.nogender@example.com",
  "phone": "+96512345680",
  "password": "password123",
  "repeatPassword": "password123",
  "year": 4,
  "semester": 1,
  "department": "Law"
}
```

### Update Profile - Form Data
```
nameAr: محمد أحمد
nameEn: Mohamed Ahmed
phone: +96512345678
year: 3
semester: 1
department: Law
gender: MALE
avatar: [file upload - optional]
```

## 🔒 Security Notes:

- **Whitelist Approach**: فقط الحقول المسموح بها يمكن تحديثها
- **Protected Fields**: الحقول التالية محظورة من التحديث:
  - `id`, `email`, `password`, `role`, `status`, `refreshToken`
- **JWT Authentication**: المستخدم يمكنه تحديث ملفه فقط

## 🧪 Testing:

1. **Register Student with Gender**:
   - استخدم "Register Student" مع `gender: "MALE"` أو `"FEMALE"`
   - يجب أن يعمل بنجاح

2. **Update Profile with Gender**:
   - سجّل الدخول كطالب
   - استخدم "Update Profile" وأضف `gender` في form-data
   - يجب أن يتم التحديث بنجاح

3. **Get Profile**:
   - بعد التحديث، استخدم "Get Profile"
   - يجب أن ترى `gender` في الاستجابة

## 📋 ملاحظات:

- حقل `gender` اختياري في التسجيل
- يمكن تحديث `gender` من Update Profile
- القيم المقبولة: `MALE`, `FEMALE`, أو `null`

