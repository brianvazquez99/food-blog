import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { debounceTime, filter } from 'rxjs';
import { BlogService } from './blog-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true,
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('MailanHomeBakery');

  searchResults = signal<any[] | undefined>(undefined)

  blogService = inject(BlogService)

  searchText = signal<string | undefined>(undefined)

  isSearchOpen = signal<boolean>(false)

  router = inject(Router)



  firstLoad:boolean = true

  hamburgerOpen = signal<boolean>(false)

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
      this.swUpdate.versionUpdates.pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
      .subscribe((evt) => {
          // Reload the page to update to the latest version.
          document.location.reload();
      });
    }
  }

  closeSearch =  () => {
      if (this.isSearchOpen()) {
        this.isSearchOpen.set(false)
      }
    }


  ngOnInit(): void {



    document.addEventListener('click', this.closeSearch.bind(this))
      this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe({
        next:value => {
          this.isSearchOpen.set(false )
          this.hamburgerOpen.set(false)
        }
      })
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

  ngOnDestroy(): void {
    document.removeEventListener('click', this.closeSearch)
  }
}
