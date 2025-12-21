import prisma from '../../../config/database.js';

/**
 * Get About App (Public - No Auth Required)
 * GET /api/mobile/public/about
 */
export const getAboutApp = async (req, res, next) => {
  try {
    let aboutApp = await prisma.aboutApp.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    // If about app doesn't exist, create a default one
    if (!aboutApp) {
      try {
        aboutApp = await prisma.aboutApp.create({
          data: {
            appName: 'D.Low',
            version: '1.0.0',
            description: 'D.Low is a comprehensive educational platform designed to help students develop their skills and knowledge through high-quality courses and interactive learning experiences.\n\nOur mission is to provide accessible, high-quality education to students everywhere.\n\nFeatures:\n- Interactive video lessons\n- Comprehensive course materials\n- Expert instructors\n- Progress tracking\n- Mobile-friendly platform\n\nD.Low هي منصة تعليمية شاملة مصممة لمساعدة الطلاب على تطوير مهاراتهم ومعرفتهم من خلال دورات عالية الجودة وتجارب تعليمية تفاعلية.\n\nمهمتنا هي توفير تعليم عالي الجودة ويمكن الوصول إليه للطلاب في كل مكان.\n\nالمميزات:\n- دروس فيديو تفاعلية\n- مواد دراسية شاملة\n- مدرسون خبراء\n- تتبع التقدم\n- منصة متوافقة مع الهاتف المحمول',
            whatsappPhone1: '+965 1234 5678',
            whatsappPhone2: null,
          },
        });
      } catch (createError) {
        // If create fails (e.g., race condition), try to fetch again
        aboutApp = await prisma.aboutApp.findFirst({
          orderBy: { updatedAt: 'desc' },
        });
        
        if (!aboutApp) {
          console.error('Failed to create default about app:', createError);
          return res.status(500).json({
            success: false,
            message: 'Failed to load about app information',
            messageAr: 'فشل تحميل معلومات التطبيق',
          });
        }
      }
    }

    res.json({
      success: true,
      data: { aboutApp },
    });
  } catch (error) {
    console.error('Error fetching about app:', error);
    next(error);
  }
};

/**
 * Get Help & Support (Public - No Auth Required)
 * GET /api/mobile/public/help-support
 */
export const getHelpSupport = async (req, res, next) => {
  try {
    let helpSupport = await prisma.helpSupport.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    // If help support doesn't exist, create a default one
    if (!helpSupport) {
      try {
        helpSupport = await prisma.helpSupport.create({
          data: {
            title: 'Help & Support / المساعدة والدعم',
            description: 'We are here to help you! Contact us through WhatsApp or email during business hours.\n\nEmail: support@dlow.edu\nPhone: +965 1234 5678\nHours: Sunday - Thursday: 9:00 AM - 5:00 PM\n\nنحن هنا لمساعدتك! تواصل معنا عبر واتساب أو البريد الإلكتروني خلال ساعات العمل.\n\nالبريد الإلكتروني: support@dlow.edu\nالهاتف: +965 1234 5678\nساعات العمل: الأحد - الخميس: 9:00 صباحاً - 5:00 مساءً\n\nFrequently Asked Questions:\n\nQ: How do I enroll in a course?\nA: Browse available courses, select the course you want, and click "Enroll" or "Add to Cart".\n\nQ: How do I access my courses?\nA: After enrollment, go to "My Courses" section to access all your enrolled courses.\n\nالأسئلة الشائعة:\n\nس: كيف أسجل في دورة؟\nج: تصفح الدورات المتاحة، اختر الدورة التي تريدها، واضغط "التسجيل" أو "أضف إلى السلة".\n\nس: كيف أصل إلى دوراتي؟\nج: بعد التسجيل، اذهب إلى قسم "دوراتي" للوصول إلى جميع الدورات المسجلة فيها.',
            whatsappPhone1: '+965 1234 5678',
            whatsappPhone2: null,
          },
        });
      } catch (createError) {
        // If create fails (e.g., race condition), try to fetch again
        helpSupport = await prisma.helpSupport.findFirst({
          orderBy: { updatedAt: 'desc' },
        });
        
        if (!helpSupport) {
          console.error('Failed to create default help & support:', createError);
          return res.status(500).json({
            success: false,
            message: 'Failed to load help & support information',
            messageAr: 'فشل تحميل معلومات المساعدة والدعم',
          });
        }
      }
    }

    res.json({
      success: true,
      data: { helpSupport },
    });
  } catch (error) {
    console.error('Error fetching help & support:', error);
    next(error);
  }
};

/**
 * Get Privacy Policy (Public - No Auth Required)
 * GET /api/mobile/public/privacy-policy
 */
