import { Request, Response } from 'express';
import axios, { AxiosResponse } from 'axios';
import crypto from 'crypto';

const ENCRYPTION_KEY = '5c88acf79eecbc7841@ar$tyudchtd^h';

interface TaskEntry {
  task_name: string;
  hs: string;
  cp: string;
  date_of_status: string;
  // Add other properties as needed
}

interface GroupedData {
  totalHours: number;
  totalCP: number;
  entries: TaskEntry[];
}

interface GroupedByTask {
  [key: string]: GroupedData;
}

interface GroupedByWeek {
  [key: string]: GroupedData;
}

export class WorkflowController {

  constructor() {
  }

  private decrypt(text: string): string {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift() || '', 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  async workflowLogin(req: Request, res: Response) {
    try {
      const authData = req.body;

      const response = await axios.post('https://workflow.appedo.com:4040/workflow/login', authData);

      let responseData = response.data;

      if (responseData.success) {
        res.json({ success: true, status: 200, message: 'Login successful', token: responseData.result });
      } else {
        res.json({ success: false, status: 401, message: responseData.message });
      }
    } catch (error: any) {
      console.error('Error in workflowLogin:', error);
      res.status(500).json({ success: false, status: 500, message: 'Login failed' });
    }
  }

  async getWorkflowReports(req: Request, res: Response) {
    try {
      const userId = req.body.params.userId;
      const token = req.body.params.token;
      const period = req.body.params.period;

      const [year, month] = period.split('-');

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);

      const startDateString = startDate.toISOString().replace('Z', '+05:30');
      const endDateString = endDate.toISOString().replace('Z', '+05:30');

      let reportParam = {
        project_code: 'SRKay',
        suggestion_id: null,
        start_date: startDateString,
        end_date: endDateString,
        assigned_to: userId,
        suggestion_name: null,
        offset: 0,
        limit: 2000
      }

      console.log("reportParam", reportParam);

      const response: any = await axios.post('https://workflow.appedo.com:4040/workflow/getTaskActualEfforts', reportParam, {
        headers: {
          'Authorization': token
        }
      });

      let resultData = response?.data?.result;
      let decryptedData = await JSON.parse(this.decrypt(resultData));

      // Group by task_name
      const groupedByTask = decryptedData.reduce((acc: any, item: any) => {
        if (!acc[item.task_name]) {
          acc[item.task_name] = {
            totalHours: 0,
            totalCP: 0,
            entries: []
          };
        }
        acc[item.task_name].totalHours += parseFloat(item.hs);
        acc[item.task_name].totalCP += parseFloat(item.cp);
        acc[item.task_name].entries.push(item);
        return acc;
      }, {});

      // Group by weeks
      const getWeekNumber = (date: string) => {
        const d = new Date(date);
        const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
        const pastDaysOfYear = (d.getTime() - firstDay.getTime()) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDay.getDay() + 1) / 7);
      };

      const groupedByWeek = decryptedData.reduce((acc: any, item: any) => {
        const weekNumber = getWeekNumber(item.date_of_status);
        const weekKey = `Week ${weekNumber}`;
        
        if (!acc[weekKey]) {
          acc[weekKey] = {
            totalHours: 0,
            totalCP: 0,
            entries: []
          };
        }

        // Find if an entry with same suggestion_name, task_name, and remarks exists
        const existingEntry = acc[weekKey].entries.find((entry: any) => 
          entry.suggestion_name.trim() === item.suggestion_name.trim() && 
          entry.task_name.trim() === item.task_name.trim() && 
          entry.remarks.trim() === item.remarks.trim()
        );

        if (existingEntry) {
          // Update existing entry's hs value
          existingEntry.hs = (parseFloat(existingEntry.hs) + parseFloat(item.hs)).toString();
          existingEntry.cp = (parseFloat(existingEntry.cp) + parseFloat(item.cp)).toString();
          
          // Update date range
          const currentCreatedOn = new Date(item.created_on);
          const existingStartDate = new Date(existingEntry['date_started']);
          const existingEndDate = new Date(existingEntry['date_completed']);
          
          existingEntry['date_started'] = currentCreatedOn < existingStartDate ? item.created_on : existingEntry['date_started'];
          existingEntry['date_completed'] = currentCreatedOn > existingEndDate ? item.created_on : existingEntry['date_completed'];
        } else {
          // Add new entry with initial date range
          const newEntry = {
            ...item,
            'date_started': item.created_on,
            'date_completed': item.created_on
          };
          acc[weekKey].entries.push(newEntry);
        }

        acc[weekKey].totalHours += parseFloat(item.hs);
        acc[weekKey].totalCP += parseFloat(item.cp);
        return acc;
      }, {});

      // Sort entries within each week
      Object.keys(groupedByWeek).forEach(weekKey => {
        groupedByWeek[weekKey].entries.sort((a: any, b: any) => {
          // First sort by suggestion_name
          const suggestionCompare = a.suggestion_name.trim().localeCompare(b.suggestion_name.trim());
          if (suggestionCompare !== 0) return suggestionCompare;

          // Then by task_name
          const taskCompare = a.task_name.trim().localeCompare(b.task_name.trim());
          if (taskCompare !== 0) return taskCompare;

          // Finally by remarks
          return a.remarks.trim().localeCompare(b.remarks.trim());
        });
      });

      if (response.data.success) {
        res.json({ 
          success: true, 
          status: 200, 
          message: 'Report fetched successfully', 
          data: {
            original: decryptedData,
            groupedByTask,
            groupedByWeek
          }
        });
      } else {
        res.json({ success: false, status: 401, message: response.data.message });
      }

    } catch (error: any) {
      console.error('Error in getWorkflowReports:', error);
      res.status(500).json({ success: false, status: 500, message: 'Report fetch failed' });
    }
  }

} 