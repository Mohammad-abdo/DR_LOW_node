import prisma from '../../config/database.js';

/**
 * Get all roles
 * GET /api/admin/roles
 */
export const getAllRoles = async (req, res, next) => {
  try {
    // Check if role model exists
    if (!prisma.role) {
      console.warn('Role model not found in Prisma client. Please run: npm run prisma:generate');
      return res.json({
        success: true,
        data: { roles: [] },
      });
    }

    let roles = [];
    
    try {
      roles = await prisma.role.findMany({
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
          _count: {
            select: {
              userRoles: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (dbError) {
      // If table doesn't exist, return empty array instead of error
      if (dbError.code === 'P2021' || dbError.code === 'P2025') {
        console.warn('Role table may not exist, returning empty data');
        roles = [];
      } else {
        throw dbError;
      }
    }

    res.json({
      success: true,
      data: { roles },
    });
  } catch (error) {
    console.error('Error in getAllRoles:', error);
    next(error);
  }
};

/**
 * Get role by ID
 * GET /api/admin/roles/:id
 */
export const getRoleById = async (req, res, next) => {
  try {
    // Check if role model exists
    if (!prisma.role) {
      return res.status(404).json({
        success: false,
        message: 'Role feature not available. Please run: npm run prisma:generate',
        messageAr: 'ميزة الأدوار غير متاحة',
      });
    }

    const { id } = req.params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                nameAr: true,
                nameEn: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
        messageAr: 'الدور غير موجود',
      });
    }

    res.json({
      success: true,
      data: { role },
    });
  } catch (error) {
    console.error('Error in roleController:', error);
    next(error);
  }
};

/**
 * Create role
 * POST /api/admin/roles
 */
export const createRole = async (req, res, next) => {
  try {
    // Check if role model exists
    if (!prisma.role) {
      return res.status(500).json({
        success: false,
        message: 'Role feature not available. Please run: npm run prisma:generate',
        messageAr: 'ميزة الأدوار غير متاحة',
      });
    }

    const { name, nameAr, nameEn, description, permissionIds } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Role name is required',
        messageAr: 'اسم الدور مطلوب',
      });
    }

    // Check if role name already exists
    let existingRole = null;
    try {
      existingRole = await prisma.role.findUnique({
        where: { name },
      });
    } catch (dbError) {
      // If table doesn't exist, we can still try to create
      if (dbError.code === 'P2021' || dbError.code === 'P2025') {
        console.warn('Role table may not exist, attempting to create');
        existingRole = null;
      } else {
        throw dbError;
      }
    }

    if (existingRole) {
      return res.status(409).json({
        success: false,
        message: 'Role name already exists',
        messageAr: 'اسم الدور موجود بالفعل',
      });
    }

    // Create role with permissions
    let role;
    try {
      role = await prisma.role.create({
      data: {
        name,
        nameAr,
        nameEn,
        description,
        permissions: permissionIds && permissionIds.length > 0
          ? {
              create: permissionIds.map(permissionId => ({
                permissionId,
              })),
            }
          : undefined,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
      });
    } catch (dbError) {
      // If table doesn't exist, return helpful error
      if (dbError.code === 'P2021' || dbError.code === 'P2025') {
        return res.status(500).json({
          success: false,
          message: 'Role table does not exist. Please run: npm run prisma:migrate',
          messageAr: 'جدول الأدوار غير موجود. يرجى تشغيل: npm run prisma:migrate',
        });
      }
      throw dbError;
    }

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      messageAr: 'تم إنشاء الدور بنجاح',
      data: { role },
    });
  } catch (error) {
    console.error('Error in createRole:', error);
    next(error);
  }
};

/**
 * Update role
 * PUT /api/admin/roles/:id
 */
export const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, nameAr, nameEn, description, permissionIds } = req.body;

    const role = await prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
        messageAr: 'الدور غير موجود',
      });
    }

    if (role.isSystem) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify system role',
        messageAr: 'لا يمكن تعديل دور النظام',
      });
    }

    // Check if new name conflicts with existing role
    if (name && name !== role.name) {
      const existingRole = await prisma.role.findUnique({
        where: { name },
      });

      if (existingRole) {
        return res.status(409).json({
          success: false,
          message: 'Role name already exists',
          messageAr: 'اسم الدور موجود بالفعل',
        });
      }
    }

    // Update role
    const updatedRole = await prisma.$transaction(async (tx) => {
      // Update role basic info
      const role = await tx.role.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(nameAr !== undefined && { nameAr }),
          ...(nameEn !== undefined && { nameEn }),
          ...(description !== undefined && { description }),
        },
      });

      // Update permissions if provided
      if (permissionIds !== undefined) {
        // Delete existing permissions
        await tx.rolePermission.deleteMany({
          where: { roleId: id },
        });

        // Add new permissions
        if (permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: permissionIds.map(permissionId => ({
              roleId: id,
              permissionId,
            })),
          });
        }
      }

      // Return updated role with permissions
      return await tx.role.findUnique({
        where: { id },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });
    });

    res.json({
      success: true,
      message: 'Role updated successfully',
      messageAr: 'تم تحديث الدور بنجاح',
      data: { role: updatedRole },
    });
  } catch (error) {
    console.error('Error in roleController:', error);
    next(error);
  }
};

/**
 * Delete role
 * DELETE /api/admin/roles/:id
 */
export const deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;

    const role = await prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
        messageAr: 'الدور غير موجود',
      });
    }

    if (role.isSystem) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete system role',
        messageAr: 'لا يمكن حذف دور النظام',
      });
    }

    await prisma.role.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Role deleted successfully',
      messageAr: 'تم حذف الدور بنجاح',
    });
  } catch (error) {
    console.error('Error in roleController:', error);
    next(error);
  }
};

/**
 * Assign role to user
 * POST /api/admin/roles/:roleId/assign
 */
export const assignRoleToUser = async (req, res, next) => {
  try {
    const { roleId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
        messageAr: 'معرف المستخدم مطلوب',
      });
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
        messageAr: 'الدور غير موجود',
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        messageAr: 'المستخدم غير موجود',
      });
    }

    // Check if already assigned
    const existing = await prisma.userRoleAssignment.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Role already assigned to user',
        messageAr: 'الدور معين بالفعل للمستخدم',
      });
    }

    // Assign role
    const userRole = await prisma.userRoleAssignment.create({
      data: {
        userId,
        roleId,
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Role assigned successfully',
      messageAr: 'تم تعيين الدور بنجاح',
      data: { userRole },
    });
  } catch (error) {
    console.error('Error in roleController:', error);
    next(error);
  }
};

/**
 * Remove role from user
 * DELETE /api/admin/roles/:roleId/users/:userId
 */
export const removeRoleFromUser = async (req, res, next) => {
  try {
    const { roleId, userId } = req.params;

    const userRole = await prisma.userRoleAssignment.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    if (!userRole) {
      return res.status(404).json({
        success: false,
        message: 'Role assignment not found',
        messageAr: 'تعيين الدور غير موجود',
      });
    }

    await prisma.userRoleAssignment.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    res.json({
      success: true,
      message: 'Role removed successfully',
      messageAr: 'تم إزالة الدور بنجاح',
    });
  } catch (error) {
    console.error('Error in roleController:', error);
    next(error);
  }
};

