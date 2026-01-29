import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminBlogDetail } from './admin-blog-detail';

describe('AdminBlogDetail', () => {
  let component: AdminBlogDetail;
  let fixture: ComponentFixture<AdminBlogDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminBlogDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminBlogDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
