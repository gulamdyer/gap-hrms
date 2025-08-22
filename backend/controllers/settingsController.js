const Settings = require('../models/Settings');

// Designation Controllers
const getAllDesignations = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit
    };
    const { rows, total } = await Settings.getAllDesignations(filters);
    res.json({
      success: true,
      data: rows,
      total,
      page: parseInt(filters.page) || 1,
      limit: parseInt(filters.limit) || 10,
      message: 'Designations retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting designations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve designations',
      error: error.message
    });
  }
};

const getDesignationById = async (req, res) => {
  try {
    const { id } = req.params;
    const designation = await Settings.getDesignationById(id);
    
    if (!designation) {
      return res.status(404).json({
        success: false,
        message: 'Designation not found'
      });
    }
    
    res.json({
      success: true,
      data: designation,
      message: 'Designation retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting designation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve designation',
      error: error.message
    });
  }
};

const createDesignation = async (req, res) => {
  try {
    const designationData = req.body;
    const createdBy = req.user.userId;
    
    const designationId = await Settings.createDesignation(designationData, createdBy);
    
    res.status(201).json({
      success: true,
      data: { designationId },
      message: 'Designation created successfully'
    });
  } catch (error) {
    console.error('Error creating designation:', error);
    
    if (error.message.includes('ORA-00001')) {
      return res.status(400).json({
        success: false,
        message: 'Designation name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create designation',
      error: error.message
    });
  }
};

const updateDesignation = async (req, res) => {
  try {
    const { id } = req.params;
    const designationData = req.body;
    
    await Settings.updateDesignation(id, designationData);
    
    res.json({
      success: true,
      message: 'Designation updated successfully'
    });
  } catch (error) {
    console.error('Error updating designation:', error);
    
    if (error.message.includes('ORA-00001')) {
      return res.status(400).json({
        success: false,
        message: 'Designation name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update designation',
      error: error.message
    });
  }
};

const deleteDesignation = async (req, res) => {
  try {
    const { id } = req.params;
    await Settings.deleteDesignation(id);
    
    res.json({
      success: true,
      message: 'Designation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting designation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete designation',
      error: error.message
    });
  }
};

// Role Controllers
const getAllRoles = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit
    };
    const { rows, total } = await Settings.getAllRoles(filters);
    res.json({
      success: true,
      data: rows,
      total,
      page: parseInt(filters.page) || 1,
      limit: parseInt(filters.limit) || 10,
      message: 'Roles retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting roles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve roles',
      error: error.message
    });
  }
};

const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Settings.getRoleById(id);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    res.json({
      success: true,
      data: role,
      message: 'Role retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve role',
      error: error.message
    });
  }
};

const createRole = async (req, res) => {
  try {
    const roleData = req.body;
    const createdBy = req.user.userId;
    
    const roleId = await Settings.createRole(roleData, createdBy);
    
    res.status(201).json({
      success: true,
      data: { roleId },
      message: 'Role created successfully'
    });
  } catch (error) {
    console.error('Error creating role:', error);
    
    if (error.message.includes('ORA-00001')) {
      return res.status(400).json({
        success: false,
        message: 'Role name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create role',
      error: error.message
    });
  }
};

const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const roleData = req.body;
    
    await Settings.updateRole(id, roleData);
    
    res.json({
      success: true,
      message: 'Role updated successfully'
    });
  } catch (error) {
    console.error('Error updating role:', error);
    
    if (error.message.includes('ORA-00001')) {
      return res.status(400).json({
        success: false,
        message: 'Role name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update role',
      error: error.message
    });
  }
};

const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    await Settings.deleteRole(id);
    
    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete role',
      error: error.message
    });
  }
};

// Position Controllers
const getAllPositions = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit
    };
    const { rows, total } = await Settings.getAllPositions(filters);
    res.json({
      success: true,
      data: rows,
      total,
      page: parseInt(filters.page) || 1,
      limit: parseInt(filters.limit) || 10,
      message: 'Positions retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting positions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve positions',
      error: error.message
    });
  }
};

