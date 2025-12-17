import prisma from '../../config/database.js';
import { notifyPurchase } from '../../services/notificationService.js';

/**
 * Get all course requests
 * GET /api/admin/course-requests
 * Query params: ?status=pending|approved|rejected
 */
export const getAllCourseRequests = async (req, res, next) => {
  try {
    const { status, studentId, courseId } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }
    if (studentId) {
      where.studentId = studentId;
    }
    if (courseId) {
      where.courseId = courseId;
    }

    const requests = await prisma.courseRequest.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            email: true,
            phone: true,
          },
        },
        course: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            price: true,
            finalPrice: true,
            teacher: {
              select: {
                nameAr: true,
                nameEn: true,
              },
            },
            category: {
              select: {
                nameAr: true,
                nameEn: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Count by status
    const counts = {
      pending: await prisma.courseRequest.count({ where: { status: 'pending' } }),
      approved: await prisma.courseRequest.count({ where: { status: 'approved' } }),
      rejected: await prisma.courseRequest.count({ where: { status: 'rejected' } }),
    };

    res.json({
      success: true,
      data: {
        requests,
        counts,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single course request by ID
 * GET /api/admin/course-requests/:id
 */
export const getCourseRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const request = await prisma.courseRequest.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            email: true,
            phone: true,
          },
        },
        course: {
          include: {
            teacher: {
              select: {
                id: true,
                nameAr: true,
                nameEn: true,
                email: true,
              },
            },
            category: {
              select: {
                id: true,
                nameAr: true,
                nameEn: true,
              },
            },
          },
        },
      },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Course request not found',
        messageAr: 'طلب الدورة غير موجود',
      });
    }

    res.json({
      success: true,
      data: { request },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve course request
 * POST /api/admin/course-requests/:id/approve
 * 
 * When approved:
 * - Status changes to "approved"
 * - Student is automatically enrolled (Purchase created)
 * - Notification sent to student
 */
export const approveCourseRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const request = await prisma.courseRequest.findUnique({
      where: { id },
      include: {
        student: true,
        course: true,
      },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Course request not found',
        messageAr: 'طلب الدورة غير موجود',
      });
    }

    if (request.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Course request already approved',
        messageAr: 'طلب الدورة معتمد بالفعل',
      });
    }

    // Check if student already has this course
    const existingPurchase = await prisma.purchase.findUnique({
      where: {
        studentId_courseId: {
          studentId: request.studentId,
          courseId: request.courseId,
        },
      },
    });

    if (existingPurchase) {
      // Update request status even if already purchased
      await prisma.courseRequest.update({
        where: { id },
        data: { status: 'approved' },
      });

      return res.json({
        success: true,
        message: 'Course request approved (student already enrolled)',
        messageAr: 'تم اعتماد طلب الدورة (الطالب مسجل بالفعل)',
        data: { request: { ...request, status: 'approved' } },
      });
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update request status
      const updatedRequest = await tx.courseRequest.update({
        where: { id },
        data: { status: 'approved' },
      });

      // Create purchase (enrollment)
      const purchase = await tx.purchase.create({
        data: {
          studentId: request.studentId,
          courseId: request.courseId,
          amount: request.course.finalPrice || request.course.price,
        },
      });

      return { updatedRequest, purchase };
    });

    // Send notification to student
    try {
      await notifyPurchase(
        request.studentId,
        request.courseId,
        parseFloat(result.purchase.amount)
      );
    } catch (notifError) {
      console.error('Error sending approval notification:', notifError);
      // Don't fail the approval if notification fails
    }

    res.json({
      success: true,
      message: 'Course request approved and student enrolled successfully',
      messageAr: 'تم اعتماد طلب الدورة وتسجيل الطالب بنجاح',
      data: {
        request: result.updatedRequest,
        purchase: result.purchase,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject course request
 * POST /api/admin/course-requests/:id/reject
 * 
 * Request body:
 * {
 *   "rejectionReason": "Optional reason for rejection"
 * }
 */
export const rejectCourseRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const request = await prisma.courseRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Course request not found',
        messageAr: 'طلب الدورة غير موجود',
      });
    }

    if (request.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Course request already rejected',
        messageAr: 'طلب الدورة مرفوض بالفعل',
      });
    }

    if (request.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reject an approved request',
        messageAr: 'لا يمكن رفض طلب معتمد',
      });
    }

    const updatedRequest = await prisma.courseRequest.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectionReason: rejectionReason || null,
      },
    });

    res.json({
      success: true,
      message: 'Course request rejected successfully',
      messageAr: 'تم رفض طلب الدورة بنجاح',
      data: { request: updatedRequest },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk approve course requests
 * POST /api/admin/course-requests/bulk-approve
 * 
 * Request body:
 * {
 *   "requestIds": ["id1", "id2", ...]
 * }
 */
export const bulkApproveCourseRequests = async (req, res, next) => {
  try {
    const { requestIds } = req.body;

    if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request IDs array is required',
        messageAr: 'مصفوفة معرفات الطلبات مطلوبة',
      });
    }

    const requests = await prisma.courseRequest.findMany({
      where: {
        id: { in: requestIds },
        status: 'pending',
      },
      include: {
        student: true,
        course: true,
      },
    });

    if (requests.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No pending requests found',
        messageAr: 'لا توجد طلبات قيد الانتظار',
      });
    }

    const results = {
      approved: [],
      errors: [],
    };

    for (const request of requests) {
      try {
        // Check if already purchased
        const existingPurchase = await prisma.purchase.findUnique({
          where: {
            studentId_courseId: {
              studentId: request.studentId,
              courseId: request.courseId,
            },
          },
        });

        if (existingPurchase) {
          await prisma.courseRequest.update({
            where: { id: request.id },
            data: { status: 'approved' },
          });
          results.approved.push({ requestId: request.id, message: 'Already enrolled' });
          continue;
        }

        // Approve and enroll
        await prisma.$transaction(async (tx) => {
          await tx.courseRequest.update({
            where: { id: request.id },
            data: { status: 'approved' },
          });

          await tx.purchase.create({
            data: {
              studentId: request.studentId,
              courseId: request.courseId,
              amount: request.course.finalPrice || request.course.price,
            },
          });
        });

        // Send notification
        try {
          await notifyPurchase(
            request.studentId,
            request.courseId,
            parseFloat(request.course.finalPrice || request.course.price)
          );
        } catch (notifError) {
          console.error('Error sending notification:', notifError);
        }

        results.approved.push({ requestId: request.id });
      } catch (error) {
        results.errors.push({
          requestId: request.id,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      message: `${results.approved.length} request(s) approved successfully`,
      messageAr: `تم اعتماد ${results.approved.length} طلب بنجاح`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};


