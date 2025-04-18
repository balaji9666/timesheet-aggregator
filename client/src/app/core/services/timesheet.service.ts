import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WorkflowEntry } from '../../timesheet/models/timesheet.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TimesheetService {

  private readonly apiUrl = `${environment.apiUrl}`;

  private user:any = JSON.parse(sessionStorage.getItem("loginUserDetails") || '{}');
  private token:any = sessionStorage.getItem("token");

  constructor(private http: HttpClient) {}

  getWorkflowEntries(period?: string): Observable<WorkflowEntry[]> {
    const [year, month] = period ? period.split('-') : [];
    const params: any = { 
      userId: this.user.user_id, 
      token: this.token,
      period: period
    };
    return this.http.post<WorkflowEntry[]>(`${this.apiUrl}/workflow/getWorkflowReports`, { params });
  }
} 