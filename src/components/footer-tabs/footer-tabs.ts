import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

// Custom
import { HomePage } from '../../pages/home/home';
import { CategoriesPage } from '../../pages/categories/categories';
import { SearchPage } from '../../pages/search/search';
import { AccountPage } from '../../pages/account/account';

@Component({
	selector: 'footer-tabs',
	templateUrl: 'footer-tabs.html'
})
export class FooterTabsComponent {
	HomePage = HomePage;
	CategoriesPage = CategoriesPage;
	SearchPage = SearchPage;
	AccountPage = AccountPage;
	active: any;
	constructor(public navCtrl: NavController) { }
	ngOnInit() {
		this.active = this.navCtrl.getActive().component;
	}
	goto(page: any) {
		if (this.active && page && this.active != page) {
			if (!page) this.navCtrl.popToRoot();
			else {
				let previous = this.navCtrl.getPrevious();
				if (previous && previous.component == page) this.navCtrl.pop();
				else this.navCtrl.push(page);
			}
		}
	}
}