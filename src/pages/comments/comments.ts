import { Component } from '@angular/core';
import { NavParams, ModalController } from 'ionic-angular';
import { Http } from '@angular/http';

// Custom
import { Core } from '../../service/core.service';

//Page
import { RatingPage } from '../rating/rating';

declare var wordpress_url: string;

@Component({
	selector: 'page-comments',
	templateUrl: 'comments.html',
	providers: [Core]
})
export class CommentsPage {
	id: Number;
	comments: any;
	allow: boolean;
	lastComment: Object[];

	constructor(
		public navParams: NavParams,
		private http: Http,
		private core: Core,
		public modalCtrl: ModalController
	) {
		this.id = navParams.get("id");
		this.allow = navParams.get("allow");
		this.getReview();
	}
	getReview(reload: boolean = false) {
		this.comments = { total: 0, details: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
		if (reload) {
			// let params = { product_id: this.id };
			this.core.showLoading();
			this.http.get(wordpress_url + '/wp-json/wooconnector/product/getproduct/' + this.id).subscribe(res => {
				this.comments["reviews"] = res.json()['wooconnector_reviews'];
				this.lastComment = this.comments["reviews"];
				if (!this.comments["reviews"]) this.comments["reviews"] = [];
				this.calculator();
				this.core.hideLoading();
			});
		} else {
			if (!this.lastComment) this.comments["reviews"] = this.navParams.get("data");
			else this.comments["reviews"] = this.lastComment;
			if (!this.comments["reviews"]) this.comments["reviews"] = [];
			this.calculator();
		}
	}
	calculator() {
		this.comments["reviews"].forEach((val) => {
			this.comments["total"] += Number(val.rating);
			this.comments["details"][val.rating] += 1;
		});
		this.bestRating();
		this.setPercent();
	}
	bestRating() {
		if (this.comments["reviews"].length == 0) return this.comments["best"] = 0;
		this.comments["best"] = Object.keys(this.comments["details"]).reduce((a, b) => {
			return this.comments["details"][a] > this.comments["details"][b] ? a : b;
		});
	}
	setPercent() {
		if (this.comments["best"] != null) {
			let best = this.comments["details"][this.comments["best"]];
			this.comments["percent"] = [];
			for (let i = 5; i >= 1; i--) {
				this.comments["percent"].push({
					rating: i,
					percent: ((this.comments["details"][i] / best * 100) || 0) + '%'
				});
			}
		}
	}
	showRating() {
		if (this.allow) {
			let modal = this.modalCtrl.create(RatingPage, { id: this.id });
			modal.onDidDismiss(reload => {
				this.getReview(reload);
			});
			modal.present();
		}
	}
}