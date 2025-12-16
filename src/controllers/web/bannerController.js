import prisma from '../../config/database.js';
import { convertImageUrls } from '../../utils/imageHelper.js';

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

    // Convert all image paths to full URLs
    const bannersWithFullUrls = convertImageUrls(banners, ['image']);

    res.json({
      success: true,
      data: { banners: bannersWithFullUrls },
    });
  } catch (error) {
    next(error);
  }
};