const getPositionById = async (req, res) => {
  try {
    const { id } = req.params;
    const position = await Settings.getPositionById(id);
    
    if (!position) {
      return res.status(404).json({
        success: false,
        message: 'Position not found'
      });
    }
    
    res.json({
      success: true,
      data: position,
      message: 'Position retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting position:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve position',
      error: error.message
    });
  }
};

const createPosition = async (req, res) => {
  try {
    const positionData = req.body;
    const createdBy = req.user.userId;
    
    const positionId = await Settings.createPosition(positionData, createdBy);
    
    res.status(201).json({
      success: true,
      data: { positionId },
      message: 'Position created successfully'
    });
  } catch (error) {
    console.error('Error creating position:', error);
    
    if (error.message.includes('ORA-00001')) {
      return res.status(400).json({
        success: false,
        message: 'Position name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create position',
      error: error.message
    });
  }
};

const updatePosition = async (req, res) => {
  try {
    const { id } = req.params;
    const positionData = req.body;
    
    await Settings.updatePosition(id, positionData);
    
    res.json({
      success: true,
      message: 'Position updated successfully'
    });
  } catch (error) {
    console.error('Error updating position:', error);
    
    if (error.message.includes('ORA-00001')) {
      return res.status(400).json({
        success: false,
        message: 'Position name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update position',
      error: error.message
    });
  }
};

const deletePosition = async (req, res) => {
  try {
    const { id } = req.params;
    await Settings.deletePosition(id);
    
    res.json({
      success: true,
      message: 'Position deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting position:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete position',
      error: error.message
    });
  }
};

// Location Controllers
const getAllLocations = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit
    };
    const { rows, total } = await Settings.getAllLocations(filters);
    res.json({
      success: true,
      data: rows,
      total,
      page: parseInt(filters.page) || 1,
      limit: parseInt(filters.limit) || 10,
      message: 'Locations retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting locations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve locations',
      error: error.message
    });
  }
};

const getLocationById = async (req, res) => {
  try {
    const { id } = req.params;
    const location = await Settings.getLocationById(id);
    
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }
    
    res.json({
      success: true,
      data: location,
      message: 'Location retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve location',
      error: error.message
    });
  }
};

const createLocation = async (req, res) => {
  try {
    const locationData = req.body;
    const createdBy = req.user.userId;
    
    const locationId = await Settings.createLocation(locationData, createdBy);
    
    res.status(201).json({
      success: true,
      data: { locationId },
      message: 'Location created successfully'
    });
  } catch (error) {
    console.error('Error creating location:', error);
    
    if (error.message.includes('ORA-00001')) {
      return res.status(400).json({
        success: false,
        message: 'Location name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create location',
      error: error.message
    });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const locationData = req.body;
    
    await Settings.updateLocation(id, locationData);
    
    res.json({
      success: true,
      message: 'Location updated successfully'
    });
  } catch (error) {
    console.error('Error updating location:', error);
    
    if (error.message.includes('ORA-00001')) {
      return res.status(400).json({
        success: false,
        message: 'Location name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message
    });
  }
};

const deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;
    await Settings.deleteLocation(id);
    
    res.json({
      success: true,
      message: 'Location deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete location',
      error: error.message
    });
  }
};

// Cost Center Controllers
const getAllCostCenters = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit
    };
    const { rows, total } = await Settings.getAllCostCenters(filters);
    res.json({
      success: true,
      data: rows,
      total,
      page: parseInt(filters.page) || 1,
      limit: parseInt(filters.limit) || 10,
      message: 'Cost Centers retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting cost centers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cost centers',
      error: error.message
    });
  }
};

