import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Pipe({ 
  name: 'safeUrl', 
  standalone: true 
})
export class SafeUrlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
//DomSanitizer est un service Angular qui sert à :
//sécuriser les contenus HTML et les URLs
  transform(url: string): SafeResourceUrl {//cette URL est sûre, tu peux l’utiliser
    //transform prend une URL normale et la transforme en URL sécurisée
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }//dire à Angular : “cette URL est sûre, tu peux l’utiliser
}