import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BlogService } from '../../../blog-service';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { tap } from 'rxjs';
import { RECIPE } from '../../../types';

@Component({
  selector: 'app-admin-dash',
  imports: [DatePipe, RouterLink],
  templateUrl: './admin-dash.html',
  styleUrl: './admin-dash.css'
})
export class AdminDash {
  blogService = inject(BlogService)

  // blogPosts = toSignal(this.blogService.getBlogList(), {initialValue:[]})

  blogPosts = toSignal(this.blogService.getBlogList().pipe(tap(val => this.copyPosts.set(val))), {initialValue:[]})
  copyPosts = signal<RECIPE[]>([])

  onSearch(search:Event) {

    const input = search.target as HTMLInputElement
    const searchString = input.value
    console.log(searchString)
    const filtered = this.blogPosts().filter(el => {
      const title = el.TITLE as string
      const index = title.indexOf(searchString)
      if (index != -1) {
        return el
      }

    })

    this.copyPosts.set([...filtered])
  }



}
