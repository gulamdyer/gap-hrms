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

  const exportReport = async (type, filename, sheetName, mapRow) => {
    if (!ensurePeriod()) return;
    try {
      setDownloading(true);
      const res = await payrollAPI.generateMonthEndReport(periodId, type);
      const rows = Array.isArray(res?.data?.reportData) ? res.data.reportData : (res?.data || []);
      const data = rows.map(mapRow);
      try {
        const XLSX = await import('xlsx');
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, filename);
      } catch (ex) {
        // Fallback to CSV and also open HTML preview
        console.warn('XLSX not available, falling back to CSV and preview.', ex);
        const headers = Object.keys(data[0] || {});
        const csv = [headers.join(','), ...data.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename.replace(/\.xlsx$/, '.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setPreview({ open: true, title: sheetName, headers, rows: data, filename });
      }
    } catch (e) {
      console.error('Export failed:', e);
      const status = e?.response?.status;
      const url = e?.config?.url;
      const method = e?.config?.method;
      const params = e?.config?.params;
      const serverData = e?.response?.data;
      const message = serverData?.message || serverData?.error || e?.message || 'Unknown error';
      setErrorInfo({
        title: 'Export failed',
        reportType: type,
        periodId,
        http: { method, url, status, params },
        server: serverData,
        message
      });
      setErrorOpen(true);
    } finally {
      setDownloading(false);
    }
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
      const numericHeaders = headers.filter(h => !['Sr.No.','Code No','Employee Name','DOJ','IFS CODE','Bank Account No','Department','Designation'].includes(h));
      numericHeaders.forEach(h => { totals[h] = tableRows.reduce((s, r) => s + (Number(r[h]) || 0), 0); });
      const totalsRow = headers.reduce((acc, h) => ({ ...acc, [h]: numericHeaders.includes(h) ? totals[h] : (h === 'Employee Name' ? 'TOTAL' : '') }), {});
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

  const exportPreviewToExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(preview.rows);
      XLSX.utils.book_append_sheet(wb, ws, preview.title);
      XLSX.writeFile(wb, preview.filename);
    } catch (ex) {
      const headers = preview.headers;
      const csv = [headers.join(','), ...preview.rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
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
          onClick={() => openPreview(
            'DETAILED',
            'Salary Sheet',
            `salary_sheet_period_${periodId}.xlsx`,
            [
              'Sr.No.',
              'Code No',
              'Employee Name',
              'DOJ',
              'IFS CODE',
              'Bank Account No',
              'Department',
              'Designation',
              'Basic',
              'HRA',
              'Other Allowance',
              'Gross Pay',
              'Days',
              'Basic Amount',
              'HRA Amount',
              'Conveyance',
              'Other Allowances',
              'Total Earnings',
              'ESI',
              'PF',
              'TDS',
              'Advance',
              'Other Deductions',
              'Total Deduction',
              'Salary Payable'
            ],
            (r, idx) => {
              const totalEarnings = Number(r.TOTAL_EARNINGS ?? 0);
              const totalDeductions = Number(r.TOTAL_DEDUCTION_AMOUNT ?? r.TOTAL_DEDUCTIONS ?? 0);
              const grossPay = Number(r.GROSS_SALARY ?? 0);
              const salaryPayable = grossPay - totalDeductions;
              return {
                'Sr.No.': idx + 1,
                'Code No': r.EMPLOYEE_CODE ?? '',
                'Employee Name': `${r.EMPLOYEE_FIRST_NAME ?? ''} ${r.EMPLOYEE_LAST_NAME ?? ''}`.trim(),
                'DOJ': r.DATE_OF_JOINING || '',
                'IFS CODE': r.IFSC_CODE || '',
                'Bank Account No': r.ACCOUNT_NUMBER || '',
                'Department': r.DEPARTMENT || '',
                'Designation': r.DESIGNATION || '',
                'Basic': r.BASIC_SALARY ?? 0,
                'HRA': r.HRA_AMOUNT ?? 0,
                'Other Allowance': r.OTHER_ALLOWANCES ?? 0,
                'Gross Pay': r.GROSS_SALARY ?? 0,
                'Days': r.WORK_DAYS ?? '',
                'Basic Amount': r.BASIC_AMOUNT ?? r.BASIC_SALARY ?? 0,
                'HRA Amount': r.HRA_AMOUNT ?? 0,
                'Conveyance': r.CONVEYANCE_AMOUNT ?? 0,
                'Other Allowances': r.OTHER_ALLOWANCES ?? 0,
                'Total Earnings': totalEarnings,
                'ESI': r.DED_ESI ?? 0,
                'PF': r.DED_PF ?? 0,
                'TDS': r.DED_TAX ?? 0,
                'Advance': r.DED_ADVANCE ?? 0,
                'Other Deductions': r.DED_OTHER ?? 0,
                'Total Deduction': totalDeductions,
                'Salary Payable': salaryPayable
              };
            }
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
          onClick={() => exportReport(
            'PF',
            `pf_statement_period_${periodId}.xlsx`,
            'PF Statement',
            (r, idx) => ({
              'S. No.': idx + 1,
              'EMPLOYEE CODE': r.EMPLOYEE_CODE || '',
              'UAN': r.UAN_NUMBER || '',
              'Name of the Employee': `${r.EMPLOYEE_FIRST_NAME ?? ''} ${r.EMPLOYEE_LAST_NAME ?? ''}`.trim(),
              'GROSS WAGES': r.GROSS_SALARY ?? 0,
              'EPF WAGES': r.EPF_WAGES ?? r.PF_WAGE_BASE ?? 0,
              'EPS WAGES': r.EPS_WAGES ?? Math.min(r.EPF_WAGES ?? r.PF_WAGE_BASE ?? 0, 15000),
              'EDLI': r.EDLI_WAGES ?? Math.min(r.GROSS_SALARY ?? 0, 15000),
              'EE SHARE 12%': r.PF_EE ?? 0,
              'EPS CONTRIBUTION SHARE 8.33%': r.EPS_ER ?? 0,
              'ER SHARE 3.67%': r.EPF_ER ?? 0,
              'NCP DAYS': r.NCP_DAYS ?? 0,
              'REFUND ADVANCE': r.PF_REFUND_ADV ?? 0,
            })
          )}
          className="bg-white hover:bg-gray-50 shadow rounded-lg p-6 text-left border border-gray-200"
        >
          <div className="flex items-center gap-3">
            <IdentificationIcon className="h-6 w-6 text-green-600" />
            <div>
              <div className="font-semibold">PF Report</div>
              <div className="text-sm text-gray-500">Export Excel</div>
            </div>
          </div>
        </button>

        <button
          disabled={downloading}
          onClick={() => exportReport(
            'ESI',
            `esi_statement_period_${periodId}.xlsx`,
            'ESI Statement',
            (r, idx) => ({
              'S. NO.': idx + 1,
              'EMPLOYEE ID': r.EMPLOYEE_CODE || '',
              'NAME': `${r.EMPLOYEE_FIRST_NAME ?? ''} ${r.EMPLOYEE_LAST_NAME ?? ''}`.trim(),
              'NO OF DAYS': r.WORK_DAYS ?? '',
              'ESI NO.': r.ESI_NUMBER || '',
              'ESI WAGES': r.ESI_WAGES ?? r.ESI_WAGE_BASE ?? 0,
              'EE CONT.': r.ESI_EE ?? 0,
              'ER CONT.': r.ESI_ER ?? 0,
              'TOTAL': (r.ESI_EE ?? 0) + (r.ESI_ER ?? 0),
            })
          )}
          className="bg-white hover:bg-gray-50 shadow rounded-lg p-6 text-left border border-gray-200"
        >
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className="h-6 w-6 text-teal-600" />
            <div>
              <div className="font-semibold">ESI Report</div>
              <div className="text-sm text-gray-500">Export Excel</div>
            </div>
          </div>
        </button>

        <button
          disabled={downloading}
          onClick={() => exportReport(
            'BANK',
            `bank_transfer_period_${periodId}.xlsx`,
            'Bank Transfer',
            (r) => ({
              'Code No.': r.EMPLOYEE_CODE || '',
              'Name of the Employee': `${r.EMPLOYEE_FIRST_NAME ?? ''} ${r.EMPLOYEE_LAST_NAME ?? ''}`.trim(),
              'IFSC': r.IFSC_CODE || '',
              'BANK ACCOUNT NO.': r.ACCOUNT_NUMBER || '',
              'Payable': r.NET_SALARY ?? r.SALARY_PAYABLE ?? 0,
            })
          )}
          className="bg-white hover:bg-gray-50 shadow rounded-lg p-6 text-left border border-gray-200"
        >
          <div className="flex items-center gap-3">
            <BanknotesIcon className="h-6 w-6 text-amber-600" />
            <div>
              <div className="font-semibold">Bank Transfer</div>
              <div className="text-sm text-gray-500">Export Excel</div>
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
                    <thead className="bg-gray-50">
                      <tr>
                    {preview.headers.map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                  {preview.rows.map((row, idx) => (
                        <tr key={idx}>
                      {preview.headers.map(h => (
                            <td key={h} className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{row[h]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
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


