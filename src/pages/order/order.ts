import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Http, Headers } from '@angular/http';
import { Observable } from 'rxjs/Observable';

// Custom
import { Core } from '../../service/core.service';
import { Storage } from '@ionic/storage';
import { Toast } from '@ionic-native/toast';

// Page
import { DetailOrderPage } from '../detail-order/detail-order';

declare var wordpress_url: string;
declare var date_format: string;
declare var wordpress_per_page: Number;
const wordpress_order = wordpress_url + '/wp-json/wooconnector/order';

@Component({
	selector: 'page-order',
	templateUrl: 'order.html',
	providers: [Core]
})
export class OrderPage {
	DetailOrderPage = DetailOrderPage;
	login: Object = {}; data: Object[]; date_format: string = date_format;
	page = 1; over: boolean;
	noOrder:boolean = false;

	constructor(
		private http: Http,
		private core: Core,
		private storage: Storage,
		private navCtrl: NavController,
		private Toast: Toast
	) { }
	ionViewDidEnter() {
		this.page = 1;
		this.storage.get('login').then(val => {
			if (val && val['token']) {
				this.login = val;
				this.getData().subscribe(order => {
					if (order.length > 0) {
						this.noOrder = false;
						this.page++;
						this.data = order;
					} else {
						this.noOrder = true;
					}
				});
			} else this.navCtrl.pop();
		});
	}
	getData(hide: boolean = false): Observable<Object[]> {
		return new Observable(observable => {
			if (!hide) this.core.showLoading();
			let params = { post_per_page: wordpress_per_page, post_num_page: this.page };
			let headers = new Headers();
			headers.set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
			headers.set('Authorization', 'Bearer ' + this.login["token"]);
			this.http.get(wordpress_order + '/getorderbyterm', {
				search: this.core.objectToURLParams(params),
				headers: headers
			}).subscribe(res => {
				if (!hide) this.core.hideLoading();
				observable.next(res.json());
				observable.complete();
			}, err => {
				if (!hide) this.core.hideLoading();
				this.Toast.showShortBottom(err.json()["message"]).subscribe(
					toast => { },
					error => { console.log(error); }
				);
			});
		});
	}
	shop() {
		this.navCtrl.popToRoot();
	}
	load(infiniteScroll) {
		this.getData(true).subscribe(order => {
			if (order.length > 0) this.page++;
			else this.over = true;
			this.data = this.data.concat(order);
			infiniteScroll.complete();
		});
	}
	doRefresh(refresher) {
		this.page = 1;
		this.getData(true).subscribe(order => {
			this.over = false;
			if (order.length > 0) this.page++;
			this.data = order;
			refresher.complete();
		});
	}
}