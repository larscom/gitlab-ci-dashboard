import { Group, GroupId } from '$groups/model/group'
import { ProjectId } from '$groups/model/project'
import { ConfigService } from '$service/config.service'
import { AuthService } from '$service/auth.service'
import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, input, output, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { NzButtonModule } from 'ng-zorro-antd/button'
import { NzIconModule } from 'ng-zorro-antd/icon'
import { NzTabChangeEvent, NzTabsModule } from 'ng-zorro-antd/tabs'
import { NzTooltipModule } from 'ng-zorro-antd/tooltip'
import { finalize, map } from 'rxjs'
import { LatestPipelinesComponent } from './latest-pipelines/latest-pipelines.component'
import { PipelinesComponent } from './pipelines/pipelines.component'
import { RunnersComponent } from './runners/runners.component'
import { DashboardFeature, DashboardPreloadService } from './service/dashboard-preload.service'
import { UsersComponent } from './users/users.component'
import { FavoritesComponent } from '../favorites/favorites.component'

interface Tab { id: 'latest-pipelines' | 'pipelines' | 'favorites' | 'runners' | 'environments' | 'global-config' | 'users'; title: string; icon: string }
interface EnvironmentItem { id:number; namespace_id:number; name:string; base_url:string; group_ids:number[]; enabled:boolean; token_configured:boolean }
const allTabs: Tab[] = [
  { id:'latest-pipelines', title:'Dashboard', icon:'dashboard' }, { id:'pipelines', title:'Pipelines', icon:'unordered-list' }, { id:'favorites', title:'Favorites', icon:'star' },
  { id:'runners', title:'Runners', icon:'thunderbolt' }, { id:'environments', title:'Environments', icon:'cloud-server' }, { id:'global-config', title:'Configs', icon:'setting' }, { id:'users', title:'Users', icon:'team' }
]
const ENVIRONMENT_HIGHLIGHT_KEY='environment_row_highlight'
@Component({ selector:'gcd-feature-tabs', imports:[CommonModule,FormsModule,NzTabsModule,NzIconModule,NzButtonModule,NzTooltipModule,LatestPipelinesComponent,PipelinesComponent,RunnersComponent,UsersComponent,FavoritesComponent], templateUrl:'./feature-tabs.component.html', styleUrls:['./feature-tabs.component.scss'], changeDetection:ChangeDetectionStrategy.OnPush })
export class FeatureTabsComponent implements OnInit {
  private config=inject(ConfigService); private auth=inject(AuthService); private preloader=inject(DashboardPreloadService); private http=inject(HttpClient)
  groupMap=input.required<Map<GroupId,Set<ProjectId>>>(); groupName=input('Group'); availableGroups=input<Group[]>([]); emptyState=input(false); disableRouting=input(false)
  environmentsChanged=output<void>()
  tabs=computed(()=>this.auth.isAdmin()?allTabs:allTabs.filter(t=>!['environments','global-config','users'].includes(t.id))); menuCollapsed=signal(this.getSavedMenuState()); localTabIndex=signal(0)
  groupSelectorOpen=signal(false); environmentSelectorOpen=signal(false); groupSearch=signal(''); currentGroupId=computed(()=>[...this.groupMap().keys()][0]); currentNamespace=computed(()=>this.namespaceOf(this.currentGroupId())); currentEnvironment=computed(()=>this.environments().find(e=>e.namespace_id===this.currentNamespace())); environmentGroups=computed(()=>this.availableGroups().filter(g=>this.namespaceOf(g.id)===this.currentNamespace())); filteredGroups=computed(()=>{const q=this.groupSearch().trim().toLowerCase();const groups=this.environmentGroups();return q?groups.filter(g=>g.name.toLowerCase().includes(q)):groups}); environments=signal<EnvironmentItem[]>([]); selectedEnvironmentIds=signal<number[]>([]); editingEnvironmentId=signal<number|null>(null); highlightedEnvironmentId=signal<number|null>(null)
  environmentName=computed(()=>this.currentEnvironment()?.name||'GitLab')
  displayGroupName=computed(()=>this.groupDisplayName(this.groupName()))
  setupOpen=signal(false); savingEnvironment=signal(false); setupError=signal(''); globalSaving=signal(false); globalMessage=signal(''); logoMode=signal<'url'|'upload'>('url'); logoFileName=signal(''); globalConfig={company_name:'GitLab CI Dashboard',company_logo:''}
  environment={name:'',base_url:'https://gitlab.com',token:'',group_ids:''}
  selectedIndex$=this.route.paramMap.pipe(map((p)=>p.get('featureId')),map((id)=>id?this.tabs().findIndex((t)=>t.id===id):0))
  constructor(private route:ActivatedRoute,private router:Router){ this.route.paramMap.pipe(takeUntilDestroyed(),map((p)=>p.get('featureId'))).subscribe((id)=>{if(id&&!this.tabs().some((t)=>t.id===id))this.router.navigate(['/'])}); effect(()=>{if(this.emptyState())return;const groupMap=this.groupMap();const id=this.route.snapshot.paramMap.get('featureId');if(!['environments','global-config','users','favorites'].includes(id||'')){const active=(id==='pipelines'||id==='runners'||id==='latest-pipelines'?id:'latest-pipelines') as DashboardFeature;this.preloader.preload(groupMap,active)}}) }
  ngOnInit(){ this.restoreEnvironmentHighlight();this.loadEnvironments(); if(this.auth.isAdmin())this.loadGlobalConfig() }
  onChange({index}:NzTabChangeEvent){ if(this.disableRouting())return; if(this.emptyState()){this.localTabIndex.set(index!);return} const id=this.tabs()[index!].id; const segments=this.route.snapshot.url.map(({path})=>path); this.router.navigate([...segments.slice(0,-1),id]) }
  openGroupSelector(){if(!this.emptyState()&&this.environmentGroups().length>1){this.groupSearch.set('');this.groupSelectorOpen.set(true)}}
  namespaceOf(id:number|undefined){return id===undefined?0:Math.floor(id/17592186044416)}
  openEnvironmentSelector(){if(this.environments().length>1)this.environmentSelectorOpen.set(true)}
  selectEnvironment(environment:EnvironmentItem){this.environmentSelectorOpen.set(false);const group=this.availableGroups().find(g=>this.namespaceOf(g.id)===environment.namespace_id);if(group){const feature=this.route.snapshot.paramMap.get('featureId')||'latest-pipelines';this.router.navigate([group.id,feature])}else{this.localTabIndex.set(3);this.router.navigate(['/'])}}  selectGroup(group:Group){this.groupSelectorOpen.set(false);const feature=this.route.snapshot.paramMap.get('featureId')||'latest-pipelines';this.router.navigate([group.id,feature])}
  openEnvironmentSetup(){this.editingEnvironmentId.set(null);this.environment={name:'',base_url:'https://gitlab.com',token:'',group_ids:''};this.logoMode.set('url');this.setupError.set('');this.setupOpen.set(true)}
  editEnvironment(item:EnvironmentItem){this.editingEnvironmentId.set(item.id);this.environment={name:item.name,base_url:item.base_url,token:'',group_ids:item.group_ids.join(', ')};this.setupError.set('');this.setupOpen.set(true)}
  saveEnvironment(){const name=this.environment.name.trim(),base_url=this.environment.base_url.trim().replace(/\/$/,''),token=this.environment.token.trim();if(!name||!base_url||(!token&&!this.editingEnvironmentId())){this.setupError.set('Environment name, GitLab URL, and access token are required.');return}const group_ids=this.environment.group_ids.split(',').map(v=>Number(v.trim())).filter(v=>Number.isSafeInteger(v)&&v>0);const payload={name,base_url,token,group_ids,enabled:true,only_top_level:true,include_subgroups:true};const editingId=this.editingEnvironmentId();this.savingEnvironment.set(true);const req=editingId?this.http.patch(`api/environments/${editingId}`,payload):this.http.post('api/environments',payload);req.pipe(finalize(()=>this.savingEnvironment.set(false))).subscribe({next:(response:any)=>{const highlightId=editingId??Number(response?.id);this.setupOpen.set(false);if(Number.isSafeInteger(highlightId))this.highlightEnvironment(highlightId);this.loadEnvironments();this.environmentsChanged.emit()},error:({error})=>this.setupError.set(error?.message||'Unable to save environment.')})}
  loadGlobalConfig(){this.http.get<{company_name:string;company_logo:string}>('api/global-config').subscribe(v=>this.globalConfig=v)}
  saveGlobalConfig(){const company_name=this.globalConfig.company_name.trim();if(!company_name){this.globalMessage.set('Company name is required.');return}this.globalSaving.set(true);const branding={company_name,company_logo:this.globalConfig.company_logo};this.http.put('api/global-config',branding).pipe(finalize(()=>this.globalSaving.set(false))).subscribe({next:()=>{this.config.setBranding(branding);this.globalMessage.set('Global configuration saved.')},error:({error})=>this.globalMessage.set(error?.message||'Unable to save global configuration.')})}
  loadEnvironments(){this.http.get<EnvironmentItem[]>('api/environments').subscribe(v=>this.environments.set(v))}
  toggleEnvironment(id:number,checked:boolean){this.selectedEnvironmentIds.update(ids=>checked?[...ids,id]:ids.filter(v=>v!==id))}
  deleteEnvironment(id:number){if(confirm('Delete this GitLab environment?'))this.http.delete(`api/environments/${id}`).subscribe(()=>{this.loadEnvironments();this.environmentsChanged.emit()})}
  deleteSelected(){const ids=this.selectedEnvironmentIds();if(!ids.length||!confirm(`Delete ${ids.length} selected environments?`))return;Promise.all(ids.map(id=>fetch(`api/environments/${id}`,{method:'DELETE'}))).then(()=>{this.selectedEnvironmentIds.set([]);this.loadEnvironments();this.environmentsChanged.emit()})}
  onLogoFile(e:Event){const f=(e.target as HTMLInputElement).files?.[0];if(!f)return;if(!['image/png','image/jpeg','image/webp','image/svg+xml'].includes(f.type)||f.size>262144){this.logoFileName.set('');this.globalMessage.set('Logo must be PNG, JPG, WebP, or SVG and no larger than 256 KB.');return}this.logoFileName.set(f.name);this.globalMessage.set('');const r=new FileReader();r.onload=()=>this.globalConfig.company_logo=String(r.result);r.readAsDataURL(f)}
  toggleMenu(){this.menuCollapsed.update(v=>!v);try{localStorage.setItem('feature_menu_collapsed',String(this.menuCollapsed()))}catch{}}
  groupDisplayName(name:string){const prefix=`${this.currentEnvironment()?.name} / `;return name.startsWith(prefix)?name.slice(prefix.length):name}
  private getSavedMenuState(){try{return localStorage.getItem('feature_menu_collapsed')==='true'}catch{return false}}
  private highlightEnvironment(id:number){this.highlightedEnvironmentId.set(id);try{sessionStorage.setItem(ENVIRONMENT_HIGHLIGHT_KEY,JSON.stringify({id,expires:Date.now()+5000}))}catch{}window.setTimeout(()=>{if(this.highlightedEnvironmentId()===id)this.highlightedEnvironmentId.set(null);try{const saved=JSON.parse(sessionStorage.getItem(ENVIRONMENT_HIGHLIGHT_KEY)||'null');if(saved?.id===id)sessionStorage.removeItem(ENVIRONMENT_HIGHLIGHT_KEY)}catch{}},2600)}
  private restoreEnvironmentHighlight(){try{const saved=JSON.parse(sessionStorage.getItem(ENVIRONMENT_HIGHLIGHT_KEY)||'null');if(Number.isSafeInteger(saved?.id)&&saved.expires>Date.now())this.highlightEnvironment(saved.id);else sessionStorage.removeItem(ENVIRONMENT_HIGHLIGHT_KEY)}catch{}}
}
