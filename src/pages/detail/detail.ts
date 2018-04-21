import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, AlertController, Platform } from 'ionic-angular';
import { Http } from '@angular/http';

// Custom
import { Core } from '../../service/core.service';
import { Storage } from '@ionic/storage';
import { Toast } from '@ionic-native/toast';
import { SocialSharing } from '@ionic-native/social-sharing';
import { TranslateService } from '../../module/ng2-translate';
import { PhotoViewer } from '@ionic-native/photo-viewer';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { Observable } from 'rxjs/Observable';

//Pipes
import { ObjectToArray } from '../../pipes/object-to-array';

//Page
import { CommentsPage } from '../comments/comments';

declare var wordpress_url: string;
declare var cordova: any;
declare var display_mode: string;

@Component({
	selector: 'page-detail',
	templateUrl: 'detail.html',
	providers: [Core, ObjectToArray, PhotoViewer]
})
export class DetailPage {
	CommentsPage = CommentsPage;
	DetailPage = DetailPage;
	@ViewChild('cart') buttonCart;
	id: Number; slides: Number = 1; quantity: Number = 1; variation: Number;
	detail: any = { wooconnector_crop_images: [] }; attributes: any = {}; rating:Number; ratingCount:Number; reviewCount:Object = [];
	description: string;
	reviews_allowed: boolean;
	favorite: Object = {}; trans: Object = {};
	viewMore: boolean = false;
	images: Object; groupedProduct: Object[];
	page = 1; over: boolean;
	display: string;

