import { Component, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-articles',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './articles.component.html',
  styleUrls: ['./articles.component.css']
})
export class ArticlesComponent implements AfterViewInit {
  private route = inject(ActivatedRoute);

  ngAfterViewInit() {
    setTimeout(() => {
      this.route.fragment.subscribe(frag => {
        if (frag) {
          const el = document.getElementById(frag);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    }, 200);
  }
}
