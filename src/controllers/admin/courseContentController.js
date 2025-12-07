import prisma from '../../config/database.js';

export const getCourseContent = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const [chapters, content] = await Promise.all([
      prisma.chapter.findMany({
        where: { courseId },
        include: {
          content: {
            orderBy: { order: 'asc' },
          },
          _count: {
            select: { content: true },
          },
        },
        orderBy: { order: 'asc' },
      }),
      prisma.courseContent.findMany({
        where: { 
          courseId, 
          chapterId: null 
        },
        orderBy: { order: 'asc' },
      }),
    ]);

    // Also get all content directly (including content in chapters) for easier access
    const allContent = await prisma.courseContent.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
    });

    console.log(`Course ${courseId} - Chapters: ${chapters.length}, Standalone Content: ${content.length}, Total Content: ${allContent.length}`);

    res.json({
      success: true,
      data: { 
        chapters, 
        content,
        allContent, // Include all content for easier access
      },
    });
  } catch (error) {
    console.error("Error in getCourseContent:", error);
    next(error);
  }
};

export const createCourseContent = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const {
      type,
      titleAr,
      titleEn,
      descriptionAr,
      descriptionEn,
      content,
      fileUrl,
      videoUrl,
      duration,
      order,
      isFree,
      chapterId,
      isIntroVideo,
    } = req.body;

    if (!type || !titleAr || !titleEn) {
      return res.status(400).json({
        success: false,
        message: 'Type, title (Arabic and English) are required',
      });
    }

    // Handle file uploads
    let finalVideoUrl = videoUrl;
    let finalFileUrl = fileUrl;

    if (req.files) {
      if (req.files.video && req.files.video[0]) {
        finalVideoUrl = `/uploads/videos/${req.files.video[0].filename}`;
      }
      if (req.files.file && req.files.file[0]) {
        finalFileUrl = `/uploads/files/${req.files.file[0].filename}`;
      }
    }

    const courseContent = await prisma.courseContent.create({
      data: {
        courseId,
        chapterId: chapterId || null,
        type,
        titleAr,
        titleEn,
        descriptionAr,
        descriptionEn,
        content,
        fileUrl: finalFileUrl,
        videoUrl: finalVideoUrl,
        duration: duration ? parseInt(duration) : null,
        order: order ? parseInt(order) : 0,
        isFree: isFree === 'true' || isFree === true,
        isIntroVideo: isIntroVideo === 'true' || isIntroVideo === true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Course content created successfully',
      data: { content: courseContent },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCourseContent = async (req, res, next) => {
  try {
    const { courseId, contentId } = req.params;
    const {
      type,
      titleAr,
      titleEn,
      descriptionAr,
      descriptionEn,
      content,
      fileUrl,
      videoUrl,
      duration,
      order,
      isFree,
      chapterId,
      isIntroVideo,
    } = req.body;

    // Handle file uploads
    const updateData = {
      ...(type && { type }),
      ...(titleAr && { titleAr }),
      ...(titleEn && { titleEn }),
      ...(descriptionAr !== undefined && { descriptionAr }),
      ...(descriptionEn !== undefined && { descriptionEn }),
      ...(content !== undefined && { content }),
      ...(duration !== undefined && { duration: duration ? parseInt(duration) : null }),
      ...(order !== undefined && { order: parseInt(order) || 0 }),
      ...(isFree !== undefined && { isFree: isFree === 'true' || isFree === true }),
      ...(chapterId !== undefined && { chapterId: chapterId || null }),
      ...(isIntroVideo !== undefined && { isIntroVideo: isIntroVideo === 'true' || isIntroVideo === true }),
    };

    if (req.files) {
      if (req.files.video && req.files.video[0]) {
        updateData.videoUrl = `/uploads/videos/${req.files.video[0].filename}`;
      }
      if (req.files.file && req.files.file[0]) {
        updateData.fileUrl = `/uploads/files/${req.files.file[0].filename}`;
      }
    } else {
      if (fileUrl !== undefined) updateData.fileUrl = fileUrl;
      if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
    }

    const courseContent = await prisma.courseContent.update({
      where: { id: contentId },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'Course content updated successfully',
      data: { content: courseContent },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCourseContent = async (req, res, next) => {
  try {
    const { courseId, contentId } = req.params;

    await prisma.courseContent.delete({
      where: { id: contentId },
    });

    res.json({
      success: true,
      message: 'Course content deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};


