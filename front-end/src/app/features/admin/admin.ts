import { JsonPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterOutlet } from '@angular/router';
import { sign } from 'crypto';

@Component({
  selector: 'app-admin',
  imports: [RouterOutlet, RouterLink, FormsModule, JsonPipe],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin implements OnInit {
  isLoggedIn = signal<boolean>(false);
  http = inject(HttpClient);
  password = signal<string | undefined>(undefined);
  errorMessage = signal<string | undefined>(undefined);
  isLoading = signal<boolean>(false);

  ngOnInit(): void {
    this.http.get('/api/verifyAdmin').subscribe({ next: (value) => {
      console.log(value)
      this.isLoggedIn.set(true)
    },
  error:(err) => {
    console.log(err)
    this.isLoggedIn.set(false)
  }

});

  }

  onLogin() {
    if (!this.password()) return;

    this.isLoading.set(true);

    this.http
      .post('/api/login', { PASSWORD: this.password() }, { withCredentials: true })
      .subscribe({
        next: (value) => {
          this.isLoading.set(false);
          this.isLoggedIn.set(true);
        },
        error: (err) => {
          this.errorMessage.set("There was an error logging in");
          this.isLoading.set(false);
        },
      });
  }
}
