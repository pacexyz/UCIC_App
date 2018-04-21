import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

// Page
import { ContactPage } from '../contact/contact';

@Component({
	selector: 'page-about',
	templateUrl: 'about.html'
})
export class AboutPage {
	ContactPage = ContactPage;
	constructor(private navCtrl: NavController) {}
	gotoContact(){
		if(this.navCtrl.getPrevious().component == this.ContactPage) this.navCtrl.pop();
		else this.navCtrl.push(this.ContactPage);
	}
}