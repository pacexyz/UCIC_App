import { Component } from '@angular/core';
import { AlertController, NavController } from 'ionic-angular';

// Custom
import { Storage } from '@ionic/storage';
import { TranslateService } from '../../module/ng2-translate';

//Pages
import { DetailPage } from '../detail/detail';

@Component({
	selector: 'page-favorite',
	templateUrl: 'favorite.html'
})
export class FavoritePage {
	DetailPage = DetailPage;
	data:Object = {};
	constructor(
		private storage: Storage,
		private alertCtrl: AlertController,
		private translate: TranslateService,
		private navCtrl: NavController
	){
		storage.get('favorite').then(val => {;
			this.data = val;
		});
	}
	clear(){
		let favoriteClearTrans:Object;
		this.translate.get('favorite.clear').subscribe(val => {
			favoriteClearTrans = val;
			let confirm = this.alertCtrl.create({
				message: favoriteClearTrans["message"],
				cssClass: 'alert-no-title alert-signout',
				buttons: [
					{
						text: favoriteClearTrans["no"],
					},
					{
						text: favoriteClearTrans["yes"],
						cssClass: 'dark',
						handler: () => {
							this.storage.remove('favorite').then(() => { this.data = {}; });
						}
					}
				]
			});
			confirm.present();		
		});
	}
	shop(){
		this.navCtrl.popToRoot();
	}
	delete(id:Number){
		let data = Object.assign({}, this.data)
		delete data[Number(id)];
		this.data = data;
		this.storage.set('favorite', this.data);
	}
}