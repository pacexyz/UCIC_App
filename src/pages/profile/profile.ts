import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Http, Headers } from '@angular/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// Custom
import { Storage } from '@ionic/storage';
import { Core } from '../../service/core.service';
import { CoreValidator } from '../../validator/core';
import { Toast } from '@ionic-native/toast';
import { Camera } from '@ionic-native/camera';
import { TranslateService } from '../../module/ng2-translate';

declare var wordpress_url:string;

@Component({
	selector: 'page-profile',
	templateUrl: 'profile.html',
	providers: [Core]
})
export class ProfilePage {
	wordpress_user:string = wordpress_url+'/wp-json/mobiconnector/user';
	login:Object;
	data:Object;
	formEdit: FormGroup;
	avatar:string;
	trans:string;

	constructor(
		navCtrl: NavController,
		private storage: Storage,
		private http: Http,
		private core: Core,
		private formBuilder: FormBuilder,
		translate: TranslateService,
		private Toast: Toast,
		private Camera: Camera
	){
		translate.get('profile.update_successfully').subscribe(trans => this.trans = trans);
		storage.get('login').then(val => {
			if(val && val["token"]) {
				this.login = val;
				core.showLoading();
				storage.get('user').then(user => {
					core.hideLoading();
					if(user && user["ID"]) {
						this.data = user;
						this.formEdit = formBuilder.group({
							first_name: ['', Validators.required],
							last_name: ['', Validators.required],
							user_email: ['', Validators.compose([Validators.required, CoreValidator.isEmail])],
							user_pass: []
						});
						this.reset();
					} else navCtrl.pop();
				});
			} else navCtrl.pop();
		});
	}
	reset(){
		this.formEdit.patchValue({
			"first_name":this.data["first_name"],
			"last_name":this.data["last_name"],
			"user_email":this.data["user_email"]
		});
		this.avatar = this.data["mobiconnector_avatar"];
	}
	editAvatar(){
		this.Camera.getPicture({
			quality: 100,
			sourceType:0,
			allowEdit: true,
			targetWidth: 180,
			targetHeight: 180,
			destinationType: 0
		}).then((imageData) => {
			this.avatar = 'data:image/jpeg;base64,' + imageData;
		}, (err) => {});
	}
	save(){
		this.core.showLoading();
		let params = this.formEdit.value;
		params["display_name"] = params["first_name"] + " " + params["last_name"];
		if(this.avatar != this.data["mobiconnector_avatar"]) params["user_profile_picture"] = this.avatar;
		params = this.core.objectToURLParams(params);
		let headers = new Headers();
		headers.set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
		headers.set('Authorization', 'Bearer '+this.login["token"]);
		this.http.post(this.wordpress_user+'/update_profile', params, {
			headers: headers,
			withCredentials: true
		}).subscribe(res => {
			this.core.hideLoading();
			this.storage.set('user', res.json());
			this.Toast.showShortBottom(this.trans).subscribe(
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
	}
}
