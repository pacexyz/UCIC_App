import { Component, Input } from '@angular/core';
import { NavController } from 'ionic-angular';

// Custom
import { CartPage } from '../../pages/cart/cart';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'button-cart',
  templateUrl: 'button-cart.html'
})
export class ButtonCartComponent {
	CartPage = CartPage;
	@Input() icon: string;
	cart:Object = {};
	constructor(private storage: Storage, private navCtrl: NavController) {
		this.update();
	}
	update(){
		this.storage.get('cart').then((val) =>{
			this.cart = {count:0,total:0};
			for(var key in val){
				let product = val[key];
				this.cart["count"] += product.quantity;
				if(Number(product.sale_price) > 0){
					this.cart["total"] += Number(product.sale_price)*product.quantity;
				} else {
					this.cart["total"] += Number(product.regular_price)*product.quantity;
				}
			}
		});
	}
	gotoCart(){
		if(this.navCtrl.getPrevious() && this.navCtrl.getPrevious().component == this.CartPage)
			this.navCtrl.pop();
		else this.navCtrl.push(this.CartPage);
	}
}