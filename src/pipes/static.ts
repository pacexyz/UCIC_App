import { Injectable, Pipe } from '@angular/core';
import { Config } from '../service/config.service';

@Pipe({
	name: 'static'
})
@Injectable()
export class Static {
	textStatic:Object = {};
	
	constructor(private config: Config){
		if(config['text_static']) this.textStatic = config['text_static'];
	}
	transform(value) {
		if(this.textStatic[value]) return this.textStatic[value];
		else return null;
	}
}
