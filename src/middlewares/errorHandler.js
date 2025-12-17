import multer from 'multer';

export const errorHandler = (err, req, res, next) => {
  // Handle multer file size errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'File too large. Maximum file size is 5GB for videos.',
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error',
    });
  }

  // Log error details
  console.error('Error Details:', {
    message: err.message,
    name: err.name,
    code: err.code,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors,
    });
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Duplicate entry',
        field: err.meta?.target?.[0],
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Record not found',
      });
    }
    // Handle other Prisma errors
    return res.status(500).json({
      success: false,
      message: 'Database error',
      ...(process.env.NODE_ENV === 'development' && { 
        prismaCode: err.code,
        prismaMeta: err.meta,
      }),
    });
  }

  // Handle Prisma validation errors
  if (err.name === 'PrismaClientValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid data provided',
      ...(process.env.NODE_ENV === 'development' && { details: err.message }),
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err.toString(),
    }),
  });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
};



