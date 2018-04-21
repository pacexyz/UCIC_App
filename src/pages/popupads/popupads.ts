import { Component } from '@angular/core';
import { NavController, NavParams, ViewController} from 'ionic-angular';
import { Http } from '@angular/http';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { Storage } from '@ionic/storage';

// Page

declare var wordpress_url: string;
@Component({
	selector: 'page-popupads',
	templateUrl: 'popupads.html'
})
export class PopupadsPage {
	data:Object;
	constructor(
		private navCtrl: NavController,
		public viewCtrl: ViewController,
		private http: Http,
		navParams: NavParams,
		private storage: Storage
		) {
		// this.getPopup();
		this.data = navParams.get('image');
	}

	openPopup(check: boolean) {
		this.storage.set('require', true);
		this.viewCtrl.dismiss(check);
	}
	
}