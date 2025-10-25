import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {

  http = inject(HttpClient)

  posts = Array(5).fill({
    TITLE: 'A very delicios recipie',
    DESCRIPTION: 'TEST'
  })


  ngOnInit(): void {
      this.http.get("/api/getBlogs").subscribe( {
        next: value => {
          console.log(value)
        }
      })
  }





}
