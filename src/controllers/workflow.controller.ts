import { Request, Response } from 'express';
import axios from 'axios';

const crypto = require('crypto');
const ENCRYPTION_KEY = '5c88acf79eecbc7841@ar$tyudchtd^h'; 

export class WorkflowController {

  constructor() {
  }

  decrypt(text:any) {
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(":"), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
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
        acc[weekKey].totalHours += parseFloat(item.hs);
        acc[weekKey].totalCP += parseFloat(item.cp);
        acc[weekKey].entries.push(item);
        return acc;
      }, {});

      // Sort entries within each week by task_name and date_of_status
      Object.keys(groupedByWeek).forEach(weekKey => {
        groupedByWeek[weekKey].entries.sort((a: any, b: any) => {
          // First sort by task_name
          const taskNameComparison = a.task_name.localeCompare(b.task_name);
          if (taskNameComparison !== 0) {
            return taskNameComparison;
          }
          // If task names are equal, sort by date_of_status
          return new Date(a.date_of_status).getTime() - new Date(b.date_of_status).getTime();
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