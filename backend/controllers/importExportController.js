const ImportExport = require('../models/ImportExport');
const multer = require('multer');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/csv'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel and CSV files are allowed.'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Get available entities for import/export
const getAvailableEntities = async (req, res) => {
  try {
    const entities = await ImportExport.getAvailableEntities();
    
    res.status(200).json({
      success: true,
      data: entities
    });
  } catch (error) {
    console.error('Error getting available entities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available entities',
      error: error.message
    });
  }
};

// Export data from a specific entity
const exportData = async (req, res) => {
  try {
    const { entityId, format = 'excel' } = req.params;
    
    if (!entityId) {
      return res.status(400).json({
        success: false,
        message: 'Entity ID is required'
      });
    }

    const exportResult = await ImportExport.exportData(entityId);
    
    if (format === 'csv') {
      // Generate CSV
      const csvData = generateCSV(exportResult.data, exportResult.entity.fields);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${entityId}_export.csv"`);
      res.send(csvData);
    } else {
      // Generate Excel
      const workbook = generateExcel(exportResult.data, exportResult.entity.fields);
      const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${entityId}_export.xlsx"`);
      res.send(buffer);
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export data',
      error: error.message
    });
  }
};

// Generate template for a specific entity
const generateTemplate = async (req, res) => {
  try {
    const { entityId, format = 'excel' } = req.params;
    
    if (!entityId) {
      return res.status(400).json({
        success: false,
        message: 'Entity ID is required'
      });
    }

    const templateResult = await ImportExport.generateTemplate(entityId);

    if (format === 'csv') {
      // For CSV, first row is headers, subsequent rows are sample rows
      const csvRows = templateResult.template.map(row => row.map(cell => {
        if (cell === null || cell === undefined) return '';
        const val = String(cell);
        return (val.includes(',') || val.includes('"') || val.includes('\n')) ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(','));
      const csvData = csvRows.join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${entityId}_template.csv"`);
      res.send(csvData);
    } else {
      // Build workbook using AOA directly for template
      const workbook = xlsx.utils.book_new();
      const dataSheet = xlsx.utils.aoa_to_sheet(templateResult.template);
      // Set column widths heuristically
      const headers = templateResult.template[0] || [];
      dataSheet['!cols'] = headers.map(h => ({ wch: Math.max(String(h).length, 18) }));
      xlsx.utils.book_append_sheet(workbook, dataSheet, 'Template');

      // Instructions sheet: one line per instruction
      const instructionLines = ['Instructions', '', ...templateResult.instructions.split('\n')];
      const instructionAoA = instructionLines.map(line => [line]);
      const instructionsSheet = xlsx.utils.aoa_to_sheet(instructionAoA);
      xlsx.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

      const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${entityId}_template.xlsx"`);
      res.send(buffer);
    }
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate template',
      error: error.message
    });
  }
};

// Import data from uploaded file
const importData = async (req, res) => {
  try {
    const { entityId } = req.params;
    const userId = req.user.userId;
    
    if (!entityId) {
      return res.status(400).json({
        success: false,
        message: 'Entity ID is required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Parse the uploaded file
    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    let data = [];
    
    if (fileExtension === '.csv') {
      data = await parseCSVFile(filePath);
    } else {
      data = await parseExcelFile(filePath);
    }

    // Debug: Log the parsed data structure
    console.log('📊 Parsed data structure:', {
      totalRows: data.length,
      firstRow: data[0],
      headers: data[0] ? Object.keys(data[0]) : []
    });

    // Clean up the uploaded file
    fs.unlinkSync(filePath);

    // Import the data
    const importResults = await ImportExport.importData(entityId, data, userId);
    
    // Log the import operation
    await ImportExport.logImport(entityId, importResults, userId);

    res.status(200).json({
      success: true,
      message: 'Import completed',
      data: {
        total: importResults.total,
        success: importResults.success,
        errors: importResults.errors,
        skipped: importResults.skipped
      }
    });
  } catch (error) {
    console.error('Error importing data:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to import data',
      error: error.message
    });
  }
};

// Get import history
const getImportHistory = async (req, res) => {
  try {
    const history = await ImportExport.getImportHistory();
    
    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error getting import history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get import history',
      error: error.message
    });
  }
};

