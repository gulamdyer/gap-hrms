import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  CalendarIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { advanceAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const AdvanceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [advance, setAdvance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);


  const advanceTypes = [
    { value: 'SALARY', label: 'Salary Advance' },
    { value: 'TRAVEL', label: 'Travel Advance' },
    { value: 'MEDICAL', label: 'Medical Advance' },
    { value: 'EDUCATION', label: 'Education Advance' },
    { value: 'HOUSING', label: 'Housing Advance' },
    { value: 'OTHER', label: 'Other' }
  ];



  useEffect(() => {
    if (isAuthenticated) {
      fetchAdvance();
    }
  }, [id, isAuthenticated]);

  const fetchAdvance = async () => {
    try {
      setLoading(true);
      const response = await advanceAPI.getById(id);
      setAdvance(response.data);
    } catch (error) {
      console.error('Error fetching advance:', error);
      toast.error('Failed to fetch advance details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await advanceAPI.delete(id);
      toast.success('Advance deleted successfully');
      navigate('/advances');
    } catch (error) {
      console.error('Error deleting advance:', error);
      toast.error('Failed to delete advance');
    } finally {
      setShowDeleteModal(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      // Create a temporary div for the print content
      const printContent = document.createElement('div');
      printContent.innerHTML = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 15px; max-width: 595px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh;">
          <!-- Header with Gradient Background -->
          <div style="text-align: center; padding: 20px 15px; background: rgba(255,255,255,0.1); border-radius: 10px; margin-bottom: 20px; backdrop-filter: blur(10px);">
            <div style="background: white; width: 50px; height: 50px; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(0,0,0,0.3);">
              <div style="font-size: 20px; color: #667eea; font-weight: bold;">💰</div>
            </div>
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">GAP HRMS</h1>
            <h2 style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px; font-weight: 300;">Advance Request Certificate</h2>
            <div style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 15px; display: inline-block; margin-top: 8px;">
              <p style="color: white; margin: 0; font-size: 11px; font-weight: 500;">Generated on ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}</p>
            </div>
          </div>

          <!-- Employee Information Card -->
          <div style="background: rgba(255,255,255,0.95); border-radius: 10px; padding: 15px; margin-bottom: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <div style="background: linear-gradient(135deg, #667eea, #764ba2); width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 10px;">
                <div style="font-size: 14px; color: white;">👤</div>
              </div>
              <h3 style="color: #1f2937; margin: 0; font-size: 16px; font-weight: 600;">Employee Information</h3>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div style="background: #f8fafc; padding: 10px; border-radius: 6px; border-left: 3px solid #667eea;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Employee Name</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${advance.EMPLOYEE_FIRST_NAME} ${advance.EMPLOYEE_LAST_NAME}</div>
              </div>
              <div style="background: #f8fafc; padding: 10px; border-radius: 6px; border-left: 3px solid #667eea;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Employee Code</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${advance.EMPLOYEE_CODE}</div>
              </div>
              <div style="background: #f8fafc; padding: 10px; border-radius: 6px; border-left: 3px solid #667eea;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Designation</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${advance.DESIGNATION || '-'}</div>
              </div>
            </div>
          </div>

          <!-- Advance Details Card -->
          <div style="background: rgba(255,255,255,0.95); border-radius: 10px; padding: 15px; margin-bottom: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <div style="background: linear-gradient(135deg, #10b981, #059669); width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 10px;">
                <div style="font-size: 14px; color: white;">📋</div>
              </div>
              <h3 style="color: #1f2937; margin: 0; font-size: 16px; font-weight: 600;">Advance Request Details</h3>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
              <div style="background: #f0fdf4; padding: 10px; border-radius: 6px; border-left: 3px solid #10b981;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Advance ID</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">#${advance.ADVANCE_ID}</div>
              </div>
              <div style="background: #f0fdf4; padding: 10px; border-radius: 6px; border-left: 3px solid #10b981;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Advance Type</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${advanceTypes.find(t => t.value === advance.ADVANCE_TYPE)?.label || advance.ADVANCE_TYPE}</div>
              </div>
              <div style="background: #fef3c7; padding: 10px; border-radius: 6px; border-left: 3px solid #f59e0b;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Amount</div>
                <div style="color: #1f2937; font-size: 14px; font-weight: 700;">${formatCurrency(advance.AMOUNT)}</div>
              </div>
              <div style="background: #f0fdf4; padding: 10px; border-radius: 6px; border-left: 3px solid #10b981;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Required On</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${formatDate(advance.AMOUNT_REQUIRED_ON_DATE)}</div>
              </div>
              <div style="background: #f0fdf4; padding: 10px; border-radius: 6px; border-left: 3px solid #10b981;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Deduction Month</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${advance.DEDUCTION_MONTH || '-'}</div>
              </div>
            </div>
            <div style="background: #fefce8; padding: 10px; border-radius: 6px; border-left: 3px solid #eab308;">
              <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">Reason for Advance</div>
              <div style="color: #1f2937; font-size: 13px; line-height: 1.4; font-weight: 500;">${advance.REASON}</div>
            </div>
          </div>

          <!-- Important Dates Card -->
          <div style="background: rgba(255,255,255,0.95); border-radius: 10px; padding: 15px; margin-bottom: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <div style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 10px;">
                <div style="font-size: 14px; color: white;">📅</div>
              </div>
              <h3 style="color: #1f2937; margin: 0; font-size: 16px; font-weight: 600;">Important Dates</h3>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div style="background: #faf5ff; padding: 10px; border-radius: 6px; border-left: 3px solid #8b5cf6;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Request Date</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${formatDate(advance.REQUEST_DATE)}</div>
              </div>
              <div style="background: #faf5ff; padding: 10px; border-radius: 6px; border-left: 3px solid #8b5cf6;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Created At</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${formatDate(advance.CREATED_AT)}</div>
              </div>
              <div style="background: #faf5ff; padding: 10px; border-radius: 6px; border-left: 3px solid #8b5cf6;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Updated At</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${formatDate(advance.UPDATED_AT)}</div>
              </div>
              <div style="background: #faf5ff; padding: 10px; border-radius: 6px; border-left: 3px solid #8b5cf6;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Created By</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${advance.CREATED_BY_FIRST_NAME && advance.CREATED_BY_LAST_NAME ? 
                  `${advance.CREATED_BY_FIRST_NAME} ${advance.CREATED_BY_LAST_NAME}` : '-'}</div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 10px; backdrop-filter: blur(10px);">
            <div style="background: white; width: 40px; height: 40px; border-radius: 50%; margin: 0 auto 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
              <div style="font-size: 16px;">🔒</div>
            </div>
            <p style="color: rgba(255,255,255,0.8); font-size: 11px; margin: 0; font-weight: 500;">This is an official computer-generated document from GAP HRMS</p>
            <p style="color: rgba(255,255,255,0.6); font-size: 9px; margin: 3px 0 0 0;">Document ID: ADV-${advance.ADVANCE_ID}-${new Date().getTime()}</p>
          </div>
        </div>
      `;

      // Add to DOM temporarily
      document.body.appendChild(printContent);
      printContent.style.position = 'absolute';
      printContent.style.left = '-9999px';

      // Convert to canvas
      const canvas = await html2canvas(printContent, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Remove from DOM
      document.body.removeChild(printContent);

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a5');
      const imgWidth = 148; // A5 width
      const pageHeight = 210; // A5 height
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download PDF
      const fileName = `Advance_Request_${advance.ADVANCE_ID}_${advance.EMPLOYEE_FIRST_NAME}_${advance.EMPLOYEE_LAST_NAME}.pdf`;
      pdf.save(fileName);

      toast.success('PDF generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsPrinting(false);
    }
  };





  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // DD-MM-YYYY format
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
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
          Please log in to access advance details.
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

  if (!advance) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Advance not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The advance you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/advances"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Advances
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
            onClick={() => navigate('/advances')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Advance Request #{advance.ADVANCE_ID}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {advance.EMPLOYEE_FIRST_NAME} {advance.EMPLOYEE_LAST_NAME} • {advance.EMPLOYEE_CODE}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className={`inline-flex items-center px-3 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium ${
              isPrinting 
                ? 'text-green-400 bg-green-50 cursor-not-allowed' 
                : 'text-green-700 bg-white hover:bg-green-50'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
          >
            {isPrinting ? (
              <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full mr-2"></div>
            ) : (
              <PrinterIcon className="h-4 w-4 mr-2" />
            )}
            {isPrinting ? 'Generating PDF...' : 'Print PDF'}
          </button>
          {(user?.role === 'ADMIN' || user?.role === 'HR') && (
            <Link
              to={`/advances/${id}/edit`}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Employee Information */}
      <InfoSection title="Employee Information" icon={UserIcon}>
        <InfoField label="Employee Name" value={`${advance.EMPLOYEE_FIRST_NAME} ${advance.EMPLOYEE_LAST_NAME}`} />
        <InfoField label="Employee Code" value={advance.EMPLOYEE_CODE} />
        <InfoField label="Designation" value={advance.DESIGNATION} />
      </InfoSection>

      {/* Advance Details */}
      <InfoSection title="Advance Details" icon={CurrencyDollarIcon}>
        <InfoField 
          label="Advance Type" 
          value={advanceTypes.find(t => t.value === advance.ADVANCE_TYPE)?.label || advance.ADVANCE_TYPE} 
        />
        <InfoField label="Amount" value={formatCurrency(advance.AMOUNT)} />
        <InfoField label="Reason" value={advance.REASON} />
      </InfoSection>

      {/* Dates */}
      <InfoSection title="Important Dates" icon={CalendarIcon}>
        <InfoField label="Request Date" value={formatDate(advance.REQUEST_DATE)} />
        <InfoField label="Amount Required on Date" value={formatDate(advance.AMOUNT_REQUIRED_ON_DATE)} />
        <InfoField label="Amount to be deducted in month of payroll" value={advance.DEDUCTION_MONTH || '-'} />
      </InfoSection>

      {/* System Information */}
      <InfoSection title="System Information" icon={DocumentTextIcon}>
        <InfoField label="Created At" value={formatDate(advance.CREATED_AT)} />
        <InfoField label="Updated At" value={formatDate(advance.UPDATED_AT)} />
        <InfoField 
          label="Created By" 
          value={advance.CREATED_BY_FIRST_NAME && advance.CREATED_BY_LAST_NAME ? 
            `${advance.CREATED_BY_FIRST_NAME} ${advance.CREATED_BY_LAST_NAME}` : '-'} 
        />
      </InfoSection>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Warning Icon */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              
              {/* Title */}
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Delete Advance Request
              </h3>
              
              {/* Message */}
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 text-center">
                  Are you sure you want to delete the advance request for{' '}
                  <span className="font-semibold text-gray-900">
                    {advance?.EMPLOYEE_FIRST_NAME} {advance?.EMPLOYEE_LAST_NAME}
                  </span>?
                </p>
                <p className="text-xs text-gray-400 text-center mt-2">
                  This action cannot be undone.
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 mt-4">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvanceDetail; 