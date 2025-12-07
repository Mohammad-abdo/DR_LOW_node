import prisma from '../../config/database.js';
import { TICKET_STATUS } from '../../config/constants.js';

export const getAllTickets = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          user: {
            select: {
              id: true,
              nameAr: true,
              nameEn: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.ticket.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        tickets,
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

export const getTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    res.json({
      success: true,
      data: { ticket },
    });
  } catch (error) {
    next(error);
  }
};

export const replyToTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { adminReply, status } = req.body;

    if (!adminReply) {
      return res.status(400).json({
        success: false,
        message: 'Reply message is required',
      });
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        adminReply,
        repliedAt: new Date(),
        status: status || TICKET_STATUS.RESOLVED,
      },
      include: {
        user: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Reply sent successfully',
      data: { ticket },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTicketStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(TICKET_STATUS).includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ticket status',
      });
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data: { status },
    });

    res.json({
      success: true,
      message: 'Ticket status updated successfully',
      data: { ticket },
    });
  } catch (error) {
    next(error);
  }
};



