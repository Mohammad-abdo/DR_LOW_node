import prisma from '../../config/database.js';
import { hashPassword } from '../../utils/password.js';
import { ROLES, USER_STATUS } from '../../config/constants.js';

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const { role, status, page = 1, limit = 10, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { nameAr: { contains: search } },
        { nameEn: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
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
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
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
        _count: {
          select: {
            coursesCreated: true,
            enrollments: true,
            payments: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nameAr, nameEn, email, phone, department, year, semester, role, status } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check email/phone uniqueness if changed
    if (email || phone) {
      const existing = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                ...(email ? [{ email }] : []),
                ...(phone ? [{ phone }] : []),
              ],
            },
          ],
        },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Email or phone already exists',
        });
      }
    }

    // Prepare update data with proper type conversion
    const updateData = {};
    if (nameAr) updateData.nameAr = nameAr;
    if (nameEn) updateData.nameEn = nameEn;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (department) updateData.department = department;
    // Convert year and semester to integers if provided
    if (year !== undefined && year !== null && year !== '') {
      const yearInt = parseInt(year, 10);
      if (!isNaN(yearInt)) {
        updateData.year = yearInt;
      }
    } else if (year === '' || year === null) {
      updateData.year = null;
    }
    if (semester !== undefined && semester !== null && semester !== '') {
      const semesterInt = parseInt(semester, 10);
      if (!isNaN(semesterInt)) {
        updateData.semester = semesterInt;
      }
    } else if (semester === '' || semester === null) {
      updateData.semester = null;
    }
    if (role) updateData.role = role;
    if (status) updateData.status = status;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        department: true,
        year: true,
        semester: true,
      },
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

export const blockUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot block yourself',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status: USER_STATUS.BLOCKED },
    });

    res.json({
      success: true,
      message: 'User blocked successfully',
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

export const unblockUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id },
      data: { status: USER_STATUS.ACTIVE },
    });

    res.json({
      success: true,
      message: 'User unblocked successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete yourself',
      });
    }

    await prisma.user.delete({ where: { id } });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const resetUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};