const getCostCenterById = async (req, res) => {
  try {
    const { id } = req.params;
    const costCenter = await Settings.getCostCenterById(id);
    
    if (!costCenter) {
      return res.status(404).json({
        success: false,
        message: 'Cost center not found'
      });
    }
    
    res.json({
      success: true,
      data: costCenter,
      message: 'Cost center retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting cost center:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cost center',
      error: error.message
    });
  }
};

const createCostCenter = async (req, res) => {
  try {
    const costCenterData = req.body;
    const createdBy = req.user.userId;
    
    const costCenterId = await Settings.createCostCenter(costCenterData, createdBy);
    
    res.status(201).json({
      success: true,
      data: { costCenterId },
      message: 'Cost center created successfully'
    });
  } catch (error) {
    console.error('Error creating cost center:', error);
    
    if (error.message.includes('ORA-00001')) {
      return res.status(400).json({
        success: false,
        message: 'Cost center code already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create cost center',
      error: error.message
    });
  }
};

const updateCostCenter = async (req, res) => {
  try {
    const { id } = req.params;
    const costCenterData = req.body;
    
    await Settings.updateCostCenter(id, costCenterData);
    
    res.json({
      success: true,
      message: 'Cost center updated successfully'
    });
  } catch (error) {
    console.error('Error updating cost center:', error);
    
    if (error.message.includes('ORA-00001')) {
      return res.status(400).json({
        success: false,
        message: 'Cost center code already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update cost center',
      error: error.message
    });
  }
};

const deleteCostCenter = async (req, res) => {
  try {
    const { id } = req.params;
    await Settings.deleteCostCenter(id);
    
    res.json({
      success: true,
      message: 'Cost center deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting cost center:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete cost center',
      error: error.message
    });
  }
};

// Dropdown Controllers
const getDesignationsForDropdown = async (req, res) => {
  try {
    const designations = await Settings.getDesignationsForDropdown();
    res.json({
      success: true,
      data: designations,
      message: 'Designations for dropdown retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting designations for dropdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve designations for dropdown',
      error: error.message
    });
  }
};

const getRolesForDropdown = async (req, res) => {
  try {
    const roles = await Settings.getRolesForDropdown();
    res.json({
      success: true,
      data: roles,
      message: 'Roles for dropdown retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting roles for dropdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve roles for dropdown',
      error: error.message
    });
  }
};

const getPositionsForDropdown = async (req, res) => {
  try {
    const positions = await Settings.getPositionsForDropdown();
    res.json({
      success: true,
      data: positions,
      message: 'Positions for dropdown retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting positions for dropdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve positions for dropdown',
      error: error.message
    });
  }
};

const getLocationsForDropdown = async (req, res) => {
  try {
    const locations = await Settings.getLocationsForDropdown();
    res.json({
      success: true,
      data: locations,
      message: 'Locations for dropdown retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting locations for dropdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve locations for dropdown',
      error: error.message
    });
  }
};

const getCostCentersForDropdown = async (req, res) => {
  try {
    const costCenters = await Settings.getCostCentersForDropdown();
    
    res.json({
      success: true,
      data: costCenters,
      message: 'Cost centers retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting cost centers for dropdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cost centers',
      error: error.message
    });
  }
};

// Pay Component Controllers
const getAllPayComponents = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit
    };
    let rows, total;
    try {
      const result = await Settings.getAllPayComponents(filters);
      rows = result.rows; total = result.total;
    } catch (error) {
      // If schema alterations are locked (ORA-00054), skip ensure and use fallback
      if (error.message.includes('ORA-00054')) {
        const result = await Settings.getAllPayComponents(filters);
        rows = result.rows; total = result.total;
      } else {
        throw error;
      }
    }
    res.json({
      success: true,
      data: rows,
      total,
      page: parseInt(filters.page) || 1,
      limit: parseInt(filters.limit) || 10,
      message: 'Pay Components retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting pay components:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pay components',
      error: error.message
    });
  }
};

