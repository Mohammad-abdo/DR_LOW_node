/**
 * Translation utility for backend messages
 * Returns bilingual messages based on language preference
 */

export const translations = {
  // Authentication
  AUTH: {
    LOGIN_SUCCESS: {
      ar: 'تم تسجيل الدخول بنجاح',
      en: 'Login successful',
    },
    LOGIN_FAILED: {
      ar: 'فشل تسجيل الدخول',
      en: 'Login failed',
    },
    INVALID_CREDENTIALS: {
      ar: 'بيانات الدخول غير صحيحة',
      en: 'Invalid credentials',
    },
    REGISTER_SUCCESS: {
      ar: 'تم التسجيل بنجاح',
      en: 'Registration successful',
    },
    REGISTER_FAILED: {
      ar: 'فشل التسجيل',
      en: 'Registration failed',
    },
    EMAIL_EXISTS: {
      ar: 'البريد الإلكتروني مستخدم مسبقاً',
      en: 'Email already exists',
    },
    PHONE_EXISTS: {
      ar: 'رقم الهاتف مستخدم مسبقاً',
      en: 'Phone number already exists',
    },
    PASSWORD_MISMATCH: {
      ar: 'كلمات المرور غير متطابقة',
      en: 'Passwords do not match',
    },
    PASSWORD_TOO_SHORT: {
      ar: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
      en: 'Password must be at least 6 characters',
    },
  },

  // Course
  COURSE: {
    NOT_FOUND: {
      ar: 'الدورة غير موجودة',
      en: 'Course not found',
    },
    NOT_PURCHASED: {
      ar: 'الدورة غير مشتراة',
      en: 'Course not purchased',
    },
    CREATED: {
      ar: 'تم إنشاء الدورة بنجاح',
      en: 'Course created successfully',
    },
    UPDATED: {
      ar: 'تم تحديث الدورة بنجاح',
      en: 'Course updated successfully',
    },
    DELETED: {
      ar: 'تم حذف الدورة بنجاح',
      en: 'Course deleted successfully',
    },
  },

  // Payment
  PAYMENT: {
    SUCCESS: {
      ar: 'تمت عملية الدفع بنجاح',
      en: 'Payment processed successfully',
    },
    FAILED: {
      ar: 'فشلت عملية الدفع',
      en: 'Payment failed',
    },
    PENDING: {
      ar: 'في انتظار الموافقة',
      en: 'Pending approval',
    },
  },

  // Progress
  PROGRESS: {
    UPDATED: {
      ar: 'تم تحديث التقدم',
      en: 'Progress updated',
    },
    COMPLETED: {
      ar: 'تم إكمال المحتوى',
      en: 'Content completed',
    },
  },

  // Exam
  EXAM: {
    NOT_FOUND: {
      ar: 'الامتحان غير موجود',
      en: 'Exam not found',
    },
    SUBMITTED: {
      ar: 'تم إرسال الامتحان بنجاح',
      en: 'Exam submitted successfully',
    },
    ALREADY_SUBMITTED: {
      ar: 'تم إرسال الامتحان مسبقاً',
      en: 'Exam already submitted',
    },
    PASSED: {
      ar: 'تهانينا! لقد نجحت في الامتحان',
      en: 'Congratulations! You passed the exam',
    },
    FAILED: {
      ar: 'لم تنجح في الامتحان. حاول مرة أخرى',
      en: 'You did not pass the exam. Please try again',
    },
  },

  // Quiz
  QUIZ: {
    NOT_FOUND: {
      ar: 'الاختبار غير موجود',
      en: 'Quiz not found',
    },
    SUBMITTED: {
      ar: 'تم إرسال الاختبار بنجاح',
      en: 'Quiz submitted successfully',
    },
    ALREADY_SUBMITTED: {
      ar: 'تم إرسال الاختبار مسبقاً',
      en: 'Quiz already submitted',
    },
  },

  // Cart
  CART: {
    ADDED: {
      ar: 'تمت الإضافة إلى السلة',
      en: 'Added to cart',
    },
    REMOVED: {
      ar: 'تم الحذف من السلة',
      en: 'Removed from cart',
    },
    CLEARED: {
      ar: 'تم تفريغ السلة',
      en: 'Cart cleared',
    },
  },

  // Wishlist
  WISHLIST: {
    ADDED: {
      ar: 'تمت الإضافة إلى المفضلة',
      en: 'Added to wishlist',
    },
    REMOVED: {
      ar: 'تم الحذف من المفضلة',
      en: 'Removed from wishlist',
    },
  },

  // Profile
  PROFILE: {
    UPDATED: {
      ar: 'تم تحديث الملف الشخصي',
      en: 'Profile updated',
    },
    DELETED: {
      ar: 'تم حذف الحساب بنجاح',
      en: 'Account deleted successfully',
    },
    PASSWORD_REQUIRED: {
      ar: 'كلمة المرور مطلوبة لحذف الحساب',
      en: 'Password is required for account deletion',
    },
    INVALID_PASSWORD: {
      ar: 'كلمة المرور غير صحيحة',
      en: 'Invalid password',
    },
  },

  // Support
  SUPPORT: {
    TICKET_CREATED: {
      ar: 'تم إنشاء تذكرة الدعم بنجاح',
      en: 'Support ticket created successfully',
    },
    TITLE_REQUIRED: {
      ar: 'العنوان مطلوب',
      en: 'Title is required',
    },
    MESSAGE_REQUIRED: {
      ar: 'الرسالة مطلوبة',
      en: 'Message is required',
    },
  },

  // General
  GENERAL: {
    REQUIRED_FIELDS: {
      ar: 'جميع الحقول المطلوبة يجب ملؤها',
      en: 'All required fields must be filled',
    },
    NOT_FOUND: {
      ar: 'غير موجود',
      en: 'Not found',
    },
    UNAUTHORIZED: {
      ar: 'غير مصرح',
      en: 'Unauthorized',
    },
    FORBIDDEN: {
      ar: 'غير مسموح',
      en: 'Forbidden',
    },
    SERVER_ERROR: {
      ar: 'خطأ في الخادم',
      en: 'Server error',
    },
    SUCCESS: {
      ar: 'نجح',
      en: 'Success',
    },
    FAILED: {
      ar: 'فشل',
      en: 'Failed',
    },
  },
};

/**
 * Get translated message
 * @param {string} key - Translation key (e.g., 'AUTH.LOGIN_SUCCESS')
 * @param {string} lang - Language ('ar' or 'en')
 * @returns {string} Translated message
 */
export const t = (key, lang = 'en') => {
  const keys = key.split('.');
  let value = translations;

  for (const k of keys) {
    if (value && value[k]) {
      value = value[k];
    } else {
      return key; // Return key if translation not found
    }
  }

  if (typeof value === 'object' && (value.ar || value.en)) {
    return value[lang] || value.en || value.ar || key;
  }

  return key;
};

/**
 * Get bilingual response
 * @param {string} key - Translation key
 * @returns {object} Object with ar and en properties
 */
export const getBilingual = (key) => {
  const keys = key.split('.');
  let value = translations;

  for (const k of keys) {
    if (value && value[k]) {
      value = value[k];
    } else {
      return { ar: key, en: key };
    }
  }

  if (typeof value === 'object' && (value.ar || value.en)) {
    return { ar: value.ar || '', en: value.en || '' };
  }

  return { ar: key, en: key };
};

