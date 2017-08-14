/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { UserInviteComponent } from './user-invite.component';

describe('UserInviteComponent', () => {
  let component: UserInviteComponent;
  let fixture: ComponentFixture<UserInviteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserInviteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserInviteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
