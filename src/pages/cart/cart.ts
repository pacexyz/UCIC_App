import { Component } from '@angular/core';
import { NavController, AlertController } from 'ionic-angular'
import { Http, Headers } from '@angular/http';

// Custom
import { Storage } from '@ionic/storage';
import { StorageMulti } from '../../service/storage-multi.service';
import { Toast } from '@ionic-native/toast';
import { TranslateService } from '../../module/ng2-translate';
import { Core } from '../../service/core.service';
import { Config } from '../../service/config.service';

//Pipes
import { ObjectToArray } from '../../pipes/object-to-array';

// Page
import { AddressPage } from '../address/address';
import { LoginPage } from '../login/login';
import { DetailPage } from '../detail/detail';

declare var wordpress_url;

@Component({
	selector: 'page-cart',
	templateUrl: 'cart.html',
	providers: [StorageMulti, Core, ObjectToArray]
})
export class CartPage {
	AddressPage = AddressPage;
	LoginPage = LoginPage;
	DetailPage = DetailPage;
	data: Object;
	tax: Number = 0;
	coupon: String[] = []; couponData: Object[];
	login: Object;
	trans: Object = {};
	isCache: boolean;
	couponCode: String;
	invalid: boolean;
	check_require_login:boolean;
	checkCart: boolean = false;