const getPayComponentById = async (req, res) => {
  try {
    const { id } = req.params;
    const payComponent = await Settings.getPayComponentById(id);
    
    if (!payComponent) {
      return res.status(404).json({
        success: false,
        message: 'Pay Component not found'
      });
    }
    
    res.json({
      success: true,
      data: payComponent,
      message: 'Pay Component retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting pay component:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pay component',
      error: error.message
    });
  }
};

const createPayComponent = async (req, res) => {
  try {
    const payComponentData = req.body;
    const createdBy = req.user.userId;
    
    const payComponentId = await Settings.createPayComponent(payComponentData, createdBy);
    
    res.status(201).json({
      success: true,
      data: { payComponentId },
      message: 'Pay Component created successfully'
    });
  } catch (error) {
    console.error('Error creating pay component:', error);
    
    if (error.message.includes('ORA-00001')) {
      return res.status(400).json({
        success: false,
        message: 'Pay Component code already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create pay component',
      error: error.message
    });
  }
};

const updatePayComponent = async (req, res) => {
  try {
    const { id } = req.params;
    const payComponentData = req.body;
    
    await Settings.updatePayComponent(id, payComponentData);
    
    res.json({
      success: true,
      message: 'Pay Component updated successfully'
    });
  } catch (error) {
    console.error('Error updating pay component:', error);
    
    if (error.message.includes('ORA-00001')) {
      return res.status(400).json({
        success: false,
        message: 'Pay Component code already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update pay component',
      error: error.message
    });
  }
};

const deletePayComponent = async (req, res) => {
  try {
    const { id } = req.params;
    await Settings.deletePayComponent(id);
    
    res.json({
      success: true,
      message: 'Pay Component deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting pay component:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete pay component',
      error: error.message
    });
  }
};

const getPayComponentsForDropdown = async (req, res) => {
  try {
    const payComponents = await Settings.getPayComponentsForDropdown();
    
    res.json({
      success: true,
      data: payComponents,
      message: 'Pay Components retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting pay components for dropdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pay components',
      error: error.message
    });
  }
};

// Leave Policy Controllers
const getAllLeavePolicies = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit
    };
    const { rows, total } = await Settings.getAllLeavePolicies(filters);
    res.json({
      success: true,
      data: rows,
      total,
      page: parseInt(filters.page) || 1,
      limit: parseInt(filters.limit) || 10,
      message: 'Leave Policies retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting leave policies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve leave policies',
      error: error.message
    });
  }
};

const getLeavePolicyById = async (req, res) => {
  try {
    const { id } = req.params;
    const leavePolicy = await Settings.getLeavePolicyById(id);
    
    if (!leavePolicy) {
      return res.status(404).json({
        success: false,
        message: 'Leave Policy not found'
      });
    }
    
    res.json({
      success: true,
      data: leavePolicy,
      message: 'Leave Policy retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting leave policy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve leave policy',
      error: error.message
    });
  }
};

const createLeavePolicy = async (req, res) => {
  try {
    const leavePolicyData = req.body;
    const createdBy = req.user.userId;
    
    const leavePolicyId = await Settings.createLeavePolicy(leavePolicyData, createdBy);
    
    res.status(201).json({
      success: true,
      data: { leavePolicyId },
      message: 'Leave Policy created successfully'
    });
  } catch (error) {
    console.error('Error creating leave policy:', error);
    
    if (error.message.includes('ORA-00001')) {
      return res.status(400).json({
        success: false,
        message: 'Leave Policy code already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create leave policy',
      error: error.message
    });
  }
};

const updateLeavePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const leavePolicyData = req.body;
    
    await Settings.updateLeavePolicy(id, leavePolicyData);
    
    res.json({
      success: true,
      message: 'Leave Policy updated successfully'
    });
  } catch (error) {
    console.error('Error updating leave policy:', error);
    
    if (error.message.includes('ORA-00001')) {
      return res.status(400).json({
        success: false,
        message: 'Leave Policy code already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update leave policy',
      error: error.message
    });
  }
};

const deleteLeavePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    await Settings.deleteLeavePolicy(id);
    
    res.json({
      success: true,
      message: 'Leave Policy deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting leave policy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete leave policy',
      error: error.message
    });
  }
};

const getLeavePoliciesForDropdown = async (req, res) => {
  try {
    const leavePolicies = await Settings.getLeavePoliciesForDropdown();
    
    res.json({
      success: true,
      data: leavePolicies,
      message: 'Leave Policies retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting leave policies for dropdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve leave policies',
      error: error.message
    });
  }
};

// Pay Grade Controllers
const getAllPayGrades = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit
    };
    const { rows, total } = await Settings.getAllPayGrades(filters);
    res.json({
      success: true,
      data: rows,
      total,
      page: parseInt(filters.page) || 1,
      limit: parseInt(filters.limit) || 10,
      message: 'Pay Grades retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting pay grades:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pay grades',
      error: error.message
    });
  }
};

const getPayGradeById = async (req, res) => {
  try {
    const { id } = req.params;
    const payGrade = await Settings.getPayGradeById(id);
    
    if (!payGrade) {
      return res.status(404).json({
        success: false,
        message: 'Pay Grade not found'
      });
    }
    
    res.json({
      success: true,
      data: payGrade,
      message: 'Pay Grade retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting pay grade:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pay grade',
      error: error.message
    });
  }
};

