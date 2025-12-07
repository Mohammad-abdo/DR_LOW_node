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
    const { nameAr, nameEn, phone, department, year, semester } = req.body;
    const avatar = req.file ? `/uploads/avatars/${req.file.filename}` : undefined;

    // Check phone uniqueness if changed
    if (phone) {
      const existing = await prisma.user.findFirst({
        where: {
          phone,
          id: { not: req.user.id },
        },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Phone number already exists',
        });
      }
    }

    const updateData = {};
    if (nameAr) updateData.nameAr = nameAr;
    if (nameEn) updateData.nameEn = nameEn;
    if (phone !== undefined) updateData.phone = phone;
    if (department) updateData.department = department;
    // Convert year and semester to integers if provided
    if (year !== undefined && year !== null && year !== '') {
      updateData.year = parseInt(year, 10);
      if (isNaN(updateData.year)) {
        return res.status(400).json({
          success: false,
          message: 'Year must be a valid number',
        });
      }
    } else if (year === '' || year === null) {
      updateData.year = null;
    }
    if (semester !== undefined && semester !== null && semester !== '') {
      updateData.semester = parseInt(semester, 10);
      if (isNaN(updateData.semester)) {
        return res.status(400).json({
          success: false,
          message: 'Semester must be a valid number',
        });
      }
    } else if (semester === '' || semester === null) {
      updateData.semester = null;
    }
    if (avatar) updateData.avatar = avatar;

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