	constructor(
		private storage: Storage,
		private storageMul: StorageMulti,
		private navCtrl: NavController,
		private http: Http,
		private alertCtrl: AlertController,
		private core: Core,
		translate: TranslateService,
		private Toast: Toast,
		config: Config,
	) {
		translate.get('cart').subscribe(trans => this.trans = trans);
		this.getData();
		if (config['required_login']) this.check_require_login = config['required_login'];
		console.log(config);
	}
	ionViewDidEnter() {
		if (this.isCache) this.getData();
		else this.isCache = true;
	}
	getData() {
		this.storageMul.get(['cart', 'coupon', 'login']).then((val) => {
			if (val && val['cart']) this.data = val['cart'];
			else this.checkCart = true;
			if (val && val['coupon']) this.coupon = val['coupon'];
			this.login = val['login'];
			if (this.data && Object.keys(this.data).length > 0) this.validate();
		});
	}
	shop() {
		this.navCtrl.popToRoot();
	}
	delete(id: string) {
		let data = Object.assign({}, this.data);
		delete data[id];
		this.data = data;
		this.update();
	}
	update() {
		this.storage.set('cart', this.data).then(() => { 
			if (Object.keys(this.data).length > 0) this.validate(); 
			else this.checkCart = true;
		});
	}
	validate() {
		this.core.showLoading();
		let params = {};
		let products: Object[] = [];
		new ObjectToArray().transform(this.data).forEach(product => {
			let now = {};
			now['product_id'] = product['id'];
			now['quantity'] = product['quantity'];
			if (product['variation_id']) now['variation_id'] = product['variation_id'];
			products.push(now);
		});
		params['products'] = JSON.stringify(products);
		params['coupons'] = JSON.stringify(this.coupon);
		let option = {};
		if (this.login && this.login['token']) {
			let headers = new Headers();
			headers.set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
			headers.set('Authorization', 'Bearer ' + this.login["token"]);
			option['withCredentials'] = true;
			option['headers'] = headers;
		}
		this.http.post(wordpress_url + '/wp-json/wooconnector/calculator/addcoupons', this.core.objectToURLParams(params), option)
			.subscribe(res => {
				let resp = res.json();
				this.core.hideLoading();
				this.tax = 0;
				if (resp['errors']) {
					let message: string = '';
					for (var key in resp['errors']) {
						if (resp['errors'][key] && resp['errors'][key]['errors']) {
							for (var key1 in resp['errors'][key]['errors']) {
								if (resp['errors'][key]['errors'][key1]) {
									message += resp['errors'][key]['errors'][key1][0];
								}
							}
						}
					}
					if (resp['discount']) {
						let coupon = [];
						resp['discount'].forEach(item => {
							coupon.push(item['code']);
						});
						this.storage.set('coupon', coupon).then(() => {
							this.coupon = coupon;
						});
					}
					this.couponData = [];
					this.coupon.forEach(item => {
						this.couponData.push({ code: item });
					});
					this.showAlert(message);
				} else this.invalid = false;
				if (resp['discount']) {
					if (Array.isArray(resp['tax'])) resp['tax'].forEach(tax => this.tax += tax['value']);
					this.couponData = resp['discount'];
				} else {
					resp['total'].forEach(product => this.tax += product['tax']);
				}
			}, error => {
				if (error.json()['message']) {
					this.couponData = [];
					this.coupon.forEach(item => {
						this.couponData.push({ code: item });
					});
					this.invalid = true;
					this.core.hideLoading();
					this.showAlert(error.json()['message']);
				}
			});
	}
	showAlert(message: string) {
		if (message == 'Sorry, Coupon only one.') {
			message +=  this.trans["remove_couponOnly"];
			let alert = this.alertCtrl.create({
				message: message,
				cssClass: 'alert-no-title',
				buttons: [
			      {
			        text: this.trans["confirm"]["no"],
			        role: 'cancel'
			      },
			      {
			        text: this.trans["confirm"]["yes"],
			        handler: () => {
			          	this.coupon = [];
                        this.couponData = [];
                        this.storage.remove('coupon');
                        this.apply();
			        }
			      }
			    ]
			});
			alert.present();
		} else {
			let alert = this.alertCtrl.create({
				message: message,
				cssClass: 'alert-no-title',
				buttons: [
					{
						text: this.trans['validate'],
						 handler: () => {
				          	this.couponCode = '';
				        }
					}
				]
			});
			alert.present();
		}
	}
	apply() {
		if (this.couponCode && this.coupon.indexOf(this.couponCode) != -1) {
			this.Toast.showShortBottom(this.trans["already_applied"]).subscribe(
				toast => { },
				error => { console.log(error); }
			);
			return;
		}
		this.core.showLoading();
		let params = {};
		let products: Object[] = [];
		new ObjectToArray().transform(this.data).forEach(product => {
			let now = {};
			now['product_id'] = product['id'];
			now['quantity'] = product['quantity'];
			if (product['variation_id']) now['variation_id'] = product['variation_id'];
			products.push(now);
		});
		params['products'] = JSON.stringify(products);
		let coupon: String[];
		if (this.couponCode && this.coupon.indexOf(this.couponCode) == -1) coupon = this.coupon.concat(this.couponCode);
		else coupon = this.coupon.slice();
		params['coupons'] = JSON.stringify(coupon);
		let option = {};
		if (this.login && this.login['token']) {
			let headers = new Headers();
			headers.set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
			headers.set('Authorization', 'Bearer ' + this.login["token"]);
			option['withCredentials'] = true;
			option['headers'] = headers;
		}
		this.http.post(wordpress_url + '/wp-json/wooconnector/calculator/addcoupons', this.core.objectToURLParams(params), option)
			.subscribe(res => {
				let resp = res.json();
				this.core.hideLoading();
				// this.tax = 0;
				if (resp['errors']) {
					let message: string = '';
					for (var key in resp['errors']) {
						if (resp['errors'][key] && resp['errors'][key]['errors']) {
							for (var key1 in resp['errors'][key]['errors']) {
								if (resp['errors'][key]['errors'][key1]) {
									message += resp['errors'][key]['errors'][key1][0];
								}
							}
						}
					}
					this.showAlert(message);
				} else {
					if (resp['discount']) {
						if (Array.isArray(resp['tax'])) resp['tax'].forEach(tax => this.tax += tax['value']);
						this.storage.set('coupon', coupon).then(() => {
							this.coupon = coupon;
							this.couponData = resp['discount'];
							this.couponCode = null;
							this.Toast.showShortBottom(this.trans["add"]).subscribe(
								toast => { },
								error => { console.log(error); }
							);
						});
					} else {
						resp['total'].forEach(product => this.tax += product['tax']);
					}
				}
			}, error => {
				if (error.json()['message']) {
					this.core.hideLoading();
					let alert = this.alertCtrl.create({
						message: error.json()['message'],
						cssClass: 'alert-no-title',
						buttons: [this.trans['validate']]
					});
					alert.present();
				}
			});
	}
	remove(index: Number) {
		if (this.coupon.length == 1) {
			this.storage.remove('coupon').then(() => {
				this.coupon = [];
				this.couponData = [];
				this.validate();
				this.Toast.showShortBottom(this.trans["remove"]).subscribe(
					toast => { },
					error => { console.log(error); }
				);
			});
		} else {
			let coupon = this.coupon.slice(0);
			coupon.splice(Number(index), 1);
			this.storage.set('coupon', coupon).then(() => {
				this.coupon.splice(Number(index), 1);
				this.couponData.splice(Number(index), 1);
				this.validate();
				this.Toast.showShortBottom(this.trans["remove"]).subscribe(
					toast => { },
					error => { console.log(error); }
				);
			});
		}
	}
	total(): Number {
		let total = 0;
		for (var key in this.data) {
			let product = this.data[key];
			if (Number(product.sale_price) > 0) {
				total += Number(product.sale_price) * product.quantity;
			} else {
				total += Number(product.regular_price) * product.quantity;
			}
		}
		return total;
	}
	gotoAddress() {
		if (this.check_require_login) {
			if (this.login) this.navCtrl.push(this.AddressPage);
			else this.navCtrl.push(this.LoginPage);
		} else{
			if (this.login) this.navCtrl.push(this.AddressPage);
			else {
				let alert = this.alertCtrl.create({
					message: this.trans['confirm']['message'],
					cssClass: 'alert-no-title alert-signout',
					buttons: [
						{
							text: this.trans['confirm']["no"],
							cssClass: 'dark',
							handler: () => {
								this.navCtrl.push(this.AddressPage);
							}
						},
						{
							text: this.trans['confirm']["yes"],
							handler: () => {
								this.navCtrl.push(this.LoginPage);
							}
						}
					]
				});
				alert.present();	
			}
		}
	}
}