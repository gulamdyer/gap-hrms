const { initializeDatabase, closeDatabase } = require('./config/database');
const Settings = require('./models/Settings');

console.log('🇦🇪 UAE HRMS Settings Data Population\n');

// UAE-specific sample data
const sampleData = {
  designations: [
    { name: 'Chief Executive Officer', description: 'Top executive responsible for overall company management' },
    { name: 'Chief Financial Officer', description: 'Senior executive responsible for financial planning and reporting' },
    { name: 'Chief Technology Officer', description: 'Senior executive responsible for technology strategy and implementation' },
    { name: 'General Manager', description: 'Senior manager responsible for overall business operations' },
    { name: 'Operations Manager', description: 'Manager responsible for day-to-day operational activities' },
    { name: 'Human Resources Manager', description: 'Manager responsible for HR policies and employee relations' },
    { name: 'Finance Manager', description: 'Manager responsible for financial operations and reporting' },
    { name: 'Marketing Manager', description: 'Manager responsible for marketing strategies and campaigns' },
    { name: 'Sales Manager', description: 'Manager responsible for sales team and revenue generation' },
    { name: 'IT Manager', description: 'Manager responsible for IT infrastructure and systems' },
    { name: 'Project Manager', description: 'Manager responsible for project planning and execution' },
    { name: 'Senior Software Engineer', description: 'Experienced software developer with advanced technical skills' },
    { name: 'Software Engineer', description: 'Developer responsible for software development and maintenance' },
    { name: 'Business Analyst', description: 'Analyst responsible for business requirements and process improvement' },
    { name: 'Accountant', description: 'Professional responsible for financial records and reporting' },
    { name: 'HR Specialist', description: 'Specialist responsible for HR functions and employee services' },
    { name: 'Marketing Specialist', description: 'Specialist responsible for marketing activities and campaigns' },
    { name: 'Sales Executive', description: 'Executive responsible for customer acquisition and sales' },
    { name: 'Customer Service Representative', description: 'Representative responsible for customer support and satisfaction' },
    { name: 'Administrative Assistant', description: 'Assistant responsible for administrative tasks and support' },
    { name: 'Receptionist', description: 'Front desk representative responsible for visitor management' },
    { name: 'Driver', description: 'Professional responsible for transportation and delivery services' },
    { name: 'Security Guard', description: 'Guard responsible for premises security and safety' },
    { name: 'Cleaner', description: 'Staff responsible for facility cleaning and maintenance' }
  ],

  roles: [
    { name: 'Administrator', description: 'Full system access with all permissions' },
    { name: 'HR Manager', description: 'Human resources management and employee oversight' },
    { name: 'HR Specialist', description: 'HR operations and employee services' },
    { name: 'Finance Manager', description: 'Financial management and reporting' },
    { name: 'Accountant', description: 'Financial records and accounting operations' },
    { name: 'Department Head', description: 'Department leadership and management' },
    { name: 'Team Lead', description: 'Team supervision and project coordination' },
    { name: 'Employee', description: 'Standard employee access and permissions' },
    { name: 'Contractor', description: 'Limited access for contract workers' },
    { name: 'Intern', description: 'Restricted access for internship programs' },
    { name: 'Manager', description: 'Management level access and team oversight' },
    { name: 'Supervisor', description: 'Supervisory role with team management' },
    { name: 'Coordinator', description: 'Project and process coordination' },
    { name: 'Analyst', description: 'Data analysis and reporting' },
    { name: 'Specialist', description: 'Specialized role with specific expertise' },
    { name: 'Executive', description: 'Executive level access and decision making' },
    { name: 'Consultant', description: 'Consulting role with advisory responsibilities' },
    { name: 'Trainer', description: 'Training and development responsibilities' },
    { name: 'Auditor', description: 'Audit and compliance responsibilities' }
  ],

  positions: [
    { name: 'CEO', description: 'Chief Executive Officer position' },
    { name: 'CFO', description: 'Chief Financial Officer position' },
    { name: 'CTO', description: 'Chief Technology Officer position' },
    { name: 'GM', description: 'General Manager position' },
    { name: 'Operations Director', description: 'Director of Operations position' },
    { name: 'HR Director', description: 'Director of Human Resources position' },
    { name: 'Finance Director', description: 'Director of Finance position' },
    { name: 'Marketing Director', description: 'Director of Marketing position' },
    { name: 'Sales Director', description: 'Director of Sales position' },
    { name: 'IT Director', description: 'Director of Information Technology position' },
    { name: 'Project Director', description: 'Director of Projects position' },
    { name: 'Senior Manager', description: 'Senior Management position' },
    { name: 'Manager', description: 'Management position' },
    { name: 'Assistant Manager', description: 'Assistant Management position' },
    { name: 'Team Lead', description: 'Team Leadership position' },
    { name: 'Senior Specialist', description: 'Senior Specialist position' },
    { name: 'Specialist', description: 'Specialist position' },
    { name: 'Senior Executive', description: 'Senior Executive position' },
    { name: 'Executive', description: 'Executive position' },
    { name: 'Senior Officer', description: 'Senior Officer position' },
    { name: 'Officer', description: 'Officer position' },
    { name: 'Senior Assistant', description: 'Senior Assistant position' },
    { name: 'Assistant', description: 'Assistant position' },
    { name: 'Coordinator', description: 'Coordination position' },
    { name: 'Analyst', description: 'Analysis position' },
    { name: 'Representative', description: 'Representative position' },
    { name: 'Trainee', description: 'Training position' },
    { name: 'Intern', description: 'Internship position' }
  ],

  locations: [
    { 
      name: 'Dubai Main Office', 
      address: 'Sheikh Zayed Road, Downtown Dubai',
      city: 'Dubai',
      state: 'Dubai',
      country: 'UAE',
      pincode: '00000'
    },
    { 
      name: 'Abu Dhabi Branch', 
      address: 'Corniche Road, Abu Dhabi',
      city: 'Abu Dhabi',
      state: 'Abu Dhabi',
      country: 'UAE',
      pincode: '00000'
    },
    { 
      name: 'Sharjah Office', 
      address: 'Al Wahda Street, Sharjah',
      city: 'Sharjah',
      state: 'Sharjah',
      country: 'UAE',
      pincode: '00000'
    },
    { 
      name: 'Ajman Branch', 
      address: 'Sheikh Khalifa Street, Ajman',
      city: 'Ajman',
      state: 'Ajman',
      country: 'UAE',
      pincode: '00000'
    },
    { 
      name: 'Ras Al Khaimah Office', 
      address: 'Al Qawasim Corniche, Ras Al Khaimah',
      city: 'Ras Al Khaimah',
      state: 'Ras Al Khaimah',
      country: 'UAE',
      pincode: '00000'
    },
    { 
      name: 'Fujairah Branch', 
      address: 'Al Faseel Road, Fujairah',
      city: 'Fujairah',
      state: 'Fujairah',
      country: 'UAE',
      pincode: '00000'
    },
    { 
      name: 'Umm Al Quwain Office', 
      address: 'King Faisal Street, Umm Al Quwain',
      city: 'Umm Al Quwain',
      state: 'Umm Al Quwain',
      country: 'UAE',
      pincode: '00000'
    },
    { 
      name: 'Dubai Internet City', 
      address: 'Dubai Internet City, Dubai',
      city: 'Dubai',
      state: 'Dubai',
      country: 'UAE',
      pincode: '00000'
    },
    { 
      name: 'Dubai Media City', 
      address: 'Dubai Media City, Dubai',
      city: 'Dubai',
      state: 'Dubai',
      country: 'UAE',
      pincode: '00000'
    },
    { 
      name: 'Dubai Knowledge Park', 
      address: 'Dubai Knowledge Park, Dubai',
      city: 'Dubai',
      state: 'Dubai',
      country: 'UAE',
      pincode: '00000'
    },
    { 
      name: 'Abu Dhabi Global Market', 
      address: 'Al Maryah Island, Abu Dhabi',
      city: 'Abu Dhabi',
      state: 'Abu Dhabi',
      country: 'UAE',
      pincode: '00000'
    },
    { 
      name: 'Dubai Multi Commodities Centre', 
      address: 'Jumeirah Lakes Towers, Dubai',
      city: 'Dubai',
      state: 'Dubai',
      country: 'UAE',
      pincode: '00000'
    },
    { 
      name: 'Dubai Airport Freezone', 
      address: 'Dubai International Airport, Dubai',
      city: 'Dubai',
      state: 'Dubai',
      country: 'UAE',
      pincode: '00000'
    },
    { 
      name: 'Jebel Ali Free Zone', 
      address: 'Jebel Ali, Dubai',
      city: 'Dubai',
      state: 'Dubai',
      country: 'UAE',
      pincode: '00000'
    },
    { 
      name: 'Abu Dhabi Airport Free Zone', 
      address: 'Abu Dhabi International Airport, Abu Dhabi',
      city: 'Abu Dhabi',
      state: 'Abu Dhabi',
      country: 'UAE',
      pincode: '00000'
    }
  ],

  costCenters: [
    { code: 'CC001', name: 'Executive Management', description: 'Cost center for executive management expenses' },
    { code: 'CC002', name: 'Human Resources', description: 'Cost center for HR department expenses' },
    { code: 'CC003', name: 'Finance & Accounting', description: 'Cost center for finance and accounting expenses' },
    { code: 'CC004', name: 'Information Technology', description: 'Cost center for IT department expenses' },
    { code: 'CC005', name: 'Marketing & Sales', description: 'Cost center for marketing and sales expenses' },
    { code: 'CC006', name: 'Operations', description: 'Cost center for operations department expenses' },
    { code: 'CC007', name: 'Research & Development', description: 'Cost center for R&D expenses' },
    { code: 'CC008', name: 'Customer Service', description: 'Cost center for customer service expenses' },
    { code: 'CC009', name: 'Legal & Compliance', description: 'Cost center for legal and compliance expenses' },
    { code: 'CC010', name: 'Facilities Management', description: 'Cost center for facilities and maintenance expenses' },
    { code: 'CC011', name: 'Training & Development', description: 'Cost center for training and development expenses' },
    { code: 'CC012', name: 'Quality Assurance', description: 'Cost center for quality assurance expenses' },
    { code: 'CC013', name: 'Procurement', description: 'Cost center for procurement expenses' },
    { code: 'CC014', name: 'Logistics', description: 'Cost center for logistics and supply chain expenses' },
    { code: 'CC015', name: 'Security', description: 'Cost center for security expenses' },
    { code: 'CC016', name: 'Administration', description: 'Cost center for administrative expenses' },
    { code: 'CC017', name: 'Business Development', description: 'Cost center for business development expenses' },
    { code: 'CC018', name: 'Project Management', description: 'Cost center for project management expenses' },
    { code: 'CC019', name: 'Corporate Communications', description: 'Cost center for corporate communications expenses' },
    { code: 'CC020', name: 'Risk Management', description: 'Cost center for risk management expenses' },
    { code: 'CC021', name: 'Internal Audit', description: 'Cost center for internal audit expenses' },
    { code: 'CC022', name: 'Corporate Social Responsibility', description: 'Cost center for CSR initiatives' },
    { code: 'CC023', name: 'Innovation Lab', description: 'Cost center for innovation and experimentation' },
    { code: 'CC024', name: 'Digital Transformation', description: 'Cost center for digital transformation projects' },
    { code: 'CC025', name: 'Sustainability', description: 'Cost center for sustainability initiatives' }
  ],

  payComponents: [
    { code: 'BASIC', name: 'Basic Salary', type: 'EARNING', description: 'Basic salary component', isTaxable: 'Y', isPfApplicable: 'Y', isEsiApplicable: 'Y' },
    { code: 'HRA', name: 'House Rent Allowance', type: 'ALLOWANCE', description: 'House rent allowance for accommodation', isTaxable: 'Y', isPfApplicable: 'N', isEsiApplicable: 'N' },
    { code: 'DA', name: 'Dearness Allowance', type: 'ALLOWANCE', description: 'Dearness allowance for cost of living', isTaxable: 'Y', isPfApplicable: 'Y', isEsiApplicable: 'Y' },
    { code: 'TA', name: 'Transport Allowance', type: 'ALLOWANCE', description: 'Transport allowance for commuting', isTaxable: 'Y', isPfApplicable: 'N', isEsiApplicable: 'N' },
    { code: 'MA', name: 'Medical Allowance', type: 'ALLOWANCE', description: 'Medical allowance for health expenses', isTaxable: 'Y', isPfApplicable: 'N', isEsiApplicable: 'N' },
    { code: 'CA', name: 'Conveyance Allowance', type: 'ALLOWANCE', description: 'Conveyance allowance for travel', isTaxable: 'Y', isPfApplicable: 'N', isEsiApplicable: 'N' },
    { code: 'FA', name: 'Food Allowance', type: 'ALLOWANCE', description: 'Food allowance for meals', isTaxable: 'Y', isPfApplicable: 'N', isEsiApplicable: 'N' },
    { code: 'EA', name: 'Education Allowance', type: 'ALLOWANCE', description: 'Education allowance for children', isTaxable: 'Y', isPfApplicable: 'N', isEsiApplicable: 'N' },
    { code: 'PA', name: 'Performance Allowance', type: 'ALLOWANCE', description: 'Performance-based allowance', isTaxable: 'Y', isPfApplicable: 'Y', isEsiApplicable: 'Y' },
    { code: 'SA', name: 'Special Allowance', type: 'ALLOWANCE', description: 'Special allowance component', isTaxable: 'Y', isPfApplicable: 'Y', isEsiApplicable: 'Y' },
    { code: 'BONUS', name: 'Annual Bonus', type: 'BONUS', description: 'Annual performance bonus', isTaxable: 'Y', isPfApplicable: 'N', isEsiApplicable: 'N' },
    { code: 'INCENTIVE', name: 'Performance Incentive', type: 'BONUS', description: 'Performance-based incentive', isTaxable: 'Y', isPfApplicable: 'N', isEsiApplicable: 'N' },
    { code: 'GRATUITY', name: 'Gratuity', type: 'BONUS', description: 'Gratuity payment', isTaxable: 'N', isPfApplicable: 'N', isEsiApplicable: 'N' },
    { code: 'PF', name: 'Provident Fund', type: 'DEDUCTION', description: 'Employee provident fund contribution', isTaxable: 'N', isPfApplicable: 'N', isEsiApplicable: 'N' },
    { code: 'ESI', name: 'ESI Contribution', type: 'DEDUCTION', description: 'Employee state insurance contribution', isTaxable: 'N', isPfApplicable: 'N', isEsiApplicable: 'N' },
    { code: 'ITAX', name: 'Income Tax', type: 'DEDUCTION', description: 'Income tax deduction', isTaxable: 'N', isPfApplicable: 'N', isEsiApplicable: 'N' },
    { code: 'ADVANCE', name: 'Salary Advance', type: 'DEDUCTION', description: 'Salary advance recovery', isTaxable: 'N', isPfApplicable: 'N', isEsiApplicable: 'N' },
    { code: 'LOAN', name: 'Loan Recovery', type: 'DEDUCTION', description: 'Loan amount recovery', isTaxable: 'N', isPfApplicable: 'N', isEsiApplicable: 'N' },
    { code: 'INSURANCE', name: 'Insurance Premium', type: 'DEDUCTION', description: 'Insurance premium deduction', isTaxable: 'N', isPfApplicable: 'N', isEsiApplicable: 'N' },
    { code: 'UNIFORM', name: 'Uniform Deduction', type: 'DEDUCTION', description: 'Uniform cost deduction', isTaxable: 'N', isPfApplicable: 'N', isEsiApplicable: 'N' },
    { code: 'CANTEEN', name: 'Canteen Charges', type: 'DEDUCTION', description: 'Canteen charges deduction', isTaxable: 'N', isPfApplicable: 'N', isEsiApplicable: 'N' },
    { code: 'OTHER_DED', name: 'Other Deductions', type: 'DEDUCTION', description: 'Other miscellaneous deductions', isTaxable: 'N', isPfApplicable: 'N', isEsiApplicable: 'N' }
  ],

  leavePolicies: [
    { code: 'ANL', name: 'Annual Leave', type: 'ANNUAL', description: 'Annual leave as per UAE Labor Law - 30 days for employees with 1+ year service', defaultDays: 30, maxDays: 30, minDays: 1, carryForwardDays: 0, carryForwardExpiryMonths: 0, isPaid: 'Y', requiresApproval: 'Y', allowHalfDay: 'Y', allowAttachment: 'N', applicableFromMonths: 12, applicableFromDays: 0 },
    { code: 'PAL', name: 'Probation Annual Leave', type: 'ANNUAL', description: 'Annual leave for employees in probation period - 2 days per month', defaultDays: 2, maxDays: 2, minDays: 1, carryForwardDays: 0, carryForwardExpiryMonths: 0, isPaid: 'Y', requiresApproval: 'Y', allowHalfDay: 'Y', allowAttachment: 'N', applicableFromMonths: 1, applicableFromDays: 0 },
    { code: 'SIC', name: 'Sick Leave', type: 'SICK', description: 'Sick leave as per UAE Labor Law - 90 days maximum (15 days full pay, 30 days half pay, 45 days unpaid)', defaultDays: 15, maxDays: 90, minDays: 1, carryForwardDays: 0, carryForwardExpiryMonths: 0, isPaid: 'Y', requiresApproval: 'Y', allowHalfDay: 'N', allowAttachment: 'Y', applicableFromMonths: 0, applicableFromDays: 0 },
    { code: 'MAT', name: 'Maternity Leave', type: 'MATERNITY', description: 'Maternity leave as per UAE Labor Law - 60 days (45 days full pay + 15 days half pay)', defaultDays: 60, maxDays: 60, minDays: 1, carryForwardDays: 0, carryForwardExpiryMonths: 0, isPaid: 'Y', requiresApproval: 'Y', allowHalfDay: 'N', allowAttachment: 'Y', applicableFromMonths: 0, applicableFromDays: 0 },
    { code: 'PAT', name: 'Paternity Leave', type: 'PATERNITY', description: 'Paternity leave as per UAE Labor Law - 5 working days', defaultDays: 5, maxDays: 5, minDays: 1, carryForwardDays: 0, carryForwardExpiryMonths: 0, isPaid: 'Y', requiresApproval: 'Y', allowHalfDay: 'N', allowAttachment: 'Y', applicableFromMonths: 0, applicableFromDays: 0 },
    { code: 'BER', name: 'Bereavement Leave', type: 'BEREAVEMENT', description: 'Bereavement leave for immediate family members - 3 working days', defaultDays: 3, maxDays: 3, minDays: 1, carryForwardDays: 0, carryForwardExpiryMonths: 0, isPaid: 'Y', requiresApproval: 'Y', allowHalfDay: 'N', allowAttachment: 'N', applicableFromMonths: 0, applicableFromDays: 0 },
    { code: 'COM', name: 'Compensatory Leave', type: 'COMPENSATORY', description: 'Compensatory leave for overtime work on public holidays', defaultDays: 0, maxDays: 10, minDays: 1, carryForwardDays: 0, carryForwardExpiryMonths: 3, isPaid: 'Y', requiresApproval: 'Y', allowHalfDay: 'Y', allowAttachment: 'N', applicableFromMonths: 0, applicableFromDays: 0 },
    { code: 'UNP', name: 'Unpaid Leave', type: 'UNPAID', description: 'Unpaid leave for personal reasons - maximum 30 days per year', defaultDays: 0, maxDays: 30, minDays: 1, carryForwardDays: 0, carryForwardExpiryMonths: 0, isPaid: 'N', requiresApproval: 'Y', allowHalfDay: 'Y', allowAttachment: 'N', applicableFromMonths: 6, applicableFromDays: 0 },
    { code: 'EMG', name: 'Emergency Leave', type: 'CASUAL', description: 'Emergency leave for urgent personal matters - 3 days per year', defaultDays: 3, maxDays: 3, minDays: 1, carryForwardDays: 0, carryForwardExpiryMonths: 0, isPaid: 'Y', requiresApproval: 'N', allowHalfDay: 'Y', allowAttachment: 'N', applicableFromMonths: 0, applicableFromDays: 0 },
    { code: 'STU', name: 'Study Leave', type: 'CASUAL', description: 'Study leave for educational purposes - 10 days per year', defaultDays: 10, maxDays: 10, minDays: 1, carryForwardDays: 0, carryForwardExpiryMonths: 0, isPaid: 'Y', requiresApproval: 'Y', allowHalfDay: 'N', allowAttachment: 'Y', applicableFromMonths: 6, applicableFromDays: 0 },
    { code: 'HAJ', name: 'Hajj Leave', type: 'CASUAL', description: 'Hajj leave for religious pilgrimage - 30 days once in lifetime', defaultDays: 30, maxDays: 30, minDays: 1, carryForwardDays: 0, carryForwardExpiryMonths: 0, isPaid: 'Y', requiresApproval: 'Y', allowHalfDay: 'N', allowAttachment: 'N', applicableFromMonths: 24, applicableFromDays: 0 },
    { code: 'UMR', name: 'Umrah Leave', type: 'CASUAL', description: 'Umrah leave for religious pilgrimage - 15 days per year', defaultDays: 15, maxDays: 15, minDays: 1, carryForwardDays: 0, carryForwardExpiryMonths: 0, isPaid: 'Y', requiresApproval: 'Y', allowHalfDay: 'N', allowAttachment: 'N', applicableFromMonths: 12, applicableFromDays: 0 },
    { code: 'WFH', name: 'Work From Home', type: 'CASUAL', description: 'Work from home arrangement - flexible policy', defaultDays: 0, maxDays: 20, minDays: 1, carryForwardDays: 0, carryForwardExpiryMonths: 0, isPaid: 'Y', requiresApproval: 'Y', allowHalfDay: 'Y', allowAttachment: 'N', applicableFromMonths: 0, applicableFromDays: 0 },
    { code: 'TRN', name: 'Training Leave', type: 'CASUAL', description: 'Training and development leave - 5 days per year', defaultDays: 5, maxDays: 5, minDays: 1, carryForwardDays: 0, carryForwardExpiryMonths: 0, isPaid: 'Y', requiresApproval: 'Y', allowHalfDay: 'N', allowAttachment: 'Y', applicableFromMonths: 0, applicableFromDays: 0 },
    { code: 'PHO', name: 'Public Holiday Overtime', type: 'COMPENSATORY', description: 'Compensatory leave for working on public holidays', defaultDays: 0, maxDays: 15, minDays: 1, carryForwardDays: 0, carryForwardExpiryMonths: 6, isPaid: 'Y', requiresApproval: 'Y', allowHalfDay: 'Y', allowAttachment: 'N', applicableFromMonths: 0, applicableFromDays: 0 }
  ]
};

