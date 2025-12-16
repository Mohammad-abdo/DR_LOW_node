import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Starting comprehensive database seeding...");

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await prisma.tokenBlacklist.deleteMany();
    // await prisma.reportLog.deleteMany();
    // await prisma.examAnswer.deleteMany();
    // await prisma.examResult.deleteMany();
    // await prisma.examQuestion.deleteMany();
    // await prisma.exam.deleteMany();
    // await prisma.progress.deleteMany();
    // await prisma.teacherRating.deleteMany();
    // await prisma.rating.deleteMany();
    // await prisma.wishlistItem.deleteMany();
    // await prisma.cartItem.deleteMany();
    // await prisma.cart.deleteMany();
    // await prisma.payment.deleteMany();
    // await prisma.purchase.deleteMany();
    // await prisma.courseContent.deleteMany();
    // await prisma.course.deleteMany();
    // await prisma.notificationRecipient.deleteMany();
    // await prisma.notification.deleteMany();
    // await prisma.ticket.deleteMany();
    // await prisma.banner.deleteMany();
    // await prisma.category.deleteMany();
    // await prisma.user.deleteMany();

    // Create Super Admin
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
    console.log("✅ Super Admin created:", admin.email);

    // Create Default Categories
    const categories = [
        {
            nameAr: "علوم الحاسوب",
            nameEn: "Computer Science",
            descriptionAr: "دورات في علوم الحاسوب والبرمجة",
            descriptionEn: "Courses in computer science and programming",
        },
        {
            nameAr: "إدارة الأعمال",
            nameEn: "Business Administration",
            descriptionAr: "دورات في إدارة الأعمال والتسويق",
            descriptionEn: "Courses in business administration and marketing",
        },
        {
            nameAr: "الهندسة",
            nameEn: "Engineering",
            descriptionAr: "دورات في مختلف فروع الهندسة",
            descriptionEn: "Courses in various engineering fields",
        },
        {
            nameAr: "الطب",
            nameEn: "Medicine",
            descriptionAr: "دورات في العلوم الطبية",
            descriptionEn: "Courses in medical sciences",
        },
        {
            nameAr: "اللغة الإنجليزية",
            nameEn: "English Language",
            descriptionAr: "دورات في اللغة الإنجليزية",
            descriptionEn: "English language courses",
        },
    ];

    const createdCategories = [];
    for (const category of categories) {
        const existing = await prisma.category.findFirst({
            where: { nameEn: category.nameEn },
        });

        if (!existing) {
            const created = await prisma.category.create({
                data: category,
            });
            createdCategories.push(created);
            console.log(`✅ Category created: ${created.nameEn}`);
        } else {
            createdCategories.push(existing);
            console.log(`ℹ️  Category already exists: ${category.nameEn}`);
        }
    }

    // Create Multiple Teachers
    const teachers = [
        {
            nameAr: "أحمد محمد",
            nameEn: "Ahmed Mohamed",
            email: "ahmed.teacher@lms.edu.kw",
            phone: "+96522345679",
            department: "Computer Science",
            gender: "MALE",
        },
        {
            nameAr: "فاطمة علي",
            nameEn: "Fatima Ali",
            email: "fatima.teacher@lms.edu.kw",
            phone: "+96522345680",
            department: "Business Administration",
            gender: "FEMALE",
        },
        {
            nameAr: "خالد حسن",
            nameEn: "Khalid Hassan",
            email: "khalid.teacher@lms.edu.kw",
            phone: "+96522345681",
            department: "Engineering",
            gender: "MALE",
        },
        {
            nameAr: "سارة أحمد",
            nameEn: "Sara Ahmed",
            email: "sara.teacher@lms.edu.kw",
            phone: "+96522345682",
            department: "English Language",
            gender: "FEMALE",
        },
    ];

    const createdTeachers = [];
    const teacherPassword = await bcrypt.hash("teacher123", 10);
    for (const teacherData of teachers) {
        const existing = await prisma.user.findUnique({
            where: { email: teacherData.email },
        });

        if (!existing) {
            const teacher = await prisma.user.create({
                data: {
                    ...teacherData,
                    password: teacherPassword,
                    role: "TEACHER",
                    status: "ACTIVE",
                },
            });
            createdTeachers.push(teacher);
            console.log(`✅ Teacher created: ${teacher.email}`);
        } else {
            // Update gender if missing
            if (!existing.gender && teacherData.gender) {
                await prisma.user.update({
                    where: { id: existing.id },
                    data: { gender: teacherData.gender },
                });
            }
            createdTeachers.push(existing);
            console.log(`ℹ️  Teacher already exists: ${teacherData.email}`);
        }
    }

    // Create Multiple Students
    const students = [
        {
            nameAr: "محمد عبدالله",
            nameEn: "Mohamed Abdullah",
            email: "mohamed.student@lms.edu.kw",
            phone: "+96522345690",
            department: "Computer Science",
            year: 3,
            semester: 1,
            gender: "MALE",
        },
        {
            nameAr: "نورا سعيد",
            nameEn: "Nora Saeed",
            email: "nora.student@lms.edu.kw",
            phone: "+96522345691",
            department: "Business Administration",
            year: 2,
            semester: 2,
            gender: "FEMALE",
        },
        {
            nameAr: "علي خالد",
            nameEn: "Ali Khalid",
            email: "ali.student@lms.edu.kw",
            phone: "+96522345692",
            department: "Engineering",
            year: 4,
            semester: 1,
            gender: "MALE",
        },
        {
            nameAr: "مريم يوسف",
            nameEn: "Mariam Youssef",
            email: "mariam.student@lms.edu.kw",
            phone: "+96522345693",
            department: "Computer Science",
            year: 1,
            semester: 1,
            gender: "FEMALE",
        },
        {
            nameAr: "يوسف أحمد",
            nameEn: "Youssef Ahmed",
            email: "youssef.student@lms.edu.kw",
            phone: "+96522345694",
            department: "English Language",
            year: 2,
            semester: 1,
            gender: "MALE",
        },
    ];

    const createdStudents = [];
    const studentPassword = await bcrypt.hash("student123", 10);
    for (const studentData of students) {
        const existing = await prisma.user.findUnique({
            where: { email: studentData.email },
        });

        if (!existing) {
            const student = await prisma.user.create({
                data: {
                    ...studentData,
                    password: studentPassword,
                    role: "STUDENT",
                    status: "ACTIVE",
                },
            });
            createdStudents.push(student);
            console.log(`✅ Student created: ${student.email}`);
        } else {
            // Update gender if missing
            if (!existing.gender && studentData.gender) {
                await prisma.user.update({
                    where: { id: existing.id },
                    data: { gender: studentData.gender },
                });
            }
            createdStudents.push(existing);
            console.log(`ℹ️  Student already exists: ${studentData.email}`);
        }
    }

    // Create Courses
    const courses = [
        {
            titleAr: "مقدمة في البرمجة",
            titleEn: "Introduction to Programming",
            descriptionAr: "دورة شاملة لتعلم أساسيات البرمجة",
            descriptionEn:
                "Comprehensive course to learn programming fundamentals",
            teacherId: createdTeachers[0].id,
            categoryId: createdCategories[0].id,
            price: 50.0,
            discount: 10,
            level: "BEGINNER",
            status: "PUBLISHED",
        },
        {
            titleAr: "قواعد البيانات المتقدمة",
            titleEn: "Advanced Database Systems",
            descriptionAr: "تعلم إدارة قواعد البيانات المتقدمة",
            descriptionEn: "Learn advanced database management",
            teacherId: createdTeachers[0].id,
            categoryId: createdCategories[0].id,
            price: 75.0,
            discount: 0,
            level: "ADVANCED",
            status: "PUBLISHED",
        },
        {
            titleAr: "التسويق الرقمي",
            titleEn: "Digital Marketing",
            descriptionAr: "تعلم استراتيجيات التسويق الرقمي",
            descriptionEn: "Learn digital marketing strategies",
            teacherId: createdTeachers[1].id,
            categoryId: createdCategories[1].id,
            price: 60.0,
            discount: 15,
            level: "INTERMEDIATE",
            status: "PUBLISHED",
        },
        {
            titleAr: "إدارة المشاريع",
            titleEn: "Project Management",
            descriptionAr: "تعلم إدارة المشاريع باحترافية",
            descriptionEn: "Learn professional project management",
            teacherId: createdTeachers[1].id,
            categoryId: createdCategories[1].id,
            price: 80.0,
            discount: 0,
            level: "INTERMEDIATE",
            status: "PUBLISHED",
        },
        {
            titleAr: "الهندسة المدنية",
            titleEn: "Civil Engineering",
            descriptionAr: "مبادئ الهندسة المدنية",
            descriptionEn: "Principles of civil engineering",
            teacherId: createdTeachers[2].id,
            categoryId: createdCategories[2].id,
            price: 70.0,
            discount: 5,
            level: "BEGINNER",
            status: "PUBLISHED",
        },
        {
            titleAr: "الإنجليزية للأعمال",
            titleEn: "Business English",
            descriptionAr: "تعلم الإنجليزية للأغراض التجارية",
            descriptionEn: "Learn English for business purposes",
            teacherId: createdTeachers[3].id,
            categoryId: createdCategories[4].id,
            price: 45.0,
            discount: 20,
            level: "INTERMEDIATE",
            status: "PUBLISHED",
        },
        {
            titleAr: "الذكاء الاصطناعي",
            titleEn: "Artificial Intelligence",
            descriptionAr: "مقدمة في الذكاء الاصطناعي",
            descriptionEn: "Introduction to artificial intelligence",
            teacherId: createdTeachers[0].id,
            categoryId: createdCategories[0].id,
            price: 90.0,
            discount: 0,
            level: "ADVANCED",
            status: "DRAFT",
        },
    ];

    const createdCourses = [];
    for (const courseData of courses) {
        // Calculate final price
        const finalPrice =
            courseData.price -
            (courseData.price * (courseData.discount || 0)) / 100;

        const course = await prisma.course.create({
            data: {
                ...courseData,
                finalPrice: finalPrice,
            },
        });
        createdCourses.push(course);
        console.log(`✅ Course created: ${course.titleEn}`);

        // Add course content
        const contentTypes = ["VIDEO", "PDF", "TEXT", "ASSIGNMENT"];
        for (let i = 0; i < 4; i++) {
            await prisma.courseContent.create({
                data: {
                    courseId: course.id,
                    titleAr: `محتوى ${i + 1}`,
                    titleEn: `Content ${i + 1}`,
                    descriptionAr: `وصف المحتوى ${i + 1}`,
                    descriptionEn: `Content description ${i + 1}`,
                    type: contentTypes[i % contentTypes.length],
                    order: i + 1,
                    duration: i === 0 ? 30 : null,
                    fileUrl: i === 1 ? "/uploads/files/sample.pdf" : null,
                    videoUrl: i === 0 ? "https://example.com/video.mp4" : null,
                },
            });
        }
        console.log(`  ✅ Added 4 content items to course: ${course.titleEn}`);
    }

    // Create Exams for courses
    for (let i = 0; i < Math.min(3, createdCourses.length); i++) {
        const exam = await prisma.exam.create({
            data: {
                courseId: createdCourses[i].id,
                titleAr: `امتحان ${i + 1}`,
                titleEn: `Exam ${i + 1}`,
                descriptionAr: `وصف الامتحان ${i + 1}`,
                descriptionEn: `Exam description ${i + 1}`,
                duration: 60,
                passingScore: 60,
                startDate: new Date(),
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            },
        });
        console.log(`✅ Exam created: ${exam.titleEn}`);

        // Add exam questions
        for (let q = 0; q < 5; q++) {
            const question = await prisma.examQuestion.create({
                data: {
                    examId: exam.id,
                    questionAr: `سؤال ${q + 1}`,
                    questionEn: `Question ${q + 1}`,
                    type: "MCQ",
                    points: 10,
                    order: q + 1,
                    options: [
                        { textAr: "الخيار 1", textEn: "Option 1" },
                        { textAr: "الخيار 2", textEn: "Option 2" },
                        { textAr: "الخيار 3", textEn: "Option 3" },
                        { textAr: "الخيار 4", textEn: "Option 4" },
                    ],
                    correctAnswer: "0", // First option is correct
                },
            });
            console.log(
                `  ✅ Added question ${q + 1} to exam: ${exam.titleEn}`
            );
        }
    }

    // Create Purchases and Payments
    for (
        let i = 0;
        i < createdStudents.length && i < createdCourses.length;
        i++
    ) {
        const student = createdStudents[i];
        const course = createdCourses[i];

        // Create purchase
        const purchasePrice = parseFloat(course.finalPrice);
        const purchase = await prisma.purchase.create({
            data: {
                studentId: student.id,
                courseId: course.id,
                amount: purchasePrice,
            },
        });
        console.log(`✅ Purchase created for student: ${student.email}`);

        // Create payment
        const paymentAmount = parseFloat(purchase.amount);
        const payment = await prisma.payment.create({
            data: {
                studentId: student.id,
                purchaseId: purchase.id,
                amount: paymentAmount,
                paymentMethod: i % 2 === 0 ? "VISA" : "KNET",
                status: i < 3 ? "COMPLETED" : "PENDING",
                transactionId: `TXN-${Date.now()}-${i}`,
            },
        });
        console.log(`✅ Payment created: ${payment.status}`);

        // Create progress (get first content item)
        const firstContent = await prisma.courseContent.findFirst({
            where: { courseId: course.id },
            orderBy: { order: "asc" },
        });

        if (firstContent) {
            await prisma.progress.create({
                data: {
                    studentId: student.id,
                    courseId: course.id,
                    contentId: firstContent.id,
                    completed: i < 2,
                    progress: i < 2 ? 50 : 0,
                },
            });
            console.log(`✅ Progress created for student: ${student.email}`);
        }
    }

    // Create Ratings
    for (
        let i = 0;
        i < Math.min(3, createdStudents.length, createdCourses.length);
        i++
    ) {
        try {
            await prisma.rating.create({
                data: {
                    studentId: createdStudents[i].id,
                    courseId: createdCourses[i].id,
                    rating: 4 + (i % 2), // 4 or 5
                    commentAr: `تعليق ${i + 1}`,
                    commentEn: `Comment ${i + 1}`,
                    date: new Date(),
                },
            });
            console.log(
                `✅ Rating created for course: ${createdCourses[i].titleEn}`
            );
        } catch (error) {
            if (error.code !== "P2002") throw error;
            console.log(
                `ℹ️  Rating already exists for course: ${createdCourses[i].titleEn}`
            );
        }

        // Teacher ratings
        const teacherIndex = i % createdTeachers.length;
        try {
            await prisma.teacherRating.create({
                data: {
                    studentId: createdStudents[i].id,
                    teacherId: createdTeachers[teacherIndex].id,
                    rating: 5,
                    commentAr: `معلم ممتاز`,
                    commentEn: `Excellent teacher`,
                    date: new Date(),
                },
            });
            console.log(`✅ Teacher rating created`);
        } catch (error) {
            if (error.code !== "P2002") throw error;
            console.log(`ℹ️  Teacher rating already exists`);
        }
    }

    // Create Banners
    const banners = [
        {
            image: "/uploads/images/banner1.jpg",
            titleAr: "ابدأ رحلتك التعليمية",
            titleEn: "Start Your Learning Journey",
            link: "/courses",
            order: 1,
            active: true,
        },
        {
            image: "/uploads/images/banner2.jpg",
            titleAr: "دورات احترافية",
            titleEn: "Professional Courses",
            link: "/categories",
            order: 2,
            active: true,
        },
        {
            image: "/uploads/images/banner3.jpg",
            titleAr: "تعلم من الخبراء",
            titleEn: "Learn from Experts",
            link: "/teachers",
            order: 3,
            active: false,
        },
    ];

    for (const banner of banners) {
        try {
            await prisma.banner.create({
                data: banner,
            });
            console.log(`✅ Banner created: ${banner.titleEn}`);
        } catch (error) {
            if (error.code !== "P2002") throw error;
            console.log(`ℹ️  Banner already exists: ${banner.titleEn}`);
        }
    }

    // Create Notifications
    const notifications = [
        {
            senderId: admin.id,
            titleAr: "مرحباً بك في النظام",
            titleEn: "Welcome to the System",
            messageAr: "نتمنى لك تجربة تعليمية ممتعة",
            messageEn: "We wish you an enjoyable learning experience",
            type: "SYSTEM",
        },
        {
            senderId: createdTeachers[0].id,
            titleAr: "دورة جديدة متاحة",
            titleEn: "New Course Available",
            messageAr: "تم إضافة دورة جديدة في البرمجة",
            messageEn: "A new programming course has been added",
            type: "COURSE",
            courseId: createdCourses[0].id,
        },
    ];

    for (const notification of notifications) {
        try {
            const notif = await prisma.notification.create({
                data: notification,
            });
            console.log(`✅ Notification created: ${notif.titleEn}`);

            // Add recipients
            for (const student of createdStudents) {
                try {
                    await prisma.notificationRecipient.create({
                        data: {
                            notificationId: notif.id,
                            userId: student.id,
                            read: false,
                        },
                    });
                } catch (error) {
                    // Skip if already exists
                    if (error.code !== "P2002") {
                        throw error;
                    }
                }
            }
            console.log(`  ✅ Added recipients to notification`);
        } catch (error) {
            if (error.code !== "P2002") throw error;
            console.log(`ℹ️  Notification already exists`);
        }
    }

    // Create Tickets
    const tickets = [
        {
            userId: createdStudents[0].id,
            title: "مشكلة في الدفع",
            message: "لا أستطيع إتمام عملية الدفع",
            status: "OPEN",
        },
        {
            userId: createdStudents[1].id,
            title: "استفسار عن الدورة",
            message: "أريد معرفة المزيد عن محتوى الدورة",
            status: "IN_PROGRESS",
        },
        {
            userId: createdStudents[2].id,
            title: "مشكلة تقنية",
            message: "الفيديو لا يعمل بشكل صحيح",
            status: "RESOLVED",
            adminReply: "تم حل المشكلة",
        },
    ];

    for (const ticket of tickets) {
        try {
            await prisma.ticket.create({
                data: ticket,
            });
            console.log(`✅ Ticket created: ${ticket.title}`);
        } catch (error) {
            if (error.code !== "P2002") throw error;
            console.log(`ℹ️  Ticket already exists: ${ticket.title}`);
        }
    }

    // Create System Settings
    const settings = [
        {
            key: "site_name_ar",
            valueAr: "نظام إدارة التعلم",
            valueEn: "Learning Management System",
            description: "اسم الموقع",
        },
        {
            key: "site_name_en",
            valueAr: "نظام إدارة التعلم",
            valueEn: "Learning Management System",
            description: "Site name",
        },
        {
            key: "contact_email",
            value: "info@lms.edu.kw",
            description: "Contact email address",
        },
        {
            key: "contact_phone",
            value: "+96512345678",
            description: "Contact phone number",
        },
    ];

    for (const setting of settings) {
        await prisma.systemSettings.upsert({
            where: { key: setting.key },
            update: {},
            create: setting,
        });
        console.log(`✅ Setting created: ${setting.key}`);
    }

    // Create Carts for students
    for (const student of createdStudents) {
        await prisma.cart.upsert({
            where: { studentId: student.id },
            update: {},
            create: {
                studentId: student.id,
            },
        });
        console.log(`✅ Cart created for student: ${student.email}`);

        // Add items to cart
        const cart = await prisma.cart.findUnique({
            where: { studentId: student.id },
        });
        if (cart && createdCourses.length > 0) {
            const existingItem = await prisma.cartItem.findFirst({
                where: {
                    cartId: cart.id,
                    courseId: createdCourses[0].id,
                },
            });

            if (!existingItem) {
                try {
                    await prisma.cartItem.create({
                        data: {
                            cartId: cart.id,
                            courseId: createdCourses[0].id,
                        },
                    });
                    console.log(`  ✅ Added course to cart`);
                } catch (error) {
                    if (error.code !== "P2002") throw error;
                }
            }
        }
    }

    // Create Wishlist items
    for (
        let i = 0;
        i < Math.min(2, createdStudents.length, createdCourses.length - 1);
        i++
    ) {
        try {
            await prisma.wishlistItem.create({
                data: {
                    studentId: createdStudents[i].id,
                    courseId: createdCourses[i + 1].id,
                },
            });
            console.log(`✅ Wishlist item created`);
        } catch (error) {
            if (error.code !== "P2002") throw error;
            console.log(`ℹ️  Wishlist item already exists`);
        }
    }

    console.log("🎉 Comprehensive seeding completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   - ${createdCategories.length} Categories`);
    console.log(`   - ${createdTeachers.length} Teachers`);
    console.log(`   - ${createdStudents.length} Students`);
    console.log(`   - ${createdCourses.length} Courses`);
    console.log(
        `   - Multiple Exams, Payments, Ratings, Banners, Notifications, and Tickets`
    );
}

main()
    .catch((e) => {
        console.error("❌ Error seeding database:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
