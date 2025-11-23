import { HttpClient, HttpParams } from '@angular/common/http';
import { AfterViewInit, ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from "@angular/router";
import { RECIPE } from '../../types';
import { BlogService } from '../../blog-service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
    changeDetection:ChangeDetectionStrategy.OnPush

})
export class Home implements OnInit, AfterViewInit {

  blogService = inject(BlogService)

  instgrm: any



    ngAfterViewInit() {
    // If the Instagram embed script hasn’t been added, add it
    if (!document.querySelector('script[src="//www.instagram.com/embed.js"]')) {
      const script = document.createElement('script');
      script.src = "//www.instagram.com/embed.js";
      script.async = true;
      script.onload = () => this.instgrm?.Embeds?.process();
      document.body.appendChild(script);
    } else {
      // If it already exists, just process embeds again
      this.instgrm?.Embeds?.process();
    }
  }

  ngOnInit(): void {

    this.blogService.getBlogList(true).subscribe({
        next: value => {
          console.log(value)
          this.blogService.posts.set(value.map((el) => { return {...el, SLUG: this.blogService.getSlug(el.TITLE!)}} ))
        }
      })

  }







}
