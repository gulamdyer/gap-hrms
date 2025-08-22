const express = require('express');
const router = express.Router();
const CalendarController = require('../controllers/calendarController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Calendar Management Routes
router.post('/', CalendarController.createCalendar);
router.get('/', CalendarController.getAllCalendars);
router.get('/dropdown', CalendarController.getCalendarDropdown);
router.get('/:id', CalendarController.getCalendarById);
router.put('/:id', CalendarController.updateCalendar);
router.delete('/:id', CalendarController.deleteCalendar);
router.get('/:calendarId/weekly-holidays', CalendarController.getWeeklyHolidays);

// Holiday Management Routes
router.post('/holidays', CalendarController.createHoliday);
router.get('/holidays', CalendarController.getAllHolidays);
router.get('/holidays/types', CalendarController.getHolidayTypes);
router.get('/holidays/:id', CalendarController.getHolidayById);
router.put('/holidays/:id', CalendarController.updateHoliday);
router.delete('/holidays/:id', CalendarController.deleteHoliday);

// Enhanced holiday management routes
router.get('/holidays/patterns', CalendarController.getHolidayPatterns);
router.get('/holidays/day-options', CalendarController.getDayOfWeekOptions);
router.get('/holidays/week-options', CalendarController.getWeekOfMonthOptions);
router.get('/holidays/templates', CalendarController.getNamedHolidayTemplates);
router.post('/holidays/template', CalendarController.createHolidayFromTemplate);
router.post('/holidays/recurring', CalendarController.createRecurringHoliday);

// Calendar-specific holiday routes
router.get('/:calendarId/holidays/:year', CalendarController.getHolidaysByCalendar);

module.exports = router; 