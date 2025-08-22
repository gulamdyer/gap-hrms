const EmployeeCompensation = require('../models/EmployeeCompensation');

// Get compensation for an employee
const getEmployeeCompensation = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const compensation = await EmployeeCompensation.findByEmployeeId(parseInt(employeeId));
    
    res.json({ 
      success: true, 
      data: compensation 
    });
  } catch (error) {
    console.error('Error fetching employee compensation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch employee compensation', 
      error: error.message 
    });
  }
};

// Get active compensation for an employee
const getActiveEmployeeCompensation = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { date } = req.query;
    
    const effectiveDate = date ? new Date(date) : new Date();
    const compensation = await EmployeeCompensation.getActiveCompensation(
      parseInt(employeeId), 
      effectiveDate
    );
    
    res.json({ 
      success: true, 
      data: compensation 
    });
  } catch (error) {
    console.error('Error fetching active employee compensation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch active employee compensation', 
      error: error.message 
    });
  }
};

// Create compensation record
const createCompensation = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const compensationData = {
      ...req.body,
      employeeId: parseInt(employeeId),
      createdBy: req.user?.userId
    };

    // Validate required fields
    if (!compensationData.payComponentId) {
      return res.status(400).json({
        success: false,
        message: 'Pay component is required'
      });
    }

    if (!compensationData.effectiveDate) {
      return res.status(400).json({
        success: false,
        message: 'Effective date is required'
      });
    }

    // Validate amount or percentage
    if (compensationData.isPercentage) {
      if (!compensationData.percentage || compensationData.percentage <= 0 || compensationData.percentage > 100) {
        return res.status(400).json({
          success: false,
          message: 'Percentage must be between 0 and 100'
        });
      }
    } else {
      if (!compensationData.amount || compensationData.amount < 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be greater than or equal to 0'
        });
      }
    }

    const compensationId = await EmployeeCompensation.create(compensationData);
    const newCompensation = await EmployeeCompensation.findById(compensationId);
    
    res.status(201).json({ 
      success: true, 
      message: 'Compensation created successfully', 
      data: newCompensation 
    });
  } catch (error) {
    console.error('Error creating compensation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create compensation', 
      error: error.message 
    });
  }
};

// Update compensation record
const updateCompensation = async (req, res) => {
  try {
    const { compensationId } = req.params;
    const compensationData = req.body;

    // Validate amount or percentage
    if (compensationData.isPercentage) {
      if (!compensationData.percentage || compensationData.percentage <= 0 || compensationData.percentage > 100) {
        return res.status(400).json({
          success: false,
          message: 'Percentage must be between 0 and 100'
        });
      }
    } else {
      if (!compensationData.amount || compensationData.amount < 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be greater than or equal to 0'
        });
      }
    }

    const updated = await EmployeeCompensation.update(parseInt(compensationId), compensationData);
    
    if (!updated) {
      return res.status(404).json({ 
        success: false, 
        message: 'Compensation record not found' 
      });
    }
    
    const updatedCompensation = await EmployeeCompensation.findById(parseInt(compensationId));
    
    res.json({ 
      success: true, 
      message: 'Compensation updated successfully', 
      data: updatedCompensation 
    });
  } catch (error) {
    console.error('Error updating compensation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update compensation', 
      error: error.message 
    });
  }
};

// Delete compensation record
const deleteCompensation = async (req, res) => {
  try {
    const { compensationId } = req.params;
    
    const deleted = await EmployeeCompensation.delete(parseInt(compensationId));
    
    if (!deleted) {
      return res.status(404).json({ 
        success: false, 
        message: 'Compensation record not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Compensation deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting compensation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete compensation', 
      error: error.message 
    });
  }
};

// Bulk update compensation for an employee
const bulkUpdateCompensation = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { compensationData } = req.body;

    console.log('🔍 Bulk update compensation request:', {
      employeeId,
      compensationDataLength: compensationData?.length,
      compensationData,
      userId: req.user?.userId,
      userRole: req.user?.role
    });

    if (!Array.isArray(compensationData)) {
      console.error('❌ Compensation data is not an array:', typeof compensationData);
      return res.status(400).json({
        success: false,
        message: 'Compensation data must be an array'
      });
    }

    if (compensationData.length === 0) {
      console.log('ℹ️ No compensation data to process');
      return res.json({ 
        success: true, 
        message: 'No compensation data to update', 
        data: [],
        results: [] 
      });
    }

    // Validate each compensation record
    for (let i = 0; i < compensationData.length; i++) {
      const comp = compensationData[i];
      
      console.log(`🔍 Validating compensation record ${i + 1}:`, comp);

      if (!comp.payComponentId) {
        console.error(`❌ Missing pay component ID for record ${i + 1}`);
        return res.status(400).json({
          success: false,
          message: `Pay component is required for record ${i + 1}`
        });
      }

      if (!comp.effectiveDate) {
        console.error(`❌ Missing effective date for record ${i + 1}`);
        return res.status(400).json({
          success: false,
          message: `Effective date is required for record ${i + 1}`
        });
      }

      if (comp.isPercentage) {
        if (!comp.percentage || comp.percentage <= 0 || comp.percentage > 100) {
          console.error(`❌ Invalid percentage for record ${i + 1}:`, comp.percentage);
          return res.status(400).json({
            success: false,
            message: `Percentage must be between 0 and 100 for record ${i + 1}`
          });
        }
      } else {
        if (comp.amount === undefined || comp.amount < 0) {
          console.error(`❌ Invalid amount for record ${i + 1}:`, comp.amount);
          return res.status(400).json({
            success: false,
            message: `Amount must be greater than or equal to 0 for record ${i + 1}`
          });
        }
      }
    }

    console.log('✅ All compensation records validated successfully');

    const results = await EmployeeCompensation.bulkUpsert(
      parseInt(employeeId), 
      compensationData, 
      req.user?.userId
    );
    
    console.log('✅ Bulk upsert completed:', results);
    
    // Get updated compensation list
    const updatedCompensation = await EmployeeCompensation.findByEmployeeId(parseInt(employeeId));
    
    console.log('✅ Retrieved updated compensation list:', updatedCompensation.length, 'records');
    
    res.json({ 
      success: true, 
      message: 'Compensation updated successfully', 
      data: updatedCompensation,
      results 
    });
  } catch (error) {
    console.error('❌ Error bulk updating compensation:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update compensation', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get compensation summary for an employee
const getCompensationSummary = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const summary = await EmployeeCompensation.getCompensationSummary(parseInt(employeeId));
    
    res.json({ 
      success: true, 
      data: summary 
    });
  } catch (error) {
    console.error('Error fetching compensation summary:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch compensation summary', 
      error: error.message 
    });
  }
};

module.exports = {
  getEmployeeCompensation,
  getActiveEmployeeCompensation,
  createCompensation,
  updateCompensation,
  deleteCompensation,
  bulkUpdateCompensation,
  getCompensationSummary
}; 