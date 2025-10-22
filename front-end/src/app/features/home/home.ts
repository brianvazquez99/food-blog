import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {

  http = inject(HttpClient)

  posts = Array(20).fill({
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
