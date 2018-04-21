import { Component } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { NavController, Platform } from 'ionic-angular';

// Custom
import { CoreValidator } from '../../validator/core';
import { Storage } from '@ionic/storage';
import { StorageMulti } from '../../service/storage-multi.service';
import { Core } from '../../service/core.service';
import { Config } from '../../service/config.service';
import { TranslateService } from '../../module/ng2-translate';
import { Geolocation } from '@ionic-native/geolocation';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { Diagnostic } from '@ionic-native/diagnostic';
import { Device } from '@ionic-native/device';

// Page
import { LoginPage } from '../login/login';
import { CheckoutPage } from '../checkout/checkout';

declare var wordpress_url;

@Component({
  selector: 'page-address',
  templateUrl: 'address.html',
  providers: [Core, StorageMulti, Geolocation, LocationAccuracy, Diagnostic, Device]
})
export class AddressPage {
  LoginPage = LoginPage;
  CheckoutPage = CheckoutPage;
  formAddress: FormGroup;
  login: Object = {};
  data: Object = {};
  rawData: Object;
  isCache: boolean;
  useBilling: boolean;
  statesBilling: any;
  statesShipping: any;
  countries: Object[] = [];
  states: Object = {};
  trans: Object;

  constructor(
    private http: Http,
    private storage: Storage,
    private storageMul: StorageMulti,
    private formBuilder: FormBuilder,
    private core: Core,
    private navCtrl: NavController,
    config: Config,
    translate: TranslateService,
    private Geolocation: Geolocation,
    private LocationAccuracy: LocationAccuracy,
    private platform: Platform,
    private Diagnostic: Diagnostic,
    private Device: Device
  ) {
  	console.log(platform);
    translate.get('states').subscribe(trans => {
      if (trans == 'states') trans = {};
      if (config['countries']) this.countries = config['countries'];
      this.states = Object.assign(trans, config['states']);
    });
    translate.get('address.location').subscribe(trans => this.trans = trans);
    this.formAddress = this.formBuilder.group({
      billing_first_name: ['', Validators.required],
      billing_last_name: ['', Validators.required],
      billing_company: [''],
      billing_address_1: ['', Validators.required],
      billing_address_2: [''],
      billing_city: ['', Validators.required],
      billing_country: ['', Validators.required],
      billing_state: [''],
      billing_postcode: ['', Validators.required],
      billing_phone: ['', Validators.compose([Validators.required, CoreValidator.isPhone])],
      user_email: ['', Validators.compose([Validators.required, CoreValidator.isEmail])],
      shipping_first_name: ['', Validators.required],
      shipping_last_name: ['', Validators.required],
      shipping_company: [''],
      shipping_address_1: ['', Validators.required],
      shipping_address_2: [''],
      shipping_city: ['', Validators.required],
      shipping_country: ['', Validators.required],
      shipping_state: [''],
      shipping_postcode: ['', Validators.required]
    });
    this.getData();
  }
  ionViewDidEnter() {
    if (this.isCache) this.getData();
    else this.isCache = true;
  }
  getData() {
    this.storageMul.get(['login', 'useBilling', 'user']).then(val => {
      if (val['login']) this.login = val['login'];
      if (val['useBilling'] == false) this.useBilling = false;
      else this.useBilling = true;
      if (val['user']) {
        this.data = val['user'];
        this.changeCountryBilling(this.data['billing_country']);
        this.changeCountryShipping(this.data['shipping_country']);
      }
      this.reset();
    });
  }
  reset() {
    this.formAddress.patchValue({
      billing_first_name: this.data["billing_first_name"],
      billing_last_name: this.data["billing_last_name"],
      billing_company: this.data["billing_company"],
      billing_address_1: this.data["billing_address_1"],
      billing_address_2: this.data["billing_address_2"],
      billing_city: this.data["billing_city"],
      billing_country: this.data["billing_country"],
      billing_state: this.data["billing_state"],
      billing_postcode: this.data["billing_postcode"],
      billing_phone: this.data["billing_phone"],
      user_email: this.data["user_email"],
      shipping_first_name: this.data["shipping_first_name"],
      shipping_last_name: this.data["shipping_last_name"],
      shipping_company: this.data["shipping_company"],
      shipping_address_1: this.data["shipping_address_1"],
      shipping_address_2: this.data["shipping_address_2"],
      shipping_city: this.data["shipping_city"],
      shipping_country: this.data["shipping_country"],
      shipping_state: this.data["shipping_state"],
      shipping_postcode: this.data["shipping_postcode"]
    });
    this.rawData = Object.assign({}, this.formAddress.value);
    this.updateShipping();
  }
  updateShipping() {
    if (this.useBilling) {
      this.formAddress.patchValue({
        shipping_first_name: this.formAddress.value["billing_first_name"],
        shipping_last_name: this.formAddress.value["billing_last_name"],
        shipping_company: this.formAddress.value["billing_company"],
        shipping_address_1: this.formAddress.value["billing_address_1"],
        shipping_address_2: this.formAddress.value["billing_address_2"],
        shipping_city: this.formAddress.value["billing_city"],
        shipping_country: this.formAddress.value["billing_country"],
        shipping_state: this.formAddress.value["billing_state"],
        shipping_postcode: this.formAddress.value["billing_postcode"]
      });
    } else {
      this.formAddress.patchValue({
        shipping_first_name: this.data["shipping_first_name"],
        shipping_last_name: this.data["shipping_last_name"],
        shipping_company: this.data["shipping_company"],
        shipping_address_1: this.data["shipping_address_1"],
        shipping_address_2: this.data["shipping_address_2"],
        shipping_city: this.data["shipping_city"],
        shipping_country: this.data["shipping_country"],
        shipping_state: this.data["shipping_state"],
        shipping_postcode: this.data["shipping_postcode"]
      });
      this.changeCountryShipping(this.formAddress.value["shipping_country"]);
    }
  }
  checkUseBilling() {
    if (this.useBilling) this.updateShipping();
  }
  changeCountryBilling(e) {
    if (this.states[e]) {
      this.statesBilling = this.states[e];
      this.formAddress.setControl('billing_state', new FormControl('', Validators.required));
    } else {
      this.statesBilling = null;
      this.formAddress.setControl('billing_state', new FormControl(''));
    }
    if (this.useBilling) this.formAddress.patchValue({
      shipping_country: this.formAddress.value["billing_country"]
    });
  }
  changeCountryShipping(e) {
    if (this.states[e]) {
      this.statesShipping = this.states[e];
      this.formAddress.setControl('shipping_state', new FormControl('', Validators.required));
    } else {
      this.statesShipping = null;
      this.formAddress.setControl('shipping_state', new FormControl(''));
    }
  }
  changeBillingState() {
    if (this.useBilling) this.formAddress.patchValue({
      shipping_state: this.formAddress.value["billing_state"]
    });
  }
  confirm() {
    this.storage.set('useBilling', this.useBilling);
    if (this.useBilling) this.updateShipping();
    if (JSON.stringify(this.rawData) != JSON.stringify(this.formAddress.value)) {
      if (this.login["token"]) {
        let params = this.core.objectToURLParams(this.formAddress.value);
        let headers = new Headers();
        headers.set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
        headers.set('Authorization', 'Bearer ' + this.login["token"]);
        this.core.showLoading();
        this.http.post(wordpress_url + '/wp-json/wooconnector/user/update_profile', params, {
          headers: headers,
          withCredentials: true
        }).subscribe(res => {
          this.data = res.json();
          this.storage.set('user', this.data).then(() => {
            this.gotoCheckout();
          });
          this.core.hideLoading();
        });
      } else {
        this.data = this.formAddress.value;
        this.storage.set('user', this.data).then(() => {
          this.gotoCheckout();
        });
      }
    } else this.gotoCheckout();
  }
  gotoCheckout() {
    if (this.navCtrl.getPrevious() && this.navCtrl.getPrevious().component == this.CheckoutPage)
      this.navCtrl.pop();
    else {
      this.navCtrl.push(this.CheckoutPage).then(() => {
        this.navCtrl.remove(this.navCtrl.getActive().index - 1);
      });
    }
  }
  location() {
    if (!this.platform.is('cordova')) return;
    this.core.showLoading();
    this.LocationAccuracy.canRequest().then(can => {
      if ((!can && this.Device.platform == 'iOS') || (can && this.Device.platform == 'Android')){
        this.LocationAccuracy.request(this.LocationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(() => {
          this.Geolocation.getCurrentPosition({enableHighAccuracy: true}).then(resp => {
            let latlng;
            if (resp['coords']) latlng = resp['coords']['latitude'] + ',' + resp['coords']['longitude'];
            if (!latlng) return;
            this.http.get('http://maps.google.com/maps/api/geocode/json?latlng=' + latlng).subscribe(res => {
              if (res.json()['status'] == 'OK' && res.json()['results']) {
                let address = res.json()['results'][0];
                let city;
                let country;
                address['address_components'].forEach(component => {
                  if (component['types'].indexOf('administrative_area_level_1') != -1)
                    city = component['long_name'];
                  if (component['types'].indexOf('country') != -1)
                    country = component['short_name'];
                });
                this.formAddress.patchValue({
                  billing_address_1: address['formatted_address'],
                  billing_city: city,
                  billing_country: country
                });
              }
            });
            this.core.hideLoading();
          }).catch((error) => {
            this.core.hideLoading();
          });
        }, err => this.core.hideLoading());
      } else {
        this.Diagnostic.requestLocationAuthorization('always').then(res => {
          if (res) this.location();
        });
        this.core.hideLoading();
      }
    });
  }
}