async function populateDesignations() {
  console.log('📋 Populating Designations...');
  let count = 0;
  
  for (const designation of sampleData.designations) {
    try {
      const designationData = {
        designationName: designation.name,
        description: designation.description
      };
      await Settings.createDesignation(designationData, 1); // Using user ID 1 as creator
      count++;
      console.log(`✅ Added: ${designation.name}`);
    } catch (error) {
      if (error.message.includes('ORA-00001')) {
        console.log(`ℹ️ Already exists: ${designation.name}`);
      } else {
        console.error(`❌ Error adding ${designation.name}:`, error.message);
      }
    }
  }
  
  console.log(`📊 Designations populated: ${count} added\n`);
}

async function populateRoles() {
  console.log('📋 Populating Roles...');
  let count = 0;
  
  for (const role of sampleData.roles) {
    try {
      const roleData = {
        roleName: role.name,
        description: role.description
      };
      await Settings.createRole(roleData, 1); // Using user ID 1 as creator
      count++;
      console.log(`✅ Added: ${role.name}`);
    } catch (error) {
      if (error.message.includes('ORA-00001')) {
        console.log(`ℹ️ Already exists: ${role.name}`);
      } else {
        console.error(`❌ Error adding ${role.name}:`, error.message);
      }
    }
  }
  
  console.log(`📊 Roles populated: ${count} added\n`);
}

