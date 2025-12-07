import prisma from '../../config/database.js';

export const getAllSettings = async (req, res, next) => {
  try {
    const settings = await prisma.systemSettings.findMany({
      orderBy: { key: 'asc' },
    });

    res.json({
      success: true,
      data: { settings },
    });
  } catch (error) {
    next(error);
  }
};

export const getSettingByKey = async (req, res, next) => {
  try {
    const { key } = req.params;

    const setting = await prisma.systemSettings.findUnique({
      where: { key },
    });

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found',
      });
    }

    res.json({
      success: true,
      data: { setting },
    });
  } catch (error) {
    next(error);
  }
};

export const createOrUpdateSetting = async (req, res, next) => {
  try {
    const { key, valueAr, valueEn, value, description } = req.body;

    if (!key) {
      return res.status(400).json({
        success: false,
        message: 'Key is required',
      });
    }

    const setting = await prisma.systemSettings.upsert({
      where: { key },
      update: {
        ...(valueAr !== undefined && { valueAr }),
        ...(valueEn !== undefined && { valueEn }),
        ...(value !== undefined && { value }),
        ...(description !== undefined && { description }),
      },
      create: {
        key,
        valueAr,
        valueEn,
        value,
        description,
      },
    });

    res.json({
      success: true,
      message: 'Setting saved successfully',
      data: { setting },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSetting = async (req, res, next) => {
  try {
    const { key } = req.params;

    await prisma.systemSettings.delete({
      where: { key },
    });

    res.json({
      success: true,
      message: 'Setting deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};



