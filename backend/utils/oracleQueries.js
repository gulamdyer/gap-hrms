const { executeQuery } = require('../config/database');

/**
 * Oracle-specific query utilities
 * Oracle doesn't support LIMIT, it uses ROWNUM or OFFSET/FETCH
 */

// Get sample data with Oracle-compatible pagination
const getSampleData = {
  // Get shifts with pagination (Oracle-compatible)
  shifts: async (limit = 5) => {
    const sql = `
      SELECT * FROM HRMS_SHIFTS 
      ORDER BY SHIFT_ID 
      FETCH FIRST :limit ROWS ONLY
    `;
    
    try {
      const result = await executeQuery(sql, { limit });
      return result.rows || [];
    } catch (error) {
      console.error('❌ Error getting shifts sample data:', error.message);
      throw error;
    }
  },

  // Get calendars with pagination (Oracle-compatible)
  calendars: async (limit = 5) => {
    const sql = `
      SELECT * FROM HRMS_CALENDAR 
      ORDER BY CALENDAR_ID 
      FETCH FIRST :limit ROWS ONLY
    `;
    
    try {
      const result = await executeQuery(sql, { limit });
      return result.rows || [];
    } catch (error) {
      console.error('❌ Error getting calendars sample data:', error.message);
      throw error;
    }
  },

  // Get employees with shifts and calendars (working queries)
  employeesWithShifts: async () => {
    const sql = `
      SELECT COUNT(*) AS COUNT_WITH_SHIFTS
      FROM HRMS_EMPLOYEES e 
      JOIN HRMS_SHIFTS s ON e.SHIFT_ID = s.SHIFT_ID 
      WHERE e.STATUS = 'ACTIVE'
    `;
    
    try {
      const result = await executeQuery(sql);
      return result.rows[0]?.COUNT_WITH_SHIFTS || 0;
    } catch (error) {
      console.error('❌ Error counting employees with shifts:', error.message);
      throw error;
    }
  },

  employeesWithCalendars: async () => {
    const sql = `
      SELECT COUNT(*) AS COUNT_WITH_CALENDARS
      FROM HRMS_EMPLOYEES e 
      JOIN HRMS_CALENDAR c ON e.CALENDAR_ID = c.CALENDAR_ID 
      WHERE e.STATUS = 'ACTIVE'
    `;
    
    try {
      const result = await executeQuery(sql);
      return result.rows[0]?.COUNT_WITH_CALENDARS || 0;
    } catch (error) {
      console.error('❌ Error counting employees with calendars:', error.message);
      throw error;
    }
  },

  activeEmployees: async () => {
    const sql = `
      SELECT COUNT(*) AS ACTIVE_COUNT
      FROM HRMS_EMPLOYEES 
      WHERE STATUS = 'ACTIVE'
    `;
    
    try {
      const result = await executeQuery(sql);
      return result.rows[0]?.ACTIVE_COUNT || 0;
    } catch (error) {
      console.error('❌ Error counting active employees:', error.message);
      throw error;
    }
  }
};

// Oracle-compatible pagination helper
const paginateQuery = (baseQuery, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  return `${baseQuery} OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
};

// Oracle-compatible LIMIT replacement
const limitQuery = (baseQuery, limit = 5) => {
  return `${baseQuery} FETCH FIRST ${limit} ROWS ONLY`;
};

module.exports = {
  getSampleData,
  paginateQuery,
  limitQuery
};