async function populatePositions() {
  console.log('📋 Populating Positions...');
  let count = 0;
  
  for (const position of sampleData.positions) {
    try {
      const positionData = {
        positionName: position.name,
        description: position.description
      };
      await Settings.createPosition(positionData, 1); // Using user ID 1 as creator
      count++;
      console.log(`✅ Added: ${position.name}`);
    } catch (error) {
      if (error.message.includes('ORA-00001')) {
        console.log(`ℹ️ Already exists: ${position.name}`);
      } else {
        console.error(`❌ Error adding ${position.name}:`, error.message);
      }
    }
  }
  
  console.log(`📊 Positions populated: ${count} added\n`);
}

async function populateLocations() {
  console.log('📋 Populating Locations...');
  let count = 0;
  
  for (const location of sampleData.locations) {
    try {
      const locationData = {
        locationName: location.name,
        address: location.address,
        city: location.city,
        state: location.state,
        country: location.country,
        pincode: location.pincode
      };
      await Settings.createLocation(locationData, 1); // Using user ID 1 as creator
      count++;
      console.log(`✅ Added: ${location.name}`);
    } catch (error) {
      if (error.message.includes('ORA-00001')) {
        console.log(`ℹ️ Already exists: ${location.name}`);
      } else {
        console.error(`❌ Error adding ${location.name}:`, error.message);
      }
    }
  }
  
  console.log(`📊 Locations populated: ${count} added\n`);
}