// Helper function to generate CSV data
const generateCSV = (data, fields) => {
  const headers = fields.map(field => field.name);
  const csvRows = [headers];
  
  data.forEach(row => {
    const csvRow = headers.map(header => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma or quote
      if (value === null || value === undefined) {
        return '';
      }
      const stringValue = value.toString();
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(csvRow);
  });
  
  return csvRows.map(row => row.join(',')).join('\n');
};

// Helper function to generate Excel workbook
const generateExcel = (data, fields) => {
  const headers = fields.map(field => field.name);
  const worksheet = xlsx.utils.aoa_to_sheet([headers, ...data.map(row => 
    headers.map(header => row[header] || '')
  )]);
  
  // Set column widths
  const colWidths = headers.map(header => ({ wch: Math.max(header.length, 15) }));
  worksheet['!cols'] = colWidths;
  
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Data');
  
  return workbook;
};

// Helper function to parse CSV file
const parseCSVFile = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv({
        // More flexible CSV parsing options
        separator: ',',
        skipEmptyLines: true,
        trim: true,
        // Handle Excel-generated CSV quirks
        strict: false
      }))
      .on('data', (data) => {
        // Clean up the data - remove any BOM characters and trim whitespace
        const cleanedData = {};
        Object.keys(data).forEach(key => {
          const value = data[key];
          // Clean the key name - remove quotes and trim
          const cleanKey = key.replace(/^['"]|['"]$/g, '').trim();
          if (value && typeof value === 'string') {
            // Remove BOM and trim
            cleanedData[cleanKey] = value.replace(/^\uFEFF/, '').trim();
          } else {
            cleanedData[cleanKey] = value;
          }
        });
        results.push(cleanedData);
      })
      .on('end', () => {
        // Debug: Log the parsed results
        console.log('📄 CSV parsing results:', {
          totalRows: results.length,
          firstRow: results[0],
          availableFields: results[0] ? Object.keys(results[0]) : []
        });
        
        // Additional debug: Check for any remaining quoted keys
        if (results[0]) {
          const quotedKeys = Object.keys(results[0]).filter(key => key.includes("'") || key.includes('"'));
          if (quotedKeys.length > 0) {
            console.log('⚠️ Found quoted keys in parsed data:', quotedKeys);
          }
        }
        
        resolve(results);
      })
      .on('error', (error) => {
        console.error('❌ CSV parsing error:', error);
        reject(error);
      });
  });
};

// Helper function to parse Excel file
const parseExcelFile = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Use sheet_to_json with dateNF option to get proper date formatting
  const data = xlsx.utils.sheet_to_json(worksheet, { 
    header: 1,
    dateNF: 'dd-mm-yyyy' // Format dates as DD-MM-YYYY
  });
  
  if (data.length < 2) {
    throw new Error('File must contain at least a header row and one data row');
  }
  
  const headers = data[0];
  const rows = data.slice(1);
  
  const processedRows = rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      // Clean the header name - remove quotes and trim
      const cleanHeader = header ? header.toString().replace(/^['"]|['"]$/g, '').trim() : '';
      let value = row[index] || '';
      
      // Handle Excel date conversion
      if (cleanHeader.includes('DATE') && value) {
        // If it's a number (Excel date), convert it
        if (typeof value === 'number') {
          try {
            // Excel dates are days since 1900-01-01
            const excelDate = new Date((value - 25569) * 86400 * 1000);
            const day = String(excelDate.getDate()).padStart(2, '0');
            const month = String(excelDate.getMonth() + 1).padStart(2, '0');
            const year = excelDate.getFullYear();
            value = `${day}-${month}-${year}`;
          } catch (error) {
            console.log(`⚠️ Failed to convert Excel date for ${cleanHeader}:`, value);
          }
        }
        // If it's already a string, ensure it's in the right format
        else if (typeof value === 'string') {
          // Check if it's in a different format and convert
          const dateMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
          if (dateMatch) {
            const [, month, day, year] = dateMatch;
            value = `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
          }
        }
      }
      
      obj[cleanHeader] = value;
    });
    return obj;
  });
  
  // Debug: Check for any remaining quoted keys
  if (processedRows[0]) {
    const quotedKeys = Object.keys(processedRows[0]).filter(key => key.includes("'") || key.includes('"'));
    if (quotedKeys.length > 0) {
      console.log('⚠️ Found quoted keys in Excel parsed data:', quotedKeys);
    }
    
    // Debug: Log date fields
    const dateFields = Object.keys(processedRows[0]).filter(key => key.includes('DATE'));
    if (dateFields.length > 0) {
      console.log('📅 Date fields in Excel data:', dateFields.map(field => ({
        field,
        value: processedRows[0][field],
        type: typeof processedRows[0][field]
      })));
    }
  }
  
  return processedRows;
};

module.exports = {
  getAvailableEntities,
  exportData,
  generateTemplate,
  importData,
  getImportHistory,
  upload
}; 