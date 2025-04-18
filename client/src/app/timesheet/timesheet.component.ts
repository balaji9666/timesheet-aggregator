import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimesheetService } from '../core/services/timesheet.service';
import { WorkflowResponse, GroupedTask } from './models/timesheet.interface';
import { Observable, map, take } from 'rxjs';
import { LoadingComponent } from '../shared/components/loading/loading.component';
import { HeaderComponent } from '../shared/components/header/header.component';
import * as XLSX from 'xlsx';
import { GoogleSheetsService } from '../core/services/google-sheets.service';

interface MonthYear {
  value: string;
  label: string;
}

@Component({
  selector: 'app-timesheet',
  standalone: true,
  imports: [CommonModule, LoadingComponent, HeaderComponent],
  templateUrl: './timesheet.component.html',
  styleUrl: './timesheet.component.css'
})
export class TimesheetComponent implements OnInit {
  timesheetData$: Observable<WorkflowResponse> | undefined;
  isLoading = signal(true);
  viewMode = signal<'original' | 'byTask' | 'byWeek'>('original');
  selectedPeriod = signal<string>('');
  availablePeriods = signal<MonthYear[]>([]);

  constructor(
    private timesheetService: TimesheetService,
    private googleSheetsService: GoogleSheetsService
  ) { }

  ngOnInit() {
    this.initializePeriods();
    this.getWorkflowEntries();
  }

  private initializePeriods() {
    const currentDate = new Date();
    const periods: MonthYear[] = [];

    for (let i = 0; i < 3; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      periods.push({ value, label });
    }

    this.availablePeriods.set(periods);
    this.selectedPeriod.set(periods[0].value);
  }

  onPeriodChange(period: string) {
    this.selectedPeriod.set(period);
    this.getWorkflowEntries();
  }

  async getWorkflowEntries() {
    this.isLoading.set(true);
    this.timesheetData$ = this.timesheetService.getWorkflowEntries(this.selectedPeriod()).pipe(
      map(response => {
        if (response && 'data' in response) {
          return response.data as WorkflowResponse;
        }
        return {
          original: [],
          groupedByTask: {},
          groupedByWeek: {}
        };
      })
    );

    this.timesheetData$.subscribe({
      next: () => this.isLoading.set(false),
      error: () => this.isLoading.set(false)
    });
  }

  setViewMode(mode: 'original' | 'byTask' | 'byWeek') {
    this.viewMode.set(mode);
  }

  getTaskEntries(data: WorkflowResponse): [string, GroupedTask][] {
    return Object.entries(data.groupedByTask);
  }

  getWeekEntries(data: WorkflowResponse): [string, GroupedTask][] {
    return Object.entries(data.groupedByWeek);
  }

  getCurrentMonthYear() {
    const currentDate = new Date();
    return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  exportToExcel(): void {
    if (!this.timesheetData$) {
      return;
    }
    // Get the current view mode data
    this.timesheetData$.pipe(take(1)).subscribe(data => {
      let exportData: any[] = [];

      switch (this.viewMode()) {
        case 'byTask':
          // Format data for task-grouped view
          const taskEntries = this.getTaskEntries(data);
          taskEntries.forEach(([taskName, taskData]) => {
            // Add a header row for each task group
            exportData.push([`Task: ${taskName}`, `Total Hours: ${taskData.totalHours}`]);
            exportData.push([]); // Empty row for spacing
            // Add the entries
            exportData.push(['MODULE', 'FEATURE', 'DEV/TEST ACTIVITIES', 'ACTUAL HOURS', 'DATE STARTED', 'DATE COMPLETED']);
            taskData.entries.forEach(entry => {
              exportData.push([
                entry.suggestion_name,
                entry.task_name,
                entry.remarks,
                entry.hs,
                new Date(entry.date_of_status).toLocaleDateString(),
                new Date(entry.date_of_status).toLocaleDateString()
              ]);
            });
            exportData.push([]); // Empty row for spacing
          });
          break;

        case 'byWeek':
          // Format data for week-grouped view
          const weekEntries = this.getWeekEntries(data);
          weekEntries.forEach(([weekName, weekData]) => {
            exportData.push([`Week: ${weekName}`, `Total Hours: ${weekData.totalHours}`]);
            exportData.push([]);
            exportData.push(['MODULE', 'FEATURE', 'DEV/TEST ACTIVITIES', 'ACTUAL HOURS', 'DATE STARTED', 'DATE COMPLETED']);
            weekData.entries.forEach(entry => {
              exportData.push([
                entry.suggestion_name,
                entry.task_name,
                entry.remarks,
                entry.hs,
                new Date(entry.date_of_status).toLocaleDateString(),
                new Date(entry.date_of_status).toLocaleDateString()
              ]);
            });
            exportData.push([]);
          });
          break;

        default: // original view
          exportData.push(['MODULE', 'FEATURE', 'DEV/TEST ACTIVITIES', 'ACTUAL HOURS', 'DATE STARTED', 'DATE COMPLETED']);
          data.original.forEach(entry => {
            exportData.push([
              entry.suggestion_name,
              entry.task_name,
              entry.remarks,
              entry.hs,
              new Date(entry.date_of_status).toLocaleDateString(),
              new Date(entry.date_of_status).toLocaleDateString()
            ]);
          });
      }

      // Create workbook and worksheet
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(exportData);

      // Set column widths
      const colWidths = [
        { wch: 20 }, // MODULE
        { wch: 20 }, // FEATURE
        { wch: 30 }, // DEV/TEST ACTIVITIES
        { wch: 15 }, // ACTUAL HOURS
        { wch: 15 }, // DATE STARTED
        { wch: 15 }, // DATE COMPLETED
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Timesheet');

      // Generate Excel file
      const period = this.selectedPeriod();
      XLSX.writeFile(wb, `Timesheet_${period}.xlsx`);
    });
  }

  exportToGoogleSheets(): void {
    if (!this.timesheetData$) {
      return;
    }

    this.timesheetData$.pipe(take(1)).subscribe(async data => {
      let exportData: any[][] = [];
      
      // Use the same data formatting logic as in exportToExcel
      switch (this.viewMode()) {
        case 'byTask':
          // ... existing task formatting logic ...
          break;
        case 'byWeek':
          // ... existing week formatting logic ...
          break;
        default:
          // ... existing original view formatting logic ...
      }

      try {
        const sheetUrl = await this.googleSheetsService.exportToGoogleSheets(
          exportData,
          this.selectedPeriod()
        );
        
        // Open the created sheet in a new tab
        if (sheetUrl) {
          window.open(sheetUrl, '_blank');
        }
      } catch (error) {
        console.error('Failed to export to Google Sheets:', error);
        // Handle error appropriately
      }
    });
  }
}
