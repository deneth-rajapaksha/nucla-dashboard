import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

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
      
      <div class="flex-1 overflow-y-auto space-y-3 pr-2">
        @for (article of articles; track article.id) {
          <div class="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex gap-4 items-center">
            <div class="w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0">
              <img [src]="article.image" alt="Thumbnail" class="w-full h-full object-cover" referrerpolicy="no-referrer">
            </div>
            <div class="flex-1">
              <span class="inline-block px-2 py-0.5 bg-green-50 text-green-600 text-[8px] font-bold uppercase rounded-full mb-1">{{ article.category }}</span>
              <h3 class="text-xs font-bold text-slate-800 leading-tight">{{ article.title }}</h3>
              <p class="text-[9px] text-gray-400 mt-2 font-bold">{{ article.date }}</p>
            </div>
            <mat-icon class="text-gray-300 text-sm">chevron_right</mat-icon>
          </div>
        }
      </div>
    </div>
  `
})
export class ScienceFeedComponent {
  articles = [
    {
      id: 1,
      title: 'Uranium-235 Enrichment Dynamics',
      date: '12 OCT 2023',
      category: 'Research',
      image: 'https://picsum.photos/seed/uranium/100/100'
    },
    {
      id: 2,
      title: 'Neutron Moderation in Heavy Water',
      date: '10 OCT 2023',
      category: 'Lab Notes',
      image: 'https://picsum.photos/seed/neutron/100/100'
    },
    {
      id: 3,
      title: 'Cherenkov Radiation Visualizer v3',
      date: '08 OCT 2023',
      category: 'Update',
      image: 'https://picsum.photos/seed/radiation/100/100'
    }
  ];
}
