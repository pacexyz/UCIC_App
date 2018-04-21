import { Component } from '@angular/core';
import { ActionSheetController, AlertController, Platform, NavController } from 'ionic-angular';
import { Http, Headers } from '@angular/http';

// Custom
import { Storage } from '@ionic/storage';
import { TranslateService } from '../../module/ng2-translate';
import { SocialSharing } from '@ionic-native/social-sharing';
import { StorageMulti } from '../../service/storage-multi.service';
import { OneSignal } from '@ionic-native/onesignal';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { Config } from '../../service/config.service';
import { Core } from '../../service/core.service';
import { Device } from '@ionic-native/device';

// Page
import { LoginPage } from '../login/login';
import { ProfilePage } from '../profile/profile';
import { OrderPage } from '../order/order';
import { FavoritePage } from '../favorite/favorite';
import { TermsPage } from '../terms/terms';
import { PrivacyPage } from '../privacy/privacy';
import { ContactPage } from '../contact/contact';
import { AboutPage } from '../about/about';
import { SearchPage } from '../search/search';

// Pipe
import { Static } from '../../pipes/static';

declare var wordpress_url: string;
const wordpress_order = wordpress_url + '/wp-json/wooconnector/order';

@Component({
	selector: 'page-account',
	templateUrl: 'account.html',
	providers: [StorageMulti, Device]
})
export class AccountPage {
	LoginPage = LoginPage;
	ProfilePage = ProfilePage;
	OrderPage = OrderPage;
	FavoritePage = FavoritePage;
	TermsPage = TermsPage;
	PrivacyPage = PrivacyPage;
	ContactPage = ContactPage;
	AboutPage = AboutPage;
	SearchPage = SearchPage;
	isCache: boolean; isLogin: boolean; loadedOrder: boolean;
	data: any = {};

	constructor(
		private storage: Storage,
		private storageMul: StorageMulti,
		private alertCtrl: AlertController,
		private translate: TranslateService,
		private platform: Platform,
		private http: Http,
		private navCtrl: NavController,
		private config: Config,
		private SocialSharing: SocialSharing,
		private OneSignal: OneSignal,
		private InAppBrowser: InAppBrowser,
		private core: Core,
		private actionCtr: ActionSheetController,
		private Device: Device
	) {
		this.getData();
	}
	ionViewDidEnter() {
		if (this.isCache) this.getData();
		else this.isCache = true;
		// this.getData();
	}
	getData() {
		this.storageMul.get(['login', 'user']).then(val => {
			if (val) {
				if (val["login"] && val["login"]["token"]) {
					this.data["login"] = val["login"];
					this.isLogin = true;
					this.data['order'] = 0;
					let params = { post_num_page: 1, post_per_page: 1000 };
					this.loadedOrder = false;
					let loadOrder = () => {
						let headers = new Headers();
						headers.set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
						headers.set('Authorization', 'Bearer ' + this.data["login"]["token"]);
						this.http.get(wordpress_order + '/getorderbyterm', {
							headers: headers,
							search: this.core.objectToURLParams(params)
						}).subscribe(res => {
							if (Array.isArray(res.json())) this.data['order'] += res.json().length;
							if (res.json().length == 1000) {
								params['post_num_page']++;
								loadOrder();
							} else this.loadedOrder = true;
						});
					};
					loadOrder();
				}
				if (val["user"]) this.data["user"] = val["user"];
			}
		});
		this.storageMul.get(['favorite', 'notification', 'text'])
			.then(val => {
				console.log(val);
				if (val) {
					if (val["favorite"]) this.data["favorite"] = Object.keys(val["favorite"]).length;
					else this.data["favorite"] = 0;
					if (val["notification"] != false) this.data["notification"] = true;
					else this.data["notification"] = false;
					if (val["text"]) this.data["text"] = val["text"];
					else this.data["text"] = "normal";
				}
			});
	}
	signOut() {
		this.translate.get('account.signout').subscribe(trans => {
			let confirm = this.alertCtrl.create({
				title: trans["title"],
				message: trans["message"],
				cssClass: 'alert-signout',
				buttons: [
					{
						text: trans["no"],
					},
					{
						text: trans["yes"],
						handler: () => {
							this.data['order'] = 0;
							this.storage.remove('login').then(() => { this.isLogin = false; });
						}
					}
				]
			});
			confirm.present();
		});
	}
	shareApp() {
		if (this.Device.platform == 'Android')
			this.SocialSharing.share(null, null, null, new Static(this.config).transform('modern_share_rate_android'));
		else this.SocialSharing.share(null, null, null, new Static(this.config).transform('modern_share_rate_ios'));
	}
	rateApp() {
		if (this.Device.platform == 'Android') this.InAppBrowser.create(new Static(this.config).transform('modern_share_rate_android'), "_system");
		else this.InAppBrowser.create(new Static(this.config).transform('modern_share_rate_ios'), "_system");
	}
	notification() {
		this.storage.set('notification', this.data["notification"]).then(() => {
			this.OneSignal.setSubscription(this.data["notification"]);
		});
	}
	changeTextSize() {
		this.translate.get('account.text_size').subscribe(trans => {
			let action = this.actionCtr.create({
				cssClass: 'action-text-size'
			});
			for (let option in trans["option"]) {
				action.addButton({
					text: trans["option"][option],
					cssClass: option == this.data['text'] ? 'selected' : null,
					handler: () => { this.updateTextSize(option) }
				});
			}
			action.addButton({
				text: trans["cancel"],
				role: 'cancel'
			});
			action.present();
		});
	}
	updateTextSize(text: string) {
		this.storage.set('text', text);
		let html = document.querySelector('html');
		html.className = text;
		this.data["text"] = text;
	}
	onSwipeContent(e) {
		if (e['deltaX'] > 150) this.navCtrl.push(this.SearchPage);
	}
}