import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import * as CryptoJS from 'crypto-js';

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface TokenPayload {
  sub: string;
  email: string;
  name: string;
  role?: string;
  exp: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}`;
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();
  public isAuthenticated = signal(false);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuthState();
  }

  private initializeAuthState(): void {
    const token = sessionStorage.getItem("token");
    const user = sessionStorage.getItem("loginUserDetails");
    
    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        this.userSubject.next(parsedUser);
        this.isAuthenticated.set(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.clearSessionData();
      }
    }
  }

  login(usr: any): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/workflow/auth/login`, usr)
      .pipe(
        tap((response: any) => {
          try {
            let decryptedValue = JSON.parse(this.decrypt(response.token));
            this.storeSessionData(decryptedValue.token, decryptedValue.user);
            this.userSubject.next(decryptedValue.user);
            this.isAuthenticated.set(true);
          } catch (error) {
            console.error('Error during login:', error);
            throw new Error('Failed to process login response');
          }
        })
      );
  }

  logout(): void {
    this.clearSessionData();
    this.userSubject.next(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  private clearSessionData(): void {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("loginUserDetails");
  }

  public randomString(length: number) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  encrypt(val: any){
    var key = CryptoJS.enc.Utf8.parse(environment.keyEncryptDecrypt);
    var iv = CryptoJS.enc.Hex.parse(this.randomString(32));
    var encrypted = CryptoJS.AES.encrypt(val, key, { 
      iv: iv, 
      mode: CryptoJS.mode.CBC
    });   
    var output = encrypted.ciphertext.toString();
    return iv+":"+output;
  }

  decrypt(val: any){
    try {
      var key = CryptoJS.enc.Utf8.parse(environment.keyEncryptDecrypt);
      let keyVal = val.split(":");
      var iv = CryptoJS.enc.Hex.parse(keyVal[0]);
      const cipherText = CryptoJS.enc.Hex.parse(keyVal[1]);
      const options = { mode: CryptoJS.mode.CBC, iv: iv };
      const decrypted = CryptoJS.AES.decrypt(
        CryptoJS.lib.CipherParams.create({
          ciphertext: cipherText
        }),
        key,
        options
      );
      const retVal = decrypted.toString(CryptoJS.enc.Utf8);
      return retVal;
    } catch (err) {
      console.error(err);
      return "";
    } 
  }

  storeSessionData(token: any, user: any){
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("loginUserDetails", JSON.stringify(user));
  }
} 