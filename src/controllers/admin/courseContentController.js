import prisma from '../../config/database.js';
import { notifyContentChange } from '../../services/notificationService.js';
import { convertImageUrls } from '../../utils/imageHelper.js';

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

    // Convert all image and video URLs to full URLs with domain name
    const dataWithUrls = convertImageUrls({
      chapters,
      content,
      allContent,
    }, ['image', 'coverImage', 'avatar', 'videoUrl', 'fileUrl']);

    res.json({
      success: true,
      data: dataWithUrls,
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

    // If videoUrl is provided (from chunked upload), use it
    if (videoUrl && videoUrl.startsWith('/uploads/videos/')) {
      finalVideoUrl = videoUrl;
    } else if (req.files) {
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

    // Notify enrolled students about new content (async, don't wait)
    notifyContentChange(courseId, 'create', titleAr, titleEn, req.user?.id).catch(err => {
      console.error('Failed to send notification for content creation:', err);
    });

    // Convert image and video URLs to full URLs with domain name
    const contentWithUrls = convertImageUrls(courseContent, ['image', 'coverImage', 'avatar', 'videoUrl', 'fileUrl']);

    res.status(201).json({
      success: true,
      message: 'Course content created successfully',
      data: { content: contentWithUrls },
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

    // If videoUrl is provided (from chunked upload), use it
    if (videoUrl && videoUrl.startsWith('/uploads/videos/')) {
      updateData.videoUrl = videoUrl;
    } else if (req.files) {
      if (req.files.video && req.files.video[0]) {
        updateData.videoUrl = `/uploads/videos/${req.files.video[0].filename}`;
      }
      if (req.files.file && req.files.file[0]) {
        updateData.fileUrl = `/uploads/files/${req.files.file[0].filename}`;
      }
    }
    
    // If fileUrl is provided, use it
    if (fileUrl && fileUrl.startsWith('/uploads/files/')) {
      updateData.fileUrl = fileUrl;
    } else {
      if (fileUrl !== undefined) updateData.fileUrl = fileUrl;
      if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
    }

    // Get content title before update for notification
    const oldContent = await prisma.courseContent.findUnique({
      where: { id: contentId },
      select: { titleAr: true, titleEn: true },
    });

    const courseContent = await prisma.courseContent.update({
      where: { id: contentId },
      data: updateData,
    });

    // Notify enrolled students about content update (async, don't wait)
    const contentTitleAr = titleAr || oldContent?.titleAr || 'المحتوى';
    const contentTitleEn = titleEn || oldContent?.titleEn || 'Content';
    notifyContentChange(courseId, 'update', contentTitleAr, contentTitleEn, req.user?.id).catch(err => {
      console.error('Failed to send notification for content update:', err);
    });

    // Convert image and video URLs to full URLs with domain name
    const contentWithUrls = convertImageUrls(courseContent, ['image', 'coverImage', 'avatar', 'videoUrl', 'fileUrl']);

    res.json({
      success: true,
      message: 'Course content updated successfully',
      data: { content: contentWithUrls },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCourseContent = async (req, res, next) => {
  try {
    const { courseId, contentId } = req.params;

    // Get content info before deletion for notification
    const content = await prisma.courseContent.findUnique({
      where: { id: contentId },
      select: { titleAr: true, titleEn: true },
    });

    await prisma.courseContent.delete({
      where: { id: contentId },
    });

    // Notify enrolled students about content deletion (async, don't wait)
    if (content) {
      notifyContentChange(courseId, 'delete', content.titleAr, content.titleEn, req.user?.id).catch(err => {
        console.error('Failed to send notification for content deletion:', err);
      });
    }

    res.json({
      success: true,
      message: 'Course content deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};


