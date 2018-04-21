import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Http } from '@angular/http';

// Custom
import { Storage } from '@ionic/storage';
import { CoreValidator } from '../../validator/core';
import { Toast } from '@ionic-native/toast';
import { TranslateService } from '../../module/ng2-translate';

// Page
import { AboutPage } from '../about/about';

declare var wordpress_url:string;

@Component({
	selector: 'page-contact',
	templateUrl: 'contact.html'
})
export class ContactPage {
	AboutPage = AboutPage;
	formContact: FormGroup;
	trans:Object;
	isSend:boolean;

	constructor(
		private navCtrl: NavController,
		private formBuilder: FormBuilder,
		private http: Http,
		storage: Storage,
		translate: TranslateService,
		private Toast: Toast
	){
		this.formContact = formBuilder.group({
			name: ['', Validators.required],
			email: ['', Validators.compose([Validators.required, CoreValidator.isEmail])],
			subject: [''],
			message: ['', Validators.required]
		});
		storage.get('user').then(user => {
			this.formContact.patchValue({
				name: user['display_name'],
				email: user['user_email']
			});
		});
		translate.get('contact').subscribe(trans => this.trans = trans);
	}
	gotoAbout(){
		if(this.navCtrl.getPrevious().component == this.AboutPage) this.navCtrl.pop();
		else this.navCtrl.push(this.AboutPage);
	}
	send(){
		this.isSend = true;
		this.http.post(wordpress_url+'/wp-json/wooconnector/contactus/sendmail', this.formContact.value)
		.subscribe(res => {
			this.isSend = false;
			if(res.json()['result'] == 'success'){
				this.Toast.showShortTop(this.trans["success"]).subscribe(
					toast => {},
					error => {console.log(error);}
				);
				this.formContact.patchValue({message: null});
			} else {
				this.Toast.showShortTop(this.trans["error"]).subscribe(
					toast => {},
					error => {console.log(error);}
				);
			}
		});
	}
}