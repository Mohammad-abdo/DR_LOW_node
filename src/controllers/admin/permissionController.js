import prisma from '../../config/database.js';

/**
 * Get all permissions
 * GET /api/admin/permissions
 * Query params: ?resource=courses&action=create
 */
export const getAllPermissions = async (req, res, next) => {
  try {
    // Check if permission model exists
    if (!prisma.permission) {
      console.warn('Permission model not found in Prisma client. Please run: npm run prisma:generate');
      return res.json({
        success: true,
        data: {
          permissions: [],
          grouped: {},
        },
      });
    }

    const { resource, action } = req.query;

    const where = {};
    if (resource) where.resource = resource;
    if (action) where.action = action;

    let permissions = [];
    let grouped = {};
    
    try {
      permissions = await prisma.permission.findMany({
      where,
      include: {
        _count: {
          select: {
            rolePermissions: true,
          },
        },
      },
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' },
      ],
    });

      // Group by resource
      grouped = permissions.reduce((acc, perm) => {
        if (!acc[perm.resource]) {
          acc[perm.resource] = [];
        }
        acc[perm.resource].push(perm);
        return acc;
      }, {});
    } catch (dbError) {
      // If table doesn't exist, return empty data instead of error
      if (dbError.code === 'P2021' || dbError.code === 'P2025') {
        console.warn('Permission table may not exist, returning empty data');
        permissions = [];
        grouped = {};
      } else {
        throw dbError;
      }
    }

    res.json({
      success: true,
      data: {
        permissions,
        grouped,
      },
    });
  } catch (error) {
    console.error('Error in getAllPermissions:', error);
    next(error);
  }
};

/**
 * Get permission by ID
 * GET /api/admin/permissions/:id
 */
export const getPermissionById = async (req, res, next) => {
  try {
    // Check if permission model exists
    if (!prisma.permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission feature not available. Please run: npm run prisma:generate',
        messageAr: 'ميزة الصلاحيات غير متاحة',
      });
    }

    const { id } = req.params;

    const permission = await prisma.permission.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                nameAr: true,
                nameEn: true,
              },
            },
          },
        },
      },
    });

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found',
        messageAr: 'الصلاحية غير موجودة',
      });
    }

    res.json({
      success: true,
      data: { permission },
    });
  } catch (error) {
    console.error('Error in permissionController:', error);
    next(error);
  }
};

/**
 * Create permission
 * POST /api/admin/permissions
 */
export const createPermission = async (req, res, next) => {
  try {
    // Check if permission model exists
    if (!prisma.permission) {
      return res.status(500).json({
        success: false,
        message: 'Permission feature not available. Please run: npm run prisma:generate',
        messageAr: 'ميزة الصلاحيات غير متاحة',
      });
    }

    const { name, nameAr, nameEn, description, resource, action } = req.body;

    if (!name || !resource || !action) {
      return res.status(400).json({
        success: false,
        message: 'Name, resource, and action are required',
        messageAr: 'الاسم والمورد والإجراء مطلوبة',
      });
    }

    // Check if permission already exists
    let existing = null;
    try {
      existing = await prisma.permission.findUnique({
        where: { name },
      });
    } catch (dbError) {
      // If table doesn't exist, we can still try to create
      if (dbError.code === 'P2021' || dbError.code === 'P2025') {
        console.warn('Permission table may not exist, attempting to create');
        existing = null;
      } else {
        throw dbError;
      }
    }

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Permission already exists',
        messageAr: 'الصلاحية موجودة بالفعل',
      });
    }

    let permission;
    try {
      permission = await prisma.permission.create({
        data: {
          name,
          nameAr,
          nameEn,
          description,
          resource,
          action,
        },
      });
    } catch (dbError) {
      // If table doesn't exist, return helpful error
      if (dbError.code === 'P2021' || dbError.code === 'P2025') {
        return res.status(500).json({
          success: false,
          message: 'Permission table does not exist. Please run: npm run prisma:migrate',
          messageAr: 'جدول الصلاحيات غير موجود. يرجى تشغيل: npm run prisma:migrate',
        });
      }
      throw dbError;
    }

    res.status(201).json({
      success: true,
      message: 'Permission created successfully',
      messageAr: 'تم إنشاء الصلاحية بنجاح',
      data: { permission },
    });
  } catch (error) {
    console.error('Error in createPermission:', error);
    next(error);
  }
};

/**
 * Update permission
 * PUT /api/admin/permissions/:id
 */
export const updatePermission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nameAr, nameEn, description, resource, action } = req.body;

    const permission = await prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found',
        messageAr: 'الصلاحية غير موجودة',
      });
    }

    const updatedPermission = await prisma.permission.update({
      where: { id },
      data: {
        ...(nameAr !== undefined && { nameAr }),
        ...(nameEn !== undefined && { nameEn }),
        ...(description !== undefined && { description }),
        ...(resource && { resource }),
        ...(action && { action }),
      },
    });

    res.json({
      success: true,
      message: 'Permission updated successfully',
      messageAr: 'تم تحديث الصلاحية بنجاح',
      data: { permission: updatedPermission },
    });
  } catch (error) {
    console.error('Error in permissionController:', error);
    next(error);
  }
};

/**
 * Delete permission
 * DELETE /api/admin/permissions/:id
 */
export const deletePermission = async (req, res, next) => {
  try {
    const { id } = req.params;

    const permission = await prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found',
        messageAr: 'الصلاحية غير موجودة',
      });
    }

    await prisma.permission.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Permission deleted successfully',
      messageAr: 'تم حذف الصلاحية بنجاح',
    });
  } catch (error) {
    console.error('Error in permissionController:', error);
    next(error);
  }
};

/**
 * Bulk create permissions
 * POST /api/admin/permissions/bulk-create
 */
export const bulkCreatePermissions = async (req, res, next) => {
  try {
    const { permissions } = req.body;

    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Permissions array is required',
        messageAr: 'مصفوفة الصلاحيات مطلوبة',
      });
    }

    const results = {
      created: [],
      skipped: [],
      errors: [],
    };

    for (const perm of permissions) {
      try {
        const { name, nameAr, nameEn, description, resource, action } = perm;

        if (!name || !resource || !action) {
          results.errors.push({
            permission: perm,
            error: 'Missing required fields: name, resource, action',
          });
          continue;
        }

        // Check if exists
        const existing = await prisma.permission.findUnique({
          where: { name },
        });

        if (existing) {
          results.skipped.push({ name, reason: 'Already exists' });
          continue;
        }

        const created = await prisma.permission.create({
          data: {
            name,
            nameAr,
            nameEn,
            description,
            resource,
            action,
          },
        });

        results.created.push(created);
      } catch (error) {
        results.errors.push({
          permission: perm,
          error: error.message,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Created ${results.created.length} permission(s)`,
      messageAr: `تم إنشاء ${results.created.length} صلاحية`,
      data: results,
    });
  } catch (error) {
    console.error('Error in permissionController:', error);
    next(error);
  }
};


