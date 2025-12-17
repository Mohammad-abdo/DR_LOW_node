import prisma from '../../config/database.js';

/**
 * Get all permissions
 * GET /api/admin/permissions
 * Query params: ?resource=courses&action=create
 */
export const getAllPermissions = async (req, res, next) => {
  try {
    const { resource, action } = req.query;

    const where = {};
    if (resource) where.resource = resource;
    if (action) where.action = action;

    const permissions = await prisma.permission.findMany({
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
    const grouped = permissions.reduce((acc, perm) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = [];
      }
      acc[perm.resource].push(perm);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        permissions,
        grouped,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get permission by ID
 * GET /api/admin/permissions/:id
 */
export const getPermissionById = async (req, res, next) => {
  try {
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
    next(error);
  }
};

/**
 * Create permission
 * POST /api/admin/permissions
 */
export const createPermission = async (req, res, next) => {
  try {
    const { name, nameAr, nameEn, description, resource, action } = req.body;

    if (!name || !resource || !action) {
      return res.status(400).json({
        success: false,
        message: 'Name, resource, and action are required',
        messageAr: 'الاسم والمورد والإجراء مطلوبة',
      });
    }

    // Check if permission already exists
    const existing = await prisma.permission.findUnique({
      where: { name },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Permission already exists',
        messageAr: 'الصلاحية موجودة بالفعل',
      });
    }

    const permission = await prisma.permission.create({
      data: {
        name,
        nameAr,
        nameEn,
        description,
        resource,
        action,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Permission created successfully',
      messageAr: 'تم إنشاء الصلاحية بنجاح',
      data: { permission },
    });
  } catch (error) {
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
    next(error);
  }
};


