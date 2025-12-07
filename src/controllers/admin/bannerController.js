import prisma from '../../config/database.js';

export const getAllBanners = async (req, res, next) => {
  try {
    const { active, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (active !== undefined) where.active = active === 'true';

    const [banners, total] = await Promise.all([
      prisma.banner.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { order: 'asc' },
      }),
      prisma.banner.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        banners,
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

export const getBannerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const banner = await prisma.banner.findUnique({
      where: { id },
    });

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found',
      });
    }

    res.json({
      success: true,
      data: { banner },
    });
  } catch (error) {
    next(error);
  }
};

export const createBanner = async (req, res, next) => {
  try {
    const { titleAr, titleEn, link, order = 0, active = true } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image is required',
      });
    }

    if (!titleAr || !titleEn) {
      return res.status(400).json({
        success: false,
        message: 'Title (Arabic and English) is required',
      });
    }

    const image = `/uploads/images/${req.file.filename}`;

    const banner = await prisma.banner.create({
      data: {
        image,
        titleAr,
        titleEn,
        link,
        order: parseInt(order),
        active: active === 'true' || active === true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: { banner },
    });
  } catch (error) {
    next(error);
  }
};

export const updateBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { titleAr, titleEn, link, order, active } = req.body;

    const banner = await prisma.banner.findUnique({ where: { id } });

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found',
      });
    }

    const updateData = {};
    if (titleAr) updateData.titleAr = titleAr;
    if (titleEn) updateData.titleEn = titleEn;
    if (link !== undefined) updateData.link = link;
    if (order !== undefined) updateData.order = parseInt(order);
    if (active !== undefined) updateData.active = active === 'true' || active === true;
    if (req.file) updateData.image = `/uploads/images/${req.file.filename}`;

    const updatedBanner = await prisma.banner.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'Banner updated successfully',
      data: { banner: updatedBanner },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBanner = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.banner.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Banner deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};



