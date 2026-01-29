import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BlogService } from '../../../blog-service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-admin-dash',
  imports: [DatePipe],
  templateUrl: './admin-dash.html',
  styleUrl: './admin-dash.css'
})
export class AdminDash {
  blogService = inject(BlogService)

  // blogPosts = toSignal(this.blogService.getBlogList(), {initialValue:[]})

  blogPosts = Array(5).fill(
    {
    ID: 20,
    TITLE: 'test',
    THUMBNAIL: new Blob(),
    BODY: "ldfskkads;lfasdkfjasdfads",
    DATE_ADDED: '1/26/2025',
    SLUG: 'test',
    CATEGORY: ['bread', 'holidfays']
    }
  )



}
