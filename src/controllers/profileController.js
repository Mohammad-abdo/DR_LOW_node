import prisma from '../config/database.js';

export const getProfile = async (req, res, next) => {
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

    res.json({
      success: true,
      data: {
        user: {
          ...user,
          profileComplete,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    // Security: Only allow specific fields to be updated (whitelist approach)
    const allowedFields = ['nameAr', 'nameEn', 'phone', 'department', 'year', 'semester', 'gender'];
    const updateData = {};

    // Extract only allowed fields from body
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    // Handle avatar separately (from file upload)
    const avatar = req.file ? `/uploads/avatars/${req.file.filename}` : undefined;
    if (avatar) updateData.avatar = avatar;

    // Security: Prevent updating sensitive fields
    const forbiddenFields = ['id', 'email', 'password', 'role', 'status', 'refreshToken', 'createdAt', 'updatedAt'];
    for (const field of forbiddenFields) {
      if (req.body[field] !== undefined) {
        return res.status(403).json({
          success: false,
          message: `Field '${field}' cannot be updated`,
        });
      }
    }

    // Validation: Required fields
    if (updateData.nameAr !== undefined && !updateData.nameAr.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name (Arabic) is required',
      });
    }

    if (updateData.nameEn !== undefined && !updateData.nameEn.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name (English) is required',
      });
    }

    // Validation: Gender enum
    if (updateData.gender !== undefined && updateData.gender !== null && updateData.gender !== '') {
      if (!['MALE', 'FEMALE'].includes(updateData.gender)) {
        return res.status(400).json({
          success: false,
          message: 'Gender must be either MALE or FEMALE',
        });
      }
    } else if (updateData.gender === '') {
      updateData.gender = null;
    }

    // Check phone uniqueness if changed
    if (updateData.phone !== undefined) {
      if (updateData.phone && updateData.phone.trim()) {
        const existing = await prisma.user.findFirst({
          where: {
            phone: updateData.phone.trim(),
            id: { not: req.user.id },
          },
        });

        if (existing) {
          return res.status(409).json({
            success: false,
            message: 'Phone number already exists',
          });
        }
        updateData.phone = updateData.phone.trim();
      } else {
        updateData.phone = null;
      }
    }

    // Convert year and semester to integers if provided
    if (updateData.year !== undefined && updateData.year !== null && updateData.year !== '') {
      updateData.year = parseInt(updateData.year, 10);
      if (isNaN(updateData.year)) {
        return res.status(400).json({
          success: false,
          message: 'Year must be a valid number',
        });
      }
    } else if (updateData.year === '' || updateData.year === null) {
      updateData.year = null;
    }

    if (updateData.semester !== undefined && updateData.semester !== null && updateData.semester !== '') {
      updateData.semester = parseInt(updateData.semester, 10);
      if (isNaN(updateData.semester)) {
        return res.status(400).json({
          success: false,
          message: 'Semester must be a valid number',
        });
      }
    } else if (updateData.semester === '' || updateData.semester === null) {
      updateData.semester = null;
    }

    // Trim string fields
    if (updateData.nameAr) updateData.nameAr = updateData.nameAr.trim();
    if (updateData.nameEn) updateData.nameEn = updateData.nameEn.trim();
    if (updateData.department) updateData.department = updateData.department.trim();

    // Security: Ensure user can only update their own profile
    // req.user.id is set by auth middleware from JWT token, so it's secure
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        gender: true,
        department: true,
        year: true,
        semester: true,
      },
    });

    // Check if profile is now complete
    let profileComplete = true;
    if (updatedUser.role === 'STUDENT') {
      profileComplete = !!(
        updatedUser.nameAr &&
        updatedUser.nameEn &&
        updatedUser.phone &&
        updatedUser.year !== null &&
        updatedUser.semester !== null
      );
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          ...updatedUser,
          profileComplete,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    const { comparePassword, hashPassword } = await import('../utils/password.js');
    const isPasswordValid = await comparePassword(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};
