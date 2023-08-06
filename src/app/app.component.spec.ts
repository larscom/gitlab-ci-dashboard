import { GroupTabsComponent } from '$groups/group-tabs/group-tabs.component'
import { HeaderComponent } from '$header/header.component'
import { TestBed } from '@angular/core/testing'
import { MockComponents } from 'ng-mocks'
import { AppComponent } from './app.component'

describe('AppComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [AppComponent, MockComponents(GroupTabsComponent, HeaderComponent)]
    })
  )

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent)
    const app = fixture.componentInstance
    expect(app).toBeTruthy()
  })
})
