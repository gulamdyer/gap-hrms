const Resignation = require('../models/Resignation');

// Create new resignation/termination
const createResignation = async (req, res) => {
  try {
    const data = {
      employeeId: req.body.employeeId,
      type: req.body.type,
      reason: req.body.reason,
      noticeDate: req.body.noticeDate,
      lastWorkingDate: req.body.lastWorkingDate,
      status: req.body.status || 'PENDING',
      comments: req.body.comments,
      attachmentUrl: req.body.attachmentUrl,
      createdBy: req.user.userId
    };
    const id = await Resignation.create(data);
    const resignation = await Resignation.findById(id);
    res.status(201).json({ success: true, data: resignation });
  } catch (error) {
    console.error('Error creating resignation:', error);
    res.status(500).json({ success: false, message: 'Failed to create resignation', error: error.message });
  }
};

// Update resignation/termination
const updateResignation = async (req, res) => {
  try {
    const { id } = req.params;
    await Resignation.update(id, req.body);
    const resignation = await Resignation.findById(id);
    res.json({ success: true, data: resignation });
  } catch (error) {
    console.error('Error updating resignation:', error);
    res.status(500).json({ success: false, message: 'Failed to update resignation', error: error.message });
  }
};

// Delete resignation/termination
const deleteResignation = async (req, res) => {
  try {
    const { id } = req.params;
    await Resignation.delete(id);
    res.json({ success: true, message: 'Resignation deleted' });
  } catch (error) {
    console.error('Error deleting resignation:', error);
    res.status(500).json({ success: false, message: 'Failed to delete resignation', error: error.message });
  }
};

// Get by ID
const getResignationById = async (req, res) => {
  try {
    const { id } = req.params;
    const resignation = await Resignation.findById(id);
    if (!resignation) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.json({ success: true, data: resignation });
  } catch (error) {
    console.error('Error fetching resignation:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch resignation', error: error.message });
  }
};

// List with filters and pagination
const listResignations = async (req, res) => {
  try {
    const { status, type, employeeId, search, page = 1, limit = 10 } = req.query;
    const filters = { status, type, employeeId, search };
    const all = await Resignation.getAll(filters);
    const totalItems = all.length;
    const totalPages = Math.ceil(totalItems / limit);
    const paginated = all.slice((page - 1) * limit, page * limit);
    res.json({ success: true, data: paginated, pagination: { currentPage: +page, totalPages, totalItems, itemsPerPage: +limit } });
  } catch (error) {
    console.error('Error listing resignations:', error);
    res.status(500).json({ success: false, message: 'Failed to list resignations', error: error.message });
  }
};

module.exports = {
  createResignation,
  updateResignation,
  deleteResignation,
  getResignationById,
  listResignations
}; 