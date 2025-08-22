import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  UserIcon, 
  BriefcaseIcon, 
  HomeIcon, 
  DocumentTextIcon, 
  CreditCardIcon,
  CurrencyDollarIcon,
  ArrowLeftIcon,
  PhotoIcon,
  DocumentIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  GlobeAltIcon,
  BuildingOffice2Icon,
  TicketIcon
} from '@heroicons/react/24/outline';
import { employeeAPI, settingsAPI, compensationAPI, calendarAPI, shiftAPI, importExportAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ValidationHelp from '../components/ValidationHelp';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import currencyConfig from '../utils/currency';
import { AvatarDisplay } from '../utils/avatar';

const EmployeeOnboarding = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAuthenticated } = useAuthStore();
  const isEditing = !!id;

  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Dropdown data state
  const [dropdownData, setDropdownData] = useState({
    designations: [],
    roles: [],
    positions: [],
    locations: [],
    costCenters: [],
    calendars: [],
    shifts: [],
    payGrades: [],
    departments: [],
    workcenters: [],
    employmentTypes: []
  });

  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    legalName: '',
    gender: '',
    nationality: '',
    dateOfBirth: '',
    birthPlace: '',
    avatarUrl: '',

    // Job Information
    reportToId: '',
    designation: '',
    department: '',
    workcenter: '',
    employmentType: '',
    role: '',
    position: '',
    location: '',
    costCenter: '',
    calendarId: '',
    shiftId: '',
    payGradeId: '',
    dateOfJoining: '',
    probationDays: 90,
    confirmDate: '',
    noticeDays: 30,

    // Address Information
    address: '',
    pincode: '',
    city: '',
    district: '',
    state: '',
    country: 'India',
    phone: '',
    mobile: '',
    email: '',

    // Personal Information
    fatherName: '',
    maritalStatus: '',
    spouseName: '',
    religion: '',

    // Legal Information
    aadharNumber: '',
    aadharImageUrl: '',
    panNumber: '',
    panImageUrl: '',
    drivingLicenseNumber: '',
    drivingLicenseImageUrl: '',
    educationCertificateNumber: '',
    educationCertificateImageUrl: '',

    // Bank Information
    bankName: '',
    branchName: '',
    ifscCode: '',
    accountNumber: '',
    uanNumber: '',
    pfNumber: '',
    esiNumber: '',

    // Compensation Information
    compensationRecords: [],

    // Global Information
    payrollCountry: '',
    employeeType: '',
    airTicketEligibility: '',
    payrollCompanies: [], // For consultants
    pfDeductionCompany: '', // For consultants
    airTicketEligible: '',
    airTicketSegment: '',
  });

  // Compensation state
  const [compensationData, setCompensationData] = useState([]);
  const [payComponents, setPayComponents] = useState([]);
  const [compensationLoading, setCompensationLoading] = useState(false);

  const [companyOptions, setCompanyOptions] = useState([
    { id: 'COMP1', name: 'Company 1' },
    { id: 'COMP2', name: 'Company 2' },
    { id: 'COMP3', name: 'Company 3' },
  ]);

  const [countryOptions, setCountryOptions] = useState([]);
  const [ctcCalculation, setCtcCalculation] = useState(null);

  // Date format conversion helpers
  const convertToDDMMYYYY = (dateString) => {
    if (!dateString || dateString === '') return '';
    
    console.log('🔄 convertToDDMMYYYY input:', dateString);
    
    // If already in DD-MM-YYYY format, return as is
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      console.log('📊 Already in DD-MM-YYYY format:', dateString);
      return dateString;
    }
    
    // If in YYYY-MM-DD format, convert to DD-MM-YYYY
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-');
      const formatted = `${day}-${month}-${year}`;
      console.log('📊 Converted YYYY-MM-DD to DD-MM-YYYY:', dateString, '->', formatted);
      return formatted;
    }
    
    // If in MM-DD-YYYY format, convert to DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      const [month, day, year] = dateString.split('-');
      const formatted = `${day}-${month}-${year}`;
      console.log('📊 Converted MM-DD-YYYY to DD-MM-YYYY:', dateString, '->', formatted);
      return formatted;
    }
    
    // Try to parse other formats
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const formatted = `${day}-${month}-${year}`;
        console.log('📊 Parsed date to DD-MM-YYYY:', dateString, '->', formatted);
        return formatted;
      }
    } catch (error) {
      console.error('❌ Error parsing date:', dateString, error);
    }
    
    console.log('⚠️ Could not parse date, returning empty string');
    return '';
  };

  const convertToYYYYMMDD = (dateString) => {
    if (!dateString || dateString === '') return null;
    
    console.log('🔄 convertToYYYYMMDD input:', dateString);
    
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      console.log('📊 Already in YYYY-MM-DD format:', dateString);
      return dateString;
    }
    
    // If in DD-MM-YYYY format, convert to YYYY-MM-DD
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split('-');
      const formatted = `${year}-${month}-${day}`;
      console.log('📊 Converted DD-MM-YYYY to YYYY-MM-DD:', dateString, '->', formatted);
      return formatted;
    }
    
    // If in MM-DD-YYYY format, convert to YYYY-MM-DD
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      const [month, day, year] = dateString.split('-');
      const formatted = `${year}-${month}-${day}`;
      console.log('📊 Converted MM-DD-YYYY to YYYY-MM-DD:', dateString, '->', formatted);
      return formatted;
    }
    
    // Try to parse other formats
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const formatted = date.toISOString().split('T')[0];
        console.log('📊 Parsed date to YYYY-MM-DD:', dateString, '->', formatted);
        return formatted;
      }
    } catch (error) {
      console.error('❌ Error parsing date:', dateString, error);
    }
    
    console.log('⚠️ Could not parse date, returning null');
    return null;
  };

  const tabs = [
    { id: 'personal', name: 'Personal Info', icon: UserIcon },
    { id: 'job', name: 'Job Info', icon: BriefcaseIcon },
    { id: 'address', name: 'Address Info', icon: HomeIcon },
    { id: 'legal', name: 'Legal Info', icon: DocumentTextIcon },
    { id: 'bank', name: 'Bank Info', icon: CreditCardIcon },
    { id: 'global', name: 'Global Info', icon: GlobeAltIcon },
    { id: 'compensation', name: 'Compensation', icon: CurrencyDollarIcon },
  ];

  // Import/Export handlers for onboarding (Employees entity)
  const handleDownloadEmployeeTemplate = async () => {
    try {
      setDownloading(true);
      const response = await importExportAPI.generateTemplate('employees', 'excel');
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'employees_template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Template downloaded');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Failed to download template');
    } finally {
      setDownloading(false);
    }
  };

  const handleExportEmployees = async () => {
    try {
      setDownloading(true);
      const response = await importExportAPI.exportData('employees', 'excel');
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'employees_export.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Employees exported');
    } catch (error) {
      console.error('Error exporting employees:', error);
      toast.error('Failed to export');
    } finally {
      setDownloading(false);
    }
  };

  const handleImportEmployees = async () => {
    if (!selectedFile) {
      toast.error('Please choose a file');
      return;
    }
    try {
      setImporting(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await importExportAPI.importData('employees', formData);
      const { success, errors, skipped, total } = res.data || {};
      toast.success(`Imported: ${success || 0}/${total || 0}. Skipped: ${skipped || 0}`);
      if (errors && errors.length) {
        console.warn('Import errors:', errors);
        toast.error(`${errors.length} rows had errors`);
      }
      // Optionally refresh list/dropdowns after import
      fetchEmployees();
    } catch (error) {
      console.error('Error importing employees:', error);
      toast.error(error.response?.data?.message || 'Failed to import');
    } finally {
      setImporting(false);
      setSelectedFile(null);
    }
  };

  useEffect(() => {
    console.log('🔄 useEffect triggered:', { id, isAuthenticated, isEditing });
    
    if (isAuthenticated) {
      fetchEmployees();
      fetchDropdownData();
      if (isEditing) {
        console.log('📝 Edit mode detected, fetching employee data...');
        fetchEmployee();
      } else {
        console.log('➕ Create mode detected');
      }
    }
  }, [id, isAuthenticated]);

  // Auto-trigger CTC calculation when compensation data and payroll country are available
  useEffect(() => {
    const autoCalculateCTC = async () => {
      if (compensationData && 
          compensationData.length > 0 && 
          formData.payrollCountry && 
          formData.payrollCountry !== '') {
        
        console.log('🔄 Auto-triggering CTC calculation for:', formData.payrollCountry);
        console.log('💰 Current compensation data:', compensationData);
        await recalculateCTC(formData.payrollCountry, false); // Suppress toast for auto-calculation
      }
    };

    autoCalculateCTC();
  }, [compensationData, formData.payrollCountry]);

  const fetchEmployees = async () => {
    try {
      const response = await employeeAPI.getDropdown();
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchDropdownData = async () => {
    try {
      console.log('📋 Fetching dropdown data...');
      
      const [designationsRes, rolesRes, positionsRes, locationsRes, costCentersRes, payComponentsRes, calendarsRes, shiftsRes, payGradesRes, departmentsRes, workcentersRes, employmentTypesRes] = await Promise.all([
        settingsAPI.getDesignationsForDropdown(),
        settingsAPI.getRolesForDropdown(),
        settingsAPI.getPositionsForDropdown(),
        settingsAPI.getLocationsForDropdown(),
        settingsAPI.getCostCentersForDropdown(),
        settingsAPI.getPayComponentsForDropdown(),
        calendarAPI.getDropdown(),
        shiftAPI.getDropdown(),
        settingsAPI.getPayGradesForDropdown(),
        settingsAPI.getDepartmentsForDropdown().then((r)=>r.data ?? r).catch(()=>[]),
        settingsAPI.getWorkcentersForDropdown().then((r)=>r.data ?? r).catch(()=>[]),
        settingsAPI.getEmploymentTypesForDropdown().then((r)=>r.data ?? r).catch(()=>[])
      ]);

      const safe = (res) => Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setDropdownData({
        designations: safe(designationsRes),
        roles: safe(rolesRes),
        positions: safe(positionsRes),
        locations: safe(locationsRes),
        costCenters: safe(costCentersRes),
        calendars: safe(calendarsRes),
        shifts: safe(shiftsRes),
        payGrades: safe(payGradesRes),
        departments: safe(departmentsRes),
        workcenters: safe(workcentersRes),
        employmentTypes: safe(employmentTypesRes)
      });

      setPayComponents(safe(payComponentsRes));

      console.log('✅ Dropdown data loaded:', {
        designations: safe(designationsRes).length,
        roles: safe(rolesRes).length,
        positions: safe(positionsRes).length,
        locations: safe(locationsRes).length,
        costCenters: safe(costCentersRes).length,
        calendars: safe(calendarsRes).length,
        shifts: safe(shiftsRes).length,
        payGrades: safe(payGradesRes).length,
        departments: safe(departmentsRes).length,
        workcenters: safe(workcentersRes).length,
        employmentTypes: safe(employmentTypesRes).length
      });
    } catch (error) {
      console.error('❌ Error fetching dropdown data:', error);
      toast.error('Failed to load dropdown data');
    }
  };

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching employee with ID:', id);
      
      const response = await employeeAPI.getById(id);
      console.log('📊 Employee data received:', response.data);
      
      // Map database field names to form field names
      const mappedData = {
        // Personal Information
        firstName: response.data.FIRST_NAME || '',
        lastName: response.data.LAST_NAME || '',
        legalName: response.data.LEGAL_NAME || '',
        gender: response.data.GENDER || '', // Database stores uppercase, keep as is
        nationality: response.data.NATIONALITY || '',
        dateOfBirth: convertToDDMMYYYY(response.data.DATE_OF_BIRTH),
        birthPlace: response.data.BIRTH_PLACE || '',
        avatarUrl: response.data.AVATAR_URL || '',

        // Job Information
        reportToId: response.data.REPORT_TO_ID || '',
        designation: response.data.DESIGNATION || '',
        department: response.data.DEPARTMENT || '',
        workcenter: response.data.WORKCENTER || '',
        employmentType: response.data.EMPLOYMENT_TYPE || '',
        role: response.data.ROLE || '',
        position: response.data.POSITION || '',
        location: response.data.LOCATION || '',
        costCenter: response.data.COST_CENTER || '',
        calendarId: response.data.CALENDAR_ID || '',
        shiftId: response.data.SHIFT_ID || '',
        payGradeId: response.data.PAY_GRADE_ID || '',
        dateOfJoining: convertToDDMMYYYY(response.data.DATE_OF_JOINING),
        probationDays: response.data.PROBATION_DAYS || 90,
        confirmDate: convertToDDMMYYYY(response.data.CONFIRM_DATE),
        noticeDays: response.data.NOTICE_DAYS || 30,

        // Address Information
        address: response.data.ADDRESS || '',
        pincode: response.data.PINCODE || '',
        city: response.data.CITY || '',
        district: response.data.DISTRICT || '',
        state: response.data.STATE || '',
        country: response.data.COUNTRY || 'India',
        phone: response.data.PHONE || '',
        mobile: response.data.MOBILE || '',
        email: response.data.EMAIL || '',

        // Personal Information
        fatherName: response.data.FATHER_NAME || '',
        maritalStatus: response.data.MARITAL_STATUS || '', // Database stores uppercase, keep as is
        spouseName: response.data.SPOUSE_NAME || '',
        religion: response.data.RELIGION || '',

        // Legal Information
        aadharNumber: response.data.AADHAR_NUMBER || '',
        aadharImageUrl: response.data.AADHAR_IMAGE_URL || '',
        panNumber: response.data.PAN_NUMBER || '',
        panImageUrl: response.data.PAN_IMAGE_URL || '',
        drivingLicenseNumber: response.data.DRIVING_LICENSE_NUMBER || '',
        drivingLicenseImageUrl: response.data.DRIVING_LICENSE_IMAGE_URL || '',
        educationCertificateNumber: response.data.EDUCATION_CERTIFICATE_NUMBER || '',
        educationCertificateImageUrl: response.data.EDUCATION_CERTIFICATE_IMAGE_URL || '',

        // Bank Information
        bankName: response.data.BANK_NAME || '',
        branchName: response.data.BRANCH_NAME || '',
        ifscCode: response.data.IFSC_CODE || '',
        accountNumber: response.data.ACCOUNT_NUMBER || '',
        uanNumber: response.data.UAN_NUMBER || '',
        pfNumber: response.data.PF_NUMBER || '',
        esiNumber: response.data.ESI_NUMBER || '',

        // Global Information
        payrollCountry: response.data.PAYROLL_COUNTRY || '',
        employeeType: response.data.EMPLOYEE_TYPE || '',
        airTicketEligibility: response.data.AIR_TICKET_ELIGIBILITY || '',
        airTicketEligible: response.data.AIR_TICKET_ELIGIBLE || 0,
        airTicketSegment: response.data.AIR_TICKET_SEGMENT || '',
        payrollCompanies: response.data.PAYROLL_COMPANIES || [],
        pfDeductionCompany: response.data.PF_DEDUCTION_COMPANY || '',

        // System Information
        status: response.data.STATUS || 'ONBOARDING'
      };

      console.log('🗺️ Mapped form data:', mappedData);
      setFormData(mappedData);
      
      // Load compensation data if in edit mode
      if (id) {
        await fetchCompensation(id);
      }
    } catch (error) {
      console.error('❌ Error fetching employee:', error);
      toast.error('Failed to fetch employee data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch compensation data for employee
  const fetchCompensation = async (employeeId) => {
    try {
      setCompensationLoading(true);
      console.log('💰 Fetching compensation for employee:', employeeId);
      const response = await compensationAPI.getByEmployeeId(employeeId);
      
      console.log('🔍 Raw API response:', response);
      console.log('🔍 Response data:', response.data);
      console.log('🔍 Data type:', typeof response.data, 'Length:', response.data?.length);
      
      // Ensure response.data is an array
      const rawData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      console.log('🔍 Raw compensation data:', rawData);
      
      // Transform backend data to frontend format
      const transformedData = rawData.map(comp => {
        console.log('🔍 Transforming component:', comp);
        return {
          compensationId: comp.COMPENSATION_ID,
          payComponentId: comp.PAY_COMPONENT_ID,
          componentName: comp.COMPONENT_NAME,
          componentType: comp.COMPONENT_TYPE,
          amount: comp.AMOUNT || 0,
          percentage: comp.PERCENTAGE || 0,
          isPercentage: comp.IS_PERCENTAGE === 1,
          effectiveDate: convertToDDMMYYYY(comp.EFFECTIVE_DATE),
          endDate: comp.END_DATE ? convertToDDMMYYYY(comp.END_DATE) : '',
          status: comp.STATUS
        };
      });
      
      setCompensationData(transformedData);
      console.log('✅ Compensation data loaded:', transformedData);
    } catch (error) {
      console.error('❌ Error fetching compensation:', error);
      console.error('❌ Error details:', error.response?.data);
      // Don't show error toast as compensation might be empty for new employees
    } finally {
      setCompensationLoading(false);
    }
  };

  // Recalculate CTC based on country selection
  const recalculateCTC = async (countryCode, showToast = true) => {
    try {
      console.log('🔄 Recalculating CTC for country:', countryCode);
      
      if (!compensationData || compensationData.length === 0) {
        if (showToast) {
          toast.error('No compensation data available for CTC calculation');
        }
        return;
      }

      // Prepare employee data for CTC calculation
      const employeeData = {
        countryCode: countryCode,
        employeeType: formData.employeeType || 'EXPATRIATE',
        joiningDate: formData.dateOfJoining || new Date().toISOString().split('T')[0],
        airTicketEligible: formData.airTicketEligible || 0,
        airTicketSegment: formData.airTicketSegment || 'ECONOMY',
        nationality: formData.employeeType === 'LOCAL' ? 'LOCAL' : 'EXPATRIATE'
      };

      // Transform compensation data to backend format
      const compensationForCalc = compensationData.map(comp => ({
        componentCode: comp.componentName?.toUpperCase().replace(/\s+/g, '_') || 'UNKNOWN',
        componentName: comp.componentName,
        componentType: comp.componentType,
        amount: comp.amount || 0,
        isPercentage: comp.isPercentage || false,
        percentage: comp.percentage || 0
      }));

      console.log('📊 Compensation data being sent to backend:', compensationForCalc);
      console.log('💰 Total earnings from frontend:', 
        compensationForCalc
          .filter(comp => comp.componentType === 'EARNING' && !comp.isPercentage)
          .reduce((sum, comp) => sum + (comp.amount || 0), 0)
      );

      const response = await employeeAPI.calculateRealTimeCTC(employeeData, compensationForCalc);
      
      if (response.success) {
        console.log('✅ CTC calculation result:', response.data);
        console.log('💰 Earnings data:', response.data.earnings);
        console.log('📉 Deductions data:', response.data.deductions);
        console.log('📊 Totals data:', response.data.totals);
        
        // Update CTC calculation with new country-specific calculations
        setCtcCalculation(response.data);
        
        if (showToast) {
          toast.success(`CTC recalculated for ${countryOptions.find(c => c.code === countryCode)?.name || countryCode}`);
        }
        
        // Optional: Refresh compensation data as well (disabled to prevent flicker)
        // await fetchCompensation(id);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('❌ Error recalculating CTC:', error);
      if (showToast) {
        toast.error('Failed to recalculate CTC: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  // Compensation functions (moved outside render to prevent re-creation)
  const addCompensationRecord = useCallback(() => {
    console.log('🔄 Adding new compensation record...');
    console.log('📊 Current compensation data length:', compensationData.length);
    
    const newRecord = {
      tempId: Date.now(),
      payComponentId: '',
      componentName: '',
      componentType: '',
      amount: 0,
      percentage: 0,
      isPercentage: false,
      effectiveDate: convertToDDMMYYYY(new Date()),
      endDate: '',
      status: 'ACTIVE'
    };
    
    console.log('✅ New record created:', newRecord);
    const updatedData = [...compensationData, newRecord];
    setCompensationData(updatedData);
    console.log('📊 Updated compensation data length:', updatedData.length);
  }, [compensationData]);

  const removeCompensationRecord = useCallback((index) => {
    console.log('🗑️ Removing compensation record at index:', index);
    const updatedData = compensationData.filter((_, i) => i !== index);
    setCompensationData(updatedData);
  }, [compensationData]);

  // Date validation function (moved before updateCompensationRecord to fix hoisting issue)
  const validateDateFormat = (dateString) => {
    if (!dateString || dateString === '') return true; // Empty is valid
    
    // Check if it matches DD-MM-YYYY format
    const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
    const match = dateString.match(dateRegex);
    
    if (!match) return false;
    
    const [, day, month, year] = match;
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    // Basic validation
    if (monthNum < 1 || monthNum > 12) return false;
    if (dayNum < 1 || dayNum > 31) return false;
    if (yearNum < 1900 || yearNum > 2100) return false;
    
    // Check for valid days in each month
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    // Handle leap years
    if (monthNum === 2 && yearNum % 4 === 0 && (yearNum % 100 !== 0 || yearNum % 400 === 0)) {
      daysInMonth[1] = 29;
    }
    
    return dayNum <= daysInMonth[monthNum - 1];
  };

  const updateCompensationRecord = useCallback((index, field, value) => {
    console.log('📝 Updating compensation record:', { index, field, value });
    const updatedData = [...compensationData];
    
    // Special handling for date fields (effectiveDate, endDate) following DATE_HANDLING_GUIDE
    if (['effectiveDate', 'endDate'].includes(field)) {
      // Allow only digits and hyphens
      const cleanedValue = value.replace(/[^\d-]/g, '');
      
      // Auto-format as user types
      let formattedValue = cleanedValue;
      if (cleanedValue.length >= 2 && !cleanedValue.includes('-')) {
        formattedValue = cleanedValue.slice(0, 2) + '-' + cleanedValue.slice(2);
      }
      if (formattedValue.length >= 5 && formattedValue.split('-').length === 2) {
        formattedValue = formattedValue.slice(0, 5) + '-' + formattedValue.slice(5);
      }
      
      // Validate the date format
      if (formattedValue.length === 10 && !validateDateFormat(formattedValue)) {
        setValidationErrors(prev => ({
          ...prev,
          [`compensation_${index}_${field}`]: 'Please enter a valid date in DD-MM-YYYY format'
        }));
      } else if (validationErrors[`compensation_${index}_${field}`]) {
        setValidationErrors(prev => ({
          ...prev,
          [`compensation_${index}_${field}`]: undefined
        }));
      }
      
      updatedData[index] = { ...updatedData[index], [field]: formattedValue };
    } else {
      updatedData[index] = { ...updatedData[index], [field]: value };
    }

    // If pay component changes, update related fields
    if (field === 'payComponentId') {
      const selectedComponent = payComponents.find(pc => pc.PAY_COMPONENT_ID === parseInt(value));
      if (selectedComponent) {
        updatedData[index].componentName = selectedComponent.COMPONENT_NAME;
        updatedData[index].componentType = selectedComponent.COMPONENT_TYPE;
        console.log('✅ Updated component details:', {
          componentName: selectedComponent.COMPONENT_NAME,
          componentType: selectedComponent.COMPONENT_TYPE
        });
      }
    }

    // If switching between amount and percentage, reset the other field
    if (field === 'isPercentage') {
      if (value) {
        updatedData[index].amount = 0;
      } else {
        updatedData[index].percentage = 0;
      }
    }

    setCompensationData(updatedData);
  }, [compensationData, payComponents, validationErrors]);

  const handleInputChange = (field, value) => {
    console.log('🔄 handleInputChange:', field, value);
    
    // Special handling for date fields
    if (['dateOfBirth', 'dateOfJoining', 'confirmDate'].includes(field)) {
      // Allow only digits and hyphens
      const cleanedValue = value.replace(/[^\d-]/g, '');
      
      // Auto-format as user types
      let formattedValue = cleanedValue;
      if (cleanedValue.length >= 2 && !cleanedValue.includes('-')) {
        formattedValue = cleanedValue.slice(0, 2) + '-' + cleanedValue.slice(2);
      }
      if (formattedValue.length >= 5 && formattedValue.split('-').length === 2) {
        formattedValue = formattedValue.slice(0, 5) + '-' + formattedValue.slice(5);
      }
      
      // Validate the date format
      if (formattedValue.length === 10 && !validateDateFormat(formattedValue)) {
        setValidationErrors(prev => ({
          ...prev,
          [field]: 'Please enter a valid date in DD-MM-YYYY format'
        }));
      } else if (validationErrors[field]) {
        setValidationErrors(prev => ({
          ...prev,
          [field]: undefined
        }));
      }
      
      setFormData(prev => ({
        ...prev,
        [field]: formattedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
      
      // Clear validation error for this field
      if (validationErrors[field]) {
        setValidationErrors(prev => ({
          ...prev,
          [field]: undefined
        }));
      }
    }
  };

  const handleFileUpload = async (file, type) => {
    if (!file) return;

    try {
      let response;
      if (type === 'avatar') {
        response = await employeeAPI.uploadAvatar(id || 'temp', file);
        handleInputChange('avatarUrl', response.data.avatarUrl);
      } else {
        response = await employeeAPI.uploadDocument(id || 'temp', type, file);
        handleInputChange(`${type}ImageUrl`, response.data.documentUrl);
      }
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    }
  };

  // Helper function to render error message
  const renderError = (fieldName) => {
    if (validationErrors[fieldName]) {
      return (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {validationErrors[fieldName]}
        </p>
      );
    }
    return null;
  };

  // Render validation summary
  const renderValidationSummary = () => {
    const errorCount = Object.keys(validationErrors).length;
    
    if (errorCount === 0) return null;

    return (
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <h3 className="text-sm font-medium text-red-800">
            Please fix {errorCount} validation error{errorCount > 1 ? 's' : ''} before submitting
          </h3>
        </div>
        <div className="mt-2 text-sm text-red-700">
          <ul className="list-disc list-inside space-y-1">
            {Object.entries(validationErrors).map(([field, error]) => (
              <li key={field}>
                <strong className="capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}:</strong> {error}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  // Helper function to ensure date is in YYYY-MM-DD format
  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      // Clean data - convert empty strings to null for optional fields
      const cleanedData = Object.keys(formData).reduce((acc, key) => {
        acc[key] = formData[key] === '' ? null : formData[key];
        return acc;
      }, {});

      // Convert all date fields from DD-MM-YYYY to YYYY-MM-DD for backend
      cleanedData.dateOfBirth = convertToYYYYMMDD(cleanedData.dateOfBirth);
      cleanedData.dateOfJoining = convertToYYYYMMDD(cleanedData.dateOfJoining);
      cleanedData.confirmDate = convertToYYYYMMDD(cleanedData.confirmDate);

      console.log('🔍 Submitting employee data:', cleanedData);
      console.log('📊 Gender value:', cleanedData.gender);
      console.log('📊 Marital status value:', cleanedData.maritalStatus);
      console.log('📊 Date of Birth value:', cleanedData.dateOfBirth);
      console.log('📊 Date of Joining value:', cleanedData.dateOfJoining);
      console.log('📊 Confirm Date value:', cleanedData.confirmDate);
      console.log('📊 Address value:', cleanedData.address);

      let response;
      let employeeId;
      
      if (isEditing) {
        response = await employeeAPI.update(id, cleanedData);
        employeeId = id;
        toast.success('Employee updated successfully!');
      } else {
        response = await employeeAPI.create(cleanedData);
        employeeId = response.data.employeeId;
        toast.success('Employee created successfully!');
      }

      // Save compensation data if any exists
      if (compensationData.length > 0 && employeeId) {
        console.log('💰 Saving compensation data for employee:', employeeId);
        
        // Transform compensation data for API
        console.log('📊 Raw compensation data before transformation:', compensationData);
        
        const compensationPayload = compensationData
          .filter(comp => {
            const hasPayComponent = comp.payComponentId;
            console.log(`🔍 Filtering compensation record:`, {
              hasPayComponent,
              payComponentId: comp.payComponentId,
              record: comp
            });
            return hasPayComponent;
          })
          .map((comp, index) => {
            // Convert and validate dates
            const effectiveDate = convertToYYYYMMDD(comp.effectiveDate);
            const endDate = comp.endDate ? convertToYYYYMMDD(comp.endDate) : null;
            
            // Validate date formats
            if (!effectiveDate || !/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate)) {
              throw new Error(`Invalid effective date format for compensation record ${index + 1}: ${comp.effectiveDate}`);
            }
            
            if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
              throw new Error(`Invalid end date format for compensation record ${index + 1}: ${comp.endDate}`);
            }
            
            const transformedComp = {
              compensationId: comp.compensationId || null,
              payComponentId: parseInt(comp.payComponentId),
              amount: comp.isPercentage ? 0 : (comp.amount || 0),
              percentage: comp.isPercentage ? (comp.percentage || 0) : 0,
              isPercentage: comp.isPercentage,
              effectiveDate: effectiveDate,
              endDate: endDate,
              status: comp.status || 'ACTIVE'
            };
            
            console.log(`✅ Transformed compensation record ${index + 1}:`, transformedComp);
            return transformedComp;
          });
        
        console.log('📊 Final compensation payload:', compensationPayload);

        if (compensationPayload.length > 0) {
          try {
            console.log('📊 Sending compensation data:', compensationPayload);
            const compensationResult = await compensationAPI.bulkUpdate(employeeId, compensationPayload);
            console.log('✅ Compensation data saved successfully:', compensationResult);
          } catch (compensationError) {
            console.error('❌ Error saving compensation:', compensationError);
            console.error('❌ Error response:', compensationError.response?.data);
            console.error('❌ Error stack:', compensationError.stack);
            
            // Show specific error message if available
            let errorMessage = 'Failed to save compensation data';
            
            if (compensationError.response?.data?.error) {
              // Backend database error (like ORA-01861)
              if (compensationError.response.data.error.includes('ORA-01861')) {
                errorMessage = 'Date format error. Please check the effective date and end date formats.';
              } else if (compensationError.response.data.error.includes('ORA-')) {
                errorMessage = `Database error: ${compensationError.response.data.error}`;
              } else {
                errorMessage = compensationError.response.data.error;
              }
            } else if (compensationError.response?.data?.message) {
              errorMessage = compensationError.response.data.message;
            } else if (compensationError.message) {
              errorMessage = compensationError.message;
            }
            
            toast.error(`Employee saved but compensation data failed to save: ${errorMessage}`);
          }
        } else {
          console.log('ℹ️ No compensation data to save');
        }
      }
      
      navigate('/employees');
    } catch (error) {
      console.error('❌ Error submitting form:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.data?.errors) {
        const validationErrors = {};
        error.response.data.errors.forEach(err => {
          validationErrors[err.field] = err.message;
        });
        setValidationErrors(validationErrors);
        toast.error('Please fix the validation errors below');
      } else {
        toast.error(error.response?.data?.message || 'Failed to save employee');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Professional Header Section with Avatar and Key Info
  const renderProfessionalHeader = () => {
    const fullName = `${formData.firstName || ''} ${formData.lastName || ''}`.trim();
    const hasBasicInfo = formData.firstName || formData.lastName || formData.email || formData.designation;
    
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-lg overflow-hidden">
        <div className="px-8 py-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-32 h-32 bg-white rounded-full shadow-lg border-4 border-white flex items-center justify-center">
              <AvatarDisplay
                avatarUrl={formData.avatarUrl}
                name={`${formData.firstName} ${formData.lastName}`}
                size="4xl"
                className="w-full h-full"
              />
            </div>
            {/* Avatar Upload Button */}
            <button
              onClick={() => document.getElementById('avatar-upload').click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center shadow-lg hover:bg-primary-700 transition-colors"
            >
              <PhotoIcon className="w-4 h-4 text-white" />
            </button>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files[0]) {
                  handleFileUpload(e.target.files[0], 'avatar');
                }
              }}
            />
          </div>
          {/* Employee Info */}
          <div className="flex-1 min-w-0">
            {hasBasicInfo ? (
              <div className="space-y-2">
                {/* Name and Designation */}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {fullName || 'New Employee'}
                  </h1>
                  {formData.designation && (
                    <p className="text-lg text-primary-600 font-medium">
                      {formData.designation}
                    </p>
                  )}
                </div>
                {/* Contact Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                  {formData.email && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{formData.email}</span>
                    </div>
                  )}
                  {formData.mobile && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <PhoneIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{formData.mobile}</span>
                    </div>
                  )}
                  {formData.location && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <MapPinIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{formData.location}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEditing ? 'Edit Employee' : 'Employee Onboarding'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {isEditing ? 'Update employee information' : 'Complete employee onboarding process'}
                </p>
              </div>
            )}
          </div>
          {/* Status Dropdown */}
          <div className="flex-shrink-0 mt-4 sm:mt-0">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select
                value={formData.status || 'ACTIVE'}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border-0 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  formData.status === 'ACTIVE' 
                    ? 'bg-green-100 text-green-800 focus:ring-green-500'
                    : formData.status === 'INACTIVE'
                    ? 'bg-red-100 text-red-800 focus:ring-red-500'
                    : 'bg-yellow-100 text-yellow-800 focus:ring-yellow-500'
                }`}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            className="input-field"
            placeholder="Enter first name"
          />
          {renderError('firstName')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            className="input-field"
            placeholder="Enter last name"
          />
          {renderError('lastName')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Legal Name</label>
          <input
            type="text"
            value={formData.legalName}
            onChange={(e) => handleInputChange('legalName', e.target.value)}
            className="input-field"
            placeholder="Enter legal name"
          />
          {renderError('legalName')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
          <select
            value={formData.gender}
            onChange={(e) => handleInputChange('gender', e.target.value)}
            className="input-field"
          >
            <option value="">Select gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
          {renderError('gender')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
          <input
            type="text"
            value={formData.nationality}
            onChange={(e) => handleInputChange('nationality', e.target.value)}
            className="input-field"
            placeholder="Enter nationality"
          />
          {renderError('nationality')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
          <input
            type="text"
            value={formData.dateOfBirth}
            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
            className="input-field"
            placeholder="DD-MM-YYYY (e.g., 25-12-1990)"
            maxLength={10}
          />
          {renderError('dateOfBirth')}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Birth Place</label>
          <input
            type="text"
            value={formData.birthPlace}
            onChange={(e) => handleInputChange('birthPlace', e.target.value)}
            className="input-field"
            placeholder="Enter birth place"
          />
          {renderError('birthPlace')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Father's Name</label>
          <input
            type="text"
            value={formData.fatherName}
            onChange={(e) => handleInputChange('fatherName', e.target.value)}
            className="input-field"
            placeholder="Enter father's name"
          />
          {renderError('fatherName')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status</label>
          <select
            value={formData.maritalStatus}
            onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
            className="input-field"
          >
            <option value="">Select marital status</option>
            <option value="SINGLE">Single</option>
            <option value="MARRIED">Married</option>
            <option value="DIVORCED">Divorced</option>
            <option value="WIDOWED">Widowed</option>
          </select>
          {renderError('maritalStatus')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Spouse Name</label>
          <input
            type="text"
            value={formData.spouseName}
            onChange={(e) => handleInputChange('spouseName', e.target.value)}
            className="input-field"
            placeholder="Enter spouse name"
          />
          {renderError('spouseName')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Religion</label>
          <input
            type="text"
            value={formData.religion}
            onChange={(e) => handleInputChange('religion', e.target.value)}
            className="input-field"
            placeholder="Enter religion"
          />
          {renderError('religion')}
        </div>
      </div>
    </div>
  );

  const renderJobInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1 Department */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
          <select value={formData.department} onChange={(e)=>handleInputChange('department', e.target.value)} className="input-field">
            <option value="">Select department</option>
            {dropdownData.departments.map((d)=>(
              <option key={d.DEPARTMENT_ID} value={d.DEPARTMENT_NAME}>{d.DEPARTMENT_NAME}</option>
            ))}
          </select>
          {renderError('department')}
        </div>
        {/* 2 Workcenter / Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Workcenter / Section</label>
          <select value={formData.workcenter} onChange={(e)=>handleInputChange('workcenter', e.target.value)} className="input-field">
            <option value="">Select workcenter</option>
            {dropdownData.workcenters.map((w)=>(
              <option key={w.WORKCENTER_ID} value={w.WORKCENTER_NAME}>{w.WORKCENTER_NAME}</option>
            ))}
          </select>
          {renderError('workcenter')}
        </div>
        {/* 3 Designation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Designation *</label>
          <select value={formData.designation} onChange={(e)=>handleInputChange('designation', e.target.value)} className="input-field" required>
            <option value="">Select designation</option>
            {dropdownData.designations.map((d)=>(
              <option key={d.DESIGNATION_ID} value={d.DESIGNATION_NAME}>{d.DESIGNATION_NAME}</option>
            ))}
          </select>
          {renderError('designation')}
        </div>
        {/* 4 Position */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
          <select value={formData.position} onChange={(e)=>handleInputChange('position', e.target.value)} className="input-field">
            <option value="">Select position</option>
            {dropdownData.positions.map((p)=>(
              <option key={p.POSITION_ID} value={p.POSITION_NAME}>{p.POSITION_NAME}</option>
            ))}
          </select>
          {renderError('position')}
        </div>
        {/* 5 Report To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Report To</label>
          <select value={formData.reportToId} onChange={(e)=>handleInputChange('reportToId', e.target.value)} className="input-field">
            <option value="">Select manager</option>
            {employees.map((emp)=>(
              <option key={emp.EMPLOYEE_ID} value={emp.EMPLOYEE_ID}>{emp.FIRST_NAME} {emp.LAST_NAME} - {emp.DESIGNATION}</option>
            ))}
          </select>
          {renderError('reportToId')}
        </div>
        {/* 6 Role */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
          <select value={formData.role} onChange={(e)=>handleInputChange('role', e.target.value)} className="input-field">
            <option value="">Select role</option>
            {dropdownData.roles.map((r)=>(
              <option key={r.ROLE_ID} value={r.ROLE_NAME}>{r.ROLE_NAME}</option>
            ))}
          </select>
          {renderError('role')}
        </div>
        {/* 7 Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
          <select value={formData.location} onChange={(e)=>handleInputChange('location', e.target.value)} className="input-field">
            <option value="">Select location</option>
            {dropdownData.locations.map((l)=>(
              <option key={l.LOCATION_ID} value={l.LOCATION_NAME}>{l.LOCATION_NAME}</option>
            ))}
          </select>
          {renderError('location')}
        </div>
        {/* 8 Cost Center */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cost Center</label>
          <select value={formData.costCenter} onChange={(e)=>handleInputChange('costCenter', e.target.value)} className="input-field">
            <option value="">Select cost center</option>
            {dropdownData.costCenters.map((cc)=>(
              <option key={cc.COST_CENTER_ID} value={cc.COST_CENTER_NAME}>{cc.COST_CENTER_NAME} ({cc.COST_CENTER_CODE})</option>
            ))}
          </select>
          {renderError('costCenter')}
        </div>
        {/* 9 Calendar */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Calendar</label>
          <select value={formData.calendarId} onChange={(e)=>handleInputChange('calendarId', e.target.value)} className="input-field">
            <option value="">Select calendar</option>
            {dropdownData.calendars.map((c)=>(
              <option key={c.CALENDAR_ID} value={c.CALENDAR_ID}>{c.CALENDAR_NAME} ({c.CALENDAR_CODE})</option>
            ))}
          </select>
          {renderError('calendarId')}
        </div>
        {/* 10 Shift */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Shift</label>
          <select value={formData.shiftId} onChange={(e)=>handleInputChange('shiftId', e.target.value)} className="input-field">
            <option value="">Select shift</option>
            {dropdownData.shifts.map((s)=>(
              <option key={s.SHIFT_ID} value={s.SHIFT_ID}>{s.SHIFT_NAME} ({s.START_TIME} - {s.END_TIME})</option>
            ))}
          </select>
          {renderError('shiftId')}
        </div>
        {/* 11 Employment Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
          <select value={formData.employmentType} onChange={(e)=>handleInputChange('employmentType', e.target.value)} className="input-field">
            <option value="">Select employment type</option>
            {dropdownData.employmentTypes.map((et)=>(
              <option key={et.EMPLOYMENT_TYPE_ID} value={et.EMPLOYMENT_TYPE_NAME}>{et.EMPLOYMENT_TYPE_NAME}</option>
            ))}
          </select>
          {renderError('employmentType')}
        </div>
        {/* 12 Pay Grade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Pay Grade</label>
          <select value={formData.payGradeId} onChange={(e)=>handleInputChange('payGradeId', e.target.value)} className="input-field">
            <option value="">Select pay grade</option>
            {dropdownData.payGrades.map((pg)=>(
              <option key={pg.PAY_GRADE_ID} value={pg.PAY_GRADE_ID}>{pg.GRADE_NAME} ({pg.GRADE_CODE})</option>
            ))}
          </select>
          {renderError('payGradeId')}
        </div>
        {/* 13 Date of Joining */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Joining</label>
          <input type="text" value={formData.dateOfJoining} onChange={(e)=>handleInputChange('dateOfJoining', e.target.value)} className="input-field" placeholder="DD-MM-YYYY (e.g., 01-01-2024)" maxLength={10} />
          {renderError('dateOfJoining')}
        </div>
        {/* 14 Probation Days */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Probation Days</label>
          <input type="number" value={formData.probationDays} onChange={(e)=>handleInputChange('probationDays', e.target.value)} className="input-field" min="0" />
          {renderError('probationDays')}
        </div>
        {/* 15 Confirmation Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Confirmation Date</label>
          <input type="text" value={formData.confirmDate} onChange={(e)=>handleInputChange('confirmDate', e.target.value)} className="input-field" placeholder="DD-MM-YYYY (e.g., 01-04-2024)" maxLength={10} />
          {renderError('confirmDate')}
        </div>
        {/* 16 Notice Days */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Notice Days</label>
          <input type="number" value={formData.noticeDays} onChange={(e)=>handleInputChange('noticeDays', e.target.value)} className="input-field" min="0" />
          {renderError('noticeDays')}
        </div>
      </div>
    </div>
  );

  const renderAddressInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
          <textarea
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            rows={3}
            className="input-field"
            placeholder="Enter complete address (max 500 characters)"
            maxLength={500}
            style={{ minHeight: '80px', resize: 'none' }}
          />
          {renderError('address')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
          <input
            type="text"
            value={formData.pincode}
            onChange={(e) => handleInputChange('pincode', e.target.value)}
            className="input-field"
            placeholder="Enter pincode"
            maxLength={6}
          />
          {renderError('pincode')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            className="input-field"
            placeholder="Enter city"
          />
          {renderError('city')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
          <input
            type="text"
            value={formData.district}
            onChange={(e) => handleInputChange('district', e.target.value)}
            className="input-field"
            placeholder="Enter district"
          />
          {renderError('district')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
          <input
            type="text"
            value={formData.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
            className="input-field"
            placeholder="Enter state"
          />
          {renderError('state')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
          <input
            type="text"
            value={formData.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            className="input-field"
            placeholder="Enter country"
          />
          {renderError('country')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className="input-field"
            placeholder="Enter phone number"
          />
          {renderError('phone')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mobile *</label>
          <input
            type="tel"
            value={formData.mobile}
            onChange={(e) => handleInputChange('mobile', e.target.value)}
            className="input-field"
            placeholder="Enter mobile number"
          />
          {renderError('mobile')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="input-field"
            placeholder="Enter email address"
          />
          {renderError('email')}
        </div>
      </div>
    </div>
  );

  const renderLegalInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">National ID Number</label>
          <input
            type="text"
            value={formData.aadharNumber}
            onChange={(e) => handleInputChange('aadharNumber', e.target.value)}
            className="input-field"
            placeholder="Enter National ID number"
            maxLength={12}
          />
          {renderError('aadharNumber')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">National ID Image</label>
          <div className="flex items-center space-x-3">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files[0]) {
                  handleFileUpload(e.target.files[0], 'aadhar');
                }
              }}
              className="input-field"
            />
            {formData.aadharImageUrl && (
              <DocumentIcon className="w-5 h-5 text-green-500" />
            )}
          </div>
          {renderError('aadharImageUrl')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Visa / Personal Number</label>
          <input
            type="text"
            value={formData.panNumber}
            onChange={(e) => handleInputChange('panNumber', e.target.value)}
            className="input-field"
            placeholder="Enter Visa / Personal number"
            maxLength={10}
          />
          {renderError('panNumber')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Visa / Personal Number Image</label>
          <div className="flex items-center space-x-3">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files[0]) {
                  handleFileUpload(e.target.files[0], 'pan');
                }
              }}
              className="input-field"
            />
            {formData.panImageUrl && (
              <DocumentIcon className="w-5 h-5 text-green-500" />
            )}
          </div>
          {renderError('panImageUrl')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Driving License Number</label>
          <input
            type="text"
            value={formData.drivingLicenseNumber}
            onChange={(e) => handleInputChange('drivingLicenseNumber', e.target.value)}
            className="input-field"
            placeholder="Enter driving license number"
          />
          {renderError('drivingLicenseNumber')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Driving License Image</label>
          <div className="flex items-center space-x-3">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files[0]) {
                  handleFileUpload(e.target.files[0], 'drivingLicense');
                }
              }}
              className="input-field"
            />
            {formData.drivingLicenseImageUrl && (
              <DocumentIcon className="w-5 h-5 text-green-500" />
            )}
          </div>
          {renderError('drivingLicenseImageUrl')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Education Certificate Number</label>
          <input
            type="text"
            value={formData.educationCertificateNumber}
            onChange={(e) => handleInputChange('educationCertificateNumber', e.target.value)}
            className="input-field"
            placeholder="Enter education certificate number"
          />
          {renderError('educationCertificateNumber')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Education Certificate Image</label>
          <div className="flex items-center space-x-3">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files[0]) {
                  handleFileUpload(e.target.files[0], 'educationCertificate');
                }
              }}
              className="input-field"
            />
            {formData.educationCertificateImageUrl && (
              <DocumentIcon className="w-5 h-5 text-green-500" />
            )}
          </div>
          {renderError('educationCertificateImageUrl')}
        </div>
      </div>
    </div>
  );

  const renderBankInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
          <input
            type="text"
            value={formData.bankName}
            onChange={(e) => handleInputChange('bankName', e.target.value)}
            className="input-field"
            placeholder="Enter bank name"
          />
          {renderError('bankName')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Branch Name</label>
          <input
            type="text"
            value={formData.branchName}
            onChange={(e) => handleInputChange('branchName', e.target.value)}
            className="input-field"
            placeholder="Enter branch name"
          />
          {renderError('branchName')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code</label>
          <input
            type="text"
            value={formData.ifscCode}
            onChange={(e) => handleInputChange('ifscCode', e.target.value)}
            maxLength={11}
            className="input-field"
            placeholder="Enter IFSC code"
          />
          {renderError('ifscCode')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
          <input
            type="text"
            value={formData.accountNumber}
            onChange={(e) => handleInputChange('accountNumber', e.target.value)}
            className="input-field"
            placeholder="Enter account number"
          />
          {renderError('accountNumber')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">UAN Number</label>
          <input
            type="text"
            value={formData.uanNumber}
            onChange={(e) => handleInputChange('uanNumber', e.target.value)}
            className="input-field"
            placeholder="Enter UAN number"
          />
          {renderError('uanNumber')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Social Security Number</label>
          <input
            type="text"
            value={formData.pfNumber}
            onChange={(e) => handleInputChange('pfNumber', e.target.value)}
            className="input-field"
            placeholder="Enter Social Security number"
          />
          {renderError('pfNumber')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Number</label>
          <input
            type="text"
            value={formData.esiNumber}
            onChange={(e) => handleInputChange('esiNumber', e.target.value)}
            className="input-field"
            placeholder="Enter Insurance number"
          />
          {renderError('esiNumber')}
        </div>
      </div>
    </div>
  );

  // Compensation tab component
  const renderCompensation = () => {
    console.log('🎯 Rendering Compensation Tab - Data Length:', compensationData.length);
    console.log('🎯 Pay Components Length:', payComponents.length);
    
    return (
      <div className="space-y-6" key="compensation-tab">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Compensation Details</h3>
            <p className="text-sm text-gray-500">Configure salary components and allowances</p>
          </div>
          <button
            type="button"
            onClick={addCompensationRecord}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Component
          </button>
        </div>

        {/* Compensation Records */}
        {compensationLoading ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-lg mb-2">⏳</div>
            <p className="text-gray-500">Loading compensation data...</p>
          </div>
        ) : compensationData.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-lg mb-2">💰</div>
            <p className="text-gray-500">No compensation components added yet</p>
            <p className="text-sm text-gray-400">Click "Add Component" to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {compensationData.map((record, index) => (
              <div key={record.compensationId || record.tempId} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-900">Component #{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeCompensationRecord(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Pay Component */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pay Component *</label>
                    <select
                      value={record.payComponentId}
                      onChange={(e) => updateCompensationRecord(index, 'payComponentId', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="">Select component</option>
                      {payComponents.map(component => (
                        <option key={component.PAY_COMPONENT_ID} value={component.PAY_COMPONENT_ID}>
                          {component.COMPONENT_NAME} ({component.COMPONENT_TYPE})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Amount Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount Type</label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`amountType_${index}`}
                          checked={!record.isPercentage}
                          onChange={() => updateCompensationRecord(index, 'isPercentage', false)}
                          className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Fixed Amount</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`amountType_${index}`}
                          checked={record.isPercentage}
                          onChange={() => updateCompensationRecord(index, 'isPercentage', true)}
                          className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Percentage</span>
                      </label>
                    </div>
                  </div>

                  {/* Amount/Percentage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {record.isPercentage ? 'Percentage (%)' : 'Amount (₹)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={record.isPercentage ? "100" : undefined}
                      step={record.isPercentage ? "0.01" : "0.01"}
                      value={record.isPercentage ? record.percentage : record.amount}
                      onChange={(e) => updateCompensationRecord(
                        index, 
                        record.isPercentage ? 'percentage' : 'amount', 
                        parseFloat(e.target.value) || 0
                      )}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder={record.isPercentage ? "0.00" : "0.00"}
                      required
                    />
                  </div>

                  {/* Effective Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date *</label>
                    <input
                      type="text"
                      value={record.effectiveDate}
                      onChange={(e) => updateCompensationRecord(index, 'effectiveDate', e.target.value)}
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        validationErrors[`compensation_${index}_effectiveDate`] ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="DD-MM-YYYY (e.g., 25-12-1990)"
                      maxLength={10}
                      required
                    />
                    {validationErrors[`compensation_${index}_effectiveDate`] && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors[`compensation_${index}_effectiveDate`]}</p>
                    )}
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="text"
                      value={record.endDate}
                      onChange={(e) => updateCompensationRecord(index, 'endDate', e.target.value)}
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        validationErrors[`compensation_${index}_endDate`] ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="DD-MM-YYYY (optional)"
                      maxLength={10}
                    />
                    {validationErrors[`compensation_${index}_endDate`] && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors[`compensation_${index}_endDate`]}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={record.status}
                      onChange={(e) => updateCompensationRecord(index, 'status', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enhanced Summary with Real-time Calculations */}
        {compensationData.length > 0 && (() => {
          // Debug: Log compensation data to see componentType values
          console.log('🔍 Compensation Data for Summary:', compensationData.map(c => ({
            payComponentId: c.payComponentId,
            componentName: c.componentName,
            componentType: c.componentType,
            amount: c.amount,
            isPercentage: c.isPercentage
          })));
          
          // Calculate all values at runtime with robust componentType checking
          console.log('🔍 Debugging Fixed Earnings Calculation:');
          
          const fixedEarnings = compensationData
            .filter(c => {
              // Get componentType from the component data or look it up from payComponents
              let componentType = c.componentType;
              if (!componentType && c.payComponentId) {
                const payComponent = payComponents.find(pc => pc.PAY_COMPONENT_ID === parseInt(c.payComponentId));
                componentType = payComponent?.COMPONENT_TYPE || '';
                console.log(`🔍 Looked up COMPONENT_TYPE for ${c.payComponentId}: ${componentType}`);
                if (!payComponent) {
                  console.log(`❌ No pay component found for ID ${c.payComponentId}. Available IDs:`, payComponents.map(pc => pc.PAY_COMPONENT_ID));
                }
              }
              const isEarning = (componentType === 'EARNING' || componentType === 'ALLOWANCE') && !c.isPercentage;
              console.log(`💰 Component "${c.componentName || 'Unnamed'}": payComponentId=${c.payComponentId}, componentType="${componentType}", isPercentage=${c.isPercentage}, isEarning=${isEarning}, amount=${c.amount}`);
              return isEarning;
            })
            .reduce((sum, c) => {
              console.log(`➕ Adding to sum: ${sum} + ${c.amount || 0} = ${sum + (c.amount || 0)}`);
              return sum + (c.amount || 0);
            }, 0);
          
          console.log(`🎯 Final Fixed Earnings Total: ₹${fixedEarnings}`);
          
          const percentageEarnings = compensationData
            .filter(c => {
              let componentType = c.componentType;
              if (!componentType && c.payComponentId) {
                const payComponent = payComponents.find(pc => pc.PAY_COMPONENT_ID === parseInt(c.payComponentId));
                componentType = payComponent?.COMPONENT_TYPE || '';
              }
              return (componentType === 'EARNING' || componentType === 'ALLOWANCE') && c.isPercentage;
            })
            .reduce((sum, c) => sum + (c.percentage || 0), 0);
          
          const fixedDeductions = compensationData
            .filter(c => {
              let componentType = c.componentType;
              if (!componentType && c.payComponentId) {
                const payComponent = payComponents.find(pc => pc.PAY_COMPONENT_ID === parseInt(c.payComponentId));
                componentType = payComponent?.COMPONENT_TYPE || '';
              }
              return componentType === 'DEDUCTION' && !c.isPercentage;
            })
            .reduce((sum, c) => sum + (c.amount || 0), 0);
          
          const percentageDeductions = compensationData
            .filter(c => {
              let componentType = c.componentType;
              if (!componentType && c.payComponentId) {
                const payComponent = payComponents.find(pc => pc.PAY_COMPONENT_ID === parseInt(c.payComponentId));
                componentType = payComponent?.COMPONENT_TYPE || '';
              }
              return componentType === 'DEDUCTION' && c.isPercentage;
            })
            .reduce((sum, c) => sum + (c.percentage || 0), 0);
          
          const netFixedSalary = fixedEarnings - fixedDeductions;
          const earningComponents = compensationData.filter(c => {
            let componentType = c.componentType;
            if (!componentType && c.payComponentId) {
              const payComponent = payComponents.find(pc => pc.PAY_COMPONENT_ID === parseInt(c.payComponentId));
              componentType = payComponent?.COMPONENT_TYPE || '';
            }
            return componentType === 'EARNING' || componentType === 'ALLOWANCE';
          }).length;
          const deductionComponents = compensationData.filter(c => {
            let componentType = c.componentType;
            if (!componentType && c.payComponentId) {
              const payComponent = payComponents.find(pc => pc.PAY_COMPONENT_ID === parseInt(c.payComponentId));
              componentType = payComponent?.COMPONENT_TYPE || '';
            }
            return componentType === 'DEDUCTION';
          }).length;
          
          // India statutory computations and CTC preview
          const findAmountByNameOrCode = (predicate) => {
            for (const c of compensationData) {
              // Try using pay component metadata when available
              const payComponent = c.payComponentId 
                ? payComponents.find(pc => pc.PAY_COMPONENT_ID === parseInt(c.payComponentId))
                : null;
              const code = (payComponent?.COMPONENT_CODE || c.componentCode || '').toUpperCase();
              const name = (c.componentName || payComponent?.COMPONENT_NAME || '').toUpperCase();
              const type = (c.componentType || payComponent?.COMPONENT_TYPE || '').toUpperCase();
              const isMatch = predicate({ code, name, type });
              if (isMatch && !c.isPercentage) return Number(c.amount || 0);
            }
            return 0;
          };

          const basicAmount = findAmountByNameOrCode(({ code, name, type }) => type === 'EARNING' && (code === 'BASIC' || name.includes('BASIC')));
          const daAmount = findAmountByNameOrCode(({ code, name }) => code === 'DA' || name.includes('DA') || name.includes('DEARNESS'));
          const grossForEligibility = fixedEarnings; // fixed monthly earnings

          const pfBaseCap = 15000;
          const baseForPf = Math.min(basicAmount + daAmount, pfBaseCap);
          const epfEE = Math.round(baseForPf * 0.12);
          const esiEligible = grossForEligibility <= 21000;
          const esiEE = Math.round(esiEligible ? grossForEligibility * 0.0075 : 0);
          const epsERRaw = baseForPf * 0.0833;
          const epsER = Math.round(Math.min(epsERRaw, 1250));
          const epfER = Math.round(Math.max(baseForPf * 0.12 - epsER, 0));
          const esiER = Math.round(esiEligible ? grossForEligibility * 0.0325 : 0);
          const gratuityER = Math.round(basicAmount * 0.0481);
          const edliER = Math.round(Math.min(baseForPf * 0.005, 75));
          const epfAdmin = Math.round(Math.min(baseForPf * 0.005, 75));
          const employerTotal = epfER + epsER + esiER + gratuityER + edliER + epfAdmin;
          const employeeStatutoryTotal = epfEE + esiEE;
          const ctcMonthly = grossForEligibility + employerTotal;

          console.log('📊 Summary Calculations:', {
            fixedEarnings,
            percentageEarnings,
            fixedDeductions,
            percentageDeductions,
            netFixedSalary,
            earningComponents,
            deductionComponents,
            basicAmount,
            daAmount,
            baseForPf,
            epfEE,
            esiEE,
            epfER,
            epsER,
            esiER,
            gratuityER,
            edliER,
            epfAdmin,
            employerTotal,
            employeeStatutoryTotal,
            ctcMonthly
          });

          return (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Compensation Summary
              </h4>
              
              {/* Main Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <div className="text-xs text-blue-600 uppercase tracking-wide font-medium">Total Components</div>
                  <div className="text-2xl font-bold text-blue-900">{compensationData.length}</div>
                  <div className="text-xs text-blue-500">
                    {earningComponents} earnings • {deductionComponents} deductions
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-3 border border-green-100">
                  <div className="text-xs text-green-600 uppercase tracking-wide font-medium">Fixed Earnings</div>
                  <div className="text-2xl font-bold text-green-900">
                    {ctcCalculation ? 
                      `${ctcCalculation.currency?.symbol || '₹'}${Math.round(ctcCalculation.earnings.gross || 0)}` : 
                      currencyConfig.formatAmount(fixedEarnings)
                    }
                  </div>
                  <div className="text-sm text-green-700">Total Fixed Earnings</div>
                </div>
                
                <div className="bg-white rounded-lg p-3 border border-red-100">
                  <div className="text-xs text-red-600 uppercase tracking-wide font-medium">Fixed Deductions</div>
                  <div className="text-2xl font-bold text-red-900">
                    {ctcCalculation ? 
                      `${ctcCalculation.currency?.symbol || '₹'}${Math.round(ctcCalculation.deductions.employee || 0)}` : 
                      currencyConfig.formatAmount(fixedDeductions)
                    }
                  </div>
                  <div className="text-sm text-red-700">Total Fixed Deductions</div>
                </div>
                
                <div className="bg-white rounded-lg p-3 border border-indigo-100">
                  <div className="text-xs text-indigo-600 uppercase tracking-wide font-medium">Net Fixed Salary</div>
                  <div className={`text-2xl font-bold ${(ctcCalculation ? ctcCalculation.deductions.net : netFixedSalary) >= 0 ? 'text-indigo-900' : 'text-red-600'}`}>
                    {ctcCalculation ? 
                      `${ctcCalculation.currency?.symbol || '₹'}${Math.round(ctcCalculation.deductions.net || 0)}` : 
                      currencyConfig.formatAmount(netFixedSalary)
                    }
                  </div>
                  <div className="text-xs text-indigo-500">After fixed deductions</div>
                </div>
              </div>

              {/* Percentage Components */}
              {(percentageEarnings > 0 || percentageDeductions > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {percentageEarnings > 0 && (
                    <div className="bg-white rounded-lg p-3 border border-green-100">
                      <div className="text-xs text-green-600 uppercase tracking-wide font-medium">Variable Earnings</div>
                      <div className="text-lg font-bold text-green-900">{percentageEarnings}%</div>
                      <div className="text-xs text-green-500">Percentage-based components</div>
                    </div>
                  )}
                  
                  {percentageDeductions > 0 && (
                    <div className="bg-white rounded-lg p-3 border border-red-100">
                      <div className="text-xs text-red-600 uppercase tracking-wide font-medium">Variable Deductions</div>
                      <div className="text-lg font-bold text-red-900">{percentageDeductions}%</div>
                      <div className="text-xs text-red-500">Percentage-based deductions</div>
                    </div>
                  )}
                </div>
              )}


              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-3 border">
                  <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">Employee Statutory Deductions</div>
                  <div className="mt-2 text-sm text-gray-700 space-y-1">
                    {ctcCalculation && ctcCalculation.deductions ? (
                      // Show country-specific deductions from CTC calculation
                      <>
                        {Object.entries(ctcCalculation.deductions.statutory || {}).map(([key, deduction]) => {
                          if (deduction.employee > 0) {
                            return (
                              <div key={key} className="flex justify-between">
                                <span>{key.replace(/([A-Z])/g, ' $1').toUpperCase().trim()}</span>
                                <span>{ctcCalculation.currency?.symbol || '₹'}{deduction.employee}</span>
                              </div>
                            );
                          }
                          return null;
                        })}
                        {(!ctcCalculation.deductions.statutory || Object.keys(ctcCalculation.deductions.statutory).length === 0 || 
                          Object.values(ctcCalculation.deductions.statutory).every(d => d.employee === 0)) && (
                          <div className="text-sm text-gray-500 italic">No statutory deductions ({ctcCalculation.countryCode === 'UAE' ? 'Expatriate employee' : 'Not applicable'})</div>
                        )}
                      </>
                    ) : (
                      // Fallback to Indian calculations if no CTC data
                      <>
                        <div className="flex justify-between"><span>EPF (12%)</span><span>{currencyConfig.formatAmount(epfEE)}</span></div>
                        <div className="flex justify-between"><span>ESI (0.75%){!esiEligible && ' (Not Eligible)'} </span><span>{currencyConfig.formatAmount(esiEE)}</span></div>
                      </>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Total: {ctcCalculation ? 
                      `${ctcCalculation.currency?.symbol || '₹'}${ctcCalculation.deductions.employee || 0}` : 
                      currencyConfig.formatAmount(employeeStatutoryTotal)
                    }
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 border">
                  <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">Employer Contributions</div>
                  <div className="mt-2 text-sm text-gray-700 space-y-1">
                    {ctcCalculation && ctcCalculation.employerCosts ? (
                      // Show country-specific employer contributions
                      <>
                        {Object.entries(ctcCalculation.deductions.statutory || {}).map(([key, deduction]) => {
                          if (deduction.employer > 0) {
                            return (
                              <div key={`${key}-er`} className="flex justify-between">
                                <span>{key.replace(/([A-Z])/g, ' $1').toUpperCase().trim()} (ER)</span>
                                <span>{ctcCalculation.currency?.symbol || '₹'}{deduction.employer}</span>
                              </div>
                            );
                          }
                          return null;
                        })}
                        {ctcCalculation.employerCosts.gratuity > 0 && (
                          <div className="flex justify-between">
                            <span>Gratuity Accrual</span>
                            <span>{ctcCalculation.currency?.symbol || '₹'}{Math.round(ctcCalculation.employerCosts.gratuity)}</span>
                          </div>
                        )}
                        {ctcCalculation.employerCosts.airTicket > 0 && (
                          <div className="flex justify-between">
                            <span>Air Ticket Allowance</span>
                            <span>{ctcCalculation.currency?.symbol || '₹'}{Math.round(ctcCalculation.employerCosts.airTicket)}</span>
                          </div>
                        )}
                        {ctcCalculation.employerCosts.total === 0 && (
                          <div className="text-sm text-gray-500 italic">No employer contributions ({ctcCalculation.countryCode === 'UAE' ? 'Expatriate employee' : 'Not applicable'})</div>
                        )}
                      </>
                    ) : (
                      // Fallback to Indian calculations
                      <>
                        <div className="flex justify-between"><span>EPF (ER)</span><span>{currencyConfig.formatAmount(epfER)}</span></div>
                        <div className="flex justify-between"><span>EPS (8.33%)</span><span>{currencyConfig.formatAmount(epsER)}</span></div>
                        <div className="flex justify-between"><span>ESI (3.25%){!esiEligible && ' (Not Eligible)'}</span><span>{currencyConfig.formatAmount(esiER)}</span></div>
                        <div className="flex justify-between"><span>Gratuity (4.81% of Basic)</span><span>{currencyConfig.formatAmount(gratuityER)}</span></div>
                        <div className="flex justify-between"><span>EDLI</span><span>{currencyConfig.formatAmount(edliER)}</span></div>
                        <div className="flex justify-between"><span>EPF Admin</span><span>{currencyConfig.formatAmount(epfAdmin)}</span></div>
                      </>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Employer Total: {ctcCalculation ? 
                      `${ctcCalculation.currency?.symbol || '₹'}${Math.round(ctcCalculation.employerCosts.total || 0)}` : 
                      currencyConfig.formatAmount(employerTotal)
                    }
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 border">
                  <div className="text-xs text-indigo-600 uppercase tracking-wide font-medium">Cost to Company (Monthly)</div>
                  <div className="text-2xl font-bold text-indigo-900">
                    {ctcCalculation ? 
                      `${ctcCalculation.currency?.symbol || '₹'}${Math.round(ctcCalculation.totals.monthlyCTC || 0)}` : 
                      currencyConfig.formatAmount(ctcMonthly)
                    }
                  </div>
                  <div className="text-xs text-indigo-500">
                    {ctcCalculation ? 
                      `${ctcCalculation.countryCode} Labor Law Applied` : 
                      'Gross Fixed Earnings + Employer Contributions'
                    }
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  const renderGlobalInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payroll Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Payroll Country *</label>
          <select
            value={formData.payrollCountry || ''}
            onChange={e => {
              const newCountry = e.target.value;
              handleInputChange('payrollCountry', newCountry);
              // Trigger CTC recalculation when country changes
              if (newCountry && compensationData.length > 0) {
                toast.success(`CTC will be recalculated for ${countryOptions.find(c => c.code === newCountry)?.name || newCountry} policy`);
                setTimeout(() => recalculateCTC(newCountry), 500);
              }
            }}
            className="input-field"
            required
          >
            <option value="">Select country</option>
            {countryOptions.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
          {renderError('payrollCountry')}
        </div>
        {/* Employee Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Employee Type *</label>
          <select
            value={formData.employeeType}
            onChange={e => handleInputChange('employeeType', e.target.value)}
            className="input-field"
            required
          >
            <option value="">Select type</option>
            <option value="EXPATRIATE">Expatriate</option>
            <option value="LOCAL">Local</option>
          </select>
          {renderError('employeeType')}
        </div>
        {/* Air Ticket Eligibility */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Air Ticket Eligibility *</label>
          <select
            value={formData.airTicketEligibility || ''}
            onChange={e => {
              const value = e.target.value;
              handleInputChange('airTicketEligibility', value);
              if (value === 'NO') {
                handleInputChange('airTicketEligible', 0);
                handleInputChange('airTicketSegment', '');
              }
            }}
            required
            className="input-field"
          >
            <option value="">Select eligibility</option>
            <option value="YES">Yes</option>
            <option value="NO">No</option>
          </select>
          {renderError('airTicketEligibility')}
        </div>
        {/* Air Ticket Eligible Dropdown (1-4) */}
        {formData.airTicketEligibility === 'YES' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Air Ticket Eligible *</label>
            <select
              value={formData.airTicketEligible || ''}
              onChange={e => handleInputChange('airTicketEligible', e.target.value)}
              required
              className="input-field"
            >
              <option value="">Select eligible count</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
            {renderError('airTicketEligible')}
          </div>
        )}
        {formData.airTicketEligibility === 'NO' && (
          <input type="hidden" name="airTicketEligible" value={0} />
        )}
        {/* Air Ticket Segment Dropdown */}
        {formData.airTicketEligibility === 'YES' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Air Ticket Segment *</label>
            <select
              value={formData.airTicketSegment || ''}
              onChange={e => handleInputChange('airTicketSegment', e.target.value)}
              required
              className="input-field"
            >
              <option value="">Select segment</option>
              <option value="Economy">Economy</option>
              <option value="Business">Business</option>
              <option value="First">First</option>
              <option value="Other">Other</option>
            </select>
            {renderError('airTicketSegment')}
          </div>
        )}
      </div>
      {/* India Consultant Multi-Company Logic */}
      {formData.payrollCountry === 'India' && formData.employeeType === 'Consultant' && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-md font-semibold text-blue-900 mb-2 flex items-center">
            <BuildingOffice2Icon className="h-5 w-5 mr-2" /> Multi-Company Payroll (Consultant)
          </h4>
          <p className="text-sm text-blue-700 mb-4">
            This consultant works for multiple companies. Payroll can be processed for all, but PF will be deducted from only one company.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payroll Companies Multi-select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payroll Companies *</label>
              <select
                multiple
                value={formData.payrollCompanies}
                onChange={e => handleInputChange('payrollCompanies', Array.from(e.target.selectedOptions, o => o.value))}
                className="input-field h-32"
                required
              >
                {companyOptions.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {renderError('payrollCompanies')}
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl (Windows) or Cmd (Mac) to select multiple companies.</p>
            </div>
            {/* PF Deduction Company Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">PF Deduction Company *</label>
              <select
                value={formData.pfDeductionCompany}
                onChange={e => handleInputChange('pfDeductionCompany', e.target.value)}
                className="input-field"
                required
                disabled={formData.payrollCompanies.length === 0}
              >
                <option value="">Select company</option>
                {formData.payrollCompanies.map(cid => {
                  const c = companyOptions.find(opt => opt.id === cid);
                  return c ? <option key={c.id} value={c.id}>{c.name}</option> : null;
                })}
              </select>
              {renderError('pfDeductionCompany')}
              <p className="text-xs text-gray-500 mt-1">Only one company can be selected for PF deduction.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return renderPersonalInfo();
      case 'job':
        return renderJobInfo();
      case 'address':
        return renderAddressInfo();
      case 'legal':
        return renderLegalInfo();
      case 'bank':
        return renderBankInfo();
      case 'compensation':
        return renderCompensation();
      case 'global':
        return renderGlobalInfo();
      default:
        return renderPersonalInfo();
    }
  };

  // Fetch countries for Payroll Country dropdown
  useEffect(() => {
    fetch('/api/public/countries')
      .then(res => res.json())
      .then(data => {
        if (data.success) setCountryOptions(data.data);
      })
      .catch(error => {
        console.error('Error fetching countries:', error);
        toast.error('Failed to load countries for dropdown');
      });
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Authentication Required</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please log in to access employee onboarding.
        </p>
        <div className="mt-6">
          <Link
            to="/login"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/employees')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditing ? 'Edit Employee' : 'Employee Onboarding'}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {isEditing ? 'Loading employee data...' : 'Complete employee onboarding process'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button and Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/employees')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </button>
        </div>
        <ValidationHelp />
      </div>

      {/* Professional Header with Avatar and Info */}
      {renderProfessionalHeader()}

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderValidationSummary()}
          {renderTabContent()}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={() => navigate('/employees')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Saving...' : (isEditing ? 'Update Employee' : 'Create Employee')}
        </button>
      </div>
    </div>
  );
};

export default EmployeeOnboarding; 