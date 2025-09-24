import { Component } from '@angular/core';
import {QuillModule} from 'ngx-quill'

@Component({
  selector: 'app-admin',
  imports: [QuillModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
  standalone: true,
})
export class Admin {

}
