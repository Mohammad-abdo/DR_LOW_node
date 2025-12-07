import prisma from '../../config/database.js';

export const getChapters = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const chapters = await prisma.chapter.findMany({
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
    });

    res.json({
      success: true,
      data: { chapters },
    });
  } catch (error) {
    next(error);
  }
};

export const createChapter = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { titleAr, titleEn, descriptionAr, descriptionEn, order } = req.body;

    if (!titleAr || !titleEn) {
      return res.status(400).json({
        success: false,
        message: 'Title (Arabic and English) are required',
      });
    }

    const chapter = await prisma.chapter.create({
      data: {
        courseId,
        titleAr,
        titleEn,
        descriptionAr,
        descriptionEn,
        order: order ? parseInt(order) : 0,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Chapter created successfully',
      data: { chapter },
    });
  } catch (error) {
    next(error);
  }
};

export const updateChapter = async (req, res, next) => {
  try {
    const { courseId, chapterId } = req.params;
    const { titleAr, titleEn, descriptionAr, descriptionEn, order } = req.body;

    const chapter = await prisma.chapter.update({
      where: { id: chapterId },
      data: {
        ...(titleAr && { titleAr }),
        ...(titleEn && { titleEn }),
        ...(descriptionAr !== undefined && { descriptionAr }),
        ...(descriptionEn !== undefined && { descriptionEn }),
        ...(order !== undefined && { order: parseInt(order) }),
      },
    });

    res.json({
      success: true,
      message: 'Chapter updated successfully',
      data: { chapter },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteChapter = async (req, res, next) => {
  try {
    const { courseId, chapterId } = req.params;

    await prisma.chapter.delete({
      where: { id: chapterId },
    });

    res.json({
      success: true,
      message: 'Chapter deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

