import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoogleSheetsService {
  private readonly API_KEY = environment.googleApiKey;
  private readonly BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

  constructor() {}

  async exportToGoogleSheets(data: any[][], title: string): Promise<string> {
    try {
      // Create a new spreadsheet
      const createResponse = await fetch(`${this.BASE_URL}?key=${this.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            title: `Timesheet_${title}`,
          },
        }),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create spreadsheet');
      }

      const spreadsheet = await createResponse.json();
      const spreadsheetId = spreadsheet.spreadsheetId;

      // Update the values
      const updateResponse = await fetch(
        `${this.BASE_URL}/${spreadsheetId}/values/Sheet1!A1?valueInputOption=RAW&key=${this.API_KEY}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: data,
          }),
        }
      );

      if (!updateResponse.ok) {
        throw new Error('Failed to update spreadsheet values');
      }

      return spreadsheet.spreadsheetUrl;
    } catch (error) {
      console.error('Error exporting to Google Sheets:', error);
      throw error;
    }
  }
} 