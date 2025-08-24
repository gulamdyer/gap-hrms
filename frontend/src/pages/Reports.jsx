import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentTextIcon, BanknotesIcon, ShieldCheckIcon, IdentificationIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { payrollAPI } from '../services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Reports = () => {
  const navigate = useNavigate();
  const [periodId, setPeriodId] = useState('');
  const [periods, setPeriods] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);
  const [preview, setPreview] = useState({ open: false, title: '', headers: [], rows: [], filename: '' });

  const ensurePeriod = () => {
    if (!periodId) {
      alert('Please enter a Period ID to generate reports. You can find it on Payroll > Periods.');
      return false;
    }
    return true;
  };



  useEffect(() => {
    // Load latest completed periods for dropdown
    (async () => {
      try {
        const res = await payrollAPI.getPeriods({ status: 'COMPLETED' });
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        setPeriods(list);
      } catch (e) {
        console.error('Failed to load periods:', e);
      }
    })();
  }, []);

  const exportPreviewToPdf = async () => {
    try {
      const el = document.getElementById('report-preview-table');
      if (!el) return;
      const canvas = await html2canvas(el);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'pt', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, Math.min(imgHeight, pageHeight - 40));
      pdf.save(preview.filename.replace(/\.xlsx$/, '.pdf'));
    } catch (err) {
      console.error('PDF export failed:', err);
    }
  };

  const openPreview = async (type, title, filename, headers, rowProjector) => {
    if (!ensurePeriod()) return;
    try {
      setDownloading(true);
      const res = await payrollAPI.generateMonthEndReport(periodId, type);
      const rows = Array.isArray(res?.data?.reportData) ? res.data.reportData : (res?.data || []);
      const tableRows = rows.map(rowProjector);
      
      // Compute totals row for numeric columns
      const totals = {};
      const numericHeaders = headers.filter(h => !['S. No.','S. NO.','EMPLOYEE CODE','EMPLOYEE ID','Code No.','UAN','Name of the Employee','NAME','DEPARTMENT','DESIGNATION','ESI NO.','IFSC','BANK ACCOUNT NO.','REFUND ADVANCE'].includes(h));
      numericHeaders.forEach(h => { 
        totals[h] = tableRows.reduce((s, r) => {
          const value = r[h];
          if (typeof value === 'string' && value.includes(',')) {
            return s + (parseFloat(value.replace(/,/g, '')) || 0);
          }
          return s + (Number(value) || 0);
        }, 0); 
      });
      
             // Create totals row with proper formatting
       const totalsRow = headers.reduce((acc, h) => {
         if (h === 'Name of the Employee' || h === 'NAME' || h === 'NAME OF EMPLOYEE') {
           return { ...acc, [h]: 'TOTAL' };
         } else if (numericHeaders.includes(h)) {
           return { ...acc, [h]: formatNumber(totals[h]) };
         } else {
           return { ...acc, [h]: '' };
         }
       }, {});
      
      setPreview({ open: true, title, headers, rows: [...tableRows, totalsRow], filename });
    } catch (e) {
      console.error('Preview failed:', e);
      const status = e?.response?.status;
      const url = e?.config?.url;
      const method = e?.config?.method;
      const params = e?.config?.params;
      const serverData = e?.response?.data;
      const message = serverData?.message || serverData?.error || e?.message || 'Unknown error';
      setErrorInfo({ title: 'Preview failed', reportType: type, periodId, http: { method, url, status, params }, server: serverData, message });
      setErrorOpen(true);
    } finally {
      setDownloading(false);
    }
  };

  const formatNumber = (value) => {
    const num = Number(value) || 0;
    return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      return dateString;
    }
  };

  const openPreviewWithGroupedHeaders = async (type, title, filename) => {
    if (!ensurePeriod()) return;
    try {
      setDownloading(true);
      const res = await payrollAPI.generateMonthEndReport(periodId, type);
      const rows = Array.isArray(res?.data?.reportData) ? res.data.reportData : (res?.data || []);
      
      const tableRows = rows.map((r, idx) => {
        const totalEarnings = Number(r.TOTAL_EARNING ?? 0);
        const totalDeductions = Number(r.TOTAL_DEDUCTION_AMOUNT ?? r.TOTAL_DEDUCTION ?? 0);
        const otherEarnings = Number(r.OTHER_EARNING ?? 0) + Number(r.OVERTIME_EARNING ?? 0) + Number(r.BONUS_EARNING ?? 0);
        const salaryPayable = Number(r.NET_SALARY ?? 0);
        
        return {
          'Sr.No.': idx + 1,
          'CODE NO': r.EMPLOYEE_CODE ?? '',
                         'NAME OF EMPLOYEE': r.EMPLOYEE_FIRST_NAME ?? '',
          'D.O.J': formatDate(r.DATE_OF_JOINING),
          'IFS CODE': r.IFSC_CODE || '',
          'BANK ACCOUNT NO.': r.ACCOUNT_NUMBER || '',
          'DEPARTMENT': r.DEPARTMENT || '',
          'DESIGNATION': r.DESIGNATION || '',
          // MONTHLY SALARY columns
          'BASIC': formatNumber(r.BASIC_SALARY ?? 0),
          'HRA': formatNumber(r.HRA_SALARY ?? 0),
          'OTHER': formatNumber(r.OTHER_SALARY ?? 0),
          'GROSS_SALARY': formatNumber(r.TOTAL_SALARY ?? 0),
          // DAYS - using PAYABLE_DAYS as requested
          'DAYS': r.PAYABLE_DAYS ?? '',
          // EARNED columns
          'BASIC_EARNING': formatNumber(r.BASIC_EARNING ?? 0),
          'HRA_EARNING': formatNumber(r.HRA_EARNING ?? 0),
          'CONVEYANCE': formatNumber(r.CONVEYANCE_EARNING ?? 0),
          'OTHER_EARNING': formatNumber(otherEarnings),
          'TOTAL_EARNING': formatNumber(totalEarnings),
          'PF_BASIC': formatNumber(r.FP_BASIC_EARNING ?? 0),
          // DEDUCTIONS columns
          'ESI': formatNumber(r.DED_ESI ?? 0),
          'PF': formatNumber(r.DED_PF ?? 0),
          'TDS': formatNumber(r.DED_TAX ?? 0),
          'ADVANCE': formatNumber(r.DED_ADVANCE ?? 0),
          'OTHER_DEDUCTION': formatNumber(r.DED_OTHER ?? 0),
          'TOTAL_DEDUCTION': formatNumber(totalDeductions),
          'SALARY_PAYABLE': formatNumber(salaryPayable)
        };
      });

      // Calculate totals
      const totals = {
        'Sr.No.': '',
        'CODE NO': '',
        'NAME OF EMPLOYEE': 'TOTAL',
        'D.O.J': '',
        'IFS CODE': '',
        'BANK ACCOUNT NO.': '',
        'DEPARTMENT': '',
        'DESIGNATION': '',
        'BASIC': formatNumber(tableRows.reduce((sum, row) => sum + (parseFloat(row.BASIC.replace(/,/g, '')) || 0), 0)),
        'HRA': formatNumber(tableRows.reduce((sum, row) => sum + (parseFloat(row.HRA.replace(/,/g, '')) || 0), 0)),
        'OTHER': formatNumber(tableRows.reduce((sum, row) => sum + (parseFloat(row.OTHER.replace(/,/g, '')) || 0), 0)),
        'GROSS_SALARY': formatNumber(tableRows.reduce((sum, row) => sum + (parseFloat(row.GROSS_SALARY.replace(/,/g, '')) || 0), 0)),
        'DAYS': '',
        'BASIC_EARNING': formatNumber(tableRows.reduce((sum, row) => sum + (parseFloat(row.BASIC_EARNING.replace(/,/g, '')) || 0), 0)),
        'HRA_EARNING': formatNumber(tableRows.reduce((sum, row) => sum + (parseFloat(row.HRA_EARNING.replace(/,/g, '')) || 0), 0)),
        'CONVEYANCE': formatNumber(tableRows.reduce((sum, row) => sum + (parseFloat(row.CONVEYANCE.replace(/,/g, '')) || 0), 0)),
        'OTHER_EARNING': formatNumber(tableRows.reduce((sum, row) => sum + (parseFloat(row.OTHER_EARNING.replace(/,/g, '')) || 0), 0)),
        'TOTAL_EARNING': formatNumber(tableRows.reduce((sum, row) => sum + (parseFloat(row.TOTAL_EARNING.replace(/,/g, '')) || 0), 0)),
        'PF_BASIC': formatNumber(tableRows.reduce((sum, row) => sum + (parseFloat(row.PF_BASIC.replace(/,/g, '')) || 0), 0)),
        'ESI': formatNumber(tableRows.reduce((sum, row) => sum + (parseFloat(row.ESI.replace(/,/g, '')) || 0), 0)),
        'PF': formatNumber(tableRows.reduce((sum, row) => sum + (parseFloat(row.PF.replace(/,/g, '')) || 0), 0)),
        'TDS': formatNumber(tableRows.reduce((sum, row) => sum + (parseFloat(row.TDS.replace(/,/g, '')) || 0), 0)),
        'ADVANCE': formatNumber(tableRows.reduce((sum, row) => sum + (parseFloat(row.ADVANCE.replace(/,/g, '')) || 0), 0)),
        'OTHER_DEDUCTION': formatNumber(tableRows.reduce((sum, row) => sum + (parseFloat(row.OTHER_DEDUCTION.replace(/,/g, '')) || 0), 0)),
        'TOTAL_DEDUCTION': formatNumber(tableRows.reduce((sum, row) => sum + (parseFloat(row.TOTAL_DEDUCTION.replace(/,/g, '')) || 0), 0)),
        'SALARY_PAYABLE': formatNumber(tableRows.reduce((sum, row) => sum + (parseFloat(row.SALARY_PAYABLE.replace(/,/g, '')) || 0), 0))
      };

      setPreview({ 
        open: true, 
        title, 
        groupedHeaders: true,
        rows: [...tableRows, totals], 
        filename 
      });
    } catch (e) {
      console.error('Preview failed:', e);
      const status = e?.response?.status;
      const url = e?.config?.url;
      const method = e?.config?.method;
      const params = e?.config?.params;
      const serverData = e?.response?.data;
      const message = serverData?.message || serverData?.error || e?.message || 'Unknown error';
      setErrorInfo({ title: 'Preview failed', reportType: type, periodId, http: { method, url, status, params }, server: serverData, message });
      setErrorOpen(true);
    } finally {
      setDownloading(false);
    }
  };

  const exportPreviewToExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      
      if (preview.groupedHeaders) {
        // For salary sheet with grouped headers, create custom worksheet
        const ws = XLSX.utils.aoa_to_sheet([]);
        
        // Add main headers
        const mainHeaders = [
          'S. No', 'CODE NO', 'NAME OF EMPLOYEE', 'D.O.J.', 'IFS CODE', 'BANK ACCOUNT NO.', 'DEPARTMENT', 'DESIGNATION',
          'MONTHLY SALARY', '', '', '', 'DAYS',
          'EARNED', '', '', '', '', '', 
          'DEDUCTIONS', '', '', '', '', '', 
          'SALARY PAYABLE'
        ];
        
        // Add sub headers
        const subHeaders = [
          '', '', '', '', '', '', '', '',
          'BASIC', 'HRA', 'OTHER', 'GROSS SALARY', '',
          'BASIC', 'HRA', 'CONVEYANCE', 'OTHER', 'TOTAL EARNING', 'PF BASIC',
          'ESI', 'PF', 'TDS', 'ADVANCE', 'OTHER', 'TOTAL DEDUCTION',
          ''
        ];
        
        // Add data rows
        const dataRows = preview.rows.map(row => [
          row['Sr.No.'], row['CODE NO'], row['NAME OF EMPLOYEE'], row['D.O.J'], row['IFS CODE'], 
          row['BANK ACCOUNT NO.'], row['DEPARTMENT'], row['DESIGNATION'],
          row['BASIC'], row['HRA'], row['OTHER'], row['GROSS_SALARY'], row['DAYS'],
          row['BASIC_EARNING'], row['HRA_EARNING'], row['CONVEYANCE'], row['OTHER_EARNING'], 
          row['TOTAL_EARNING'], row['PF_BASIC'],
          row['ESI'], row['PF'], row['TDS'], row['ADVANCE'], row['OTHER_DEDUCTION'], 
          row['TOTAL_DEDUCTION'], row['SALARY_PAYABLE']
        ]);
        
        XLSX.utils.sheet_add_aoa(ws, [mainHeaders], { origin: 'A1' });
        XLSX.utils.sheet_add_aoa(ws, [subHeaders], { origin: 'A2' });
        XLSX.utils.sheet_add_aoa(ws, dataRows, { origin: 'A3' });
        
        // Merge cells for grouped headers
        ws['!merges'] = [
          { s: { r: 0, c: 8 }, e: { r: 0, c: 11 } },   // MONTHLY SALARY
          { s: { r: 0, c: 13 }, e: { r: 0, c: 18 } },  // EARNED
          { s: { r: 0, c: 19 }, e: { r: 0, c: 24 } }   // DEDUCTIONS
        ];
        
        XLSX.utils.book_append_sheet(wb, ws, preview.title);
      } else {
        // Regular export for other reports
        const ws = XLSX.utils.json_to_sheet(preview.rows);
        XLSX.utils.book_append_sheet(wb, ws, preview.title);
      }
      
      XLSX.writeFile(wb, preview.filename);
    } catch (ex) {
      console.warn('XLSX export failed, falling back to CSV');
      // Fallback to CSV
      const headers = preview.groupedHeaders ? 
        ['S. No', 'CODE NO', 'NAME OF EMPLOYEE', 'D.O.J.', 'IFS CODE', 'BANK ACCOUNT NO.', 'DEPARTMENT', 'DESIGNATION',
         'BASIC', 'HRA', 'OTHER', 'GROSS SALARY', 'DAYS', 'BASIC_EARNING', 'HRA_EARNING', 'CONVEYANCE', 
         'OTHER_EARNING', 'TOTAL_EARNING', 'PF_BASIC', 'ESI', 'PF', 'TDS', 'ADVANCE', 'OTHER_DEDUCTION', 
         'TOTAL_DEDUCTION', 'SALARY_PAYABLE'] :
        preview.headers;
      
      const csvData = preview.groupedHeaders ? 
        preview.rows.map(r => [
          r['Sr.No.'], r['CODE NO'], r['NAME OF EMPLOYEE'], r['D.O.J'], r['IFS CODE'], 
          r['BANK ACCOUNT NO.'], r['DEPARTMENT'], r['DESIGNATION'],
          r['BASIC'], r['HRA'], r['OTHER'], r['GROSS_SALARY'], r['DAYS'],
          r['BASIC_EARNING'], r['HRA_EARNING'], r['CONVEYANCE'], r['OTHER_EARNING'], 
          r['TOTAL_EARNING'], r['PF_BASIC'],
          r['ESI'], r['PF'], r['TDS'], r['ADVANCE'], r['OTHER_DEDUCTION'], 
          r['TOTAL_DEDUCTION'], r['SALARY_PAYABLE']
        ]) :
        preview.rows.map(r => headers.map(h => r[h] ?? ''));
      
      const csv = [headers.join(','), ...csvData.map(row => row.map(cell => JSON.stringify(cell ?? '')).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = preview.filename.replace(/\.xlsx$/, '.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Download payroll reports for a processed period.</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
        <div className="col-span-2">
          <label className="block text-sm text-gray-700 mb-1">Payroll Period</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={periodId}
            onChange={(e) => setPeriodId(e.target.value)}
          >
            <option value="">Select a period...</option>
            {periods.map(p => (
              <option key={p.PERIOD_ID} value={p.PERIOD_ID}>
                {p.PERIOD_NAME} ({p.PERIOD_TYPE})
              </option>
            ))}
          </select>
        </div>
        <div>
          <button
            onClick={() => periodId && navigate(`/payroll/periods/${periodId}`)}
            className="mt-6 px-3 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50 w-full"
          >
            Open Period
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <button
          disabled={downloading}
          onClick={() => openPreviewWithGroupedHeaders(
            'DETAILED',
            'Salary Sheet',
            `salary_sheet_period_${periodId}.xlsx`
          )}
          className="bg-white hover:bg-gray-50 shadow rounded-lg p-6 text-left border border-gray-200"
        >
          <div className="flex items-center gap-3">
            <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
            <div>
              <div className="font-semibold">Salary Sheet</div>
              <div className="text-sm text-gray-500">Preview & Export</div>
            </div>
          </div>
        </button>

                 <button
           disabled={downloading}
           onClick={() => openPreview(
             'PF',
             'PF Statement',
             `pf_statement_period_${periodId}.xlsx`,
             ['S. No.', 'EMPLOYEE CODE', 'UAN', 'Name of the Employee', 'DEPARTMENT', 'DESIGNATION', 'NCP DAYS', 'GROSS WAGES', 'EPF WAGES', 'EPS WAGES', 'EDLI', 'EE SHARE 12%', 'EPS CONTRIBUTION SHARE 8.33%', 'ER SHARE 3.67%', 'REFUND ADVANCE'],
             (r, idx) => ({
               'S. No.': idx + 1,
               'EMPLOYEE CODE': r.EMPLOYEE_CODE || '',
               'UAN': r.UAN_NUMBER || '',
               'Name of the Employee': r.EMPLOYEE_FIRST_NAME ?? '',
               'DEPARTMENT': r.DEPARTMENT || '',
               'DESIGNATION': r.DESIGNATION || '',
               'NCP DAYS': r.NCP_DAYS ?? 0,
               'GROSS WAGES': formatNumber(r.GROSS_WAGES ?? 0),
               'EPF WAGES': formatNumber(r.EPF_WAGES ?? 0),
               'EPS WAGES': formatNumber(r.EPS_WAGES ?? 0),
               'EDLI': formatNumber(r.EDLI ?? 0),
               'EE SHARE 12%': formatNumber(r.EE_SHARE_12 ?? 0),
               'EPS CONTRIBUTION SHARE 8.33%': formatNumber(r.EPS_CONTRIBUTION_SHARE_833 ?? 0),
               'ER SHARE 3.67%': formatNumber(r.ER_SHARE_367 ?? 0),
               'REFUND ADVANCE': formatNumber(r.REFUND_ADVANCE ?? 0),
             })
           )}
           className="bg-white hover:bg-gray-50 shadow rounded-lg p-6 text-left border border-gray-200"
         >
          <div className="flex items-center gap-3">
            <IdentificationIcon className="h-6 w-6 text-green-600" />
            <div>
              <div className="font-semibold">PF Report</div>
              <div className="text-sm text-gray-500">Preview & Export</div>
            </div>
          </div>
        </button>

                 <button
           disabled={downloading}
           onClick={() => openPreview(
             'ESI',
             'ESI Statement',
             `esi_statement_period_${periodId}.xlsx`,
             ['S. NO.', 'EMPLOYEE ID', 'NAME', 'DEPARTMENT', 'DESIGNATION', 'ESI NO.', 'WORK DAYS', 'ESI WAGES', 'EE CONT.', 'ER CONT.', 'TOTAL'],
             (r, idx) => ({
               'S. NO.': idx + 1,
               'EMPLOYEE ID': r.EMPLOYEE_CODE || '',
               'NAME': r.EMPLOYEE_FIRST_NAME ?? '',
               'DEPARTMENT': r.DEPARTMENT || '',
               'DESIGNATION': r.DESIGNATION || '',
               'ESI NO.': r.ESI_NUMBER || '',
               'WORK DAYS': r.WORK_DAYS ?? 0,
               'ESI WAGES': formatNumber(r.ESI_WAGES ?? 0),
               'EE CONT.': formatNumber(r.ESI_EE ?? 0),
               'ER CONT.': formatNumber(r.ESI_ER ?? 0),
               'TOTAL': formatNumber((r.ESI_EE ?? 0) + (r.ESI_ER ?? 0)),
             })
           )}
           className="bg-white hover:bg-gray-50 shadow rounded-lg p-6 text-left border border-gray-200"
         >
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className="h-6 w-6 text-teal-600" />
            <div>
              <div className="font-semibold">ESI Report</div>
              <div className="text-sm text-gray-500">Preview & Export</div>
            </div>
          </div>
        </button>

        <button
          disabled={downloading}
          onClick={() => openPreview(
            'BANK',
            'Bank Transfer',
            `bank_transfer_period_${periodId}.xlsx`,
            ['S. No.', 'Code No.', 'Name of the Employee', 'DEPARTMENT', 'DESIGNATION', 'IFSC', 'BANK ACCOUNT NO.', 'Payable'],
            (r, idx) => ({
              'S. No.': idx + 1,
              'Code No.': r.EMPLOYEE_CODE || '',
                             'Name of the Employee': r.EMPLOYEE_FIRST_NAME ?? '',
              'DEPARTMENT': r.DEPARTMENT || '',
              'DESIGNATION': r.DESIGNATION || '',
              'IFSC': r.IFSC_CODE || '',
              'BANK ACCOUNT NO.': r.ACCOUNT_NUMBER || '',
              'Payable': formatNumber(r.NET_SALARY ?? 0),
            })
          )}
          className="bg-white hover:bg-gray-50 shadow rounded-lg p-6 text-left border border-gray-200"
        >
          <div className="flex items-center gap-3">
            <BanknotesIcon className="h-6 w-6 text-amber-600" />
            <div>
              <div className="font-semibold">Bank Transfer</div>
              <div className="text-sm text-gray-500">Preview & Export</div>
            </div>
          </div>
        </button>
      </div>

      {/* Error Modal */}
      {errorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{errorInfo?.title || 'Error'}</h3>
              <button onClick={() => setErrorOpen(false)} className="p-1 rounded hover:bg-gray-100">
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-3 max-h-[70vh] overflow-auto">
              <div className="text-sm text-gray-700">
                <div><span className="font-medium">Report Type:</span> {errorInfo?.reportType}</div>
                <div><span className="font-medium">Period ID:</span> {errorInfo?.periodId}</div>
                <div className="mt-2">
                  <div className="font-medium mb-1">HTTP</div>
                  <pre className="bg-gray-50 p-3 rounded border text-xs whitespace-pre-wrap break-all">{JSON.stringify(errorInfo?.http, null, 2)}</pre>
                </div>
                <div className="mt-2">
                  <div className="font-medium mb-1">Server Response</div>
                  <pre className="bg-gray-50 p-3 rounded border text-xs whitespace-pre-wrap break-all">{JSON.stringify(errorInfo?.server, null, 2)}</pre>
                </div>
                <div className="mt-2">
                  <div className="font-medium mb-1">Message</div>
                  <div className="text-red-700 text-sm">{errorInfo?.message}</div>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 border-t flex justify-end gap-2">
              <button onClick={() => setErrorOpen(false)} className="px-3 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* HTML Preview Modal */}
      {preview.open && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-stretch bg-black/40">
          <div className="bg-white w-full h-full rounded-none lg:rounded-none shadow-lg flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{preview.title} (Preview)</h3>
              <button onClick={() => setPreview(p => ({ ...p, open: false }))} className="p-1 rounded hover:bg-gray-100">
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-3 flex-1 min-h-0 overflow-auto">
              <div className="text-sm text-gray-700">
                <div className="flex justify-end gap-2 mb-3">
              <button onClick={exportPreviewToExcel} className="px-3 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50">Export Excel</button>
              <button onClick={exportPreviewToPdf} className="px-3 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50">Export PDF</button>
                </div>
                <div className="overflow-auto border rounded">
                  <table id="report-preview-table" className="min-w-full divide-y divide-gray-200">
                    {preview.groupedHeaders ? (
                      <>
                        {/* Grouped Headers for Salary Sheet */}
                        <thead className="bg-gray-50">
                          {/* Main header row */}
                          <tr>
                            <th rowSpan={2} className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">S. No</th>
                            <th rowSpan={2} className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">CODE NO</th>
                            <th rowSpan={2} className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">NAME OF EMPLOYEE</th>
                            <th rowSpan={2} className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">D.O.J.</th>
                            <th rowSpan={2} className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">IFS CODE</th>
                            <th rowSpan={2} className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">BANK ACCOUNT NO.</th>
                            <th rowSpan={2} className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">DEPARTMENT</th>
                            <th rowSpan={2} className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">DESIGNATION</th>
                            <th colSpan={4} className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r bg-blue-50">MONTHLY SALARY</th>
                            <th rowSpan={2} className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">DAYS</th>
                            <th colSpan={6} className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r bg-green-50">EARNED</th>
                            <th colSpan={6} className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r bg-red-50">DEDUCTIONS</th>
                            <th rowSpan={2} className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">SALARY PAYABLE</th>
                          </tr>
                          {/* Sub header row */}
                          <tr>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r bg-blue-50">BASIC</th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r bg-blue-50">HRA</th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r bg-blue-50">OTHER</th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r bg-blue-50">GROSS SALARY</th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r bg-green-50">BASIC</th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r bg-green-50">HRA</th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r bg-green-50">CONVEYANCE</th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r bg-green-50">OTHER</th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r bg-green-50">TOTAL EARNING</th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r bg-green-50">PF BASIC</th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r bg-red-50">ESI</th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r bg-red-50">PF</th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r bg-red-50">TDS</th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r bg-red-50">ADVANCE</th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r bg-red-50">OTHER</th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r bg-red-50">TOTAL DEDUCTION</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {preview.rows.map((row, idx) => (
                            <tr key={idx} className={idx === preview.rows.length - 1 ? "font-bold bg-gray-100" : ""}>
                              <td className="px-2 py-2 whitespace-nowrap text-xs text-center border-r">{row['Sr.No.']}</td>
                              <td className="px-2 py-2 whitespace-nowrap text-xs text-center border-r">{row['CODE NO']}</td>
                              <td className="px-2 py-2 whitespace-nowrap text-xs text-left border-r">{row['NAME OF EMPLOYEE']}</td>
                              <td className="px-2 py-2 whitespace-nowrap text-xs text-center border-r">{row['D.O.J']}</td>
                              <td className="px-2 py-2 whitespace-nowrap text-xs text-center border-r">{row['IFS CODE']}</td>
                              <td className="px-2 py-2 whitespace-nowrap text-xs text-center border-r">{row['BANK ACCOUNT NO.']}</td>
                              <td className="px-2 py-2 whitespace-nowrap text-xs text-center border-r">{row['DEPARTMENT']}</td>
                              <td className="px-2 py-2 whitespace-nowrap text-xs text-center border-r">{row['DESIGNATION']}</td>
                              {/* MONTHLY SALARY columns - right aligned */}
                              <td className="px-2 py-2 whitespace-nowrap text-xs text-right border-r">{row['BASIC']}</td>
                              <td className="px-2 py-2 whitespace-nowrap text-xs text-right border-r">{row['HRA']}</td>
                              <td className="px-2 py-2 whitespace-nowrap text-xs text-right border-r">{row['OTHER']}</td>
                              <td className="px-2 py-2 whitespace-nowrap text-xs text-right border-r">{row['GROSS_SALARY']}</td>
                              {/* DAYS */}
                              <td className="px-2 py-2 whitespace-nowrap text-xs text-center border-r">{row['DAYS']}</td>
                              {/* EARNED columns - right aligned */}
                              <td className="px-2 py-2 whitespace-nowrap text-xs text-right border-r">{row['BASIC_EARNING']}</td>
                              <td className="px-2 py-2 whitespace-nowrap text-xs text-right border-r">{row['HRA_EARNING']}</td>
                              <td className="px-2 py-2 whitespace-nowrap text-xs text-right border-r">{row['CONVEYANCE']}</td>
                              <td className="px-2 py-2 whitespace-nowrap text-xs text-right border-r">{row['OTHER_EARNING']}</td>
                              <td className="px-2 py-2 whitespace-nowrap text-xs text-right border-r">{row['TOTAL_EARNING']}</td>
                              <td className="px-2 py-2 whitespace-nowrap text-xs text-right border-r">{row['PF_BASIC']}</td>
                              {/* DEDUCTIONS columns - right aligned */}
                              <td className="px-2 py-2 whitespace-nowrap text-xs text-right border-r">{row['ESI']}</td>
                              <td className="px-2 py-2 whitespace-nowrap text-xs text-right border-r">{row['PF']}</td>
                              <td className="px-2 py-2 whitespace-nowrap text-xs text-right border-r">{row['TDS']}</td>
                              <td className="px-2 py-2 whitespace-nowrap text-xs text-right border-r">{row['ADVANCE']}</td>
                              <td className="px-2 py-2 whitespace-nowrap text-xs text-right border-r">{row['OTHER_DEDUCTION']}</td>
                              <td className="px-2 py-2 whitespace-nowrap text-xs text-right border-r">{row['TOTAL_DEDUCTION']}</td>
                              {/* SALARY PAYABLE - right aligned */}
                              <td className="px-2 py-2 whitespace-nowrap text-xs text-right">{row['SALARY_PAYABLE']}</td>
                            </tr>
                          ))}
                        </tbody>
                      </>
                    ) : (
                      <>
                        {/* Regular headers for other reports */}
                        <thead className="bg-gray-50">
                          <tr>
                            {preview.headers.map(h => (
                              <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                                                 <tbody className="bg-white divide-y divide-gray-200">
                           {preview.rows.map((row, idx) => (
                             <tr key={idx} className={idx === preview.rows.length - 1 ? "font-bold bg-gray-100" : ""}>
                               {preview.headers.map(h => (
                                 <td key={h} className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{row[h]}</td>
                               ))}
                             </tr>
                           ))}
                         </tbody>
                      </>
                    )}
                  </table>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 border-t flex justify-end gap-2">
              <button onClick={() => setPreview(p => ({ ...p, open: false }))} className="px-3 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;


