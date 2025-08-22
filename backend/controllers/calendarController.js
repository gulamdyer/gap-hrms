const Calendar = require('../models/Calendar');
const CalendarHoliday = require('../models/CalendarHoliday');
const { validateCalendar, validateCalendarHoliday } = require('../middleware/validation');

class CalendarController {
  // Calendar Management Methods
  static async createCalendar(req, res) {
    try {
      const { error } = validateCalendar(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const calendarData = {
        ...req.body,
        createdBy: req.user.username
      };

      const calendarId = await Calendar.create(calendarData);
      const calendar = await Calendar.getById(calendarId);

      res.status(201).json({
        message: 'Calendar created successfully',
        data: calendar
      });
    } catch (error) {
      console.error('Error creating calendar:', error);
      if (error.message.includes('unique constraint')) {
        res.status(400).json({ error: 'Calendar code already exists' });
      } else if (error.message.includes('table or view does not exist')) {
        console.error('Calendar table missing. Please run database setup.');
        res.status(500).json({ error: 'Database schema not initialized. Please contact administrator.' });
      } else {
        res.status(500).json({ error: `Failed to create calendar: ${error.message}` });
      }
    }
  }

  static async getAllCalendars(req, res) {
    try {
      const result = await Calendar.getAll(req.query);
      res.json(result);
    } catch (error) {
      console.error('Error fetching calendars:', error);
      res.status(500).json({ error: 'Failed to fetch calendars' });
    }
  }

  static async getCalendarById(req, res) {
    try {
      const calendar = await Calendar.getById(req.params.id);
      if (!calendar) {
        return res.status(404).json({ error: 'Calendar not found' });
      }
      res.json({ data: calendar });
    } catch (error) {
      console.error('Error fetching calendar:', error);
      res.status(500).json({ error: 'Failed to fetch calendar' });
    }
  }

  static async updateCalendar(req, res) {
    try {
      const { error } = validateCalendar(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const calendarData = {
        ...req.body,
        updatedBy: req.user.username
      };

      await Calendar.update(req.params.id, calendarData);
      const calendar = await Calendar.getById(req.params.id);

      res.json({
        message: 'Calendar updated successfully',
        data: calendar
      });
    } catch (error) {
      console.error('Error updating calendar:', error);
      if (error.message.includes('unique constraint')) {
        res.status(400).json({ error: 'Calendar code already exists' });
      } else {
        res.status(500).json({ error: 'Failed to update calendar' });
      }
    }
  }

  static async deleteCalendar(req, res) {
    try {
      await Calendar.delete(req.params.id);
      res.json({ message: 'Calendar deleted successfully' });
    } catch (error) {
      console.error('Error deleting calendar:', error);
      res.status(500).json({ error: 'Failed to delete calendar' });
    }
  }

  static async getCalendarDropdown(req, res) {
    try {
      const calendars = await Calendar.getDropdown();
      res.json({ data: calendars });
    } catch (error) {
      console.error('Error fetching calendar dropdown:', error);
      res.status(500).json({ error: 'Failed to fetch calendar dropdown' });
    }
  }

  static async getWeeklyHolidays(req, res) {
    try {
      const { calendarId } = req.params;
      const weeklyHolidays = await Calendar.getWeeklyHolidays(calendarId);
      res.json({ data: weeklyHolidays });
    } catch (error) {
      console.error('Error fetching weekly holidays:', error);
      res.status(500).json({ error: 'Failed to fetch weekly holidays' });
    }
  }

  // Holiday Management Methods
  static async createHoliday(req, res) {
    try {
      const { error } = validateCalendarHoliday(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const holidayData = {
        ...req.body,
        createdBy: req.user.username
      };

      const holidayId = await CalendarHoliday.create(holidayData);
      const holiday = await CalendarHoliday.getById(holidayId);

      res.status(201).json({
        message: 'Holiday created successfully',
        data: holiday
      });
    } catch (error) {
      console.error('Error creating holiday:', error);
      res.status(500).json({ error: 'Failed to create holiday' });
    }
  }

  static async getAllHolidays(req, res) {
    try {
      const holidays = await CalendarHoliday.getAll(req.query);
      res.json({ data: holidays });
    } catch (error) {
      console.error('Error fetching holidays:', error);
      res.status(500).json({ error: 'Failed to fetch holidays' });
    }
  }

  static async getHolidayById(req, res) {
    try {
      const holiday = await CalendarHoliday.getById(req.params.id);
      res.json({ data: holiday });
    } catch (error) {
      console.error('Error fetching holiday:', error);
      if (error.message === 'Holiday not found') {
        res.status(404).json({ error: 'Holiday not found' });
      } else {
        res.status(500).json({ error: 'Failed to fetch holiday' });
      }
    }
  }

  static async updateHoliday(req, res) {
    try {
      const { error } = validateCalendarHoliday(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const holidayData = {
        ...req.body,
        updatedBy: req.user.username
      };

      await CalendarHoliday.update(req.params.id, holidayData);
      const holiday = await CalendarHoliday.getById(req.params.id);

      res.json({
        message: 'Holiday updated successfully',
        data: holiday
      });
    } catch (error) {
      console.error('Error updating holiday:', error);
      if (error.message === 'Holiday not found') {
        res.status(404).json({ error: 'Holiday not found' });
      } else {
        res.status(500).json({ error: 'Failed to update holiday' });
      }
    }
  }

  static async deleteHoliday(req, res) {
    try {
      await CalendarHoliday.delete(req.params.id);
      res.json({ message: 'Holiday deleted successfully' });
    } catch (error) {
      console.error('Error deleting holiday:', error);
      res.status(500).json({ error: 'Failed to delete holiday' });
    }
  }

  static async getHolidaysByCalendar(req, res) {
    try {
      const { calendarId, year } = req.params;
      const holidays = await CalendarHoliday.getHolidaysByCalendar(parseInt(calendarId), parseInt(year));
      res.json({ data: holidays });
    } catch (error) {
      console.error('Error fetching holidays by calendar:', error);
      res.status(500).json({ error: 'Failed to fetch holidays' });
    }
  }

  static async getHolidayTypes(req, res) {
    try {
      const holidayTypes = await CalendarHoliday.getHolidayTypes();
      res.json({ data: holidayTypes });
    } catch (error) {
      console.error('Error fetching holiday types:', error);
      res.status(500).json({ error: 'Failed to fetch holiday types' });
    }
  }

  // New methods for enhanced holiday management
  static async getHolidayPatterns(req, res) {
    try {
      const patterns = await CalendarHoliday.getHolidayPatterns();
      res.json({ data: patterns });
    } catch (error) {
      console.error('Error fetching holiday patterns:', error);
      res.status(500).json({ error: 'Failed to fetch holiday patterns' });
    }
  }

  static async getDayOfWeekOptions(req, res) {
    try {
      const dayOptions = await CalendarHoliday.getDayOfWeekOptions();
      res.json({ data: dayOptions });
    } catch (error) {
      console.error('Error fetching day of week options:', error);
      res.status(500).json({ error: 'Failed to fetch day of week options' });
    }
  }

  static async getWeekOfMonthOptions(req, res) {
    try {
      const weekOptions = await CalendarHoliday.getWeekOfMonthOptions();
      res.json({ data: weekOptions });
    } catch (error) {
      console.error('Error fetching week of month options:', error);
      res.status(500).json({ error: 'Failed to fetch week of month options' });
    }
  }

  static async getNamedHolidayTemplates(req, res) {
    try {
      const templates = await CalendarHoliday.getNamedHolidayTemplates();
      res.json({ data: templates });
    } catch (error) {
      console.error('Error fetching named holiday templates:', error);
      res.status(500).json({ error: 'Failed to fetch named holiday templates' });
    }
  }

  static async createHolidayFromTemplate(req, res) {
    try {
      const { calendarId, templateCode, customName } = req.body;
      
      if (!calendarId || !templateCode) {
        return res.status(400).json({ error: 'Calendar ID and template code are required' });
      }

      const templates = await CalendarHoliday.getNamedHolidayTemplates();
      const template = templates.find(t => t.templateCode === templateCode);
      
      if (!template) {
        return res.status(400).json({ error: 'Invalid template code' });
      }

      const holidayData = {
        calendarId: parseInt(calendarId),
        holidayName: customName || template.templateName,
        holidayDate: null,
        holidayType: template.holidayType,
        holidayPattern: template.patternType,
        dayOfWeek: template.patternConfig.dayOfWeek,
        monthOfYear: template.patternConfig.monthOfYear,
        dayOfMonth: template.patternConfig.dayOfMonth,
        weekOfMonth: template.patternConfig.weekOfMonth,
        isRecurring: template.patternType !== 'SPECIFIC_DATE' ? 1 : 0,
        isNamedHoliday: 1,
        description: template.description,
        createdBy: req.user.username
      };

      const holidayId = await CalendarHoliday.create(holidayData);
      const holiday = await CalendarHoliday.getById(holidayId);

      res.status(201).json({
        message: 'Holiday created from template successfully',
        data: holiday
      });
    } catch (error) {
      console.error('Error creating holiday from template:', error);
      res.status(500).json({ error: 'Failed to create holiday from template' });
    }
  }

  static async createRecurringHoliday(req, res) {
    try {
      const { 
        calendarId, 
        holidayName, 
        holidayType, 
        holidayPattern, 
        dayOfWeek, 
        monthOfYear, 
        dayOfMonth, 
        weekOfMonth, 
        description 
      } = req.body;

      if (!calendarId || !holidayName || !holidayPattern) {
        return res.status(400).json({ error: 'Calendar ID, holiday name, and pattern are required' });
      }

      const holidayData = {
        calendarId: parseInt(calendarId),
        holidayName,
        holidayDate: null,
        holidayType: holidayType || 'PUBLIC_HOLIDAY',
        holidayPattern,
        dayOfWeek: dayOfWeek || null,
        monthOfYear: monthOfYear || null,
        dayOfMonth: dayOfMonth || null,
        weekOfMonth: weekOfMonth || null,
        isRecurring: 1,
        isNamedHoliday: 0,
        description,
        createdBy: req.user.username
      };

      const holidayId = await CalendarHoliday.create(holidayData);
      const holiday = await CalendarHoliday.getById(holidayId);

      res.status(201).json({
        message: 'Recurring holiday created successfully',
        data: holiday
      });
    } catch (error) {
      console.error('Error creating recurring holiday:', error);
      res.status(500).json({ error: 'Failed to create recurring holiday' });
    }
  }
}

module.exports = CalendarController; 