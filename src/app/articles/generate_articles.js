const fs = require('fs');
const path = require('path');

const projectRoot = path.join('g:', 'Learning Coding', 'nuclaflux frontend - Copy', 'nucla-dashboard');
const srcFile = path.join(projectRoot, 'src', 'app', 'articles', 'radiation_web_articles - Copy.html');
const destTs = path.join(projectRoot, 'src', 'app', 'articles', 'articles.component.ts');
const destHtml = path.join(projectRoot, 'src', 'app', 'articles', 'articles.component.html');
const destCss = path.join(projectRoot, 'src', 'app', 'articles', 'articles.component.css');

const content = fs.readFileSync(srcFile, 'utf-8');

// Extract style
const styleMatch = content.match(/<style>([\s\S]*?)<\/style>/);
let css = styleMatch ? styleMatch[1] : '';

// Replace body {} and html {} with .articles-page {}
css = css.replace(/body\s*\{/g, '.articles-page {');
css = css.replace(/html\s*\{/g, '.articles-container-wrap {');

// Write CSS
fs.writeFileSync(destCss, css);

// Extract body (from <body> up to <script>)
const bodyMatch = content.match(/<body>([\s\S]*?)<script>/);
let htmlContent = bodyMatch ? bodyMatch[1] : '';

// Replace href="#article-X" with routerLink="." fragment="article-X"
htmlContent = htmlContent.replace(/href="#(article-\d+)"/g, `routerLink="." fragment="$1"`);

// Add wrapper
htmlContent = `<div class="articles-page articles-container-wrap">\n${htmlContent}\n</div>`;

fs.writeFileSync(destHtml, htmlContent);

// Write TS
const tsContent = `import { Component, AfterViewInit, inject } from '@angular/core';
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
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    setTimeout(() => {
      const DOMarticles = document.querySelectorAll('.article');
      DOMarticles.forEach(a => observer.observe(a));
      
      if (DOMarticles.length > 0) {
        DOMarticles[0].classList.add('visible');
      }

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
`;
fs.writeFileSync(destTs, tsContent);

console.log('Successfully generated articles components.');