async function populateCostCenters() {
  console.log('📋 Populating Cost Centers...');
  let count = 0;
  
  for (const costCenter of sampleData.costCenters) {
    try {
      const costCenterData = {
        costCenterCode: costCenter.code,
        costCenterName: costCenter.name,
        description: costCenter.description
      };
      await Settings.createCostCenter(costCenterData, 1); // Using user ID 1 as creator
      count++;
      console.log(`✅ Added: ${costCenter.name} (${costCenter.code})`);
    } catch (error) {
      if (error.message.includes('ORA-00001')) {
        console.log(`ℹ️ Already exists: ${costCenter.name} (${costCenter.code})`);
      } else {
        console.error(`❌ Error adding ${costCenter.name}:`, error.message);
      }
    }
  }
  
  console.log(`📊 Cost Centers populated: ${count} added\n`);
}

async function populatePayComponents() {
  console.log('📋 Populating Pay Components...');
  let count = 0;
  
  for (const payComponent of sampleData.payComponents) {
    try {
      const payComponentData = {
        componentCode: payComponent.code,
        componentName: payComponent.name,
        componentType: payComponent.type,
        description: payComponent.description,
        isTaxable: payComponent.isTaxable,
        isPfApplicable: payComponent.isPfApplicable,
        isEsiApplicable: payComponent.isEsiApplicable
      };
      await Settings.createPayComponent(payComponentData, 1); // Using user ID 1 as creator
      count++;
      console.log(`✅ Added: ${payComponent.name} (${payComponent.code})`);
    } catch (error) {
      if (error.message.includes('ORA-00001')) {
        console.log(`ℹ️ Already exists: ${payComponent.name} (${payComponent.code})`);
      } else {
        console.error(`❌ Error adding ${payComponent.name}:`, error.message);
      }
    }
  }
  
  console.log(`📊 Pay Components populated: ${count} added\n`);
}

