import { Component } from '@angular/core';
import { NavController, AlertController } from 'ionic-angular';
import { Http } from '@angular/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// Custom
import { Core } from '../../service/core.service';
import { Storage } from '@ionic/storage';
import { TranslateService } from '../../module/ng2-translate';
import { Toast } from '@ionic-native/toast';

//Page
import { SignupPage } from '../signup/signup';

declare var wordpress_url;

@Component({
	selector: 'page-login',
	templateUrl: 'login.html',
	providers: [Core]
})
export class LoginPage {
	wordpress_user:string = wordpress_url+'/wp-json/mobiconnector/user';
	SignupPage = SignupPage;
	formLogin: FormGroup;
	wrong:boolean;
	trans:Object = {};
	constructor(
		private formBuilder: FormBuilder,
		private http: Http,
		private core: Core,
		private storage: Storage,
		private navCtrl: NavController,
		private alertCtrl: AlertController,
		translate: TranslateService,
		private Toast: Toast
	){
		this.formLogin = formBuilder.group({
			username: ['', Validators.required],
			password: ['', Validators.required]
		});
		translate.get('login').subscribe(trans => { if(trans) this.trans = trans; });
	}
	login(){
		this.core.showLoading();
		this.http.post(wordpress_url+'/wp-json/mobiconnector/jwt/token', this.formLogin.value)
		.subscribe(
			res => {
				let login = res.json();
				login.username = this.formLogin.value.username;
				let params = this.core.objectToURLParams({'username':login["username"]});
				this.http.post(this.wordpress_user+'/get_info', params).subscribe(user => {
					this.core.hideLoading();
					this.storage.set('user', user.json()).then(() => {
						this.storage.set('login', login).then(() => this.navCtrl.pop());
					});
				}, err => {
					this.core.hideLoading();
					this.formLogin.patchValue({password: null});
					this.wrong = true;
				});
			},
			err => {
				this.core.hideLoading();
				this.formLogin.patchValue({password: null});
				this.wrong = true;
			},
			
		);
	}
	forgot(){
		let alert = this.alertCtrl.create({
			title: this.trans["forgot_title"],
			message: this.trans["forgot_body"],
			cssClass: 'alert-forgot',
			inputs: [
				{
					name: 'username',
					placeholder: this.trans["forgot_placeholder"],
				}
			],
			buttons: [
				{
					text: '',
					cssClass: 'button-cancel'
				},
				{
					text: this.trans["forgot_send"],
					cssClass: 'button-confirm',
					handler: data => {
						if(data.username){
							this.core.showLoading();
							this.http.post(wordpress_url+'/wp-json/mobiconnector/user/forgot_password',
								this.core.objectToURLParams({username: data.username})
							).subscribe(res => {
								this.core.hideLoading();
								this.Toast.showShortBottom(this.trans["forgot_success"]).subscribe(
									toast => {},
									error => {console.log(error);}
								);
							}, err => {
								this.core.hideLoading();
								this.Toast.showShortBottom(err.json()["message"]).subscribe(
									toast => {},
									error => {console.log(error);}
								);
							});
						} else {
							this.Toast.showShortBottom(this.trans["forgot_err"]).subscribe(
								toast => {},
								error => {console.log(error);}
							);
						}
					}
				}
			]
		});
		alert.present();
	}
}