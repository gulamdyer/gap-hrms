import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  EyeIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { activityAPI } from '../services/api';
import toast from 'react-hot-toast';

const ActivityDetailModal = ({ isOpen, onClose, activityId }) => {
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [oldValues, setOldValues] = useState({});
  const [newValues, setNewValues] = useState({});
  const [changedFields, setChangedFields] = useState([]);

  useEffect(() => {
    if (isOpen && activityId) {
      fetchActivityDetails();
    }
  }, [isOpen, activityId]);

  const fetchActivityDetails = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching activity details for ID:', activityId);
      
      // For mock activities, create mock details instead of API call
      if (activityId <= 5) { // Mock activities have IDs 1-5
        console.log('📋 Using mock activity details for ID:', activityId);
        
        const mockActivityDetails = {
          1: {
            ID: 1,
            ACTION: 'UPDATE',
            MODULE: 'Employee',
            ENTITY_TYPE: 'Employee',
            ENTITY_ID: 'EMP001',
            OLD_VALUES: JSON.stringify({
              firstName: 'John',
              lastName: 'Doe',
              email: 'john.doe@old.com',
              phone: '+1234567890',
              salary: '50000'
            }),
            NEW_VALUES: JSON.stringify({
              firstName: 'John',
              lastName: 'Doe',
              email: 'john.doe@new.com',
              phone: '+1234567891',
              salary: '55000'
            }),
            DESCRIPTION: 'Updated employee information for John Doe',
            CREATED_AT: new Date().toISOString(),
            USER_ID: 1,
            USER_NAME: 'Admin User'
          },
          2: {
            ID: 2,
            ACTION: 'CREATE',
            MODULE: 'Leave',
            ENTITY_TYPE: 'Leave',
            ENTITY_ID: 'LEAVE001',
            OLD_VALUES: null,
            NEW_VALUES: JSON.stringify({
              employeeId: 'EMP002',
              leaveType: 'Annual',
              startDate: '2024-01-15',
              endDate: '2024-01-17',
              reason: 'Personal vacation'
            }),
            DESCRIPTION: 'Leave request submitted by Jane Smith',
            CREATED_AT: new Date().toISOString(),
            USER_ID: 2,
            USER_NAME: 'Jane Smith'
          },
          3: {
            ID: 3,
            ACTION: 'CREATE',
            MODULE: 'Employee',
            ENTITY_TYPE: 'Employee',
            ENTITY_ID: 'EMP003',
            OLD_VALUES: null,
            NEW_VALUES: JSON.stringify({
              firstName: 'Sarah',
              lastName: 'Johnson',
              email: 'sarah.johnson@company.com',
              phone: '+1234567892',
              department: 'Marketing',
              position: 'Marketing Manager',
              salary: '65000'
            }),
            DESCRIPTION: 'New employee Sarah Johnson added to system',
            CREATED_AT: new Date().toISOString(),
            USER_ID: 1,
            USER_NAME: 'Admin User'
          },
          4: {
            ID: 4,
            ACTION: 'UPDATE',
            MODULE: 'Leave',
            ENTITY_TYPE: 'Leave',
            ENTITY_ID: 'LEAVE002',
            OLD_VALUES: JSON.stringify({
              status: 'PENDING',
              approvedBy: null,
              approvedAt: null
            }),
            NEW_VALUES: JSON.stringify({
              status: 'APPROVED',
              approvedBy: 'Admin User',
              approvedAt: new Date().toISOString()
            }),
            DESCRIPTION: 'Leave request approved for Mike Wilson',
            CREATED_AT: new Date().toISOString(),
            USER_ID: 1,
            USER_NAME: 'Admin User'
          },
          5: {
            ID: 5,
            ACTION: 'CREATE',
            MODULE: 'Payroll',
            ENTITY_TYPE: 'Payroll',
            ENTITY_ID: 'PAYROLL001',
            OLD_VALUES: null,
            NEW_VALUES: JSON.stringify({
              month: 'January 2024',
              totalEmployees: 25,
              totalAmount: '1250000',
              processedBy: 'Admin User',
              processedAt: new Date().toISOString()
            }),
            DESCRIPTION: 'Monthly payroll processed for all employees',
            CREATED_AT: new Date().toISOString(),
            USER_ID: 1,
            USER_NAME: 'Admin User'
          }
        };
        
        const activityData = mockActivityDetails[activityId];
        setActivity(activityData);
        
        // Parse old and new values
        if (activityData.OLD_VALUES) {
          const old = typeof activityData.OLD_VALUES === 'string' 
            ? JSON.parse(activityData.OLD_VALUES) 
            : activityData.OLD_VALUES;
          setOldValues(old);
          console.log('🔍 Parsed OLD_VALUES:', old);
          console.log('🔍 OLD_VALUES keys:', Object.keys(old));
          
          // Debug date fields specifically
          if (old.DATE_OF_BIRTH) console.log('🔍 OLD_VALUES DATE_OF_BIRTH:', old.DATE_OF_BIRTH, 'type:', typeof old.DATE_OF_BIRTH);
          if (old.DATE_OF_JOINING) console.log('🔍 OLD_VALUES DATE_OF_JOINING:', old.DATE_OF_JOINING, 'type:', typeof old.DATE_OF_JOINING);
          if (old.CONFIRM_DATE) console.log('🔍 OLD_VALUES CONFIRM_DATE:', old.CONFIRM_DATE, 'type:', typeof old.CONFIRM_DATE);
          
          // Debug advance fields specifically
          if (old.ADVANCE_ID) console.log('🔍 OLD_VALUES ADVANCE_ID:', old.ADVANCE_ID, 'type:', typeof old.ADVANCE_ID);
          if (old.ADVANCE_TYPE) console.log('🔍 OLD_VALUES ADVANCE_TYPE:', old.ADVANCE_TYPE, 'type:', typeof old.ADVANCE_TYPE);
          if (old.AMOUNT) console.log('🔍 OLD_VALUES AMOUNT:', old.AMOUNT, 'type:', typeof old.AMOUNT);
          if (old.REASON) console.log('🔍 OLD_VALUES REASON:', old.REASON, 'type:', typeof old.REASON);
          if (old.REQUEST_DATE) console.log('🔍 OLD_VALUES REQUEST_DATE:', old.REQUEST_DATE, 'type:', typeof old.REQUEST_DATE);
          if (old.AMOUNT_REQUIRED_ON_DATE) console.log('🔍 OLD_VALUES AMOUNT_REQUIRED_ON_DATE:', old.AMOUNT_REQUIRED_ON_DATE, 'type:', typeof old.AMOUNT_REQUIRED_ON_DATE);
          
          // Debug loan fields specifically
          if (old.LOAN_ID) console.log('🔍 OLD_VALUES LOAN_ID:', old.LOAN_ID, 'type:', typeof old.LOAN_ID);
          if (old.LOAN_TYPE) console.log('🔍 OLD_VALUES LOAN_TYPE:', old.LOAN_TYPE, 'type:', typeof old.LOAN_TYPE);
          if (old.AMOUNT) console.log('🔍 OLD_VALUES AMOUNT:', old.AMOUNT, 'type:', typeof old.AMOUNT);
          if (old.REASON) console.log('🔍 OLD_VALUES REASON:', old.REASON, 'type:', typeof old.REASON);
          if (old.STATUS) console.log('🔍 OLD_VALUES STATUS:', old.STATUS, 'type:', typeof old.STATUS);
          if (old.INTEREST_RATE) console.log('🔍 OLD_VALUES INTEREST_RATE:', old.INTEREST_RATE, 'type:', typeof old.INTEREST_RATE);
          if (old.REPAYMENT_PERIOD) console.log('🔍 OLD_VALUES REPAYMENT_PERIOD:', old.REPAYMENT_PERIOD, 'type:', typeof old.REPAYMENT_PERIOD);
          if (old.LOAN_DATE) console.log('🔍 OLD_VALUES LOAN_DATE:', old.LOAN_DATE, 'type:', typeof old.LOAN_DATE);
          if (old.APPROVAL_DATE) console.log('🔍 OLD_VALUES APPROVAL_DATE:', old.APPROVAL_DATE, 'type:', typeof old.APPROVAL_DATE);
          if (old.DISBURSEMENT_DATE) console.log('🔍 OLD_VALUES DISBURSEMENT_DATE:', old.DISBURSEMENT_DATE, 'type:', typeof old.DISBURSEMENT_DATE);
        }
        
        if (activityData.NEW_VALUES) {
          const newVals = typeof activityData.NEW_VALUES === 'string' 
            ? JSON.parse(activityData.NEW_VALUES) 
            : activityData.NEW_VALUES;
          setNewValues(newVals);
          console.log('🔍 Parsed NEW_VALUES:', newVals);
          console.log('🔍 NEW_VALUES keys:', Object.keys(newVals));
          
          // Debug date fields specifically
          if (newVals.dateOfBirth) console.log('🔍 NEW_VALUES dateOfBirth:', newVals.dateOfBirth, 'type:', typeof newVals.dateOfBirth);
          if (newVals.dateOfJoining) console.log('🔍 NEW_VALUES dateOfJoining:', newVals.dateOfJoining, 'type:', typeof newVals.dateOfJoining);
          if (newVals.confirmDate) console.log('🔍 NEW_VALUES confirmDate:', newVals.confirmDate, 'type:', typeof newVals.confirmDate);
          
          // Debug advance fields specifically
          if (newVals.advanceId) console.log('🔍 NEW_VALUES advanceId:', newVals.advanceId, 'type:', typeof newVals.advanceId);
          if (newVals.advanceType) console.log('🔍 NEW_VALUES advanceType:', newVals.advanceType, 'type:', typeof newVals.advanceType);
          if (newVals.amount) console.log('🔍 NEW_VALUES amount:', newVals.amount, 'type:', typeof newVals.amount);
          if (newVals.reason) console.log('🔍 NEW_VALUES reason:', newVals.reason, 'type:', typeof newVals.reason);
          if (newVals.requestDate) console.log('🔍 NEW_VALUES requestDate:', newVals.requestDate, 'type:', typeof newVals.requestDate);
          if (newVals.amountRequiredOnDate) console.log('🔍 NEW_VALUES amountRequiredOnDate:', newVals.amountRequiredOnDate, 'type:', typeof newVals.amountRequiredOnDate);
          
          // Debug loan fields specifically
          if (newVals.loanId) console.log('🔍 NEW_VALUES loanId:', newVals.loanId, 'type:', typeof newVals.loanId);
          if (newVals.loanType) console.log('🔍 NEW_VALUES loanType:', newVals.loanType, 'type:', typeof newVals.loanType);
          if (newVals.amount) console.log('🔍 NEW_VALUES amount:', newVals.amount, 'type:', typeof newVals.amount);
          if (newVals.reason) console.log('🔍 NEW_VALUES reason:', newVals.reason, 'type:', typeof newVals.reason);
          if (newVals.status) console.log('🔍 NEW_VALUES status:', newVals.status, 'type:', typeof newVals.status);
          if (newVals.interestRate) console.log('🔍 NEW_VALUES interestRate:', newVals.interestRate, 'type:', typeof newVals.interestRate);
          if (newVals.repaymentPeriod) console.log('🔍 NEW_VALUES repaymentPeriod:', newVals.repaymentPeriod, 'type:', typeof newVals.repaymentPeriod);
          if (newVals.loanDate) console.log('🔍 NEW_VALUES loanDate:', newVals.loanDate, 'type:', typeof newVals.loanDate);
          if (newVals.approvalDate) console.log('🔍 NEW_VALUES approvalDate:', newVals.approvalDate, 'type:', typeof newVals.approvalDate);
          if (newVals.disbursementDate) console.log('🔍 NEW_VALUES disbursementDate:', newVals.disbursementDate, 'type:', typeof newVals.disbursementDate);
        }
        
        // Identify changed fields with improved logic
        if (activityData.OLD_VALUES && activityData.NEW_VALUES) {
          const old = typeof activityData.OLD_VALUES === 'string' 
            ? JSON.parse(activityData.OLD_VALUES) 
            : activityData.OLD_VALUES;
          const newVals = typeof activityData.NEW_VALUES === 'string' 
            ? JSON.parse(activityData.NEW_VALUES) 
            : activityData.NEW_VALUES;
          
          console.log('🔍 Before identifyChangedFields - Old keys:', Object.keys(old));
          console.log('🔍 Before identifyChangedFields - New keys:', Object.keys(newVals));
          
          const changed = identifyChangedFields(old, newVals);
          setChangedFields(changed);
          
          console.log('🔍 Final changed fields:', changed);
        }
        
      } else {
        // Try real API call for non-mock activities
        const response = await activityAPI.getById(activityId);
        const activityData = response.data;
        
        setActivity(activityData);
        
        // Parse old and new values
        if (activityData.OLD_VALUES) {
          const old = typeof activityData.OLD_VALUES === 'string' 
            ? JSON.parse(activityData.OLD_VALUES) 
            : activityData.OLD_VALUES;
          setOldValues(old);
          console.log('🔍 Parsed OLD_VALUES:', old);
          console.log('🔍 OLD_VALUES keys:', Object.keys(old));
          
          // Debug date fields specifically
          if (old.DATE_OF_BIRTH) console.log('🔍 OLD_VALUES DATE_OF_BIRTH:', old.DATE_OF_BIRTH, 'type:', typeof old.DATE_OF_BIRTH);
          if (old.DATE_OF_JOINING) console.log('🔍 OLD_VALUES DATE_OF_JOINING:', old.DATE_OF_JOINING, 'type:', typeof old.DATE_OF_JOINING);
          if (old.CONFIRM_DATE) console.log('🔍 OLD_VALUES CONFIRM_DATE:', old.CONFIRM_DATE, 'type:', typeof old.CONFIRM_DATE);
        }
        
        if (activityData.NEW_VALUES) {
          const newVals = typeof activityData.NEW_VALUES === 'string' 
            ? JSON.parse(activityData.NEW_VALUES) 
            : activityData.NEW_VALUES;
          setNewValues(newVals);
          console.log('🔍 Parsed NEW_VALUES:', newVals);
          console.log('🔍 NEW_VALUES keys:', Object.keys(newVals));
          
          // Debug date fields specifically
          if (newVals.dateOfBirth) console.log('🔍 NEW_VALUES dateOfBirth:', newVals.dateOfBirth, 'type:', typeof newVals.dateOfBirth);
          if (newVals.dateOfJoining) console.log('🔍 NEW_VALUES dateOfJoining:', newVals.dateOfJoining, 'type:', typeof newVals.dateOfJoining);
          if (newVals.confirmDate) console.log('🔍 NEW_VALUES confirmDate:', newVals.confirmDate, 'type:', typeof newVals.confirmDate);
        }
        
        // Identify changed fields with improved logic
        if (activityData.OLD_VALUES && activityData.NEW_VALUES) {
          const old = typeof activityData.OLD_VALUES === 'string' 
            ? JSON.parse(activityData.OLD_VALUES) 
            : activityData.OLD_VALUES;
          const newVals = typeof activityData.NEW_VALUES === 'string' 
            ? JSON.parse(activityData.NEW_VALUES) 
            : activityData.NEW_VALUES;
          
          console.log('🔍 Before identifyChangedFields - Old keys:', Object.keys(old));
          console.log('🔍 Before identifyChangedFields - New keys:', Object.keys(newVals));
          
          const changed = identifyChangedFields(old, newVals);
          setChangedFields(changed);
          
          console.log('🔍 Final changed fields:', changed);
        }
      }
      
    } catch (error) {
      console.error('Error fetching activity details:', error);
      toast.error('Failed to load activity details');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to identify changed fields with improved logic
  const identifyChangedFields = (old, newVals) => {
    console.log('🔍 identifyChangedFields called');
    console.log('🔍 Old values keys:', Object.keys(old));
    console.log('🔍 New values keys:', Object.keys(newVals));
    
    // Create normalized versions of both objects for comparison
    const normalizedOld = {};
    const normalizedNew = {};
    
    // Normalize old values
    Object.keys(old).forEach(key => {
      const normalizedKey = normalizeFieldName(key);
      normalizedOld[normalizedKey] = old[key];
    });
    
    // Normalize new values
    Object.keys(newVals).forEach(key => {
      const normalizedKey = normalizeFieldName(key);
      normalizedNew[normalizedKey] = newVals[key];
    });
    
    console.log('🔍 Normalized old keys:', Object.keys(normalizedOld));
    console.log('🔍 Normalized new keys:', Object.keys(normalizedNew));
    
    // Get all unique fields from both normalized objects
    const allFields = new Set([...Object.keys(normalizedOld), ...Object.keys(normalizedNew)]);
    console.log('🔍 All unique fields:', Array.from(allFields));
    
    // Compare only fields that exist in both objects
    const changed = Array.from(allFields).filter(key => {
      // Only compare if the field exists in both old and new values
      if (normalizedOld.hasOwnProperty(key) && normalizedNew.hasOwnProperty(key)) {
        // Handle date comparisons properly
        if (isDateField(key)) {
          // Convert both values to comparable format
          const oldValue = normalizedOld[key];
          const newValue = normalizedNew[key];
          
          console.log(`🔍 Date field ${key}: oldValue="${oldValue}", newValue="${newValue}"`);
          
          // Handle null/undefined values
          if (!oldValue && !newValue) {
            console.log(`🔍 Date field ${key}: both null/undefined, not changed`);
            return false;
          }
          
          if (!oldValue || !newValue) {
            console.log(`🔍 Date field ${key}: one is null/undefined, changed`);
            return true;
          }
          
          // Normalize date strings to YYYY-MM-DD format for comparison
          const normalizeDateString = (dateStr) => {
            if (!dateStr) return null;
            
            console.log(`🔍 Normalizing date: "${dateStr}" (type: ${typeof dateStr})`);
            
            try {
              // Handle different date formats
              let date;
              
              // If it's already a Date object
              if (dateStr instanceof Date) {
                date = dateStr;
              }
              // If it's a string, try to parse it
              else if (typeof dateStr === 'string') {
                // Handle DD-MM-YYYY format
                if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
                  const parts = dateStr.split('-');
                  date = new Date(parts[2], parts[1] - 1, parts[0]);
                }
                // Handle YYYY-MM-DD format
                else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                  date = new Date(dateStr);
                }
                // Handle ISO string format
                else if (dateStr.includes('T') || dateStr.includes('Z')) {
                  date = new Date(dateStr);
                }
                // Try default parsing
                else {
                  date = new Date(dateStr);
                }
              }
              // For other types, try to convert to Date
              else {
                date = new Date(dateStr);
              }
              
              if (isNaN(date.getTime())) {
                console.log(`🔍 Invalid date: "${dateStr}" - returning original string`);
                return String(dateStr);
              }
              
              // Return in YYYY-MM-DD format
              const normalized = date.toISOString().split('T')[0];
              console.log(`🔍 Normalized date: "${dateStr}" -> "${normalized}"`);
              return normalized;
            } catch (error) {
              console.log(`🔍 Date parsing failed for: "${dateStr}" - returning original string`);
              return String(dateStr);
            }
          };
          
          const normalizedOldDate = normalizeDateString(oldValue);
          const normalizedNewDate = normalizeDateString(newValue);
          
          console.log(`🔍 Date field ${key}: normalized old="${normalizedOldDate}", new="${normalizedNewDate}"`);
          
          // For date fields, compare the normalized values
          // If both are valid dates, compare the normalized strings
          if (normalizedOldDate && normalizedNewDate && 
              /^\d{4}-\d{2}-\d{2}$/.test(normalizedOldDate) && 
              /^\d{4}-\d{2}-\d{2}$/.test(normalizedNewDate)) {
            const isChanged = normalizedOldDate !== normalizedNewDate;
            console.log(`🔍 Date field ${key}: comparing normalized dates, changed=${isChanged}`);
            return isChanged;
          }
          
          // If one or both are not valid dates, compare as strings
          const isChanged = normalizedOldDate !== normalizedNewDate;
          console.log(`🔍 Date field ${key}: comparing as strings, changed=${isChanged}`);
          return isChanged;
        }
        // Handle other value comparisons
        const isChanged = normalizedOld[key] !== normalizedNew[key];
        console.log(`🔍 Field ${key}: old=${normalizedOld[key]}, new=${normalizedNew[key]}, changed=${isChanged}`);
        return isChanged;
      }
      return false; // Don't mark as changed if field doesn't exist in both
    });
    
    console.log('🔍 Changed fields:', changed);
    return changed;
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATE':
        return <CheckCircleIcon className="h-5 w-5 text-success-500" />;
      case 'UPDATE':
        return <ArrowPathIcon className="h-5 w-5 text-warning-500" />;
      case 'DELETE':
        return <ExclamationTriangleIcon className="h-5 w-5 text-danger-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-primary-500" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE':
        return 'bg-success-100 text-success-800 border-success-200';
      case 'UPDATE':
        return 'bg-warning-100 text-warning-800 border-warning-200';
      case 'DELETE':
        return 'bg-danger-100 text-danger-800 border-danger-200';
      default:
        return 'bg-primary-100 text-primary-800 border-primary-200';
    }
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">Not set</span>;
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (typeof value === 'object') {
      return <pre className="text-xs bg-gray-50 p-2 rounded">{JSON.stringify(value, null, 2)}</pre>;
    }
    return String(value);
  };

  const formatFieldName = (fieldName) => {
    // First normalize the field name to camelCase
    const normalizedField = normalizeFieldName(fieldName);
    
    // Then convert camelCase to Title Case
    return normalizedField
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  // Function to normalize field names for comparison
  const normalizeFieldName = (fieldName) => {
    // Convert common field name variations to a standard format
    const fieldMappings = {
      // Database column names to frontend field names
      'FIRST_NAME': 'firstName',
      'LAST_NAME': 'lastName',
      'LEGAL_NAME': 'legalName',
      'GENDER': 'gender',
      'NATIONALITY': 'nationality',
      'DATE_OF_BIRTH': 'dateOfBirth',
      'BIRTH_PLACE': 'birthPlace',
      'AVATAR_URL': 'avatarUrl',
      'REPORT_TO_ID': 'reportToId',
      'DESIGNATION': 'designation',
      'ROLE': 'role',
      'POSITION': 'position',
      'LOCATION': 'location',
      'COST_CENTER': 'costCenter',
      'DATE_OF_JOINING': 'dateOfJoining',
      'PROBATION_DAYS': 'probationDays',
      'CONFIRM_DATE': 'confirmDate',
      'NOTICE_DAYS': 'noticeDays',
      'ADDRESS': 'address',
      'PINCODE': 'pincode',
      'CITY': 'city',
      'DISTRICT': 'district',
      'STATE': 'state',
      'COUNTRY': 'country',
      'PHONE': 'phone',
      'MOBILE': 'mobile',
      'EMAIL': 'email',
      'FATHER_NAME': 'fatherName',
      'MARITAL_STATUS': 'maritalStatus',
      'SPOUSE_NAME': 'spouseName',
      'RELIGION': 'religion',
      'AADHAR_NUMBER': 'aadharNumber',
      'AADHAR_IMAGE_URL': 'aadharImageUrl',
      'PAN_NUMBER': 'panNumber',
      'PAN_IMAGE_URL': 'panImageUrl',
      'DRIVING_LICENSE_NUMBER': 'drivingLicenseNumber',
      'DRIVING_LICENSE_IMAGE_URL': 'drivingLicenseImageUrl',
      'EDUCATION_CERTIFICATE_NUMBER': 'educationCertificateNumber',
      'EDUCATION_CERTIFICATE_IMAGE_URL': 'educationCertificateImageUrl',
      'BANK_NAME': 'bankName',
      'BRANCH_NAME': 'branchName',
      'IFSC_CODE': 'ifscCode',
      'ACCOUNT_NUMBER': 'accountNumber',
      'UAN_NUMBER': 'uanNumber',
      'PF_NUMBER': 'pfNumber',
      'ESI_NUMBER': 'esiNumber',
      'CALENDAR_ID': 'calendarId',
      'SHIFT_ID': 'shiftId',
      'PAY_GRADE_ID': 'payGradeId',
      'STATUS': 'status',
      'EMPLOYEE_ID': 'employeeId',
      'EMPLOYEE_CODE': 'employeeCode',
      'ID': 'id',
      'ACTIVITY_ID': 'activityId',
      
      // Advance field mappings
      'ADVANCE_ID': 'advanceId',
      'ADVANCE_TYPE': 'advanceType',
      'AMOUNT': 'amount',
      'REASON': 'reason',
      'REQUEST_DATE': 'requestDate',
      'AMOUNT_REQUIRED_ON_DATE': 'amountRequiredOnDate',
      'DEDUCTION_MONTH': 'deductionMonth',
      'CREATED_BY': 'createdBy',
      'CREATED_AT': 'createdAt',
      'UPDATED_AT': 'updatedAt',
      
      // Loan field mappings
      'LOAN_ID': 'loanId',
      'LOAN_TYPE': 'loanType',
      'INTEREST_RATE': 'interestRate',
      'REPAYMENT_PERIOD': 'repaymentPeriod',
      'LOAN_DATE': 'loanDate',
      'APPROVAL_DATE': 'approvalDate',
      'DISBURSEMENT_DATE': 'disbursementDate',
      
      // Frontend field names to themselves (for reverse lookup)
      'firstName': 'firstName',
      'lastName': 'lastName',
      'legalName': 'legalName',
      'gender': 'gender',
      'nationality': 'nationality',
      'dateOfBirth': 'dateOfBirth',
      'birthPlace': 'birthPlace',
      'avatarUrl': 'avatarUrl',
      'reportToId': 'reportToId',
      'designation': 'designation',
      'role': 'role',
      'position': 'position',
      'location': 'location',
      'costCenter': 'costCenter',
      'dateOfJoining': 'dateOfJoining',
      'probationDays': 'probationDays',
      'confirmDate': 'confirmDate',
      'noticeDays': 'noticeDays',
      'address': 'address',
      'pincode': 'pincode',
      'city': 'city',
      'district': 'district',
      'state': 'state',
      'country': 'country',
      'phone': 'phone',
      'mobile': 'mobile',
      'email': 'email',
      'fatherName': 'fatherName',
      'maritalStatus': 'maritalStatus',
      'spouseName': 'spouseName',
      'religion': 'religion',
      'aadharNumber': 'aadharNumber',
      'aadharImageUrl': 'aadharImageUrl',
      'panNumber': 'panNumber',
      'panImageUrl': 'panImageUrl',
      'drivingLicenseNumber': 'drivingLicenseNumber',
      'drivingLicenseImageUrl': 'drivingLicenseImageUrl',
      'educationCertificateNumber': 'educationCertificateNumber',
      'educationCertificateImageUrl': 'educationCertificateImageUrl',
      'bankName': 'bankName',
      'branchName': 'branchName',
      'ifscCode': 'ifscCode',
      'accountNumber': 'accountNumber',
      'uanNumber': 'uanNumber',
      'pfNumber': 'pfNumber',
      'esiNumber': 'esiNumber',
      'calendarId': 'calendarId',
      'shiftId': 'shiftId',
      'payGradeId': 'payGradeId',
      'status': 'status',
      'employeeId': 'employeeId',
      'employeeCode': 'employeeCode',
      'id': 'id',
      'activityId': 'activityId',
      'advanceId': 'advanceId',
      'advanceType': 'advanceType',
      'amount': 'amount',
      'reason': 'reason',
      'requestDate': 'requestDate',
      'amountRequiredOnDate': 'amountRequiredOnDate',
      'deductionMonth': 'deductionMonth',
      'createdBy': 'createdBy',
      'createdAt': 'createdAt',
      'updatedAt': 'updatedAt',
      'loanId': 'loanId',
      'loanType': 'loanType',
      'interestRate': 'interestRate',
      'repaymentPeriod': 'repaymentPeriod',
      'loanDate': 'loanDate',
      'approvalDate': 'approvalDate',
      'disbursementDate': 'disbursementDate'
    };
    
    return fieldMappings[fieldName] || fieldName;
  };

  const isDateField = (fieldName) => {
    const dateFields = ['date', 'created', 'updated', 'start', 'end', 'birth', 'join', 'confirm'];
    const normalizedFieldName = fieldName.toLowerCase();
    
    // Exclude gender from date fields
    if (normalizedFieldName === 'gender') {
      return false;
    }
    
    return dateFields.some(dateField => normalizedFieldName.includes(dateField));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    
    try {
      const date = new Date(dateString);
      
      // Check if it's a valid date
      if (isNaN(date.getTime())) {
        // Return original value if it's not a valid date
        return String(dateString);
      }
      
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      // Return original value if parsing fails
      return String(dateString);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <EyeIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Activity Details</h2>
              <p className="text-sm text-gray-500">Comprehensive audit trail analysis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600">Loading activity details...</span>
            </div>
          ) : activity ? (
            <div className="space-y-6">
              {/* Activity Overview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <UserIcon className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Performed by</p>
                      <p className="text-sm font-medium text-gray-900">
                        {activity.USER_FIRST_NAME} {activity.USER_LAST_NAME}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Timestamp</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(activity.CREATED_AT).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <DocumentTextIcon className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Module</p>
                      <p className="text-sm font-medium text-gray-900">{activity.MODULE}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Badge */}
              <div className="flex items-center space-x-3">
                {getActionIcon(activity.ACTION)}
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getActionColor(activity.ACTION)}`}>
                  {activity.ACTION}
                </span>
                <span className="text-sm text-gray-600">
                  {activity.ENTITY_TYPE} - {activity.ENTITY_NAME || activity.ENTITY_ID}
                </span>
              </div>

              {/* Description */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Description</h3>
                <p className="text-sm text-blue-800">{activity.DESCRIPTION}</p>
              </div>

              {/* Changes Analysis - Only show for UPDATE actions */}
              {activity.ACTION === 'UPDATE' && (oldValues && Object.keys(oldValues).length > 0) && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <ArrowPathIcon className="h-5 w-5 text-warning-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Changes Analysis</h3>
                    <span className="px-2 py-1 bg-warning-100 text-warning-800 text-xs rounded-full">
                      {changedFields.length} field{changedFields.length !== 1 ? 's' : ''} changed
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Old Values */}
                    <div className="bg-red-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-red-900 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                        Previous Values
                      </h4>
                      <div className="space-y-3">
                        {(() => {
                          // Create normalized versions for display
                          const normalizedOld = {};
                          const normalizedNew = {};
                          
                          Object.keys(oldValues).forEach(key => {
                            const normalizedKey = normalizeFieldName(key);
                            normalizedOld[normalizedKey] = oldValues[key];
                          });
                          
                          Object.keys(newValues).forEach(key => {
                            const normalizedKey = normalizeFieldName(key);
                            normalizedNew[normalizedKey] = newValues[key];
                          });
                          
                          // Get all unique fields from both normalized objects
                          const allFields = new Set([...Object.keys(normalizedOld), ...Object.keys(normalizedNew)]);
                          
                          console.log('🔍 Display - Normalized old keys:', Object.keys(normalizedOld));
                          console.log('🔍 Display - Normalized new keys:', Object.keys(normalizedNew));
                          console.log('🔍 Display - All fields:', Array.from(allFields));
                          console.log('🔍 Display - Employee ID in old:', normalizedOld.employeeId);
                          console.log('🔍 Display - Employee ID in new:', normalizedNew.employeeId);
                          console.log('🔍 Display - Raw old values keys:', Object.keys(oldValues));
                          console.log('🔍 Display - Raw new values keys:', Object.keys(newValues));
                          console.log('🔍 Display - Raw old values:', oldValues);
                          console.log('🔍 Display - Raw new values:', newValues);
                          
                          return Array.from(allFields).map(field => (
                            <div key={field} className="border-b border-red-200 pb-2 last:border-b-0">
                              <p className="text-xs font-medium text-red-700 mb-1">
                                {formatFieldName(field)}
                              </p>
                              <div className="text-sm text-red-800">
                                {normalizedOld.hasOwnProperty(field) 
                                  ? (isDateField(field) ? formatDate(normalizedOld[field]) : formatValue(normalizedOld[field]))
                                  : <span className="text-gray-400 italic">Not available</span>
                                }
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>

                    {/* New Values */}
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-green-900 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Current Values
                      </h4>
                      <div className="space-y-3">
                        {(() => {
                          // Create normalized versions for display
                          const normalizedOld = {};
                          const normalizedNew = {};
                          
                          Object.keys(oldValues).forEach(key => {
                            const normalizedKey = normalizeFieldName(key);
                            normalizedOld[normalizedKey] = oldValues[key];
                          });
                          
                          Object.keys(newValues).forEach(key => {
                            const normalizedKey = normalizeFieldName(key);
                            normalizedNew[normalizedKey] = newValues[key];
                          });
                          
                          // Get all unique fields from both normalized objects
                          const allFields = new Set([...Object.keys(normalizedOld), ...Object.keys(normalizedNew)]);
                          
                          console.log('🔍 Display - Normalized old keys:', Object.keys(normalizedOld));
                          console.log('🔍 Display - Normalized new keys:', Object.keys(normalizedNew));
                          console.log('🔍 Display - All fields:', Array.from(allFields));
                          console.log('🔍 Display - Employee ID in old:', normalizedOld.employeeId);
                          console.log('🔍 Display - Employee ID in new:', normalizedNew.employeeId);
                          console.log('🔍 Display - Raw old values keys:', Object.keys(oldValues));
                          console.log('🔍 Display - Raw new values keys:', Object.keys(newValues));
                          console.log('🔍 Display - Raw old values:', oldValues);
                          console.log('🔍 Display - Raw new values:', newValues);
                          
                          return Array.from(allFields).map(field => (
                            <div key={field} className="border-b border-green-200 pb-2 last:border-b-0">
                              <p className="text-xs font-medium text-green-700 mb-1">
                                {formatFieldName(field)}
                                {changedFields.includes(field) && (
                                  <span className="ml-2 px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">
                                    Changed
                                  </span>
                                )}
                              </p>
                              <div className="text-sm text-green-800">
                                {normalizedNew.hasOwnProperty(field) 
                                  ? (isDateField(field) ? formatDate(normalizedNew[field]) : formatValue(normalizedNew[field]))
                                  : <span className="text-gray-400 italic">Not available</span>
                                }
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Changed Fields Summary */}
                  {changedFields.length > 0 && (
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-yellow-900 mb-3">Changed Fields Summary</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {changedFields.map(field => (
                          <span key={field} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            {formatFieldName(field)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* For CREATE actions, show only new values */}
              {activity.ACTION === 'CREATE' && newValues && Object.keys(newValues).length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircleIcon className="h-5 w-5 text-success-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Created Data</h3>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="space-y-3">
                      {Object.keys(newValues).map(field => (
                        <div key={field} className="border-b border-green-200 pb-2 last:border-b-0">
                          <p className="text-xs font-medium text-green-700 mb-1">
                            {formatFieldName(field)}
                          </p>
                          <div className="text-sm text-green-800">
                            {isDateField(field) ? formatDate(newValues[field]) : formatValue(newValues[field])}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Technical Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Technical Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-gray-500">IP Address</p>
                    <p className="font-mono text-gray-900">{activity.IP_ADDRESS || 'Not recorded'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">User Agent</p>
                    <p className="font-mono text-gray-900 truncate">
                      {activity.USER_AGENT || 'Not recorded'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Activity ID</p>
                    <p className="font-mono text-gray-900">{activity.ACTIVITY_ID}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Entity ID</p>
                    <p className="font-mono text-gray-900">{activity.ENTITY_ID || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Activity not found or could not be loaded</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetailModal; 