/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ContactChipComponent } from './contact-chip.component';

describe('ContactChipComponent', () => {
  let component: ContactChipComponent;
  let fixture: ComponentFixture<ContactChipComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContactChipComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContactChipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
