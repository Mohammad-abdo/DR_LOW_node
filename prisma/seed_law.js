import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Starting Law Courses Database Seeding...");

    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await prisma.quizAnswer.deleteMany();
    await prisma.quizResult.deleteMany();
    await prisma.quizQuestion.deleteMany();
    await prisma.quiz.deleteMany();
    await prisma.examAnswer.deleteMany();
    await prisma.examResult.deleteMany();
    await prisma.examQuestion.deleteMany();
    await prisma.exam.deleteMany();
    await prisma.progress.deleteMany();
    await prisma.teacherRating.deleteMany();
    await prisma.rating.deleteMany();
    await prisma.wishlistItem.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.purchase.deleteMany();
    await prisma.courseContent.deleteMany();
    await prisma.chapter.deleteMany();
    await prisma.course.deleteMany();
    await prisma.notificationRecipient.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.banner.deleteMany();
    await prisma.category.deleteMany();
    
    // Keep admin and create law-specific users
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const admin = await prisma.user.upsert({
        where: { email: "admin@lms.edu.kw" },
        update: {
            gender: "MALE",
        },
        create: {
            nameAr: "مدير النظام",
            nameEn: "System Admin",
            email: "admin@lms.edu.kw",
            phone: "+96512345678",
            password: hashedPassword,
            role: "ADMIN",
            status: "ACTIVE",
            department: "Administration",
            gender: "MALE",
        },
    });
    console.log("✅ Admin created:", admin.email);

    // Create Law Categories
    const categories = [
        {
            nameAr: "القانون الدستوري",
            nameEn: "Constitutional Law",
            descriptionAr: "دورات في القانون الدستوري والنظم السياسية",
            descriptionEn: "Courses in constitutional law and political systems",
        },
        {
            nameAr: "القانون المدني",
            nameEn: "Civil Law",
            descriptionAr: "دورات في القانون المدني والعقود",
            descriptionEn: "Courses in civil law and contracts",
        },
        {
            nameAr: "القانون الجنائي",
            nameEn: "Criminal Law",
            descriptionAr: "دورات في القانون الجنائي والإجراءات الجزائية",
            descriptionEn: "Courses in criminal law and criminal procedures",
        },
        {
            nameAr: "القانون التجاري",
            nameEn: "Commercial Law",
            descriptionAr: "دورات في القانون التجاري والشركات",
            descriptionEn: "Courses in commercial law and companies",
        },
        {
            nameAr: "القانون الإداري",
            nameEn: "Administrative Law",
            descriptionAr: "دورات في القانون الإداري والوظيفة العامة",
            descriptionEn: "Courses in administrative law and public service",
        },
    ];

    const createdCategories = [];
    for (const category of categories) {
        const created = await prisma.category.create({
            data: category,
        });
        createdCategories.push(created);
        console.log(`✅ Category created: ${created.nameAr}`);
    }

    // Create Law Teachers
    const teachers = [
        {
            nameAr: "د. أحمد مغاوري",
            nameEn: "Dr. Ahmed Maghawry",
            email: "ahmed.law@lms.edu.kw",
            phone: "+96522345679",
            department: "Law",
            gender: "MALE",
        },
        {
            nameAr: "د. سارة محمد",
            nameEn: "Dr. Sarah Mohamed",
            email: "sara.law@lms.edu.kw",
            phone: "+96522345680",
            department: "Law",
            gender: "FEMALE",
        },
        {
            nameAr: "م. علي حسن",
            nameEn: "M. Ali Hassan",
            email: "ali.law@lms.edu.kw",
            phone: "+96522345681",
            department: "Law",
            gender: "MALE",
        },
        {
            nameAr: "د. فاطمة العلي",
            nameEn: "Dr. Fatima Al-Ali",
            email: "fatima.law@lms.edu.kw",
            phone: "+96522345682",
            department: "Law",
            gender: "FEMALE",
        },
    ];

    const createdTeachers = [];
    const teacherPassword = await bcrypt.hash("teacher123", 10);
    for (const teacherData of teachers) {
        const teacher = await prisma.user.upsert({
            where: { email: teacherData.email },
            update: {
                gender: teacherData.gender,
            },
            create: {
                ...teacherData,
                password: teacherPassword,
                role: "TEACHER",
                status: "ACTIVE",
            },
        });
        createdTeachers.push(teacher);
        console.log(`✅ Teacher created: ${teacher.nameAr}`);
    }

    // Create Law Students
    const students = [
        {
            nameAr: "محمد أحمد",
            nameEn: "Mohamed Ahmed",
            email: "mohamed.student@lms.edu.kw",
            phone: "+96522345690",
            department: "Law",
            year: 3,
            semester: 1,
            gender: "MALE",
        },
        {
            nameAr: "نورا سعيد",
            nameEn: "Nora Saeed",
            email: "nora.student@lms.edu.kw",
            phone: "+96522345691",
            department: "Law",
            year: 2,
            semester: 2,
            gender: "FEMALE",
        },
        {
            nameAr: "علي خالد",
            nameEn: "Ali Khalid",
            email: "ali.student@lms.edu.kw",
            phone: "+96522345692",
            department: "Law",
            year: 4,
            semester: 1,
            gender: "MALE",
        },
    ];

    const createdStudents = [];
    const studentPassword = await bcrypt.hash("student123", 10);
    for (const studentData of students) {
        const student = await prisma.user.upsert({
            where: { email: studentData.email },
            update: {
                gender: studentData.gender,
            },
            create: {
                ...studentData,
                password: studentPassword,
                role: "STUDENT",
                status: "ACTIVE",
            },
        });
        createdStudents.push(student);
        console.log(`✅ Student created: ${student.nameAr}`);
    }

    // Create Law Courses with detailed structure
    const lawCourses = [
        {
            titleAr: "القانون الدستوري",
            titleEn: "Constitutional Law",
            descriptionAr: "دورة شاملة في القانون الدستوري والنظم السياسية والدستور",
            descriptionEn: "Comprehensive course in constitutional law, political systems, and constitution",
            teacherId: createdTeachers[0].id,
            categoryId: createdCategories[0].id,
            price: 123.0,
            discount: 0,
            level: "INTERMEDIATE",
            status: "PUBLISHED",
            chapters: [
                {
                    titleAr: "مقدمة في القانون الدستوري",
                    titleEn: "Introduction to Constitutional Law",
                    order: 1,
                    videos: [
                        { titleAr: "تعريف القانون الدستوري", titleEn: "Definition of Constitutional Law", duration: 45, order: 1 },
                        { titleAr: "مصادر القانون الدستوري", titleEn: "Sources of Constitutional Law", duration: 50, order: 2 },
                        { titleAr: "نشأة وتطور القانون الدستوري", titleEn: "Origin and Development", duration: 40, order: 3 },
                    ],
                    quizzes: [2], // Quiz after video 2
                },
                {
                    titleAr: "الدستور والنظام السياسي",
                    titleEn: "Constitution and Political System",
                    order: 2,
                    videos: [
                        { titleAr: "مفهوم الدستور", titleEn: "Concept of Constitution", duration: 35, order: 1 },
                        { titleAr: "أنواع الدساتير", titleEn: "Types of Constitutions", duration: 55, order: 2 },
                        { titleAr: "النظام السياسي", titleEn: "Political System", duration: 42, order: 3 },
                    ],
                    quizzes: [1, 3], // Quizzes after videos 1 and 3
                },
                {
                    titleAr: "السلطات في الدولة",
                    titleEn: "State Powers",
                    order: 3,
                    videos: [
                        { titleAr: "السلطة التشريعية", titleEn: "Legislative Power", duration: 48, order: 1 },
                        { titleAr: "السلطة التنفيذية", titleEn: "Executive Power", duration: 52, order: 2 },
                        { titleAr: "السلطة القضائية", titleEn: "Judicial Power", duration: 38, order: 3 },
                    ],
                    quizzes: [2],
                },
            ],
        },
        {
            titleAr: "القانون الجنائي",
            titleEn: "Criminal Law",
            descriptionAr: "دورة متخصصة في القانون الجنائي والجرائم والعقوبات",
            descriptionEn: "Specialized course in criminal law, crimes, and penalties",
            teacherId: createdTeachers[1].id,
            categoryId: createdCategories[2].id,
            price: 150.0,
            discount: 0,
            level: "ADVANCED",
            status: "PUBLISHED",
            chapters: [
                {
                    titleAr: "مقدمة في القانون الجنائي",
                    titleEn: "Introduction to Criminal Law",
                    order: 1,
                    videos: [
                        { titleAr: "تعريف القانون الجنائي", titleEn: "Definition of Criminal Law", duration: 40, order: 1 },
                        { titleAr: "مبادئ القانون الجنائي", titleEn: "Principles of Criminal Law", duration: 45, order: 2 },
                    ],
                    quizzes: [1],
                },
                {
                    titleAr: "الجرائم والعقوبات",
                    titleEn: "Crimes and Penalties",
                    order: 2,
                    videos: [
                        { titleAr: "أنواع الجرائم", titleEn: "Types of Crimes", duration: 50, order: 1 },
                        { titleAr: "العقوبات الجنائية", titleEn: "Criminal Penalties", duration: 55, order: 2 },
                        { titleAr: "ظروف التخفيف والتشديد", titleEn: "Mitigating and Aggravating Circumstances", duration: 43, order: 3 },
                    ],
                    quizzes: [2, 3],
                },
            ],
        },
        {
            titleAr: "القانون التجاري",
            titleEn: "Commercial Law",
            descriptionAr: "دورة في القانون التجاري والشركات والعقود التجارية",
            descriptionEn: "Course in commercial law, companies, and commercial contracts",
            teacherId: createdTeachers[2].id,
            categoryId: createdCategories[3].id,
            price: 99.0,
            discount: 0,
            level: "BEGINNER",
            status: "PUBLISHED",
            chapters: [
                {
                    titleAr: "مبادئ القانون التجاري",
                    titleEn: "Principles of Commercial Law",
                    order: 1,
                    videos: [
                        { titleAr: "تعريف القانون التجاري", titleEn: "Definition of Commercial Law", duration: 38, order: 1 },
                        { titleAr: "التاجر والصفة التجارية", titleEn: "Merchant and Commercial Status", duration: 42, order: 2 },
                    ],
                    quizzes: [1],
                },
                {
                    titleAr: "الشركات التجارية",
                    titleEn: "Commercial Companies",
                    order: 2,
                    videos: [
                        { titleAr: "أنواع الشركات", titleEn: "Types of Companies", duration: 48, order: 1 },
                        { titleAr: "تأسيس الشركات", titleEn: "Company Formation", duration: 50, order: 2 },
                    ],
                    quizzes: [2],
                },
            ],
        },
    ];

    const createdCourses = [];
    for (const courseData of lawCourses) {
        const finalPrice = courseData.price - (courseData.price * (courseData.discount || 0)) / 100;

        const course = await prisma.course.create({
            data: {
                titleAr: courseData.titleAr,
                titleEn: courseData.titleEn,
                descriptionAr: courseData.descriptionAr,
                descriptionEn: courseData.descriptionEn,
                teacherId: courseData.teacherId,
                categoryId: courseData.categoryId,
                price: courseData.price,
                discount: courseData.discount,
                finalPrice: finalPrice,
                level: courseData.level,
                status: courseData.status,
            },
        });
        createdCourses.push(course);
        console.log(`✅ Course created: ${course.titleAr}`);

        // Create course intro video
        await prisma.courseContent.create({
            data: {
                courseId: course.id,
                type: "VIDEO",
                titleAr: `مقدمة دورة ${courseData.titleAr}`,
                titleEn: `Introduction to ${courseData.titleEn}`,
                descriptionAr: `مقدمة شاملة لدورة ${courseData.titleAr}`,
                descriptionEn: `Comprehensive introduction to ${courseData.titleEn}`,
                videoUrl: "/uploads/videos/intro.mp4",
                duration: 15,
                order: 0,
                isIntroVideo: true,
            },
        });

        // Create chapters and their content
        for (const chapterData of courseData.chapters) {
            const chapter = await prisma.chapter.create({
                data: {
                    courseId: course.id,
                    titleAr: chapterData.titleAr,
                    titleEn: chapterData.titleEn,
                    order: chapterData.order,
                },
            });
            console.log(`  ✅ Chapter created: ${chapter.titleAr}`);

            // Create chapter intro video
            await prisma.courseContent.create({
                data: {
                    courseId: course.id,
                    chapterId: chapter.id,
                    type: "VIDEO",
                    titleAr: `مقدمة ${chapterData.titleAr}`,
                    titleEn: `Introduction to ${chapterData.titleEn}`,
                    videoUrl: "/uploads/videos/chapter-intro.mp4",
                    duration: 10,
                    order: chapterData.order * 100,
                    isIntroVideo: true,
                },
            });

            // Create videos for this chapter
            for (let i = 0; i < chapterData.videos.length; i++) {
                const video = chapterData.videos[i];
                const content = await prisma.courseContent.create({
                    data: {
                        courseId: course.id,
                        chapterId: chapter.id,
                        type: "VIDEO",
                        titleAr: video.titleAr,
                        titleEn: video.titleEn,
                        videoUrl: `/uploads/videos/${course.id}/${chapter.id}/video-${i + 1}.mp4`,
                        duration: video.duration,
                        order: chapterData.order * 100 + video.order,
                        isIntroVideo: false,
                    },
                });

                // Create quiz after specific videos
                if (chapterData.quizzes && chapterData.quizzes.includes(video.order)) {
                    const quiz = await prisma.quiz.create({
                        data: {
                            contentId: content.id,
                            titleAr: `اختبار: ${video.titleAr}`,
                            titleEn: `Quiz: ${video.titleEn}`,
                            passingScore: 60,
                            timeLimit: 30,
                        },
                    });

                    // Create quiz questions
                    const questions = [
                        {
                            type: "MULTIPLE_CHOICE",
                            questionAr: `سؤال 1 عن ${video.titleAr}`,
                            questionEn: `Question 1 about ${video.titleEn}`,
                            options: [
                                { textAr: "الخيار الأول", textEn: "Option 1" },
                                { textAr: "الخيار الثاني", textEn: "Option 2" },
                                { textAr: "الخيار الثالث", textEn: "Option 3" },
                                { textAr: "الخيار الرابع", textEn: "Option 4" },
                            ],
                            correctAnswer: "0",
                            points: 10,
                            order: 1,
                        },
                        {
                            type: "MULTIPLE_CHOICE",
                            questionAr: `سؤال 2 عن ${video.titleAr}`,
                            questionEn: `Question 2 about ${video.titleEn}`,
                            options: [
                                { textAr: "الخيار الأول", textEn: "Option 1" },
                                { textAr: "الخيار الثاني", textEn: "Option 2" },
                                { textAr: "الخيار الثالث", textEn: "Option 3" },
                            ],
                            correctAnswer: "1",
                            points: 10,
                            order: 2,
                        },
                    ];

                    for (const qData of questions) {
                        await prisma.quizQuestion.create({
                            data: {
                                quizId: quiz.id,
                                type: qData.type,
                                questionAr: qData.questionAr,
                                questionEn: qData.questionEn,
                                options: qData.options,
                                correctAnswer: qData.correctAnswer,
                                points: qData.points,
                                order: qData.order,
                            },
                        });
                    }
                    console.log(`    ✅ Quiz created for: ${video.titleAr}`);
                }
            }
        }
    }

    // Create Banners
    const banners = [
        {
            titleAr: "منصة D.Low للقانون",
            titleEn: "D.Low Law Platform",
            descriptionAr: "منصة متخصصة في كورسات الحقوق والقانون",
            descriptionEn: "Platform specialized in law and legal courses",
            image: "/uploads/banners/law-banner-1.jpg",
            link: "/dashboard",
            active: true,
            order: 1,
        },
    ];

    for (const banner of banners) {
        await prisma.banner.create({ data: banner });
        console.log(`✅ Banner created: ${banner.titleAr}`);
    }

    console.log("✅ Law courses seeding completed!");
}

main()
    .catch((e) => {
        console.error("❌ Error seeding database:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

