import { Component } from '@angular/core';
import { ViewController, NavParams, NavController } from 'ionic-angular';
import { Http, Headers } from '@angular/http';

// Custom
import { Core } from '../../service/core.service';
import { Storage } from '@ionic/storage';
import { Toast } from '@ionic-native/toast';
import { TranslateService } from '../../module/ng2-translate';

// Page
import { LoginPage } from '../login/login';

declare var wordpress_url;

@Component({
	selector: 'page-rating',
	templateUrl: 'rating.html',
	providers: [Core]
})
export class RatingPage {
	LoginPage = LoginPage;
	id:Number;
	ratingValue:Number;
	name:String;
	email:String;
	comment:String;
	login:Object = {};
	trans:Object;
	
	constructor(
		public viewCtrl: ViewController,
		navParams: NavParams,
		private navCtrl: NavController,
		private http:Http,
		private core:Core,
		private storage: Storage,
		translate: TranslateService,
		private Toast: Toast
	){
		translate.get('rating').subscribe(trans => this.trans = trans);
		this.id = navParams.get("id");
	}
	ionViewDidEnter(){
		this.storage.get('login').then(login => { if(login) this.login = login; });
	}
	dismiss(reload:boolean = false){
		this.viewCtrl.dismiss(reload);
	}
	rating(){
		let params:any = {
			product: this.id,
			comment: this.comment,
			ratestar: this.ratingValue,
			namecustomer: this.name,
			emailcustomer: this.email
		};
		let option:Object = {};
		if(this.login && this.login["token"]){
			let headers = new Headers();
			headers.set('Content-Type', 'application/json; charset=UTF-8');
			headers.set('Authorization', 'Bearer '+this.login["token"]);
			option['headers'] = headers,
			option['withCredentials'] = true;
		}
		this.core.showLoading();
		this.http.post(wordpress_url+'/wp-json/wooconnector/product/postreviews', params, option)
		.subscribe(res => {
			this.core.hideLoading();
			if(res.json()["result"] == "success") this.dismiss(true);
			else this.Toast.showShortBottom(this.trans["fail"]).subscribe(
				toast => {},
				error => {console.log(error);}
			);
		}, err => {
			this.core.hideLoading();
			if(err.status == 401) this.navCtrl.push(this.LoginPage);
			else this.Toast.showShortBottom(err.json()['message']).subscribe(
				toast => {},
				error => {console.log(error);}
			);
		});
	}
}