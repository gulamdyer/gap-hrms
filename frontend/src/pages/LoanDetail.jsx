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
import { loanAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const LoanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const loanTypes = [
    { value: 'PERSONAL', label: 'Personal Loan' },
    { value: 'HOME', label: 'Home Loan' },
    { value: 'VEHICLE', label: 'Vehicle Loan' },
    { value: 'EDUCATION', label: 'Education Loan' },
    { value: 'MEDICAL', label: 'Medical Loan' },
    { value: 'OTHER', label: 'Other' }
  ];

  const loanStatuses = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  useEffect(() => {
    if (isAuthenticated) {
      fetchLoan();
    }
  }, [id, isAuthenticated]);

  const fetchLoan = async () => {
    try {
      setLoading(true);
      const response = await loanAPI.getById(id);
      setLoan(response.data);
    } catch (error) {
      console.error('Error fetching loan:', error);
      toast.error('Failed to fetch loan details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await loanAPI.delete(id);
      toast.success('Loan deleted successfully');
      navigate('/loans');
    } catch (error) {
      console.error('Error deleting loan:', error);
      toast.error('Failed to delete loan');
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
            <h2 style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px; font-weight: 300;">Loan Certificate</h2>
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
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${loan.EMPLOYEE_FIRST_NAME} ${loan.EMPLOYEE_LAST_NAME}</div>
              </div>
              <div style="background: #f8fafc; padding: 10px; border-radius: 6px; border-left: 3px solid #667eea;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Employee Code</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${loan.EMPLOYEE_CODE}</div>
              </div>
              <div style="background: #f8fafc; padding: 10px; border-radius: 6px; border-left: 3px solid #667eea;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Designation</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${loan.DESIGNATION || '-'}</div>
              </div>
            </div>
          </div>

          <!-- Loan Details Card -->
          <div style="background: rgba(255,255,255,0.95); border-radius: 10px; padding: 15px; margin-bottom: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <div style="background: linear-gradient(135deg, #10b981, #059669); width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 10px;">
                <div style="font-size: 14px; color: white;">📋</div>
              </div>
              <h3 style="color: #1f2937; margin: 0; font-size: 16px; font-weight: 600;">Loan Details</h3>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
              <div style="background: #f0fdf4; padding: 10px; border-radius: 6px; border-left: 3px solid #10b981;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Loan ID</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">#${loan.LOAN_ID}</div>
              </div>
              <div style="background: #f0fdf4; padding: 10px; border-radius: 6px; border-left: 3px solid #10b981;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Loan Type</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${loanTypes.find(t => t.value === loan.LOAN_TYPE)?.label || loan.LOAN_TYPE}</div>
              </div>
              <div style="background: #fef3c7; padding: 10px; border-radius: 6px; border-left: 3px solid #f59e0b;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Loan Amount</div>
                <div style="color: #1f2937; font-size: 14px; font-weight: 700;">${formatCurrency(loan.LOAN_AMOUNT)}</div>
              </div>
              <div style="background: #f0fdf4; padding: 10px; border-radius: 6px; border-left: 3px solid #10b981;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Monthly Deduction</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${formatCurrency(loan.MONTHLY_DEDUCTION_AMOUNT)}</div>
              </div>
              <div style="background: #f0fdf4; padding: 10px; border-radius: 6px; border-left: 3px solid #10b981;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Total Months</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${loan.TOTAL_MONTHS}</div>
              </div>
              <div style="background: #f0fdf4; padding: 10px; border-radius: 6px; border-left: 3px solid #10b981;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Status</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${loanStatuses.find(s => s.value === loan.STATUS)?.label || loan.STATUS}</div>
              </div>
            </div>
            <div style="background: #fefce8; padding: 10px; border-radius: 6px; border-left: 3px solid #eab308;">
              <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">Reason for Loan</div>
              <div style="color: #1f2937; font-size: 13px; line-height: 1.4; font-weight: 500;">${loan.REASON}</div>
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
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Loan Date</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${formatDate(loan.LOAN_DATE)}</div>
              </div>
              <div style="background: #faf5ff; padding: 10px; border-radius: 6px; border-left: 3px solid #8b5cf6;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">First Deduction</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${loan.FIRST_DEDUCTION_MONTH || '-'}</div>
              </div>
              <div style="background: #faf5ff; padding: 10px; border-radius: 6px; border-left: 3px solid #8b5cf6;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Last Deduction</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${loan.LAST_DEDUCTION_MONTH || '-'}</div>
              </div>
              <div style="background: #faf5ff; padding: 10px; border-radius: 6px; border-left: 3px solid #8b5cf6;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Created At</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${formatDate(loan.CREATED_AT)}</div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 10px; backdrop-filter: blur(10px);">
            <div style="background: white; width: 40px; height: 40px; border-radius: 50%; margin: 0 auto 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
              <div style="font-size: 16px;">🔒</div>
            </div>
            <p style="color: rgba(255,255,255,0.8); font-size: 11px; margin: 0; font-weight: 500;">This is an official computer-generated document from GAP HRMS</p>
            <p style="color: rgba(255,255,255,0.6); font-size: 9px; margin: 3px 0 0 0;">Document ID: LOAN-${loan.LOAN_ID}-${new Date().getTime()}</p>
          </div>
        </div>
      `;

      // Add to DOM temporarily
      document.body.appendChild(printContent);

      // Generate PDF
      const canvas = await html2canvas(printContent, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
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
      pdf.save(`loan-${loan.LOAN_ID}-${loan.EMPLOYEE_FIRST_NAME}-${loan.EMPLOYEE_LAST_NAME}.pdf`);

      // Clean up
      document.body.removeChild(printContent);
      toast.success('PDF generated successfully');
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
          Please log in to access loan details.
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

  if (!loan) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Loan not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The loan you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/loans"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Loans
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
            onClick={() => navigate('/loans')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Loan Request #{loan.LOAN_ID}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {loan.EMPLOYEE_FIRST_NAME} {loan.EMPLOYEE_LAST_NAME} • {loan.EMPLOYEE_CODE}
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
              to={`/loans/${id}/edit`}
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
        <InfoField label="Employee Name" value={`${loan.EMPLOYEE_FIRST_NAME} ${loan.EMPLOYEE_LAST_NAME}`} />
        <InfoField label="Employee Code" value={loan.EMPLOYEE_CODE} />
        <InfoField label="Designation" value={loan.DESIGNATION} />
      </InfoSection>

      {/* Loan Details */}
      <InfoSection title="Loan Details" icon={CurrencyDollarIcon}>
        <InfoField 
          label="Loan Type" 
          value={loanTypes.find(t => t.value === loan.LOAN_TYPE)?.label || loan.LOAN_TYPE} 
        />
        <InfoField label="Loan Amount" value={formatCurrency(loan.LOAN_AMOUNT)} />
        <InfoField label="Monthly Deduction Amount" value={formatCurrency(loan.MONTHLY_DEDUCTION_AMOUNT)} />
        <InfoField label="Total Months" value={`${loan.TOTAL_MONTHS} months`} />
        <InfoField label="Reason" value={loan.REASON} />
        <InfoField 
          label="Status" 
          value={loanStatuses.find(s => s.value === loan.STATUS)?.label || loan.STATUS} 
        />
      </InfoSection>

      {/* Dates */}
      <InfoSection title="Important Dates" icon={CalendarIcon}>
        <InfoField label="Loan Date" value={formatDate(loan.LOAN_DATE)} />
        <InfoField label="First Deduction Month" value={loan.FIRST_DEDUCTION_MONTH} />
        <InfoField label="Last Deduction Month" value={loan.LAST_DEDUCTION_MONTH} />
      </InfoSection>

      {/* System Information */}
      <InfoSection title="System Information" icon={DocumentTextIcon}>
        <InfoField label="Created At" value={formatDate(loan.CREATED_AT)} />
        <InfoField label="Updated At" value={formatDate(loan.UPDATED_AT)} />
        <InfoField 
          label="Created By" 
          value={loan.CREATED_BY_FIRST_NAME && loan.CREATED_BY_LAST_NAME ? 
            `${loan.CREATED_BY_FIRST_NAME} ${loan.CREATED_BY_LAST_NAME}` : '-'} 
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
                Delete Loan Request
              </h3>
              
              {/* Message */}
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 text-center">
                  Are you sure you want to delete the loan request for{' '}
                  <span className="font-semibold text-gray-900">
                    {loan?.EMPLOYEE_FIRST_NAME} {loan?.EMPLOYEE_LAST_NAME}
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

export default LoanDetail; 