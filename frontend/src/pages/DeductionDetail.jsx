import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  PrinterIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { deductionAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const DeductionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [deduction, setDeduction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [printingPdf, setPrintingPdf] = useState(false);

  // Format date for display (DD-MM-YYYY)
  const formatEffectiveDate = (monthStr) => {
    if (!monthStr) return 'Ongoing';
    try {
      // Convert "2025-07" to "01-07-2025" (first day of the month)
      const [year, month] = monthStr.split('-');
      if (year && month) {
        return `01-${month}-${year}`;
      }
      return monthStr;
    } catch (error) {
      return monthStr;
    }
  };

  const deductionTypes = [
    { value: 'FINE', label: 'Fine' },
    { value: 'PENALTY', label: 'Penalty' },
    { value: 'SALARY_ADVANCE_RECOVERY', label: 'Salary Advance Recovery' },
    { value: 'LOAN_RECOVERY', label: 'Loan Recovery' },
    { value: 'MISCELLANEOUS', label: 'Miscellaneous' },
    { value: 'DISCIPLINARY', label: 'Disciplinary Action' },
    { value: 'ATTENDANCE', label: 'Attendance Deduction' },
    { value: 'OTHER', label: 'Other' }
  ];

  const deductionCategories = [
    { value: 'STATUTORY', label: 'Statutory' },
    { value: 'VOLUNTARY', label: 'Voluntary' },
    { value: 'RECOVERY', label: 'Recovery' },
    { value: 'PENALTY', label: 'Penalty' }
  ];

  const deductionStatuses = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  useEffect(() => {
    fetchDeduction();
  }, [id]);

  const fetchDeduction = async () => {
    try {
      setLoading(true);
      const response = await deductionAPI.getById(id);
      if (response.success) {
        setDeduction(response.data);
      } else {
        toast.error('Deduction not found');
        navigate('/deductions');
      }
    } catch (error) {
      console.error('Error fetching deduction:', error);
      toast.error('Failed to load deduction details');
      navigate('/deductions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deductionAPI.delete(id);
      toast.success('Deduction deleted successfully');
      navigate('/deductions');
    } catch (error) {
      console.error('Error deleting deduction:', error);
      toast.error('Failed to delete deduction');
    } finally {
      setShowDeleteModal(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleStatusUpdate = async (status) => {
    try {
      await deductionAPI.updateStatus(id, {
        status,
        comments: `Status updated to ${status} by ${user?.firstName} ${user?.lastName}`
      });
      toast.success(`Deduction ${status.toLowerCase()} successfully`);
      fetchDeduction(); // Refresh data
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update deduction status');
    }
  };

  const handlePrint = async () => {
    setPrintingPdf(true);
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
            <h2 style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px; font-weight: 300;">Deduction Certificate</h2>
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
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${deduction.EMPLOYEE_FIRST_NAME} ${deduction.EMPLOYEE_LAST_NAME}</div>
              </div>
              <div style="background: #f8fafc; padding: 10px; border-radius: 6px; border-left: 3px solid #667eea;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Employee Code</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${deduction.EMPLOYEE_CODE}</div>
              </div>
            </div>
          </div>

          <!-- Deduction Details Card -->
          <div style="background: rgba(255,255,255,0.95); border-radius: 10px; padding: 15px; margin-bottom: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <div style="background: linear-gradient(135deg, #10b981, #059669); width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 10px;">
                <div style="font-size: 14px; color: white;">📋</div>
              </div>
              <h3 style="color: #1f2937; margin: 0; font-size: 16px; font-weight: 600;">Deduction Details</h3>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
              <div style="background: #f0fdf4; padding: 10px; border-radius: 6px; border-left: 3px solid #10b981;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Deduction ID</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">#${deduction.DEDUCTION_ID}</div>
              </div>
              <div style="background: #f0fdf4; padding: 10px; border-radius: 6px; border-left: 3px solid #10b981;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Deduction Type</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${deductionTypes.find(t => t.value === deduction.DEDUCTION_TYPE)?.label || deduction.DEDUCTION_TYPE}</div>
              </div>
              <div style="background: #fef3c7; padding: 10px; border-radius: 6px; border-left: 3px solid #f59e0b;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Deduction Amount</div>
                <div style="color: #1f2937; font-size: 14px; font-weight: 700;">${formatCurrency(deduction.AMOUNT)}</div>
              </div>
              <div style="background: #f0fdf4; padding: 10px; border-radius: 6px; border-left: 3px solid #10b981;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Remaining Amount</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${formatCurrency(deduction.REMAINING_AMOUNT || deduction.AMOUNT)}</div>
              </div>
              <div style="background: #f0fdf4; padding: 10px; border-radius: 6px; border-left: 3px solid #10b981;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Category</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${deductionCategories.find(c => c.value === deduction.DEDUCTION_CATEGORY)?.label || deduction.DEDUCTION_CATEGORY}</div>
              </div>
              <div style="background: #f0fdf4; padding: 10px; border-radius: 6px; border-left: 3px solid #10b981;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Status</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${deductionStatuses.find(s => s.value === deduction.STATUS)?.label || deduction.STATUS}</div>
              </div>
            </div>
            <div style="background: #fefce8; padding: 10px; border-radius: 6px; border-left: 3px solid #eab308;">
              <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">Reason for Deduction</div>
              <div style="color: #1f2937; font-size: 13px; line-height: 1.4; font-weight: 500;">${deduction.REASON}</div>
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
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Deduction Date</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${formatDate(deduction.DEDUCTION_DATE)}</div>
              </div>
              <div style="background: #faf5ff; padding: 10px; border-radius: 6px; border-left: 3px solid #8b5cf6;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Effective From</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${formatEffectiveDate(deduction.EFFECTIVE_FROM_MONTH)}</div>
              </div>
              <div style="background: #faf5ff; padding: 10px; border-radius: 6px; border-left: 3px solid #8b5cf6;">
                                  <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Effective To</div>
                  <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${formatEffectiveDate(deduction.EFFECTIVE_TO_MONTH)}</div>
              </div>
              <div style="background: #faf5ff; padding: 10px; border-radius: 6px; border-left: 3px solid #8b5cf6;">
                <div style="color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Created At</div>
                <div style="color: #1f2937; font-size: 13px; font-weight: 600;">${formatDate(deduction.CREATED_AT)}</div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 10px; backdrop-filter: blur(10px);">
            <div style="background: white; width: 40px; height: 40px; border-radius: 50%; margin: 0 auto 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
              <div style="font-size: 16px;">🔒</div>
            </div>
            <p style="color: rgba(255,255,255,0.8); font-size: 11px; margin: 0; font-weight: 500;">This is an official computer-generated document from GAP HRMS</p>
            <p style="color: rgba(255,255,255,0.6); font-size: 9px; margin: 3px 0 0 0;">Document ID: DEDUCTION-${deduction.DEDUCTION_ID}-${new Date().getTime()}</p>
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
      pdf.save(`deduction-${deduction.DEDUCTION_ID}-${deduction.EMPLOYEE_FIRST_NAME}-${deduction.EMPLOYEE_LAST_NAME}.pdf`);

      // Clean up
      document.body.removeChild(printContent);
      toast.success('PDF generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setPrintingPdf(false);
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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-4">
        <Icon className="h-5 w-5 text-primary-600 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );

  const InfoField = ({ label, value }) => (
    <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{value}</dd>
    </div>
  );

  const StatusBadge = ({ status }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'PENDING':
          return 'bg-yellow-100 text-yellow-800';
        case 'ACTIVE':
          return 'bg-green-100 text-green-800';
        case 'COMPLETED':
          return 'bg-blue-100 text-blue-800';
        case 'CANCELLED':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
        {deductionStatuses.find(s => s.value === status)?.label || status}
      </span>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!deduction) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Deduction not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The deduction you're looking for doesn't exist or has been deleted.
        </p>
        <div className="mt-6">
          <Link
            to="/deductions"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Back to Deductions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Deduction Details
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Deduction ID: #{deduction.DEDUCTION_ID}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrint}
            disabled={printingPdf}
            className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium ${
              printingPdf
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                : 'text-gray-700 bg-white hover:bg-gray-50'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
          >
            {printingPdf ? (
              <>
                <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                Generating...
              </>
            ) : (
              <>
                <PrinterIcon className="h-4 w-4 mr-2" />
                Print PDF
              </>
            )}
          </button>

          {deduction.STATUS === 'PENDING' && (user?.role === 'ADMIN' || user?.role === 'HR') && (
            <>
              <button
                onClick={() => handleStatusUpdate('ACTIVE')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                Approve
              </button>
              <button
                onClick={() => handleStatusUpdate('CANCELLED')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Cancel
              </button>
            </>
          )}

          {(user?.role === 'ADMIN' || user?.role === 'HR') && (
            <>
              <Link
                to={`/deductions/${deduction.DEDUCTION_ID}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </Link>
              {user?.role === 'ADMIN' && (
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Employee Information */}
      <InfoSection title="Employee Information" icon={UserIcon}>
        <dl className="divide-y divide-gray-200">
          <InfoField 
            label="Employee Name" 
            value={`${deduction.EMPLOYEE_FIRST_NAME} ${deduction.EMPLOYEE_LAST_NAME}`} 
          />
          <InfoField label="Employee Code" value={deduction.EMPLOYEE_CODE} />
          <InfoField label="Email" value={deduction.EMPLOYEE_EMAIL || '-'} />
        </dl>
      </InfoSection>

      {/* Deduction Details */}
      <InfoSection title="Deduction Details" icon={CurrencyDollarIcon}>
        <dl className="divide-y divide-gray-200">
          <InfoField 
            label="Type" 
            value={deductionTypes.find(t => t.value === deduction.DEDUCTION_TYPE)?.label || deduction.DEDUCTION_TYPE} 
          />
          <InfoField 
            label="Category" 
            value={deductionCategories.find(c => c.value === deduction.DEDUCTION_CATEGORY)?.label || deduction.DEDUCTION_CATEGORY} 
          />
          <InfoField 
            label="Amount" 
            value={formatCurrency(deduction.AMOUNT)} 
          />
          <InfoField 
            label="Deducted Amount" 
            value={formatCurrency(deduction.DEDUCTED_AMOUNT || 0)} 
          />
          <InfoField 
            label="Remaining Amount" 
            value={formatCurrency(deduction.REMAINING_AMOUNT || deduction.AMOUNT)} 
          />
          <InfoField 
            label="Status" 
            value={<StatusBadge status={deduction.STATUS} />} 
          />
          <InfoField 
            label="Recurring" 
            value={deduction.IS_RECURRING === 'Y' ? `Yes (${deduction.RECURRING_MONTHS} months)` : 'No'} 
          />
          <InfoField label="Reason" value={deduction.REASON} />
        </dl>
      </InfoSection>

      {/* Dates and Timeline */}
      <InfoSection title="Dates & Timeline" icon={CalendarIcon}>
        <dl className="divide-y divide-gray-200">
          <InfoField label="Deduction Date" value={formatDate(deduction.DEDUCTION_DATE)} />
          <InfoField label="Effective From" value={formatEffectiveDate(deduction.EFFECTIVE_FROM_MONTH)} />
                      <InfoField label="Effective To" value={formatEffectiveDate(deduction.EFFECTIVE_TO_MONTH)} />
          <InfoField label="Created At" value={formatDate(deduction.CREATED_AT)} />
          <InfoField label="Updated At" value={formatDate(deduction.UPDATED_AT)} />
        </dl>
      </InfoSection>

      {/* Additional Information */}
      <InfoSection title="Additional Information" icon={TagIcon}>
        <dl className="divide-y divide-gray-200">
          <InfoField 
            label="Applied By" 
            value={deduction.APPLIED_BY_FIRST_NAME && deduction.APPLIED_BY_LAST_NAME 
              ? `${deduction.APPLIED_BY_FIRST_NAME} ${deduction.APPLIED_BY_LAST_NAME}` 
              : '-'} 
          />
          <InfoField 
            label="Approved By" 
            value={deduction.APPROVED_BY_FIRST_NAME && deduction.APPROVED_BY_LAST_NAME 
              ? `${deduction.APPROVED_BY_FIRST_NAME} ${deduction.APPROVED_BY_LAST_NAME}` 
              : '-'} 
          />
          <InfoField label="Approved Date" value={formatDate(deduction.APPROVED_DATE)} />
          <InfoField 
            label="Attachment" 
            value={deduction.ATTACHMENT_URL ? (
              <a 
                href={deduction.ATTACHMENT_URL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-900 underline"
              >
                View Document
              </a>
            ) : '-'} 
          />
          <InfoField label="Comments" value={deduction.COMMENTS || '-'} />
        </dl>
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
                Delete Deduction
              </h3>
              
              {/* Message */}
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 text-center">
                  Are you sure you want to delete this deduction for{' '}
                  <span className="font-semibold text-gray-900">
                    {deduction.EMPLOYEE_FIRST_NAME} {deduction.EMPLOYEE_LAST_NAME}
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

export default DeductionDetail; 