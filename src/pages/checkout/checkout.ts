import { Component } from '@angular/core';
import { NavController, Platform, AlertController, ModalController} from 'ionic-angular';
import { Http, Headers } from '@angular/http';

// Custom
import { StorageMulti } from '../../service/storage-multi.service';
import { Core } from '../../service/core.service';
import { TranslateService } from '../../module/ng2-translate';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { Toast } from '@ionic-native/toast';
import { Config } from '../../service/config.service';
//Pipes
import { ObjectToArray } from '../../pipes/object-to-array';

// Page
import { AddressPage } from '../address/address';
import { ThanksPage } from '../thanks/thanks';
import { TermsPage } from '../terms/terms';
declare var wordpress_url;

@Component({
	selector: 'page-checkout',
	templateUrl: 'checkout.html',
	providers: [Core, StorageMulti, ObjectToArray]
})
export class CheckoutPage {
	AddressPage = AddressPage;
	ThanksPage = ThanksPage;
	TermsPage = TermsPage;
	login: Object; user: Object; cart: Object; coupon: Object[] = []; data: any;
	shipping: string; payment: string; products: Object[];
	trans: string; useBilling: boolean; checkCondition: boolean;

	constructor(
		private storageMul: StorageMulti,
		private core: Core,
		private navCtrl: NavController,
		private http: Http,
		private platform: Platform,
		private InAppBrowser: InAppBrowser,
		private Toast: Toast,
		translate: TranslateService,
		private alertCtrl: AlertController,
		public modalCtrl: ModalController,
		public config: Config,
	) {
		translate.get('checkout').subscribe(trans => this.trans = trans);
		core.showLoading();
		console.log(this.trans);
		console.log(config);
	}
	ionViewDidEnter() {
		this.core.showLoading();
		this.storageMul.get(['login', 'user', 'cart', 'coupon', 'useBilling']).then(val => {
			if (val["login"] && val["login"]["token"]) this.login = val["login"];
			if (val["user"]) this.user = val["user"];
			if (val["cart"]) {
				this.cart = val["cart"];
				if (this.user) {
					this.products = [];
					new ObjectToArray().transform(this.cart).forEach(product => {
						let now = {};
						now['product_id'] = product['id'];
						now['quantity'] = product['quantity'];
						if (product['variation_id']) now['variation_id'] = product['variation_id'];
						this.products.push(now);
					});
					let params = {};
					params['products'] = JSON.stringify(this.products);
					if (val['coupon']) params['coupons'] = JSON.stringify(val['coupon']);
					params['country'] = this.user['shipping_country'];
					params['states'] = this.user['shipping_state'];
					params['postcode'] = this.user['shipping_postcode'];
					let option = {
						search: this.core.objectToURLParams(params)
					};
					if (this.login && this.login['token']) {
						let headers = new Headers();
						headers.set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
						headers.set('Authorization', 'Bearer ' + this.login["token"]);
						option['withCredentials'] = true;
						option['headers'] = headers;
					}
					this.http.get(wordpress_url + '/wp-json/wooconnector/calculator/getall', option).subscribe(res => {
						this.data = res.json();
						if (this.data['total']['discount']) {
							this.coupon = this.data['total']['discount'];
						}
						if (this.data['shipping'] && this.data['shipping'].length > 0) {
							this.data['shipping'].forEach(shipping => {
								shipping['cost'] = Number(shipping['price']) + Number(shipping['tax']);
							});
							this.changeShipping(this.data['shipping'][0]);
						} else this.data['_shipping_tax'] = 0;
						if (this.data['payment']) this.payment = this.data['payment'][0]['id'];
						this.data['_total'] = 0;
						this.data['_tax'] = 0;
						let product: Object[];
						if (!this.data['total']['discount']) product = this.data['total'];
						else product = this.data['total']['baseitem'];
						if (product && !product['errors']) {
							if (!this.data['total']['discount']) {
								product['total'].forEach(val => {
									this.data['_tax'] += val['tax'];
									this.data['_total'] += val['subtotal'];
								});
							} else {
								if (this.data['total']['tax'])
									this.data['total']['tax'].forEach(tax => this.data['_tax'] += tax['value']);
								this.data['_total'] = this.data['total']['subtotal'];
							}
						} else if (this.data['total']['errors']) {
							let message: string = '';
							for (var key in this.data['total']['errors']) {
								if (this.data['total']['errors'][key]) message += ' ' + this.data['total']['errors'][key][0];
							}
							this.showAlert(message);
						}
						this.core.hideLoading();
					});
				}
			}
			if(val['useBilling'] == true) this.useBilling = true;
			else this.useBilling = false;
		});
	}
	total(): Number {
		let total: Number = this.data['_total'] + this.data['_tax'];
		if (this.data['_shipping']) total += this.data['_shipping'];
		if (this.data['_shipping_tax']) total += this.data['_shipping_tax'];
		this.coupon.forEach(val => {
			total = Number(total) - (val['value']);
		});
		if (total < 0) total = 0;
		return total;
	}
	changeShipping(shipping) {
		this.shipping = shipping['id'];
		this.data['_shipping'] = Number(shipping['price']);
		this.data['_shipping_tax'] = 0;
		if (shipping['tax']) shipping['tax'].forEach(tax => this.data['_shipping_tax'] += tax['value']);
	}
	confirm() {
		this.core.showLoading();
		let params = {};
		params['products'] = JSON.stringify(this.products);
		Object.assign(params, this.core.filterProfile(this.user));
		params['billing_email'] = this.user['user_email'];
		params['shipping_method'] = this.shipping;
		params['payment_method'] = this.payment;
		if(this.useBilling) params['ship_to_different_address'] = 0;
		else params['ship_to_different_address'] = 1;
		if (this.coupon) {
			let coupon: string[] = [];
			this.coupon.forEach(item => coupon.push(item['code']));
			params['coupons'] = JSON.stringify(coupon);
		}
		params = this.core.objectToURLParams(params);
		if (this.login && this.login['token']) {
			let headers = new Headers();
			headers.set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
			headers.set('Authorization', 'Bearer ' + this.login["token"]);
			this.http.post(wordpress_url + '/wp-json/wooconnector/checkout/processcheckout', params, {
				headers: headers,
				withCredentials: true
			}).subscribe(res => {
				this.core.hideLoading();
				this.checkout(res.json());
			}, err => {
				this.core.hideLoading();
				this.showAlert(err.json()['message']);
			});
		} else {
			this.http.post(wordpress_url + '/wp-json/wooconnector/checkout/processcheckout', params)
				.subscribe(res => {
					this.core.hideLoading();
					this.checkout(res.json());
				}, err => {
					this.core.hideLoading();
					this.showAlert(err.json()['message']);
				});
		}
	}
	showAlert(message: string) {
		let alert = this.alertCtrl.create({
			message: message,
			cssClass: 'alert-no-title',
			buttons: [this.trans['has_error']['button']]
		});
		alert.present();
	}
	checkout(res) {
		let order_id;
		let checkoutUrl = wordpress_url + '/wooconnector-checkout/?data_key=' + res;
		if (this.platform.is('cordova')) {
			this.platform.ready().then(() => {
				let isCheckout: boolean = false;
				let openCheckout = this.InAppBrowser.create(checkoutUrl, '_blank', 'location=no');
				openCheckout.on('loadstart').subscribe(res => {			
					let url = wordpress_url;
					if (res.url.indexOf(url) != 0) url.replace('http', 'https');
					if ((res.url.indexOf(url) == 0 && res.url.indexOf('order-received') != -1) || (res.url.indexOf(url) == 0 && res.url.indexOf('order-pay') != -1)){
						// let params = res.url.split('?');
						// if (params.length > 1 && !isCheckout) {
						// 	isCheckout = true;
						// 	params = params[1].split('&');
						// 	params.forEach(val => {
						// 		let now = val.split('=');
						// 		if (now[0] == 'key' && now['1'].indexOf('wc_order') == 0) {
						// 			let id: any = (res.url.split('?')[0]).split('/');
						// 			id = id[5];
						// 			if (Number.isInteger(Number(id[id.length - 1]))) id = id[id.length - 1];
						// 			else id = id[id.length - 2];
						// 			this.navCtrl.push(this.ThanksPage, { id: id }).then(() => {
						// 				openCheckout.close();
						// 				this.navCtrl.remove(1, this.navCtrl.length() - 2);
						// 				this.storageMul.remove(['cart', 'coupon']);
						// 			});
						// 		}
						// 	});
						// }
						order_id = (res.url.split('?')[0]).split('order-received/')[1].replace("/", "");
						this.navCtrl.push(ThanksPage, {id:order_id}).then(() => {
							openCheckout.close();    
                        	this.storageMul.remove(['cart', 'coupon']);
						});
					} else if (res.url.indexOf('cancel_order') != -1 && res.url.indexOf('paypal.com') == -1) {
                        openCheckout.close();
                    }
				});
				openCheckout.on('loaderror').subscribe(res => {
					openCheckout.close();
					this.Toast.showLongBottom(this.trans['message']).subscribe(
						toast => { },
						error => { console.log(error); }
					);
				});
			});
		}
	}
	showTerms(){
		 let alert = this.alertCtrl.create({
		    title: this.config['text_static']['modern_terms_ofuser_title'],
		    message: this.config['text_static']['modern_description_term_ofuse'],
		    cssClass: 'term-condition',
		    buttons: [
		      {
		        text: this.trans['term_popup']['cancel'],
		        role: 'cancel'
		      },
		      {
		        text: this.trans['term_popup']['accept'],
		        handler: () => {
		          this.checkCondition = true;
		        }
		      }
		    ]
		  });
		  alert.present();
	}
}