import prisma from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, verifyAccessToken } from '../utils/jwt.js';
import { ROLES, USER_STATUS } from '../config/constants.js';
import { convertImageUrls } from '../utils/imageHelper.js';

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, TEACHER, STUDENT]
 */
export const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    // Validate required fields with detailed messages
    if (!email || !password || !role) {
      const missingFields = [];
      if (!email) missingFields.push('Email');
      if (!password) missingFields.push('Password');
      if (!role) missingFields.push('Role');
      
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        messageAr: `الحقول المطلوبة مفقودة: ${missingFields.map(f => f === 'Email' ? 'البريد الإلكتروني' : f === 'Password' ? 'كلمة المرور' : 'الدور').join('، ')}`,
        errorCode: 'MISSING_FIELDS',
        missingFields,
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format. Please enter a valid email address.',
        messageAr: 'صيغة البريد الإلكتروني غير صحيحة. يرجى إدخال عنوان بريد إلكتروني صحيح.',
        errorCode: 'INVALID_EMAIL_FORMAT',
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // User not found
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No account found with this email address. Please check your email or register a new account.',
        messageAr: 'لا يوجد حساب بهذا البريد الإلكتروني. يرجى التحقق من البريد الإلكتروني أو إنشاء حساب جديد.',
        errorCode: 'USER_NOT_FOUND',
        field: 'email',
      });
    }

    // Check role mismatch
    if (user.role !== role) {
      const roleNames = {
        ADMIN: { en: 'Administrator', ar: 'مدير' },
        TEACHER: { en: 'Teacher', ar: 'معلم' },
        STUDENT: { en: 'Student', ar: 'طالب' },
      };
      
      const userRoleName = roleNames[user.role] || user.role;
      const requestedRoleName = roleNames[role] || role;
      
      return res.status(403).json({
        success: false,
        message: `This account is registered as ${userRoleName.en}. Please login using the ${userRoleName.en} login page.`,
        messageAr: `هذا الحساب مسجل كـ ${userRoleName.ar}. يرجى تسجيل الدخول باستخدام صفحة تسجيل الدخول الخاصة بـ ${userRoleName.ar}.`,
        errorCode: 'ROLE_MISMATCH',
        userRole: user.role,
        requestedRole: role,
        field: 'role',
      });
    }

    // Check account status
    if (user.status === USER_STATUS.BLOCKED) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Please contact the administrator for assistance.',
        messageAr: 'تم حظر حسابك. يرجى الاتصال بالمدير للحصول على المساعدة.',
        errorCode: 'ACCOUNT_BLOCKED',
        field: 'status',
      });
    }

    if (user.status === USER_STATUS.PENDING) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval. Please wait for administrator approval or contact support.',
        messageAr: 'حسابك قيد الموافقة. يرجى انتظار موافقة المدير أو الاتصال بالدعم.',
        errorCode: 'ACCOUNT_PENDING',
        field: 'status',
      });
    }

    // Validate password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      console.error('Login failed: Invalid password for user', email);
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please check your password and try again. If you forgot your password, please use the password reset feature.',
        messageAr: 'كلمة المرور غير صحيحة. يرجى التحقق من كلمة المرور والمحاولة مرة أخرى. إذا نسيت كلمة المرور، يرجى استخدام ميزة إعادة تعيين كلمة المرور.',
        errorCode: 'INVALID_PASSWORD',
        field: 'password',
      });
    }

    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    const { password: _, refreshToken: __, ...userData } = user;

    // Convert avatar path to full URL
    const userWithFullUrl = convertImageUrls(userData, ['avatar']);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithFullUrl,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/register/student:
 *   post:
 *     summary: Register new student
 *     tags: [Authentication]
 */
