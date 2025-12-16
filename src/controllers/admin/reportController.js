import prisma from '../../config/database.js';
import { PAYMENT_STATUS, ROLES } from '../../config/constants.js';
import XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateStudentReport = async (req, res, next) => {
  try {
    const { studentId, type = 'enrollment', format = 'json' } = req.query;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required',
      });
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId, role: ROLES.STUDENT },
      include: {
        enrollments: {
          include: {
            course: {
              include: {
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
            payment: true,
          },
        },
        progress: {
          include: {
            course: {
              select: {
                titleAr: true,
                titleEn: true,
              },
            },
          },
        },
        examResults: {
          include: {
            exam: {
              include: {
                course: {
                  select: {
                    titleAr: true,
                    titleEn: true,
                  },
                },
              },
            },
          },
        },
        ratings: {
          include: {
            course: {
              select: {
                titleAr: true,
                titleEn: true,
              },
            },
          },
        },
        payments: {
          where: {
            status: PAYMENT_STATUS.COMPLETED,
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    let reportData = {};

    switch (type) {
      case 'enrollment':
        reportData = {
          student: {
            nameAr: student.nameAr,
            nameEn: student.nameEn,
            email: student.email,
          },
          enrollments: student.enrollments.map(e => ({
            course: e.course.titleEn,
            teacher: e.course.teacher.nameEn,
            category: e.course.category.nameEn,
            amount: e.amount,
            date: e.createdAt,
          })),
        };
        break;
      case 'progress':
        reportData = {
          student: {
            nameAr: student.nameAr,
            nameEn: student.nameEn,
          },
          progress: student.progress.map(p => ({
            course: p.course.titleEn,
            progress: p.progress,
            completed: p.completed,
          })),
        };
        break;
      case 'payments':
        reportData = {
          student: {
            nameAr: student.nameAr,
            nameEn: student.nameEn,
          },
          payments: student.payments.map(p => ({
            amount: p.amount,
            method: p.paymentMethod,
            status: p.status,
            date: p.createdAt,
          })),
        };
        break;
      case 'ratings':
        reportData = {
          student: {
            nameAr: student.nameAr,
            nameEn: student.nameEn,
          },
          ratings: student.ratings.map(r => ({
            course: r.course.titleEn,
            rating: r.rating,
            comment: r.commentEn,
            date: r.createdAt,
          })),
        };
        break;
      default:
        reportData = {
          student: {
            nameAr: student.nameAr,
            nameEn: student.nameEn,
            email: student.email,
          },
          summary: {
            totalEnrollments: student.enrollments.length,
            totalPayments: student.payments.length,
            totalSpent: student.payments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
            coursesInProgress: student.progress.filter(p => !p.completed).length,
            completedCourses: student.progress.filter(p => p.completed).length,
          },
        };
    }

    if (format === 'xlsx' || format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(
        type === 'enrollment' ? reportData.enrollments :
        type === 'progress' ? reportData.progress :
        type === 'payments' ? reportData.payments :
        type === 'ratings' ? reportData.ratings :
        []
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=student-report-${studentId}.xlsx`);
      return res.send(buffer);
    }

    if (format === 'pdf') {
      const doc = new PDFDocument();
      const filename = `student-report-${studentId}-${Date.now()}.pdf`;
      const filepath = path.join(__dirname, '../../uploads/reports', filename);
      
      // Ensure directory exists
      const dir = path.dirname(filepath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      doc.pipe(fs.createWriteStream(filepath));
      doc.fontSize(20).text('Student Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Student: ${reportData.student.nameEn}`);
      doc.text(`Email: ${student.email}`);
      doc.moveDown();

      // Add report content based on type
      if (type === 'enrollment' && reportData.enrollments) {
        doc.fontSize(16).text('Enrollments', { underline: true });
        reportData.enrollments.forEach((e, i) => {
          doc.fontSize(12).text(`${i + 1}. ${e.course} - ${e.teacher} - ${e.amount} KWD`);
        });
      }

      doc.end();

      return new Promise((resolve, reject) => {
        doc.on('end', () => {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
          res.sendFile(filepath, (err) => {
            if (err) reject(err);
            else {
              // Clean up file after sending
              setTimeout(() => fs.unlinkSync(filepath), 1000);
              resolve();
            }
          });
        });
        doc.on('error', reject);
      });
    }

    res.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    next(error);
  }
};

export const generateTeacherReport = async (req, res, next) => {
  try {
    const { teacherId, format = 'json' } = req.query;

    if (!teacherId) {
      return res.status(400).json({
        success: false,
        message: 'Teacher ID is required',
      });
    }

    const teacher = await prisma.user.findUnique({
      where: { id: teacherId, role: ROLES.TEACHER },
      include: {
        coursesCreated: {
          include: {
            _count: {
              select: {
                purchases: true,
                ratings: true,
              },
            },
            purchases: {
              include: {
                payment: {
                  where: {
                    status: PAYMENT_STATUS.COMPLETED,
                  },
                },
              },
            },
            ratings: {
              select: {
                rating: true,
              },
            },
          },
        },
      },
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    const reportData = {
      teacher: {
        nameAr: teacher.nameAr,
        nameEn: teacher.nameEn,
        email: teacher.email,
      },
      courses: teacher.coursesCreated.map(course => ({
        title: course.titleEn,
        enrollments: course._count.purchases,
        averageRating: course.ratings.length > 0
          ? course.ratings.reduce((sum, r) => sum + r.rating, 0) / course.ratings.length
          : 0,
        totalEarnings: course.purchases.reduce((sum, p) => {
          return sum + (p.payment?.amount || 0);
        }, 0),
      })),
      summary: {
        totalCourses: teacher.coursesCreated.length,
        totalEnrollments: teacher.coursesCreated.reduce((sum, c) => sum + c._count.purchases, 0),
        totalEarnings: teacher.coursesCreated.reduce((sum, course) => {
          return sum + course.purchases.reduce((courseSum, p) => {
            return courseSum + (p.payment?.amount || 0);
          }, 0);
        }, 0),
      },
    };

    if (format === 'xlsx' || format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(reportData.courses);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Courses');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=teacher-report-${teacherId}.xlsx`);
      return res.send(buffer);
    }

    if (format === 'pdf') {
      const doc = new PDFDocument();
      const filename = `teacher-report-${teacherId}-${Date.now()}.pdf`;
      const filepath = path.join(__dirname, '../../uploads/reports', filename);
      
      // Ensure directory exists
      const dir = path.dirname(filepath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      doc.pipe(fs.createWriteStream(filepath));
      doc.fontSize(20).text('Teacher Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Teacher: ${reportData.teacher.nameEn}`);
      doc.text(`Email: ${teacher.email}`);
      doc.moveDown();
      doc.fontSize(14).text('Summary', { underline: true });
      doc.fontSize(12).text(`Total Courses: ${reportData.summary.totalCourses}`);
      doc.text(`Total Enrollments: ${reportData.summary.totalEnrollments}`);
      doc.text(`Total Earnings: ${reportData.summary.totalEarnings.toFixed(2)} KWD`);
      doc.moveDown();

      if (reportData.courses.length > 0) {
        doc.fontSize(16).text('Courses', { underline: true });
        reportData.courses.forEach((course, i) => {
          doc.fontSize(12).text(`${i + 1}. ${course.title}`);
          doc.fontSize(10).text(`   Enrollments: ${course.enrollments} | Rating: ${course.averageRating.toFixed(2)} | Earnings: ${course.totalEarnings.toFixed(2)} KWD`);
          doc.moveDown(0.3);
        });
      }

      doc.end();

      return new Promise((resolve, reject) => {
        doc.on('end', () => {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
          res.sendFile(filepath, (err) => {
            if (err) reject(err);
            else {
              // Clean up file after sending
              setTimeout(() => {
                if (fs.existsSync(filepath)) {
                  fs.unlinkSync(filepath);
                }
              }, 1000);
              resolve();
            }
          });
        });
        doc.on('error', reject);
      });
    }

    res.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    next(error);
  }
};

export const generateFinancialReport = async (req, res, next) => {
  try {
    const { period = 'month', format = 'json' } = req.query;
    const now = new Date();
    let startDate;

    switch (period) {
      case 'day':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    const payments = await prisma.payment.findMany({
      where: {
        status: PAYMENT_STATUS.COMPLETED,
        createdAt: { gte: startDate },
      },
      include: {
        student: {
          select: {
            nameEn: true,
            email: true,
          },
        },
        purchase: {
          include: {
            course: {
              include: {
                teacher: {
                  select: {
                    nameEn: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const reportData = {
      period,
      startDate,
      endDate: new Date(),
      totalRevenue: payments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
      totalTransactions: payments.length,
      paymentsByMethod: {},
      earningsByCourse: {},
      earningsByTeacher: {},
      dailyRevenue: {},
    };

    payments.forEach(payment => {
      // By method
      const method = payment.paymentMethod;
      reportData.paymentsByMethod[method] = (reportData.paymentsByMethod[method] || 0) + parseFloat(payment.amount);

      // By course
      if (payment.purchase?.course) {
        const courseId = payment.purchase.course.id;
        reportData.earningsByCourse[courseId] = {
          title: payment.purchase.course.titleEn,
          earnings: (reportData.earningsByCourse[courseId]?.earnings || 0) + parseFloat(payment.amount),
        };
      }

      // By teacher
      if (payment.purchase?.course?.teacher) {
        const teacherId = payment.purchase.course.teacher.id;
        reportData.earningsByTeacher[teacherId] = {
          name: payment.purchase.course.teacher.nameEn,
          earnings: (reportData.earningsByTeacher[teacherId]?.earnings || 0) + parseFloat(payment.amount),
        };
      }

      // Daily revenue
      const date = payment.createdAt.toISOString().split('T')[0];
      reportData.dailyRevenue[date] = (reportData.dailyRevenue[date] || 0) + parseFloat(payment.amount);
    });

    if (format === 'xlsx' || format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(
        payments.map(p => ({
          date: p.createdAt,
          student: p.student.nameEn,
          course: p.purchase?.course?.titleEn || 'N/A',
          amount: p.amount,
          method: p.paymentMethod,
        }))
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=financial-report-${period}.xlsx`);
      return res.send(buffer);
    }

    res.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    next(error);
  }
};

// Generate report for all students
export const generateAllStudentsReport = async (req, res, next) => {
  try {
    const { format = 'json' } = req.query;
    console.log('📊 Generating students report, format:', format);

    const students = await prisma.user.findMany({
      where: { role: ROLES.STUDENT },
      include: {
        _count: {
          select: {
            purchases: true,
            payments: true,
            progress: true,
          },
        },
        purchases: {
          include: {
            course: {
              select: {
                titleEn: true,
                titleAr: true,
              },
            },
            payment: {
              where: {
                status: PAYMENT_STATUS.COMPLETED,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`📊 Found ${students.length} students`);

    const reportData = students.map(student => {
      try {
        const totalSpent = student.purchases.reduce((sum, p) => {
          try {
            return sum + (p.payment?.amount ? parseFloat(p.payment.amount) || 0 : 0);
          } catch (e) {
            console.warn('Error calculating totalSpent for student:', student.id, e);
            return sum;
          }
        }, 0);

        return {
          id: student.id,
          nameAr: student.nameAr || 'N/A',
          nameEn: student.nameEn || 'N/A',
          email: student.email || 'N/A',
          phone: student.phone || 'N/A',
          createdAt: student.createdAt,
          totalEnrollments: student._count?.purchases || 0,
          totalPayments: student._count?.payments || 0,
          totalCoursesInProgress: student._count?.progress || 0,
          totalSpent: totalSpent || 0,
        };
      } catch (e) {
        console.error('Error processing student:', student.id, e);
        return {
          id: student.id,
          nameAr: 'Error',
          nameEn: 'Error',
          email: student.email || 'N/A',
          phone: 'N/A',
          createdAt: student.createdAt,
          totalEnrollments: 0,
          totalPayments: 0,
          totalCoursesInProgress: 0,
          totalSpent: 0,
        };
      }
    });

    console.log(`📊 Processed ${reportData.length} students for report`);

    if (format === 'xlsx' || format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(reportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=students-report-${Date.now()}.xlsx`);
      return res.send(buffer);
    }

    if (format === 'pdf') {
      console.log('📄 Starting PDF generation...');
      
      try {
        const doc = new PDFDocument();
        const filename = `students-report-${Date.now()}.pdf`;
        
        // Set headers BEFORE piping to response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        
        // Pipe PDF directly to response
        doc.pipe(res);
        
        // Handle errors
        doc.on('error', (err) => {
          console.error('❌ PDF generation error:', err);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              message: 'Error generating PDF report',
              messageAr: 'خطأ في إنشاء تقرير PDF',
              error: err.message,
            });
          }
        });

        // Generate PDF content
        try {
          doc.fontSize(20).text('Students Report', { align: 'center' });
          doc.moveDown();
          doc.fontSize(12).text(`Total Students: ${students.length}`);
          doc.text(`Generated: ${new Date().toLocaleString()}`);
          doc.moveDown();

          // Add table header
          doc.fontSize(10).text('Name', 50, doc.y, { width: 150 });
          doc.text('Email', 200, doc.y - 15, { width: 200 });
          doc.text('Enrollments', 400, doc.y - 15, { width: 80 });
          doc.text('Total Spent', 480, doc.y - 15, { width: 100 });
          doc.moveDown(0.5);
          doc.moveTo(50, doc.y).lineTo(580, doc.y).stroke();
          doc.moveDown(0.3);

          // Add student rows
          reportData.forEach((student, index) => {
            try {
              if (doc.y > 700) {
                doc.addPage();
                doc.fontSize(10).text('Name', 50, doc.y, { width: 150 });
                doc.text('Email', 200, doc.y - 15, { width: 200 });
                doc.text('Enrollments', 400, doc.y - 15, { width: 80 });
                doc.text('Total Spent', 480, doc.y - 15, { width: 100 });
                doc.moveDown(0.5);
                doc.moveTo(50, doc.y).lineTo(580, doc.y).stroke();
                doc.moveDown(0.3);
              }
              const name = String(student.nameEn || student.nameAr || 'N/A').substring(0, 30);
              const email = String(student.email || 'N/A').substring(0, 40);
              doc.fontSize(9).text(name, 50, doc.y, { width: 150 });
              doc.text(email, 200, doc.y - 12, { width: 200 });
              doc.text(String(student.totalEnrollments || 0), 400, doc.y - 12, { width: 80 });
              doc.text(`${Number(student.totalSpent || 0).toFixed(2)} KWD`, 480, doc.y - 12, { width: 100 });
              doc.moveDown(0.4);
            } catch (rowError) {
              console.error(`Error adding student row ${index}:`, rowError);
              // Continue with next student
            }
          });

          doc.end();
          console.log('✅ PDF generation completed');
          return; // Don't continue to JSON response
        } catch (contentError) {
          console.error('❌ Error generating PDF content:', contentError);
          doc.end();
          if (!res.headersSent) {
            return res.status(500).json({
              success: false,
              message: 'Error generating PDF content',
              messageAr: 'خطأ في إنشاء محتوى PDF',
              error: contentError.message,
            });
          }
        }
      } catch (pdfError) {
        console.error('❌ PDF creation error:', pdfError);
        if (!res.headersSent) {
          return res.status(500).json({
            success: false,
            message: 'Error creating PDF report',
            messageAr: 'خطأ في إنشاء تقرير PDF',
            error: pdfError.message,
            stack: process.env.NODE_ENV === 'development' ? pdfError.stack : undefined,
          });
        }
      }
    }

    res.json({
      success: true,
      data: reportData,
      total: students.length,
    });
  } catch (error) {
    next(error);
  }
};

// Generate report for all teachers
export const generateAllTeachersReport = async (req, res, next) => {
  try {
    const { format = 'json' } = req.query;

    const teachers = await prisma.user.findMany({
      where: { role: ROLES.TEACHER },
      include: {
        coursesCreated: {
          include: {
            _count: {
              select: {
                purchases: true,
                ratings: true,
              },
            },
            purchases: {
              include: {
                payment: {
                  where: {
                    status: PAYMENT_STATUS.COMPLETED,
                  },
                },
              },
            },
            ratings: {
              select: {
                rating: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const reportData = teachers.map(teacher => {
      const totalEarnings = teacher.coursesCreated.reduce((sum, course) => {
        return sum + course.purchases.reduce((courseSum, p) => {
          return courseSum + (p.payment?.amount ? parseFloat(p.payment.amount) : 0);
        }, 0);
      }, 0);

      const totalEnrollments = teacher.coursesCreated.reduce((sum, course) => {
        return sum + course._count.purchases;
      }, 0);

      const averageRating = teacher.coursesCreated.length > 0
        ? teacher.coursesCreated.reduce((sum, course) => {
            const courseRating = course.ratings.length > 0
              ? course.ratings.reduce((rSum, r) => rSum + r.rating, 0) / course.ratings.length
              : 0;
            return sum + courseRating;
          }, 0) / teacher.coursesCreated.length
        : 0;

      return {
        id: teacher.id,
        nameAr: teacher.nameAr,
        nameEn: teacher.nameEn,
        email: teacher.email,
        phone: teacher.phone || 'N/A',
        createdAt: teacher.createdAt,
        totalCourses: teacher.coursesCreated.length,
        totalEnrollments,
        totalEarnings,
        averageRating: averageRating.toFixed(2),
      };
    });

    if (format === 'xlsx' || format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(reportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Teachers');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=teachers-report-${Date.now()}.xlsx`);
      return res.send(buffer);
    }

    if (format === 'pdf') {
      console.log('📄 Starting teachers PDF generation...');
      
      try {
        const doc = new PDFDocument();
        const filename = `teachers-report-${Date.now()}.pdf`;
        
        // Set headers BEFORE piping to response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        
        // Pipe PDF directly to response
        doc.pipe(res);
        
        // Handle errors
        doc.on('error', (err) => {
          console.error('❌ PDF generation error:', err);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              message: 'Error generating PDF report',
              messageAr: 'خطأ في إنشاء تقرير PDF',
              error: err.message,
            });
          }
        });

        // Generate PDF content
        try {
          doc.fontSize(20).text('Teachers Report', { align: 'center' });
          doc.moveDown();
          doc.fontSize(12).text(`Total Teachers: ${teachers.length}`);
          doc.text(`Generated: ${new Date().toLocaleString()}`);
          doc.moveDown();

          // Add table header
          doc.fontSize(10).text('Name', 50, doc.y, { width: 150 });
          doc.text('Email', 200, doc.y - 15, { width: 200 });
          doc.text('Courses', 400, doc.y - 15, { width: 60 });
          doc.text('Enrollments', 460, doc.y - 15, { width: 80 });
          doc.text('Earnings', 540, doc.y - 15, { width: 100 });
          doc.moveDown(0.5);
          doc.moveTo(50, doc.y).lineTo(640, doc.y).stroke();
          doc.moveDown(0.3);

          // Add teacher rows
          reportData.forEach((teacher, index) => {
            try {
              if (doc.y > 700) {
                doc.addPage();
                doc.fontSize(10).text('Name', 50, doc.y, { width: 150 });
                doc.text('Email', 200, doc.y - 15, { width: 200 });
                doc.text('Courses', 400, doc.y - 15, { width: 60 });
                doc.text('Enrollments', 460, doc.y - 15, { width: 80 });
                doc.text('Earnings', 540, doc.y - 15, { width: 100 });
                doc.moveDown(0.5);
                doc.moveTo(50, doc.y).lineTo(640, doc.y).stroke();
                doc.moveDown(0.3);
              }
              const name = String(teacher.nameEn || teacher.nameAr || 'N/A').substring(0, 30);
              const email = String(teacher.email || 'N/A').substring(0, 40);
              doc.fontSize(9).text(name, 50, doc.y, { width: 150 });
              doc.text(email, 200, doc.y - 12, { width: 200 });
              doc.text(String(teacher.totalCourses || 0), 400, doc.y - 12, { width: 60 });
              doc.text(String(teacher.totalEnrollments || 0), 460, doc.y - 12, { width: 80 });
              doc.text(`${Number(teacher.totalEarnings || 0).toFixed(2)} KWD`, 540, doc.y - 12, { width: 100 });
              doc.moveDown(0.4);
            } catch (rowError) {
              console.error(`Error adding teacher row ${index}:`, rowError);
              // Continue with next teacher
            }
          });

          doc.end();
          console.log('✅ Teachers PDF generation completed');
          return; // Don't continue to JSON response
        } catch (contentError) {
          console.error('❌ Error generating PDF content:', contentError);
          doc.end();
          if (!res.headersSent) {
            return res.status(500).json({
              success: false,
              message: 'Error generating PDF content',
              messageAr: 'خطأ في إنشاء محتوى PDF',
              error: contentError.message,
            });
          }
        }
      } catch (pdfError) {
        console.error('❌ PDF creation error:', pdfError);
        if (!res.headersSent) {
          return res.status(500).json({
            success: false,
            message: 'Error creating PDF report',
            messageAr: 'خطأ في إنشاء تقرير PDF',
            error: pdfError.message,
            stack: process.env.NODE_ENV === 'development' ? pdfError.stack : undefined,
          });
        }
      }
    }

    res.json({
      success: true,
      data: reportData,
      total: teachers.length,
    });
  } catch (error) {
    next(error);
  }
};

// Generate report for all courses
export const generateAllCoursesReport = async (req, res, next) => {
  try {
    const { format = 'json' } = req.query;

    const courses = await prisma.course.findMany({
      include: {
        teacher: {
          select: {
            nameAr: true,
            nameEn: true,
            email: true,
          },
        },
        category: {
          select: {
            nameAr: true,
            nameEn: true,
          },
        },
        _count: {
          select: {
            purchases: true,
            ratings: true,
            content: true,
          },
        },
        ratings: {
          select: {
            rating: true,
          },
        },
        purchases: {
          include: {
            payment: {
              where: {
                status: PAYMENT_STATUS.COMPLETED,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const reportData = courses.map(course => {
      const averageRating = course.ratings.length > 0
        ? course.ratings.reduce((sum, r) => sum + r.rating, 0) / course.ratings.length
        : 0;

      const totalRevenue = course.purchases.reduce((sum, p) => {
        return sum + (p.payment?.amount ? parseFloat(p.payment.amount) : 0);
      }, 0);

      return {
        id: course.id,
        titleAr: course.titleAr,
        titleEn: course.titleEn,
        teacher: course.teacher.nameEn || course.teacher.nameAr || 'N/A',
        category: course.category.nameEn || course.category.nameAr || 'N/A',
        price: course.price,
        status: course.status,
        level: course.level,
        enrollments: course._count.purchases,
        ratings: course._count.ratings,
        averageRating: averageRating.toFixed(2),
        contentCount: course._count.content,
        totalRevenue: totalRevenue.toFixed(2),
        isFeatured: course.isFeatured || false,
        isBasic: course.isBasic || false,
        createdAt: course.createdAt,
      };
    });

    if (format === 'xlsx' || format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(reportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Courses');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=courses-report-${Date.now()}.xlsx`);
      return res.send(buffer);
    }

    if (format === 'pdf') {
      console.log('📄 Starting courses PDF generation...');
      
      try {
        const doc = new PDFDocument();
        const filename = `courses-report-${Date.now()}.pdf`;
        
        // Set headers BEFORE piping to response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        
        // Pipe PDF directly to response
        doc.pipe(res);
        
        // Handle errors
        doc.on('error', (err) => {
          console.error('❌ PDF generation error:', err);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              message: 'Error generating PDF report',
              messageAr: 'خطأ في إنشاء تقرير PDF',
              error: err.message,
            });
          }
        });

        // Generate PDF content
        try {
          doc.fontSize(20).text('Courses Report', { align: 'center' });
          doc.moveDown();
          doc.fontSize(12).text(`Total Courses: ${courses.length}`);
          doc.text(`Generated: ${new Date().toLocaleString()}`);
          doc.moveDown();

          // Add table header
          doc.fontSize(9).text('Title', 50, doc.y, { width: 150 });
          doc.text('Teacher', 200, doc.y - 12, { width: 120 });
          doc.text('Category', 320, doc.y - 12, { width: 100 });
          doc.text('Enrollments', 420, doc.y - 12, { width: 70 });
          doc.text('Revenue', 490, doc.y - 12, { width: 80 });
          doc.moveDown(0.5);
          doc.moveTo(50, doc.y).lineTo(570, doc.y).stroke();
          doc.moveDown(0.3);

          // Add course rows
          reportData.forEach((course, index) => {
            try {
              if (doc.y > 700) {
                doc.addPage();
                doc.fontSize(9).text('Title', 50, doc.y, { width: 150 });
                doc.text('Teacher', 200, doc.y - 12, { width: 120 });
                doc.text('Category', 320, doc.y - 12, { width: 100 });
                doc.text('Enrollments', 420, doc.y - 12, { width: 70 });
                doc.text('Revenue', 490, doc.y - 12, { width: 80 });
                doc.moveDown(0.5);
                doc.moveTo(50, doc.y).lineTo(570, doc.y).stroke();
                doc.moveDown(0.3);
              }
              const title = String(course.titleEn || course.titleAr || 'N/A').substring(0, 30);
              const teacher = String(course.teacher || 'N/A').substring(0, 20);
              const category = String(course.category || 'N/A').substring(0, 20);
              doc.fontSize(8).text(title, 50, doc.y, { width: 150 });
              doc.text(teacher, 200, doc.y - 10, { width: 120 });
              doc.text(category, 320, doc.y - 10, { width: 100 });
              doc.text(String(course.enrollments || 0), 420, doc.y - 10, { width: 70 });
              doc.text(`${course.totalRevenue || '0.00'} KWD`, 490, doc.y - 10, { width: 80 });
              doc.moveDown(0.3);
            } catch (rowError) {
              console.error(`Error adding course row ${index}:`, rowError);
              // Continue with next course
            }
          });

          doc.end();
          console.log('✅ Courses PDF generation completed');
          return; // Don't continue to JSON response
        } catch (contentError) {
          console.error('❌ Error generating PDF content:', contentError);
          doc.end();
          if (!res.headersSent) {
            return res.status(500).json({
              success: false,
              message: 'Error generating PDF content',
              messageAr: 'خطأ في إنشاء محتوى PDF',
              error: contentError.message,
            });
          }
        }
      } catch (pdfError) {
        console.error('❌ PDF creation error:', pdfError);
        if (!res.headersSent) {
          return res.status(500).json({
            success: false,
            message: 'Error creating PDF report',
            messageAr: 'خطأ في إنشاء تقرير PDF',
            error: pdfError.message,
            stack: process.env.NODE_ENV === 'development' ? pdfError.stack : undefined,
          });
        }
      }
    }

    res.json({
      success: true,
      data: reportData,
      total: courses.length,
    });
  } catch (error) {
    console.error('Error generating courses report:', error);
    next(error);
  }
};



