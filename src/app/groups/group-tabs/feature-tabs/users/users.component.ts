import { CommonModule } from '@angular/common'
import { Component, OnInit, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { finalize } from 'rxjs'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { AppUser, UserInput, UserRole, UserService } from './user.service'
import { AuthService } from '$service/auth.service'

@Component({selector:'gcd-users',imports:[CommonModule,FormsModule,NzButtonModule,NzIconModule],templateUrl:'./users.component.html',styleUrls:['./users.component.scss']})
export class UsersComponent implements OnInit {
  private service=inject(UserService)
  private auth=inject(AuthService)
  users=signal<AppUser[]>([]); loading=signal(false); saving=signal(false); search=signal(''); drawerOpen=signal(false); error=signal(''); editing=signal<AppUser|null>(null); highlightedUsername=signal('')
  form:UserInput={username:'',password:'',display_name:'',email:'',role:'editor',enabled:true}
  filtered=computed(()=>{const q=this.search().trim().toLowerCase();return q?this.users().filter(u=>[u.username,u.display_name,u.email,u.role].some(v=>v.toLowerCase().includes(q))):this.users()})
  ngOnInit(){this.load()}
  load(){this.loading.set(true);this.service.list().pipe(finalize(()=>this.loading.set(false))).subscribe({next:v=>this.users.set(v),error:e=>this.error.set(e.error?.message||'Unable to load users')})}
  create(){this.editing.set(null);this.form={username:'',password:'',display_name:'',email:'',role:'editor',enabled:true};this.error.set('');this.drawerOpen.set(true)}
  edit(user:AppUser){this.editing.set(user);this.form={username:user.username,password:'',display_name:user.display_name,email:user.email,role:user.role,enabled:user.enabled};this.error.set('');this.drawerOpen.set(true)}
  setRole(role:UserRole){if(this.editing()?.role==='admin')return;this.form.role=role}
  save(){if(!this.form.username.trim()||(!this.editing()&&this.form.password.length<8)){this.error.set('Username and a password of at least 8 characters are required.');return}const highlightUsername=this.form.username.trim();this.saving.set(true);const req=this.editing()?this.service.update(this.editing()!.id,this.form):this.service.create(this.form);req.pipe(finalize(()=>this.saving.set(false))).subscribe({next:()=>{this.error.set('');this.drawerOpen.set(false);this.highlightedUsername.set(highlightUsername);window.setTimeout(()=>{if(this.highlightedUsername()===highlightUsername)this.highlightedUsername.set('')},2600);this.load()},error:e=>this.error.set(e.error?.message||'Unable to save user')})}
  remove(user:AppUser){if(confirm(`Delete user ${user.username}?`))this.service.remove(user.id).subscribe({next:()=>this.load(),error:e=>this.error.set(e.error?.message||'Unable to delete user')})}
  canDelete(user:AppUser){if(user.username===this.auth.username())return false;return user.role!=='admin'||this.users().filter(v=>v.role==='admin'&&v.enabled).length>1}
  initials(user:AppUser){return (user.display_name||user.username).split(/\s+/).slice(0,2).map(v=>v[0]?.toUpperCase()).join('')}
}