export const registerStudent = async (req, res, next) => {
  try {
    const {
      nameAr,
      nameEn,
      email,
      phone,
      password,
      repeatPassword,
      gender,
      year,
      semester,
      department,
    } = req.body;

    // Validation
    if (!nameAr || !nameEn || !email || !password || !repeatPassword) {
      return res.status(400).json({
        success: false,
        message: 'Required fields are missing',
      });
    }

    if (password !== repeatPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Validate gender if provided
    if (gender && !['MALE', 'FEMALE'].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: 'Gender must be either MALE or FEMALE',
      });
    }

    // Check if email or phone already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.email === email ? 'Email already exists' : 'Phone already exists',
      });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        nameAr,
        nameEn,
        email,
        phone,
        password: hashedPassword,
        role: ROLES.STUDENT,
        gender: gender || null,
        year,
        semester,
        department,
        status: USER_STATUS.ACTIVE,
      },
    });

    // Create cart for student
    await prisma.cart.create({
      data: {
        studentId: user.id,
      },
    });

    const { password: _, refreshToken: __, ...userData } = user;

    // Convert avatar path to full URL
    const userWithFullUrl = convertImageUrls(userData, ['avatar']);

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: { user: userWithFullUrl },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/register/teacher:
 *   post:
 *     summary: Register new teacher (Admin only)
 *     tags: [Authentication]
 */
export const registerTeacher = async (req, res, next) => {
  try {
    const {
      nameAr,
      nameEn,
      email,
      phone,
      department,
      password,
    } = req.body;

    if (!nameAr || !nameEn || !email || !password || !department) {
      return res.status(400).json({
        success: false,
        message: 'Required fields are missing',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.email === email ? 'Email already exists' : 'Phone already exists',
      });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        nameAr,
        nameEn,
        email,
        phone,
        password: hashedPassword,
        role: ROLES.TEACHER,
        department,
        status: USER_STATUS.ACTIVE,
      },
    });

    const { password: _, refreshToken: __, ...userData } = user;

    // Convert avatar path to full URL
    const userWithFullUrl = convertImageUrls(userData, ['avatar']);

    res.status(201).json({
      success: true,
      message: 'Teacher registered successfully',
      data: { user: userWithFullUrl },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 */
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    const decoded = verifyRefreshToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, refreshToken: true, status: true },
    });

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    if (user.status === USER_STATUS.BLOCKED) {
      return res.status(403).json({
        success: false,
        message: 'Account is blocked',
      });
    }

    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const newRefreshToken = generateRefreshToken({ userId: user.id });

    // Update refresh token in database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    res.json({
      success: true,
      data: { 
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};
export const forgetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');

    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExp: new Date(Date.now() + 10 * 60 * 1000), // 10 دقائق
      },
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // 🔴 هنا تبعت الإيميل
    // await sendEmail(user.email, resetUrl);

    res.status(200).json({
      success: true,
      message: 'Reset password link sent to email',
      resetUrl, // شيله في production
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExp: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token is invalid or expired',
      });
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExp: null,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               logoutAllDevices:
 *                 type: boolean
 *                 description: If true, invalidates all refresh tokens (logout from all devices)
 */
export const logout = async (req, res, next) => {
  try {
    const { logoutAllDevices = false } = req.body;
    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7);

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        if (decoded) {
          // Add token to blacklist
          const expiresAt = new Date(decoded.exp * 1000);
          await prisma.tokenBlacklist.create({
            data: {
              token,
              expiresAt,
            },
          });
        }
      } catch (tokenError) {
        // Token might be expired or invalid, continue with logout
        console.log('Token verification failed during logout:', tokenError.message);
      }
    }

    if (req.user) {
      if (logoutAllDevices) {
        // Invalidate all refresh tokens for this user (logout from all devices)
        await prisma.user.update({
          where: { id: req.user.id },
          data: { refreshToken: null },
        });
      } else {
        // Only clear refresh token if it matches (optional - for single device logout)
        // For now, we'll clear it anyway since we don't track device-specific tokens
        await prisma.user.update({
          where: { id: req.user.id },
          data: { refreshToken: null },
        });
      }
    }

    res.json({
      success: true,
      message: logoutAllDevices 
        ? 'Logged out from all devices successfully' 
        : 'Logged out successfully',
      messageAr: logoutAllDevices 
        ? 'تم تسجيل الخروج من جميع الأجهزة بنجاح' 
        : 'تم تسجيل الخروج بنجاح',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        avatar: true,
        gender: true,
        department: true,
        year: true,
        semester: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Check if profile is complete (for students)
    let profileComplete = true;
    if (user.role === 'STUDENT') {
      profileComplete = !!(
        user.nameAr &&
        user.nameEn &&
        user.phone &&
        user.year !== null &&
        user.semester !== null
      );
    }

    // Convert avatar path to full URL
    const userWithFullUrl = convertImageUrls({
      ...user,
      profileComplete,
    }, ['avatar']);

    res.json({
      success: true,
      data: {
        user: userWithFullUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};



