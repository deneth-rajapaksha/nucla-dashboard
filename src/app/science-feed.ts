import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-science-feed',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="h-full flex flex-col">
      <div class="flex items-center justify-between mb-4 px-2">
        <h2 class="text-lg font-black text-slate-900 flex items-center gap-2">
          <mat-icon class="text-green-500">feed</mat-icon>
          Scientific Feed
        </h2>
        <button class="text-[10px] text-green-600 font-bold hover:underline uppercase">History</button>
      </div>
      
      <div class="flex-1 overflow-y-auto space-y-3 pr-2 pb-4">
        @for (article of articles; track article.id) {
          <div (click)="navigateToArticle(article.id)" class="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex gap-4 items-center group">
            <div class="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0 group-hover:scale-[1.02] transition-transform">
              <img [src]="article.image" alt="Thumbnail" class="w-full h-full object-cover" referrerpolicy="no-referrer">
            </div>
            <div class="flex-1">
              <span class="inline-block px-3 py-1 bg-green-50 text-green-600 text-[9px] font-bold uppercase rounded-full mb-2 tracking-wider">{{ article.category }}</span>
              <h3 class="text-sm md:text-xs font-bold text-slate-800 leading-snug line-clamp-2 md:line-clamp-none">{{ article.title }}</h3>
              <p class="text-[10px] text-gray-400 mt-2 font-bold">{{ article.date }}</p>
            </div>
            <mat-icon class="text-gray-300 text-sm group-hover:text-green-500 transition-colors">chevron_right</mat-icon>
          </div>
        }
      </div>
    </div>
  `
})
export class ScienceFeedComponent {
  constructor(private router: Router) {}

  navigateToArticle(articleId: string) {
    this.router.navigate(['/articles'], { fragment: articleId });
  }

  articles = [
    {
      id: 'article-1',
      title: 'Benefits of Radiation for Humans',
      date: 'By Senuli Rashwitha Menon',
      category: 'Article 01',
      image: 'https://picsum.photos/seed/rad1/100/100'
    },
    {
      id: 'article-2',
      title: 'Rules, Policies and Procedures on the Disposal of Nuclear Waste',
      date: 'By Omindie Karunawansha',
      category: 'Article 02',
      image: 'https://picsum.photos/seed/rad2/100/100'
    },
    {
      id: 'article-3',
      title: 'Safety Procedures in Nuclear Power Plants & Reactors',
      date: 'By Research Unit',
      category: 'Article 03',
      image: 'https://picsum.photos/seed/rad3/100/100'
    },
    {
      id: 'article-4',
      title: 'World Nuclear Energy Regulatory Rules and Procedures',
      date: 'By Sayuri Widyarathne',
      category: 'Article 04',
      image: 'https://picsum.photos/seed/rad4/100/100'
    },
    {
      id: 'article-5',
      title: 'Natural Radiation in the Environment',
      date: 'By Omindie Karunawansha',
      category: 'Article 05',
      image: 'https://picsum.photos/seed/rad5/100/100'
    },
    {
      id: 'article-6',
      title: 'Radiation: A Blessing in Disguise',
      date: 'By Omindie Karunawansha',
      category: 'Article 06',
      image: 'https://picsum.photos/seed/rad6/100/100'
    },
    {
      id: 'article-7',
      title: 'Nuclear Energy: From Fission to the Future',
      date: 'By team FLUX3',
      category: 'Article 07',
      image: 'https://picsum.photos/seed/rad7/100/100'
    }
  ];
}