const createPayGrade = async (req, res) => {
  try {
    const payGradeData = req.body;
    const createdBy = req.user.userId;
    
    const payGradeId = await Settings.createPayGrade(payGradeData, createdBy);
    
    res.status(201).json({
      success: true,
      data: { payGradeId },
      message: 'Pay Grade created successfully'
    });
  } catch (error) {
    console.error('Error creating pay grade:', error);
    
    if (error.message.includes('ORA-00001')) {
      return res.status(400).json({
        success: false,
        message: 'Pay Grade code already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create pay grade',
      error: error.message
    });
  }
};

const updatePayGrade = async (req, res) => {
  try {
    const { id } = req.params;
    const payGradeData = req.body;
    
    await Settings.updatePayGrade(id, payGradeData);
    
    res.json({
      success: true,
      message: 'Pay Grade updated successfully'
    });
  } catch (error) {
    console.error('Error updating pay grade:', error);
    
    if (error.message.includes('ORA-00001')) {
      return res.status(400).json({
        success: false,
        message: 'Pay Grade code already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update pay grade',
      error: error.message
    });
  }
};

const deletePayGrade = async (req, res) => {
  try {
    const { id } = req.params;
    await Settings.deletePayGrade(id);
    
    res.json({
      success: true,
      message: 'Pay Grade deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting pay grade:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete pay grade',
      error: error.message
    });
  }
};

const getPayGradesForDropdown = async (req, res) => {
  try {
    const payGrades = await Settings.getPayGradesForDropdown();
    
    res.json({
      success: true,
      data: payGrades,
      message: 'Pay Grades retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting pay grades for dropdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pay grades',
      error: error.message
    });
  }
};

// New dropdowns
const getDepartmentsForDropdown = async (req, res) => {
  try {
    const items = await Settings.getDepartmentsForDropdown();
    res.json(items);
  } catch (error) {
    console.error('Error fetching departments dropdown:', error);
    res.status(500).json([]);
  }
};

const getWorkcentersForDropdown = async (req, res) => {
  try {
    const items = await Settings.getWorkcentersForDropdown();
    res.json(items);
  } catch (error) {
    console.error('Error fetching workcenters dropdown:', error);
    res.status(500).json([]);
  }
};

const getEmploymentTypesForDropdown = async (req, res) => {
  try {
    const items = await Settings.getEmploymentTypesForDropdown();
    res.json(items);
  } catch (error) {
    console.error('Error fetching employment types dropdown:', error);
    res.status(500).json([]);
  }
};

// Get currency configuration
const getCurrencyConfig = async (req, res) => {
  try {
    const currencyConfig = {
      symbol: process.env.CURRENCY_SYMBOL || '₹',
      code: process.env.CURRENCY_CODE || 'INR',
      name: process.env.CURRENCY_NAME || 'Indian Rupee'
    };
    
    res.json({
      success: true,
      data: currencyConfig
    });
  } catch (error) {
    console.error('Error fetching currency config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch currency configuration'
    });
  }
};

// Utility: backfill pay component rule defaults
const backfillPayComponentRules = async (req, res) => {
  try {
    const result = await Settings.backfillPayComponentRuleDefaults();
    res.json({ success: true, data: result, message: 'Pay component rules backfilled' });
  } catch (error) {
    console.error('Error backfilling pay component rules:', error);
    res.status(500).json({ success: false, message: 'Failed to backfill rules', error: error.message });
  }
};

module.exports = {
  // Designation controllers
  getAllDesignations,
  getDesignationById,
  createDesignation,
  updateDesignation,
  deleteDesignation,

  // Role controllers
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,

  // Position controllers
  getAllPositions,
  getPositionById,
  createPosition,
  updatePosition,
  deletePosition,

  // Location controllers
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,

  // Cost Center controllers
  getAllCostCenters,
  getCostCenterById,
  createCostCenter,
  updateCostCenter,
  deleteCostCenter,

  // Pay Component controllers
  getAllPayComponents,
  getPayComponentById,
  createPayComponent,
  updatePayComponent,
  deletePayComponent,

  // Leave Policy controllers
  getAllLeavePolicies,
  getLeavePolicyById,
  createLeavePolicy,
  updateLeavePolicy,
  deleteLeavePolicy,

  // Pay Grade controllers
  getAllPayGrades,
  getPayGradeById,
  createPayGrade,
  updatePayGrade,
  deletePayGrade,

  // Dropdown controllers
  getDesignationsForDropdown,
  getRolesForDropdown,
  getPositionsForDropdown,
  getLocationsForDropdown,
  getCostCentersForDropdown,
  getPayComponentsForDropdown,
  getLeavePoliciesForDropdown,
  getPayGradesForDropdown,
  getDepartmentsForDropdown,
  getWorkcentersForDropdown,
  getEmploymentTypesForDropdown,
  getCurrencyConfig
  ,backfillPayComponentRules
  ,
  // Departments
  getAllDepartments: async (req, res) => {
    try { const { rows, total } = await Settings.getAllDepartments(req.query); res.json({ success:true, data:rows, total, page: parseInt(req.query.page)||1, limit: parseInt(req.query.limit)||10 }); } catch (e) { res.status(500).json({ success:false, message:'Failed to retrieve departments', error:e.message }); }
  },
  getDepartmentById: async (req, res) => { try { const r = await Settings.getDepartmentById(req.params.id); if(!r) return res.status(404).json({success:false,message:'Department not found'}); res.json({success:true,data:r}); } catch(e){ res.status(500).json({success:false,message:'Failed to retrieve department', error:e.message}); } },
  createDepartment: async (req,res)=>{ try{ const id=await Settings.createDepartment(req.body, req.user.userId); res.status(201).json({success:true, data:{ departmentId:id }});}catch(e){ if(e.message.includes('ORA-00001')) return res.status(400).json({success:false,message:'Department name already exists'}); res.status(500).json({success:false,message:'Failed to create department',error:e.message});}},
  updateDepartment: async (req,res)=>{ try{ await Settings.updateDepartment(req.params.id, req.body); res.json({success:true,message:'Department updated successfully'});}catch(e){ if(e.message.includes('ORA-00001')) return res.status(400).json({success:false,message:'Department name already exists'}); res.status(500).json({success:false,message:'Failed to update department',error:e.message});}},
  deleteDepartment: async (req,res)=>{ try{ await Settings.deleteDepartment(req.params.id); res.json({success:true,message:'Department deleted successfully'});}catch(e){ res.status(500).json({success:false,message:'Failed to delete department',error:e.message}); }},

  // Workcenters
  getAllWorkcenters: async (req,res)=>{ try{ const { rows,total }=await Settings.getAllWorkcenters(req.query); res.json({success:true,data:rows,total,page:parseInt(req.query.page)||1,limit:parseInt(req.query.limit)||10}); }catch(e){ res.status(500).json({success:false,message:'Failed to retrieve workcenters',error:e.message});}},
  getWorkcenterById: async (req,res)=>{ try{ const r=await Settings.getWorkcenterById(req.params.id); if(!r) return res.status(404).json({success:false,message:'Workcenter not found'}); res.json({success:true,data:r}); }catch(e){ res.status(500).json({success:false,message:'Failed to retrieve workcenter',error:e.message});}},
  createWorkcenter: async (req,res)=>{ try{ const id=await Settings.createWorkcenter(req.body, req.user.userId); res.status(201).json({success:true,data:{workcenterId:id}});}catch(e){ if(e.message.includes('ORA-00001')) return res.status(400).json({success:false,message:'Workcenter name already exists'}); res.status(500).json({success:false,message:'Failed to create workcenter',error:e.message});}},
  updateWorkcenter: async (req,res)=>{ try{ await Settings.updateWorkcenter(req.params.id, req.body); res.json({success:true,message:'Workcenter updated successfully'});}catch(e){ if(e.message.includes('ORA-00001')) return res.status(400).json({success:false,message:'Workcenter name already exists'}); res.status(500).json({success:false,message:'Failed to update workcenter',error:e.message});}},
  deleteWorkcenter: async (req,res)=>{ try{ await Settings.deleteWorkcenter(req.params.id); res.json({success:true,message:'Workcenter deleted successfully'});}catch(e){ res.status(500).json({success:false,message:'Failed to delete workcenter',error:e.message});}},

  // Employment types
  getAllEmploymentTypes: async (req,res)=>{ try{ const { rows,total }=await Settings.getAllEmploymentTypes(req.query); res.json({success:true,data:rows,total,page:parseInt(req.query.page)||1,limit:parseInt(req.query.limit)||10}); }catch(e){ res.status(500).json({success:false,message:'Failed to retrieve employment types',error:e.message});}},
  getEmploymentTypeById: async (req,res)=>{ try{ const r=await Settings.getEmploymentTypeById(req.params.id); if(!r) return res.status(404).json({success:false,message:'Employment type not found'}); res.json({success:true,data:r}); }catch(e){ res.status(500).json({success:false,message:'Failed to retrieve employment type',error:e.message});}},
  createEmploymentType: async (req,res)=>{ try{ const id=await Settings.createEmploymentType(req.body, req.user.userId); res.status(201).json({success:true,data:{employmentTypeId:id}});}catch(e){ if(e.message.includes('ORA-00001')) return res.status(400).json({success:false,message:'Employment type name already exists'}); res.status(500).json({success:false,message:'Failed to create employment type',error:e.message});}},
  updateEmploymentType: async (req,res)=>{ try{ await Settings.updateEmploymentType(req.params.id, req.body); res.json({success:true,message:'Employment type updated successfully'});}catch(e){ if(e.message.includes('ORA-00001')) return res.status(400).json({success:false,message:'Employment type name already exists'}); res.status(500).json({success:false,message:'Failed to update employment type',error:e.message});}},
  deleteEmploymentType: async (req,res)=>{ try{ await Settings.deleteEmploymentType(req.params.id); res.json({success:true,message:'Employment type deleted successfully'});}catch(e){ res.status(500).json({success:false,message:'Failed to delete employment type',error:e.message});}}
}; 