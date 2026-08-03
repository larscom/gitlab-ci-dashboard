import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'

export type UserRole = 'admin' | 'editor'
export interface AppUser { id:number; username:string; display_name:string; email:string; role:UserRole; enabled:boolean; created_at:string }
export interface UserInput { username:string; password:string; display_name:string; email:string; role:UserRole; enabled:boolean }

@Injectable({ providedIn: 'root' })
export class UserService {
  private http=inject(HttpClient)
  list(){return this.http.get<AppUser[]>('api/users')}
  create(input:UserInput){return this.http.post('api/users',input)}
  update(id:number,input:UserInput){return this.http.put(`api/users/${id}`,input)}
  remove(id:number){return this.http.delete(`api/users/${id}`)}
}
