import prisma from '../config/database.js';
import { ROLES } from '../config/constants.js';

/**
 * Permission Middleware
 * Checks if user has required permission
 * 
 * Usage: permissionMiddleware('courses.create')
 */
export const permissionMiddleware = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          messageAr: 'المصادقة مطلوبة',
        });
      }

      // Super admin (ADMIN role) has all permissions
      if (req.user.role === ROLES.ADMIN) {
        return next();
      }

      // Get user with roles and permissions
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          userRoles: {
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
          },
        },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
          messageAr: 'المستخدم غير موجود',
        });
      }

      // Check if user has the required permission through any of their roles
      let hasPermission = false;

      for (const userRole of user.userRoles) {
        for (const rolePermission of userRole.role.permissions) {
          if (rolePermission.permission.name === requiredPermission) {
            hasPermission = true;
            break;
          }
        }
        if (hasPermission) break;
      }

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Permission denied: ${requiredPermission}`,
          messageAr: `صلاحية مرفوضة: ${requiredPermission}`,
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions',
        messageAr: 'خطأ في التحقق من الصلاحيات',
        error: error.message,
      });
    }
  };
};

/**
 * Multiple Permissions Middleware (OR logic)
 * User needs at least one of the specified permissions
 * 
 * Usage: anyPermissionMiddleware(['courses.create', 'courses.update'])
 */
export const anyPermissionMiddleware = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          messageAr: 'المصادقة مطلوبة',
        });
      }

      // Super admin has all permissions
      if (req.user.role === ROLES.ADMIN) {
        return next();
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          userRoles: {
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
          },
        },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
          messageAr: 'المستخدم غير موجود',
        });
      }

      // Collect all user permissions
      const userPermissions = new Set();
      for (const userRole of user.userRoles) {
        for (const rolePermission of userRole.role.permissions) {
          userPermissions.add(rolePermission.permission.name);
        }
      }

      // Check if user has at least one required permission
      const hasAnyPermission = requiredPermissions.some(perm => 
        userPermissions.has(perm)
      );

      if (!hasAnyPermission) {
        return res.status(403).json({
          success: false,
          message: `Permission denied. Required: ${requiredPermissions.join(' or ')}`,
          messageAr: 'صلاحية مرفوضة',
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions',
        messageAr: 'خطأ في التحقق من الصلاحيات',
        error: error.message,
      });
    }
  };
};

/**
 * All Permissions Middleware (AND logic)
 * User needs all specified permissions
 * 
 * Usage: allPermissionsMiddleware(['courses.create', 'courses.update'])
 */
export const allPermissionsMiddleware = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          messageAr: 'المصادقة مطلوبة',
        });
      }

      // Super admin has all permissions
      if (req.user.role === ROLES.ADMIN) {
        return next();
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          userRoles: {
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
          },
        },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
          messageAr: 'المستخدم غير موجود',
        });
      }

      // Collect all user permissions
      const userPermissions = new Set();
      for (const userRole of user.userRoles) {
        for (const rolePermission of userRole.role.permissions) {
          userPermissions.add(rolePermission.permission.name);
        }
      }

      // Check if user has all required permissions
      const hasAllPermissions = requiredPermissions.every(perm => 
        userPermissions.has(perm)
      );

      if (!hasAllPermissions) {
        return res.status(403).json({
          success: false,
          message: `Permission denied. Required all: ${requiredPermissions.join(', ')}`,
          messageAr: 'صلاحية مرفوضة',
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions',
        messageAr: 'خطأ في التحقق من الصلاحيات',
        error: error.message,
      });
    }
  };
};















