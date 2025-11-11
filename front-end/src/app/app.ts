import { CommonModule } from '@angular/common';
import { AfterContentInit, AfterViewInit, Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { debounceTime } from 'rxjs';
import { BlogService } from './blog-service';
import { SwUpdate } from '@angular/service-worker';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true
})
export class App {
  protected readonly title = signal('front-end');

  searchResults = signal<any[] | undefined>(undefined)

  blogService = inject(BlogService)

  searchText = signal<string | undefined>(undefined)

  isSearchOpen = signal<boolean>(false)



  firstLoad:boolean = true

  initialSearchEffect = effect(() => {
    if (this.blogService.posts()) {
      if(this.firstLoad) {
        this.searchResults.set([...this.blogService.posts()!])
        console.log(this.searchResults())
        this.firstLoad = false
      }
    }
  })

  searchEffect = effect(() => {
    if (this.searchText()) {
      this.searchBlogs()
    }
  })


  constructor(private swUpdate: SwUpdate) {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe({
        next:value => {
          console.log(value)
          console.log("hi")
        }
      })
    }
  }

  ngAfterContentInit(): void {
    console.log(this.blogService.posts())
      this.searchResults.set(this.blogService.posts()!)
  }


  searchBlogs() {
    console.log(this.searchText())
    if (this.searchText() != undefined) {

      this.blogService.searchBlogs(this.searchText()!).pipe(debounceTime((1000))).subscribe({
        next:value => {

          if (value) {

            this.searchResults.set(value.map((el) => { return {...el, SLUG: this.blogService.getSlug(el.TITLE!)}} ))
          }
          else {
            this.searchResults.set([])
          }

        }
      })
    }
    else if (this.searchText() == '') {
      this.searchResults.set([])
    }
  }
}