	constructor(
		navParams: NavParams,
		private core: Core,
		private http: Http,
		private storage: Storage,
		translate: TranslateService,
		private alertCtrl: AlertController,
		private navCtrl: NavController,
		private Toast: Toast,
		private SocialSharing: SocialSharing,
		private PhotoViewer: PhotoViewer,
		private platform: Platform,
		private InAppBrowser: InAppBrowser
	) {
		this.display = display_mode;
		translate.get('detail').subscribe(trans => this.trans = trans);
		this.id = navParams.get("id");
		this.storage.get('favorite').then((val) => { if (val) this.favorite = val; });
		this.getData();
	}
	ionViewDidEnter() {
		this.buttonCart.update();
	}
	getData() {
		// let params = { product_id: this.id };
		this.core.showLoading();
		this.http.get(wordpress_url + '/wp-json/wooconnector/product/getproduct/' + this.id).subscribe(res => {
			this.detail = res.json();
			this.reviews_allowed = this.detail['reviews_allowed'];
			this.rating = this.detail['average_rating'];
			this.ratingCount = this.detail['rating_count'];
			this.reviewCount = this.detail['wooconnector_reviews'];
			this.description = this.detail['description']
			if (!this.detail['wooconnector_crop_images']) {
				let noImages = { wooconnector_large: 'assets/images/no-image.png' };
				this.detail['wooconnector_crop_images'] = [];
				this.detail['wooconnector_crop_images'].push(noImages);
			}
			if (this.detail['type'] == 'grouped') {
				this.groupedProduct = this.detail['grouped_products'].slice();
				this.groupedProduct.forEach(product => {
					product['quantity'] = 1;
				});
			}
			if (this.detail['type'] == 'variable') this.images = this.detail['wooconnector_crop_images'].slice();
			//create attributes
			if (this.detail.attributes) {
				this.detail.attributes.forEach((val) => {
					if (val["variation"]) {
						this.attributes[val["name"]] = {};
						this.attributes[val["name"]].id = val["id"];
						this.attributes[val["name"]].name = val["name"];
						this.attributes[val["name"]].option = val["options"][0].toLowerCase();
					}
				});
			}
			// //default_attributes
			if(this.detail.default_attributes.length > 0) {
				this.detail.default_attributes.forEach((val) => {
					this.attributes[val["name"]].option = val["option"].toLowerCase();
				});
			}
			this.getVariation();
			this.core.hideLoading();
			// this.http.get(wordpress_url + '/wp-json/mobiconnector/post/counter_view?post_id=' + this.id)
			// 	.subscribe(() => { this.core.hideLoading(); });
		});
	}
	getProducts(): Observable<Object[]> {
		return new Observable(observable => {
			let params = { look_num_page: this.page, look_per_page: 10 };
			this.http.get(wordpress_url + '/wp-json/wooconnector/product/getproduct/'+ this.id, {
				search: this.core.objectToURLParams(params)
			}).subscribe(products => {
				observable.next(products.json());
				observable.complete();
			});
		});
	}
	load(infiniteScroll) {
		this.page++;
		this.getProducts().subscribe(products => {
			console.log(products);
			if (products) {
				console.log(products['modernshop_look_images']);
				this.page++;
				this.detail['modernshop_look_images'] = this.detail['modernshop_look_images'].concat(products['modernshop_look_images']);
			} else this.over = true;
			infiniteScroll.complete();
		});
	}
	changeSlides(event) {
		if(!event.realIndex) event.realIndex = 0;
		this.slides = event.realIndex + 1;
	}
	changeFavorite() {
		if (this.favorite[Number(this.id)]) {
			delete this.favorite[Number(this.id)];
			this.storage.set('favorite', this.favorite).then(() => {
				this.Toast.showShortBottom(this.trans["favorite"]["remove"]).subscribe(
					toast => { },
					error => { console.log(error); }
				);
			});
		} else {
			let data: any = {
				id: this.id,
				name: this.detail["name"],
				on_sale: this.detail["on_sale"],
				price_html: this.detail["price_html"],
				regular_price: this.detail["regular_price"],
				sale_price: this.detail["sale_price"],
				price: this.detail["price"],
				type: this.detail["type"]
			};
			if (this.detail["modernshop_images"]) data['images'] = this.detail["modernshop_images"][0].modern_square;
			this.favorite[Number(this.id)] = data;
			this.storage.set('favorite', this.favorite).then(() => {
				this.Toast.showShortBottom(this.trans["favorite"]["add"]).subscribe(
					toast => { },
					error => { console.log(error); }
				);
			});
		}
	}
	viewImage(src: string) {
		if(!this.platform.is('cordova')) return;
		this.PhotoViewer.show(src);
	}
	getVariation() {
		if (this.detail["type"] == "variable" && this.detail["variations"].length > 0) {
			let attr = new ObjectToArray().transform(this.attributes);
			this.core.getVariation(this.detail["variations"], attr).subscribe(
				res => {
					if (res) {
						this.variation = res["id"];
						let _res = Object.assign({}, res);
						delete _res["id"];
						delete _res["attributes"];
						delete _res["type"];
						_res['wooconnector_crop_images'] = _res['wooconnector_crop_images'].concat(this.images);
						this.detail = Object.assign(this.detail, _res);
					} else {
						this.variation = 0;
						this.noVariation();
					}
				}
			);
		}
	}
	share() {
		this.SocialSharing.share(null, null, null, this.detail["permalink"]);
	}
	addToCart() {
		if (!this.detail['in_stock']) {
			this.Toast.showShortBottom(this.trans["outStock"]).subscribe(
				toast => { },
				error => { console.log(error); }
			);
			return;
		}
		if (this.detail['type'] == 'external') this.external(this.detail['external_url']);
		else if (this.detail['type'] == 'grouped') this.grouped();
		else {
			if (this.detail["manage_stock"] && this.quantity > this.detail["stock_quantity"] && !this.detail['backorders_allowed']) {
				this.Toast.showShortBottom(this.trans["out_of_quantity"] + this.detail["stock_quantity"])
					.subscribe(
					toast => { },
					error => { console.log(error); }
					);
				return;
			}
			let data: any = {};
			let idCart: string = this.id.toString();
			if (this.detail["type"] == "variable") {
				if (this.variation != 0) {
					data.variation_id = this.variation;
					// idCart += '_' + this.variation;
				} else {
					this.noVariation();
					return;
				}
			}
			data.idCart = idCart;
			data.id = this.detail["id"];
			data.name = this.detail["name"];
			if (this.detail["wooconnector_crop_images"])
				data.images = this.detail["wooconnector_crop_images"][0].wooconnector_medium;
			data.attributes = this.attributes;
			data.regular_price = this.detail["regular_price"];
			data.sale_price = this.detail["sale_price"];
			data.price = this.detail["price"];
			data.quantity = this.quantity;
			data.sold_individually = this.detail['sold_individually'];
			this.storage.get('cart').then((val) => {
				let individually: boolean = false;
				if (!val) val = {};
				if (!val[idCart]) val[idCart] = data;
				else {
					if (!this.detail['sold_individually']) val[idCart].quantity += data.quantity;
					else individually = true;
				}
				if (individually) {
					this.Toast.showShortBottom(this.trans['individually']['before'] + this.detail['name'] + this.trans['individually']['after']).subscribe(
						toast => { },
						error => { console.log(error); }
					);
				} else this.storage.set('cart', val).then(() => {
					this.buttonCart.update();
					if (!this.detail['in_stock'] && this.detail['backorders'] == 'notify') {
						this.Toast.showShortBottom(this.trans["addOut"]).subscribe(
							toast => { },
							error => { console.log(error); }
						);
					} else {
						this.Toast.showShortBottom(this.trans["add"]).subscribe(
							toast => { },
							error => { console.log(error); }
						);
					}
				});
			});
		}
	}
	external(link: string) {
		// cordova["InAppBrowser"].open(link, '_system');
		this.InAppBrowser.create(link, "_system");
	}
	grouped() {
		if (this.groupedProduct) {
			this.storage.get('cart').then((val) => {
				if (!val) val = {};
				let alertContent = '';
				this.groupedProduct.forEach(product => {
					if (product['type'] == 'simple' && product['quantity'] > 0) {
						if (product['manage_stock'] && product['quantity'] >= product['stock_quantity'] && !product['backorders_allowed']) {
							alertContent += product['title'] + ' ' + this.trans['out_of_quantity'] + product['stock_quantity'] + '<br/>';
						} else {
							if (!val[product['id']]) {
								let now: Object = {};
								now['idCart'] = product['id'];
								now['id'] = product['id'];
								now['name'] = product['title'];
								if (product['wooconnector_crop_images'])
									now['images'] = product['wooconnector_crop_images'].wooconnector_medium;
								now['regular_price'] = product['regular_price'];
								now['sale_price'] = product['sale_price'];
								now['price'] = product['price'];
								now['quantity'] = Number(product['quantity']);
								now['sold_individually'] = product['sold_individually'];
								val[product['id']] = now;
							} else {
								if (!product['sold_individually']) val[product['id']]['quantity'] += product['quantity'];
								else alertContent += this.trans['individually']['before'] + product['title'] + this.trans['individually']['after'] + '<br/>';
							}
							product['quantity'] = 1;
						}
					}
				});
				this.storage.set('cart', val).then(() => {
					this.buttonCart.update();
					if (alertContent != '') {
						let alert = this.alertCtrl.create({
							cssClass: 'alert-no-title',
							message: alertContent,
							buttons: [this.trans['grouped']['button']]
						});
						alert.present();
					} else {
						this.Toast.showShortBottom(this.trans["add"]).subscribe(
							toast => { },
							error => { console.log(error); }
						);
					}
				});
			});
		}
	}
	noVariation() {
		this.Toast.showShortBottom(this.trans["have_not_variation"]).subscribe(
			toast => { },
			error => { console.log(error); }
		);
	}
	doRefresh(refresher) {
		this.getData();
		refresher.complete();
	}
	popToRoot() {
		this.navCtrl.popToRoot();
	}
	onSwipe(e) {
		if (e['deltaX'] < -150 || e['deltaX'] > 150) {
			if (e['deltaX'] > 0 && this.detail['wooconnector_previous_product']) {
				this.navCtrl.push(this.DetailPage, { id: this.detail['wooconnector_previous_product'] }).then(() => {
					this.navCtrl.remove(this.navCtrl.getActive().index - 1);
				});
			} else if (e['deltaX'] < 0 && this.detail['wooconnector_next_product']) {
				this.navCtrl.push(this.DetailPage, { id: this.detail['wooconnector_next_product'] }).then(() => {
					this.navCtrl.remove(this.navCtrl.getActive().index - 1);
				});
			}
		}
	}
}