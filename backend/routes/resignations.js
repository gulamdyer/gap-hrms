const express = require('express');
const router = express.Router();
const resignationController = require('../controllers/resignationController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// List with filters and pagination
router.get('/', resignationController.listResignations);
// Create
router.post('/', resignationController.createResignation);
// Get by ID
router.get('/:id', resignationController.getResignationById);
// Update
router.put('/:id', resignationController.updateResignation);
// Delete
router.delete('/:id', resignationController.deleteResignation);

module.exports = router; 