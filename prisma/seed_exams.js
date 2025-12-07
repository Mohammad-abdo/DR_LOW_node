import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Starting Exams Seeding...");
    console.log("⚠️  This will only add exams to existing courses. No videos or content will be deleted.");

    // Get all existing courses
    const courses = await prisma.course.findMany({
        where: {
            status: "PUBLISHED",
        },
        include: {
            chapters: {
                include: {
                    content: true,
                },
            },
        },
    });

    if (courses.length === 0) {
        console.log("❌ No courses found. Please create courses first.");
        return;
    }

    console.log(`📚 Found ${courses.length} courses. Creating exams...`);

    // Exam questions templates - Expanded with more questions
    const examQuestionsTemplates = {
        law: [
            {
                type: "MCQ",
                questionAr: "ما هو تعريف القانون الدستوري؟",
                questionEn: "What is the definition of constitutional law?",
                options: {
                    a: { ar: "القانون الذي ينظم العلاقات بين الأفراد", en: "Law that regulates relationships between individuals" },
                    b: { ar: "القانون الذي ينظم السلطات العامة في الدولة", en: "Law that regulates public authorities in the state" },
                    c: { ar: "القانون الذي ينظم المعاملات التجارية", en: "Law that regulates commercial transactions" },
                    d: { ar: "القانون الذي ينظم الجرائم والعقوبات", en: "Law that regulates crimes and penalties" },
                },
                correctAnswer: "b",
                points: 2,
            },
            {
                type: "MCQ",
                questionAr: "ما هي أنواع الدساتير؟",
                questionEn: "What are the types of constitutions?",
                options: {
                    a: { ar: "مكتوبة وغير مكتوبة", en: "Written and unwritten" },
                    b: { ar: "مرنة وجامدة", en: "Flexible and rigid" },
                    c: { ar: "جميع ما سبق", en: "All of the above" },
                    d: { ar: "لا شيء مما سبق", en: "None of the above" },
                },
                correctAnswer: "c",
                points: 2,
            },
            {
                type: "MCQ",
                questionAr: "ما هي السلطات الثلاث في الدولة؟",
                questionEn: "What are the three powers in the state?",
                options: {
                    a: { ar: "تشريعية، تنفيذية، قضائية", en: "Legislative, executive, judicial" },
                    b: { ar: "تشريعية، عسكرية، دينية", en: "Legislative, military, religious" },
                    c: { ar: "تنفيذية، اقتصادية، اجتماعية", en: "Executive, economic, social" },
                    d: { ar: "قضائية، أمنية، تعليمية", en: "Judicial, security, educational" },
                },
                correctAnswer: "a",
                points: 2,
            },
            {
                type: "MCQ",
                questionAr: "ما هو دور السلطة القضائية؟",
                questionEn: "What is the role of the judicial power?",
                options: {
                    a: { ar: "سن القوانين", en: "Enacting laws" },
                    b: { ar: "تنفيذ القوانين", en: "Implementing laws" },
                    c: { ar: "تطبيق القوانين والفصل في المنازعات", en: "Applying laws and resolving disputes" },
                    d: { ar: "جميع ما سبق", en: "All of the above" },
                },
                correctAnswer: "c",
                points: 2,
            },
            {
                type: "TRUE_FALSE",
                questionAr: "الدستور هو القانون الأساسي للدولة",
                questionEn: "The constitution is the fundamental law of the state",
                correctAnswer: "true",
                points: 1,
            },
            {
                type: "TRUE_FALSE",
                questionAr: "السلطة التشريعية هي المسؤولة عن تنفيذ القوانين",
                questionEn: "The legislative power is responsible for implementing laws",
                correctAnswer: "false",
                points: 1,
            },
            {
                type: "TRUE_FALSE",
                questionAr: "مبدأ فصل السلطات يمنع تركيز السلطة في يد واحدة",
                questionEn: "The principle of separation of powers prevents concentration of power in one hand",
                correctAnswer: "true",
                points: 1,
            },
            {
                type: "ESSAY",
                questionAr: "اشرح مبدأ فصل السلطات في الدولة",
                questionEn: "Explain the principle of separation of powers in the state",
                correctAnswer: "مبدأ فصل السلطات يعني تقسيم السلطات في الدولة إلى ثلاث سلطات: تشريعية وتنفيذية وقضائية، كل منها مستقلة عن الأخرى",
                points: 5,
            },
            {
                type: "ESSAY",
                questionAr: "ما هي أهمية الدستور في النظام السياسي؟",
                questionEn: "What is the importance of the constitution in the political system?",
                correctAnswer: "الدستور مهم لأنه يحدد شكل الدولة ونظام الحكم ويضمن حقوق المواطنين ويحدد صلاحيات السلطات",
                points: 5,
            },
        ],
        general: [
            {
                type: "MCQ",
                questionAr: "ما هو المفهوم الأساسي للقانون؟",
                questionEn: "What is the basic concept of law?",
                options: {
                    a: { ar: "مجموعة من القواعد الملزمة", en: "A set of binding rules" },
                    b: { ar: "مجموعة من التوصيات", en: "A set of recommendations" },
                    c: { ar: "مجموعة من الأعراف", en: "A set of customs" },
                    d: { ar: "جميع ما سبق", en: "All of the above" },
                },
                correctAnswer: "a",
                points: 2,
            },
            {
                type: "MCQ",
                questionAr: "ما هي مصادر القانون؟",
                questionEn: "What are the sources of law?",
                options: {
                    a: { ar: "التشريع", en: "Legislation" },
                    b: { ar: "العرف", en: "Custom" },
                    c: { ar: "الفقه والقضاء", en: "Jurisprudence and judiciary" },
                    d: { ar: "جميع ما سبق", en: "All of the above" },
                },
                correctAnswer: "d",
                points: 2,
            },
            {
                type: "MCQ",
                questionAr: "ما هو الفرق بين القانون العام والقانون الخاص؟",
                questionEn: "What is the difference between public law and private law?",
                options: {
                    a: { ar: "القانون العام ينظم علاقات الدولة، الخاص ينظم علاقات الأفراد", en: "Public law regulates state relations, private law regulates individual relations" },
                    b: { ar: "لا يوجد فرق", en: "There is no difference" },
                    c: { ar: "القانون العام للشركات، الخاص للأفراد", en: "Public law for companies, private for individuals" },
                    d: { ar: "جميع ما سبق", en: "All of the above" },
                },
                correctAnswer: "a",
                points: 2,
            },
            {
                type: "TRUE_FALSE",
                questionAr: "القانون يطبق على جميع الأفراد بالتساوي",
                questionEn: "Law applies equally to all individuals",
                correctAnswer: "true",
                points: 1,
            },
            {
                type: "TRUE_FALSE",
                questionAr: "العرف هو مصدر رئيسي للقانون",
                questionEn: "Custom is a main source of law",
                correctAnswer: "true",
                points: 1,
            },
            {
                type: "ESSAY",
                questionAr: "ما هي أهمية القانون في المجتمع؟",
                questionEn: "What is the importance of law in society?",
                correctAnswer: "القانون مهم في المجتمع لأنه ينظم العلاقات بين الأفراد ويحافظ على النظام والأمن ويضمن العدالة",
                points: 5,
            },
            {
                type: "ESSAY",
                questionAr: "اشرح دور القضاء في تطبيق القانون",
                questionEn: "Explain the role of the judiciary in applying the law",
                correctAnswer: "القضاء يلعب دوراً مهماً في تطبيق القانون من خلال الفصل في المنازعات وتطبيق القوانين على القضايا المطروحة أمامه",
                points: 5,
            },
        ],
    };

    let examsCreated = 0;
    let questionsCreated = 0;

    for (const course of courses) {
        // Create 2-3 exams per course
        const numExams = Math.floor(Math.random() * 2) + 2; // 2 or 3 exams

        for (let examIndex = 0; examIndex < numExams; examIndex++) {
            const examTitleAr = examIndex === 0 
                ? `امتحان نهائي - ${course.titleAr}`
                : `امتحان الفصل ${examIndex + 1} - ${course.titleAr}`;
            
            const examTitleEn = examIndex === 0
                ? `Final Exam - ${course.titleEn}`
                : `Chapter ${examIndex + 1} Exam - ${course.titleEn}`;

            const examDescriptionAr = examIndex === 0
                ? `امتحان شامل يغطي جميع محتويات دورة ${course.titleAr}`
                : `امتحان يغطي محتوى الفصل ${examIndex + 1}`;

            const examDescriptionEn = examIndex === 0
                ? `Comprehensive exam covering all content of ${course.titleEn} course`
                : `Exam covering Chapter ${examIndex + 1} content`;

            // Determine exam duration based on number of chapters
            const duration = course.chapters.length > 0 
                ? course.chapters.length * 15 + 30 // 15 min per chapter + 30 min base
                : 60; // Default 60 minutes

            // Create exam
            const exam = await prisma.exam.create({
                data: {
                    courseId: course.id,
                    titleAr: examTitleAr,
                    titleEn: examTitleEn,
                    descriptionAr: examDescriptionAr,
                    descriptionEn: examDescriptionEn,
                    duration: duration,
                    passingScore: 60,
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
                },
            });

            examsCreated++;
            console.log(`  ✅ Exam created: ${exam.titleAr}`);

            // Select questions template based on course category
            const questionsTemplate = course.categoryId 
                ? examQuestionsTemplates.law 
                : examQuestionsTemplates.general;

            // Create 10-15 questions per exam
            const numQuestions = Math.floor(Math.random() * 6) + 10; // 10-15 questions

            // Mix question types: 60% MCQ, 20% TRUE_FALSE, 20% ESSAY
            const questionTypes = [];
            const mcqCount = Math.floor(numQuestions * 0.6);
            const tfCount = Math.floor(numQuestions * 0.2);
            const essayCount = numQuestions - mcqCount - tfCount;

            for (let i = 0; i < mcqCount; i++) questionTypes.push("MCQ");
            for (let i = 0; i < tfCount; i++) questionTypes.push("TRUE_FALSE");
            for (let i = 0; i < essayCount; i++) questionTypes.push("ESSAY");

            // Shuffle question types
            for (let i = questionTypes.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [questionTypes[i], questionTypes[j]] = [questionTypes[j], questionTypes[i]];
            }

            for (let qIndex = 0; qIndex < numQuestions; qIndex++) {
                const desiredType = questionTypes[qIndex];
                // Find a template with the desired type
                const availableTemplates = questionsTemplate.filter(t => t.type === desiredType);
                const template = availableTemplates.length > 0 
                    ? availableTemplates[qIndex % availableTemplates.length]
                    : questionsTemplate[qIndex % questionsTemplate.length];
                
                let questionData = {
                    examId: exam.id,
                    type: template.type,
                    questionAr: template.questionAr,
                    questionEn: template.questionEn,
                    correctAnswer: template.correctAnswer,
                    points: template.points,
                    order: qIndex + 1,
                };

                // Add options for MCQ
                if (template.type === "MCQ" && template.options) {
                    questionData.options = template.options;
                }

                await prisma.examQuestion.create({
                    data: questionData,
                });

                questionsCreated++;
            }

            console.log(`    ✅ Created ${numQuestions} questions for exam: ${exam.titleAr}`);
        }
    }

    console.log("\n✅ Exams Seeding Completed!");
    console.log(`📊 Summary:`);
    console.log(`   - Courses processed: ${courses.length}`);
    console.log(`   - Exams created: ${examsCreated}`);
    console.log(`   - Questions created: ${questionsCreated}`);
    console.log("\n⚠️  Note: All existing videos and content remain untouched.");
}

main()
    .catch((e) => {
        console.error("❌ Error seeding exams:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

