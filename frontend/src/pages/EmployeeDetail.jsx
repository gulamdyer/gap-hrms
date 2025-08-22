import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  BriefcaseIcon,
  HomeIcon,
  DocumentTextIcon,
  CreditCardIcon,
  PhotoIcon,
  CurrencyDollarIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  GlobeAltIcon,
  BuildingOffice2Icon,
  TicketIcon
} from '@heroicons/react/24/outline';
import { employeeAPI, compensationAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import currencyConfig from '../utils/currency';
import { AvatarDisplay } from '../utils/avatar';

const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [employee, setEmployee] = useState(null);
  const [compensation, setCompensation] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchEmployee();
      fetchCompensation();
    }
  }, [id, isAuthenticated]);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const response = await employeeAPI.getById(id);
      setEmployee(response.data);
    } catch (error) {
      console.error('Error fetching employee:', error);
      toast.error('Failed to fetch employee details');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompensation = async () => {
    try {
      const response = await compensationAPI.getByEmployeeId(id);
      setCompensation(response.data || []);
    } catch (error) {
      console.error('Error fetching compensation:', error);
      // Don't show error toast for compensation as it might not exist
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${employee?.FIRST_NAME} ${employee?.LAST_NAME}?`)) {
      return;
    }

    try {
      await employeeAPI.delete(id);
      toast.success('Employee deleted successfully');
      navigate('/employees');
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Failed to delete employee');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'ACTIVE': { color: 'bg-green-100 text-green-800', label: 'Active' },
      'INACTIVE': { color: 'bg-gray-100 text-gray-800', label: 'Inactive' },
      'TERMINATED': { color: 'bg-red-100 text-red-800', label: 'Terminated' },
      'ONBOARDING': { color: 'bg-blue-100 text-blue-800', label: 'Onboarding' }
    };

    const config = statusConfig[status] || statusConfig['INACTIVE'];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // Date format conversion helper from DATE_HANDLING_GUIDE.md
  const formatDate = (dateString) => {
    if (!dateString || dateString === '') return '-';
    
    // If already in DD-MM-YYYY format, return as is
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      return dateString;
    }
    
    // If in YYYY-MM-DD format, convert to DD-MM-YYYY
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-');
      return `${day}-${month}-${year}`;
    }
    
    // Try to parse other formats
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      }
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
    }
    
    return '-';
  };

  const calculateTotalCompensation = () => {
    if (!compensation.length) return 0;
    
    return compensation
      .filter(comp => comp.STATUS === 'ACTIVE')
      .reduce((total, comp) => {
        if (comp.IS_PERCENTAGE === 1) {
          // For percentage-based components, we'll need a base salary to calculate
          // For now, just return the percentage
          return total + (comp.PERCENTAGE || 0);
        } else {
          return total + (comp.AMOUNT || 0);
        }
      }, 0);
  };

  const InfoSection = ({ title, icon: Icon, children }) => (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Icon className="h-6 w-6 text-primary-600" />
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );

  const InfoField = ({ label, value }) => (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value || '-'}</dd>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Authentication Required</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please log in to access employee details.
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
    return <LoadingSpinner />;
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Employee not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The employee you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/employees"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Employees
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
        <div className="flex items-center space-x-3">
          {getStatusBadge(employee.STATUS)}
          <Link
            to={`/employees/${id}/edit`}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Employee Avatar and Basic Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-lg overflow-hidden">
        <div className="px-8 py-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-32 h-32 bg-white rounded-full shadow-lg border-4 border-white flex items-center justify-center">
              <AvatarDisplay
                avatarUrl={employee.AVATAR_URL}
                name={`${employee.FIRST_NAME} ${employee.LAST_NAME}`}
                size="4xl"
                className="w-full h-full"
              />
            </div>
          </div>
                                {/* Employee Info */}
           <div className="flex-1 min-w-0">
             <div className="space-y-1">
               {/* Employee Name - 1st Line */}
               <div>
                 <h2 className="text-3xl font-bold text-gray-900 leading-tight">
                   {employee.FIRST_NAME} {employee.LAST_NAME}
                 </h2>
               </div>
               
               {/* Designation - 2nd Line */}
               {employee.DESIGNATION && (
                 <div>
                   <p className="text-xl text-primary-600 font-semibold">
                     {employee.DESIGNATION}
                   </p>
                 </div>
               )}
               
               {/* Employee ID - 3rd Line */}
               {employee.EMPLOYEE_CODE && (
                 <div className="flex items-center space-x-2 text-gray-600">
                   <span className="text-sm">{employee.EMPLOYEE_CODE}</span>
                 </div>
               )}
               
               {/* Status Badge - 4th Line */}
               <div className="mt-2">
                 <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                   employee.STATUS === 'ACTIVE' 
                     ? 'bg-green-100 text-green-800'
                     : employee.STATUS === 'INACTIVE'
                     ? 'bg-red-100 text-red-800'
                     : 'bg-yellow-100 text-yellow-800'
                 }`}>
                   {employee.STATUS || 'ACTIVE'}
                 </span>
               </div>
               
               {/* Contact Info Grid */}
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                 {employee.EMAIL && (
                   <div className="flex items-center space-x-2 text-gray-600">
                     <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                     <span className="text-sm">{employee.EMAIL}</span>
                   </div>
                 )}
                 {employee.MOBILE && (
                   <div className="flex items-center space-x-2 text-gray-600">
                     <PhoneIcon className="h-4 w-4 text-gray-400" />
                     <span className="text-sm">{employee.MOBILE}</span>
                   </div>
                 )}
                 {employee.LOCATION && (
                   <div className="flex items-center space-x-2 text-gray-600">
                     <MapPinIcon className="h-4 w-4 text-gray-400" />
                     <span className="text-sm">{employee.LOCATION}</span>
              </div>
            )}
          </div>
             </div>
           </div>
          {/* Status Badge */}
          <div className="flex-shrink-0 mt-4 sm:mt-0">
            {getStatusBadge(employee.STATUS)}
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <InfoSection title="Personal Information" icon={UserIcon}>
        <InfoField label="Legal Name" value={employee.LEGAL_NAME} />
        <InfoField label="Gender" value={employee.GENDER} />
        <InfoField label="Nationality" value={employee.NATIONALITY} />
        <InfoField label="Date of Birth" value={formatDate(employee.DATE_OF_BIRTH)} />
        <InfoField label="Birth Place" value={employee.BIRTH_PLACE} />
        <InfoField label="Father Name" value={employee.FATHER_NAME} />
        <InfoField label="Marital Status" value={employee.MARITAL_STATUS} />
        <InfoField label="Spouse Name" value={employee.SPOUSE_NAME} />
        <InfoField label="Religion" value={employee.RELIGION} />
      </InfoSection>

      {/* Job Information */}
      <InfoSection title="Job Information" icon={BriefcaseIcon}>
        {/* 1 Department */}
        <InfoField label="Department" value={employee.DEPARTMENT} />
        {/* 2 Workcenter / Section */}
        <InfoField label="Workcenter / Section" value={employee.WORKCENTER} />
        {/* 3 Designation */}
        <InfoField label="Designation" value={employee.DESIGNATION} />
        {/* 4 Position */}
        <InfoField label="Position" value={employee.POSITION} />
        {/* 5 Report To */}
        <InfoField 
          label="Report To" 
          value={employee.REPORT_TO_FIRST_NAME && employee.REPORT_TO_LAST_NAME ? `${employee.REPORT_TO_FIRST_NAME} ${employee.REPORT_TO_LAST_NAME}` : 'No manager assigned'} 
        />
        {/* 6 Role */}
        <InfoField label="Role" value={employee.ROLE} />
        {/* 7 Location */}
        <InfoField label="Location" value={employee.LOCATION} />
        {/* 8 Cost Center */}
        <InfoField label="Cost Center" value={employee.COST_CENTER} />
        {/* 9 Calendar */}
        <InfoField 
          label="Calendar" 
          value={employee.CALENDAR_NAME ? `${employee.CALENDAR_NAME} (${employee.CALENDAR_CODE})` : 'No calendar assigned'} 
        />
        {/* 10 Shift */}
        <InfoField 
          label="Shift" 
          value={employee.SHIFT_NAME ? `${employee.SHIFT_NAME} (${employee.START_TIME} - ${employee.END_TIME})` : 'No shift assigned'} 
        />
        {/* 11 Employment Type */}
        <InfoField label="Employment Type" value={employee.EMPLOYMENT_TYPE} />
        {/* 12 Pay Grade */}
        <InfoField 
          label="Pay Grade" 
          value={employee.GRADE_NAME ? `${employee.GRADE_NAME} (${employee.GRADE_CODE})` : 'No pay grade assigned'} 
        />
        {/* 13 Date of Joining */}
        <InfoField label="Date of Joining" value={formatDate(employee.DATE_OF_JOINING)} />
        {/* 14 Probation Days */}
        <InfoField label="Probation Days" value={employee.PROBATION_DAYS} />
        {/* 15 Confirmation Date */}
        <InfoField label="Confirmation Date" value={formatDate(employee.CONFIRM_DATE)} />
        {/* 16 Notice Days */}
        <InfoField label="Notice Days" value={employee.NOTICE_DAYS} />
      </InfoSection>

      {/* Address Information */}
      <InfoSection title="Address Information" icon={HomeIcon}>
        <InfoField label="Address" value={employee.ADDRESS} />
        <InfoField label="Pincode" value={employee.PINCODE} />
        <InfoField label="City" value={employee.CITY} />
        <InfoField label="District" value={employee.DISTRICT} />
        <InfoField label="State" value={employee.STATE} />
        <InfoField label="Country" value={employee.COUNTRY} />
        <InfoField label="Phone" value={employee.PHONE} />
        <InfoField label="Mobile" value={employee.MOBILE} />
        <InfoField label="Email" value={employee.EMAIL} />
      </InfoSection>

      {/* Legal Information */}
      <InfoSection title="Legal Information" icon={DocumentTextIcon}>
         <InfoField label="National ID Number" value={employee.AADHAR_NUMBER} />
         <InfoField label="Visa / Personal Number" value={employee.PAN_NUMBER} />
        <InfoField label="Driving License Number" value={employee.DRIVING_LICENSE_NUMBER} />
        <InfoField label="Education Certificate Number" value={employee.EDUCATION_CERTIFICATE_NUMBER} />
      </InfoSection>

      {/* Bank Information */}
      <InfoSection title="Bank Information" icon={CreditCardIcon}>
        <InfoField label="Bank Name" value={employee.BANK_NAME} />
        <InfoField label="Branch Name" value={employee.BRANCH_NAME} />
        <InfoField label="IFSC Code" value={employee.IFSC_CODE} />
        <InfoField label="Account Number" value={employee.ACCOUNT_NUMBER} />
        <InfoField label="UAN Number" value={employee.UAN_NUMBER} />
         <InfoField label="Social Security Number" value={employee.PF_NUMBER} />
         <InfoField label="Insurance Number" value={employee.ESI_NUMBER} />
       </InfoSection>

      {/* Compensation Information */}
      <InfoSection title="Compensation Information" icon={CurrencyDollarIcon}>
        {compensation.length === 0 ? (
          <div className="col-span-2">
            <div className="text-center py-8">
              <div className="text-gray-400 text-lg mb-2">💰</div>
              <p className="text-gray-500">No compensation components found</p>
              <p className="text-sm text-gray-400">Compensation details will appear here when added</p>
            </div>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="col-span-2 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">Compensation Summary</h4>
                    <p className="text-sm text-blue-700">
                      {compensation.filter(comp => comp.STATUS === 'ACTIVE').length} active components
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-blue-900">
                      {currencyConfig.formatAmount(calculateTotalCompensation())}
                    </p>
                    <p className="text-sm text-blue-700">Total Fixed Amount</p>
                  </div>
                </div>
              </div>
            </div>
            
            {compensation.map((comp, index) => (
              <div key={comp.COMPENSATION_ID || index} className="col-span-2">
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">
                      {comp.COMPONENT_NAME} ({comp.COMPONENT_TYPE})
                    </h4>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      comp.STATUS === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {comp.STATUS}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Amount</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {comp.IS_PERCENTAGE === 1 
                          ? `${comp.PERCENTAGE}%` 
                          : currencyConfig.formatAmount(comp.AMOUNT || 0)
                        }
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Effective Date</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formatDate(comp.EFFECTIVE_DATE)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">End Date</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {comp.END_DATE ? formatDate(comp.END_DATE) : 'No end date'}
                      </dd>
                    </div>
                  </div>
                  {comp.PAY_COMPONENT_DESCRIPTION && (
                    <div className="mt-3">
                      <dt className="text-sm font-medium text-gray-500">Description</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {comp.PAY_COMPONENT_DESCRIPTION}
                      </dd>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </InfoSection>

      {/* Global Info Section */}
      <InfoSection title="Global Info" icon={GlobeAltIcon}>
        <InfoField label="Payroll Country" value={employee.PAYROLL_COUNTRY} />
        <InfoField label="Employee Type" value={employee.EMPLOYEE_TYPE} />
        <InfoField label="Air Ticket Eligibility" value={employee.AIR_TICKET_ELIGIBILITY} />
        {employee.PAYROLL_COUNTRY === 'India' && employee.EMPLOYEE_TYPE === 'Consultant' && (
          <>
            <InfoField label="Payroll Companies" value={Array.isArray(employee.PAYROLL_COMPANIES) ? employee.PAYROLL_COMPANIES.join(', ') : employee.PAYROLL_COMPANIES || '-'} />
            <InfoField label="PF Deduction Company" value={employee.PF_DEDUCTION_COMPANY || '-'} />
          </>
        )}
      </InfoSection>

      {/* System Information */}
      <InfoSection title="System Information" icon={UserIcon}>
        <InfoField label="Status" value={employee.STATUS} />
        <InfoField label="Created At" value={formatDate(employee.CREATED_AT)} />
        <InfoField label="Updated At" value={formatDate(employee.UPDATED_AT)} />
        <InfoField 
          label="Created By" 
          value={employee.CREATED_BY_FIRST_NAME && employee.CREATED_BY_LAST_NAME ? 
            `${employee.CREATED_BY_FIRST_NAME} ${employee.CREATED_BY_LAST_NAME}` : '-'} 
        />
      </InfoSection>
    </div>
  );
};

export default EmployeeDetail; 