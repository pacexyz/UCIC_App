import { Component, ViewChild } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Http } from '@angular/http';

// Custom
import { Core } from '../../service/core.service';

// Page
import { DetailCategoryPage } from '../detail-category/detail-category';
import { SearchPage } from '../search/search';

declare var wordpress_url:string;

@Component({
	selector: 'page-categories',
	templateUrl: 'categories.html',
	providers: [Core]
})
export class CategoriesPage {
	@ViewChild('cart') buttonCart;
	DetailCategoryPage = DetailCategoryPage;
	SearchPage = SearchPage;
	parents:Object[] = [];
	id:Number;
	noResuilt:boolean = false;
	constructor(
		private http: Http,
		private core: Core,
		private navCtrl: NavController
	){
		core.showLoading();
		let params = {cat_num_page:1, cat_per_page:100, parent: '0'};
		let loadCategories = () => {
			http.get(wordpress_url+'/wp-json/wooconnector/product/getcategories', {
				search:core.objectToURLParams(params)
			}).subscribe(res => {
				this.parents = this.parents.concat(res.json());
				if(res.json() && res.json().length == 100){
					this.noResuilt = false;
					params.cat_num_page++;
					loadCategories();
				} else {
					this.noResuilt = true;
					core.hideLoading();
				}
			});
		};
		loadCategories();
	}
	ionViewDidEnter(){
		this.buttonCart.update();
	}
	onSwipeContent(e){
		if(e['deltaX'] < -150 || e['deltaX'] > 150){
			if(e['deltaX'] < 0) this.navCtrl.push(this.SearchPage);
			else this.navCtrl.popToRoot();
		}
	}
}