export const getPrivacyPolicy = async (req, res, next) => {
  try {
    let policy = await prisma.appPolicy.findUnique({
      where: { type: 'privacy_policy' },
    });

    // If policy doesn't exist, create a default one
    if (!policy) {
      try {
        policy = await prisma.appPolicy.create({
          data: {
            type: 'privacy_policy',
            content: JSON.stringify({
              en: 'Privacy Policy\n\nWe respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and protect your information when you use our application.\n\n1. Information We Collect\nWe may collect personal information such as your name, email address, and usage data.\n\n2. How We Use Your Information\nWe use your information to provide and improve our services, process transactions, and communicate with you.\n\n3. Data Protection\nWe implement appropriate security measures to protect your personal data.\n\n4. Your Rights\nYou have the right to access, update, or delete your personal information at any time.',
              ar: 'سياسة الخصوصية\n\nنحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. توضح سياسة الخصوصية هذه كيفية جمع معلوماتك واستخدامها وحمايتها عند استخدامك لتطبيقنا.\n\n1. المعلومات التي نجمعها\nقد نجمع معلومات شخصية مثل اسمك وعنوان بريدك الإلكتروني وبيانات الاستخدام.\n\n2. كيفية استخدامنا لمعلوماتك\nنستخدم معلوماتك لتقديم وتحسين خدماتنا ومعالجة المعاملات والتواصل معك.\n\n3. حماية البيانات\nنطبق تدابير أمنية مناسبة لحماية بياناتك الشخصية.\n\n4. حقوقك\nلديك الحق في الوصول إلى معلوماتك الشخصية أو تحديثها أو حذفها في أي وقت.'
            }),
          },
        });
      } catch (createError) {
        // If create fails (e.g., race condition), try to fetch again
        policy = await prisma.appPolicy.findUnique({
          where: { type: 'privacy_policy' },
        });
        
        if (!policy) {
          console.error('Failed to create default privacy policy:', createError);
          return res.status(500).json({
            success: false,
            message: 'Failed to load privacy policy',
            messageAr: 'فشل تحميل سياسة الخصوصية',
          });
        }
      }
    }

    res.json({
      success: true,
      data: { policy },
    });
  } catch (error) {
    console.error('Error fetching privacy policy:', error);
    next(error);
  }
};

/**
 * Get Terms & Conditions (Public - No Auth Required)
 * GET /api/mobile/public/terms
 */
export const getTermsAndConditions = async (req, res, next) => {
  try {
    let policy = await prisma.appPolicy.findUnique({
      where: { type: 'terms_and_conditions' },
    });

    // If policy doesn't exist, create a default one
    if (!policy) {
      try {
        policy = await prisma.appPolicy.create({
          data: {
            type: 'terms_and_conditions',
            content: JSON.stringify({
              en: 'Terms and Conditions\n\nBy using this application, you agree to the following terms and conditions:\n\n1. Acceptance of Terms\nBy accessing and using this application, you accept and agree to be bound by these terms.\n\n2. Use of Service\nYou agree to use the service only for lawful purposes and in accordance with these terms.\n\n3. User Accounts\nYou are responsible for maintaining the confidentiality of your account credentials.\n\n4. Intellectual Property\nAll content and materials in this application are protected by copyright and other intellectual property laws.\n\n5. Limitation of Liability\nWe are not liable for any indirect, incidental, or consequential damages arising from your use of the service.\n\n6. Changes to Terms\nWe reserve the right to modify these terms at any time. Continued use constitutes acceptance of modified terms.',
              ar: 'الشروط والأحكام\n\nباستخدامك لهذا التطبيق، فإنك توافق على الشروط والأحكام التالية:\n\n1. قبول الشروط\nمن خلال الوصول إلى هذا التطبيق واستخدامه، فإنك تقبل وتوافق على الالتزام بهذه الشروط.\n\n2. استخدام الخدمة\nتتفق على استخدام الخدمة فقط للأغراض القانونية ووفقاً لهذه الشروط.\n\n3. حسابات المستخدمين\nأنت مسؤول عن الحفاظ على سرية بيانات اعتماد حسابك.\n\n4. الملكية الفكرية\nجميع المحتويات والمواد في هذا التطبيق محمية بموجب قوانين حقوق النشر والملكية الفكرية الأخرى.\n\n5. تحديد المسؤولية\nنحن غير مسؤولين عن أي أضرار غير مباشرة أو عرضية أو تبعية ناتجة عن استخدامك للخدمة.\n\n6. تغييرات الشروط\nنحتفظ بالحق في تعديل هذه الشروط في أي وقت. الاستمرار في الاستخدام يعني قبول الشروط المعدلة.'
            }),
          },
        });
      } catch (createError) {
        // If create fails (e.g., race condition), try to fetch again
        policy = await prisma.appPolicy.findUnique({
          where: { type: 'terms_and_conditions' },
        });
        
        if (!policy) {
          console.error('Failed to create default terms and conditions:', createError);
          return res.status(500).json({
            success: false,
            message: 'Failed to load terms and conditions',
            messageAr: 'فشل تحميل الشروط والأحكام',
          });
        }
      }
    }

    res.json({
      success: true,
      data: { policy },
    });
  } catch (error) {
    console.error('Error fetching terms and conditions:', error);
    next(error);
  }
};

/**
 * Get All Policies (Public - No Auth Required)
 * GET /api/mobile/public/policies
 */
export const getAllPolicies = async (req, res, next) => {
  try {
    const policies = await prisma.appPolicy.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    res.json({
      success: true,
      data: { policies },
    });
  } catch (error) {
    next(error);
  }
};

