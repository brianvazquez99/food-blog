import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';

@Component({
  selector: 'app-recipes',
  imports: [],
  templateUrl: './recipes.html',
  styleUrl: './recipes.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Recipes implements OnInit {

  http = inject(HttpClient)

  posts = signal<any>(undefined)

    ngOnInit(): void {
      this.http.get("/api/getBlogs").subscribe( {
        next: value => {
          console.log(value)
          this.posts.set(value)
        }
      })
  }

}
