import prisma from '../../config/database.js';

export const getBanners = async (req, res, next) => {
  try {
    const { active } = req.query;
    
    const where = {};
    if (active === 'true') {
      where.active = true;
    }

    const banners = await prisma.banner.findMany({
      where,
      orderBy: { order: 'asc' },
    });

    res.json({
      success: true,
      data: { banners },
    });
  } catch (error) {
    next(error);
  }
};