async function populateLeavePolicies() {
  console.log('📋 Populating Leave Policies...');
  let count = 0;

  for (const leavePolicy of sampleData.leavePolicies) {
    try {
             const leavePolicyData = {
         leaveCode: leavePolicy.code,
         policyName: leavePolicy.name,
         leaveType: leavePolicy.type,
         description: leavePolicy.description,
        defaultDays: leavePolicy.defaultDays,
        maxDays: leavePolicy.maxDays,
        minDays: leavePolicy.minDays,
        carryForwardDays: leavePolicy.carryForwardDays,
        carryForwardExpiryMonths: leavePolicy.carryForwardExpiryMonths,
        isPaid: leavePolicy.isPaid,
        requiresApproval: leavePolicy.requiresApproval,
        allowHalfDay: leavePolicy.allowHalfDay,
        allowAttachment: leavePolicy.allowAttachment,
        applicableFromMonths: leavePolicy.applicableFromMonths,
        applicableFromDays: leavePolicy.applicableFromDays
      };
      await Settings.createLeavePolicy(leavePolicyData, 1); // Using user ID 1 as creator
      count++;
      console.log(`✅ Added: ${leavePolicy.name} (${leavePolicy.code})`);
    } catch (error) {
      if (error.message.includes('ORA-00001')) {
        console.log(`ℹ️ Already exists: ${leavePolicy.name} (${leavePolicy.code})`);
      } else {
        console.error(`❌ Error adding ${leavePolicy.name}:`, error.message);
      }
    }
  }

  console.log(`📊 Leave Policies populated: ${count} added\n`);
}

async function populateAllData() {
  try {
    console.log('🔌 Initializing database connection...');
    await initializeDatabase();
    
    console.log('📊 Starting data population...\n');
    
    await populateDesignations();
    await populateRoles();
    await populatePositions();
    await populateLocations();
    await populateCostCenters();
    await populatePayComponents();
    await populateLeavePolicies();
    
    console.log('🎉 UAE HRMS Settings Data Population Complete!');
    console.log('\n📋 Summary:');
    console.log(`   • Designations: ${sampleData.designations.length} entries`);
    console.log(`   • Roles: ${sampleData.roles.length} entries`);
    console.log(`   • Positions: ${sampleData.positions.length} entries`);
    console.log(`   • Locations: ${sampleData.locations.length} entries`);
    console.log(`   • Cost Centers: ${sampleData.costCenters.length} entries`);
    console.log(`   • Pay Components: ${sampleData.payComponents.length} entries`);
    console.log(`   • Leave Policies: ${sampleData.leavePolicies.length} entries`);
    
    await closeDatabase();
  } catch (error) {
    console.error('❌ Error during data population:', error);
    process.exit(1);
  }
}

// Run the population script
populateAllData().catch(console.error); 