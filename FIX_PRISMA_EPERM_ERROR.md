# حل مشكلة EPERM في Prisma Generate

## المشكلة:
```
EPERM: operation not permitted, rename 'D:\DR.Low\Backend\node_modules\.prisma\client\query_engine-windows.dll.node.tmp...'
```

## الحلول:

### الحل 1: إيقاف جميع عمليات Node.js ثم تشغيل Prisma

#### في PowerShell:
```powershell
# إيقاف جميع عمليات Node.js
taskkill /F /IM node.exe

# الانتقال إلى مجلد Backend
cd Backend

# تشغيل Prisma Generate (استخدم cmd بدلاً من PowerShell)
```

#### في CMD (Command Prompt):
```cmd
cd D:\DR.Low\Backend
npx prisma generate
npx prisma migrate dev --name add_isBasic_to_category
```

### الحل 2: تغيير PowerShell Execution Policy (مؤقت)

#### في PowerShell (كمسؤول):
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

ثم:
```powershell
cd Backend
npx prisma generate
npx prisma migrate dev --name add_isBasic_to_category
```

### الحل 3: استخدام npm scripts مباشرة في CMD

#### في CMD:
```cmd
cd D:\DR.Low\Backend
npm run prisma:generate
npm run prisma:migrate -- --name add_isBasic_to_category
```

### الحل 4: استخدام Prisma CLI مباشرة

#### في CMD:
```cmd
cd D:\DR.Low\Backend
node_modules\.bin\prisma.cmd generate
node_modules\.bin\prisma.cmd migrate dev --name add_isBasic_to_category
```

## الخطوات الموصى بها:

1. **إيقاف جميع عمليات Node.js:**
   ```cmd
   taskkill /F /IM node.exe
   ```

2. **فتح CMD (Command Prompt) بدلاً من PowerShell**

3. **الانتقال إلى مجلد Backend:**
   ```cmd
   cd D:\DR.Low\Backend
   ```

4. **تشغيل Prisma Generate:**
   ```cmd
   npx prisma generate
   ```

5. **تشغيل Migration (إذا لزم الأمر):**
   ```cmd
   npx prisma migrate dev --name add_isBasic_to_category
   ```

6. **تشغيل Seed:**
   ```cmd
   npm run prisma:seed
   ```

7. **إعادة تشغيل الـ Server:**
   ```cmd
   npm run dev
   ```

## ملاحظات:

- **EPERM Error** يحدث عادة عندما يكون هناك عملية Node.js (مثل الـ server) تعمل وتستخدم ملف Prisma Client
- **PowerShell Execution Policy** قد يمنع تشغيل npm/npx في بعض الحالات
- **CMD (Command Prompt)** عادة ما يعمل بدون مشاكل
- تأكد من إيقاف جميع عمليات Node.js قبل تشغيل `prisma generate`

## التحقق من النجاح:

بعد تشغيل `prisma generate` بنجاح، يجب أن ترى:
```
✔ Generated Prisma Client (x.xx.x | xxx) in xxxms
```

## إذا استمرت المشكلة:

1. أغلق جميع نوافذ Terminal/CMD/PowerShell
2. أغلق VS Code أو أي IDE آخر
3. افتح CMD جديد كمسؤول
4. اتبع الخطوات المذكورة أعلاه



















