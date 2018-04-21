import { Injectable } from '@angular/core';
import { URLSearchParams } from '@angular/http';
import { LoadingController, Platform } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';

// Custom
import { Network } from '@ionic-native/network';
import { Config } from './config.service';

declare var request_timeout: Number;

@Injectable()
export class Core {
	loading: any;
	isLoading:boolean;
	constructor(
		public loadingCtrl: LoadingController,
		public platform: Platform,
		private Network: Network,
		config: Config
	) {}
	objectToURLParams(object): URLSearchParams {
		let params: URLSearchParams = new URLSearchParams();
		for (var key in object) {
			if (object.hasOwnProperty(key)) {
				if(Array.isArray(object[key])){
					object[key].forEach(val => {
						params.append(key+'[]', val);
					});
				}
				else params.set(key, object[key]);
			}
		}
		return params;
	}
	showLoading(content:string = null) {
		if(!this.isLoading){
			this.isLoading = true;
			this.loading = this.loadingCtrl.create({
				content: content
			});
			this.loading.onDidDismiss(() => {
				this.isLoading = false
			});
			this.loading.present();
			setTimeout(() => { this.hideLoading() }, request_timeout);
			this.platform.ready().then(() => {
				if(this.Network.type == "none") this.hideLoading();
				this.Network.onDisconnect().subscribe(() => { this.hideLoading(); });
			});
		}
	}
	hideLoading() { if(this.isLoading) this.loading.dismiss(); }
	getVariation(variations:Object[], attributes:Object[]):Observable<Object> {
		return new Observable(observable => {
			let variation:any;
			let _attr = JSON.stringify(attributes).toLowerCase();
			let maxEqual = 0;
			variations.forEach(val => {
				let equalAttr = 0;
				val["attributes"].forEach(attr => {
					console.log(_attr);
					console.log(attr);
					delete attr['taxanomy'];
					delete attr['slug'];
					if(_attr.indexOf(JSON.stringify(attr).toLowerCase()) != -1) equalAttr++;
				});
				if(equalAttr > maxEqual && equalAttr == val["attributes"].length) {
					variation = val;
					maxEqual = equalAttr;
				}
			});
			if(!variation) variation = variations.filter(
				item => item["attributes"].length == 0
			)[0];
			observable.next(variation);
			observable.complete();
		});
	}
	filterProfile(profile:Object):any {
		if(!profile) profile = {};
		return {
			billing_first_name: profile['billing_first_name'],
			billing_last_name: profile['billing_last_name'],
			billing_company: profile['billing_company'],
			billing_country: profile['billing_country'],
			billing_state: profile['billing_state'],
			billing_address_1: profile['billing_address_1'],
			billing_address_2: profile['billing_address_2'],
			billing_city: profile['billing_city'],
			billing_postcode: profile['billing_postcode'],
			billing_phone: profile['billing_phone'],
			shipping_first_name: profile['shipping_first_name'],
			shipping_last_name: profile['shipping_last_name'],
			shipping_company: profile['shipping_company'],
			shipping_country: profile['shipping_country'],
			shipping_state: profile['shipping_state'],
			shipping_address_1: profile['shipping_address_1'],
			shipping_address_2: profile['shipping_address_2'],
			shipping_city: profile['shipping_city'],
			shipping_postcode: profile['shipping_postcode']
		};
	}
	addSortToSearchParams(params: Object, sort_type: String) {
    	if(sort_type == "-date") {
            params['post_order_by'] = 'date';
            params['post_order_page'] = 'ASC';
        } else if (sort_type == 'price') {
            params['price_sort'] = 1;
            params['post_order_page'] = 'ASC';
        } else if (sort_type == '-price') {
            params['price_sort'] = 1;
            params['post_order_page'] = 'DESC';
        } else if (sort_type == '-name') {
            params['name_sort'] = 1;
            params['post_order_page'] = 'DESC';
        } else if (sort_type == 'name') {
            params['name_sort'] = 1;
            params['post_order_page'] = 'ASC';
        } else if (sort_type == 'popularity') {
        	params['popularity_sort'] = 1;
        	params['post_order_page'] = 'DESC';
        } else if (sort_type == 'rating') {
        	params['rating_sort'] = 1;
        	params['post_order_page'] = 'DESC';
        }
        return params;
    }
}