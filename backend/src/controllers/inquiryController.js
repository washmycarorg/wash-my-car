import prisma from '../config/db.js';

// Public: Submit inquiry or complaint
export const submitInquiry = async (req, res) => {
  try {
    const { name, phone, email, service, message, images, type = 'INQUIRY' } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and Phone number are required' });
    }

    let imagesData = null;
    if (images) {
      if (Array.isArray(images)) {
        imagesData = JSON.stringify(images.slice(0, 3));
      } else if (typeof images === 'string') {
        imagesData = images;
      }
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : null,
        service: service || 'General Doorstep Wash',
        message: message ? message.trim() : 'Inquiry submitted from website',
        images: imagesData,
        type: type.toUpperCase(), // INQUIRY, COMPLAINT, FRANCHISE
        status: 'PENDING'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Inquiry received successfully! Our representative will contact you shortly.',
      inquiry
    });
  } catch (error) {
    console.error('Error submitting inquiry:', error);
    res.status(500).json({ error: error.message });
  }
};

// Admin: Get all inquiries / complaints
export const getAdminInquiries = async (req, res) => {
  try {
    const { status, type, search } = req.query;

    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (type && type !== 'ALL') {
      where.type = type;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { message: { contains: search, mode: 'insensitive' } }
      ];
    }

    const inquiries = await prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    const pendingCount = await prisma.inquiry.count({ where: { status: 'PENDING' } });
    const complaintCount = await prisma.inquiry.count({ where: { type: 'COMPLAINT' } });

    res.json({
      inquiries,
      stats: {
        total: inquiries.length,
        pending: pendingCount,
        complaints: complaintCount
      }
    });
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).json({ error: error.message });
  }
};

// Admin: Update inquiry status or notes
export const updateInquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const updated = await prisma.inquiry.update({
      where: { id: Number(id) },
      data: {
        ...(status ? { status } : {}),
        ...(notes !== undefined ? { notes } : {})
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating inquiry:', error);
    res.status(500).json({ error: error.message });
  }
};

// Admin: Delete inquiry
export const deleteInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.inquiry.delete({ where: { id: Number(id) } });
    res.json({ success: true, message: 'Inquiry removed successfully' });
  } catch (error) {
    console.error('Error deleting inquiry:', error);
    res.status(500).json({ error: error.message });
  }
};
