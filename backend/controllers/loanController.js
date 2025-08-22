const Loan = require('../models/Loan');
const { validateLoanData } = require('../middleware/validation');

// Get all loans with pagination and filters
const getAllLoans = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, loanType, employeeId, status } = req.query;
    
    // Build filters object
    const filters = {};
    if (search) filters.search = search;
    if (loanType) filters.loanType = loanType;
    if (employeeId) filters.employeeId = parseInt(employeeId);
    if (status) filters.status = status;
    
    const loans = await Loan.getAllLoans(filters);
    
    // Calculate pagination
    const totalItems = loans.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedLoans = loans.slice(startIndex, endIndex);
    
    res.json({
      data: paginatedLoans,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching loans:', error);
    res.status(500).json({ message: 'Failed to fetch loans' });
  }
};

// Get loan by ID
const getLoanById = async (req, res) => {
  try {
    const { id } = req.params;
    const loan = await Loan.findById(parseInt(id));
    
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }
    
    res.json({ data: loan });
  } catch (error) {
    console.error('Error fetching loan:', error);
    res.status(500).json({ message: 'Failed to fetch loan' });
  }
};

// Create new loan
const createLoan = async (req, res) => {
  try {
    const validation = validateLoanData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validation.errors 
      });
    }
    
    const loanData = {
      ...req.body,
      createdBy: req.user.userId
    };
    
    const loanId = await Loan.create(loanData);
    const newLoan = await Loan.findById(loanId);
    
    res.status(201).json({ 
      message: 'Loan created successfully',
      data: newLoan 
    });
  } catch (error) {
    console.error('Error creating loan:', error);
    res.status(500).json({ message: 'Failed to create loan' });
  }
};

// Update loan
const updateLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const validation = validateLoanData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validation.errors 
      });
    }
    
    await Loan.update(parseInt(id), req.body);
    const updatedLoan = await Loan.findById(parseInt(id));
    
    res.json({ 
      message: 'Loan updated successfully',
      data: updatedLoan 
    });
  } catch (error) {
    console.error('Error updating loan:', error);
    res.status(500).json({ message: 'Failed to update loan' });
  }
};

// Delete loan
const deleteLoan = async (req, res) => {
  try {
    const { id } = req.params;
    await Loan.delete(parseInt(id));
    
    res.json({ message: 'Loan deleted successfully' });
  } catch (error) {
    console.error('Error deleting loan:', error);
    res.status(500).json({ message: 'Failed to delete loan' });
  }
};

// Get loans by employee ID
const getLoansByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const loans = await Loan.getByEmployeeId(parseInt(employeeId));
    
    res.json({ data: loans });
  } catch (error) {
    console.error('Error fetching employee loans:', error);
    res.status(500).json({ message: 'Failed to fetch employee loans' });
  }
};

// Get loan statistics
const getLoanStatistics = async (req, res) => {
  try {
    const statistics = await Loan.getStatistics();
    res.json({ data: statistics });
  } catch (error) {
    console.error('Error fetching loan statistics:', error);
    res.status(500).json({ message: 'Failed to fetch loan statistics' });
  }
};

module.exports = {
  getAllLoans,
  getLoanById,
  createLoan,
  updateLoan,
  deleteLoan,
  getLoansByEmployee,
  getLoanStatistics
}; 