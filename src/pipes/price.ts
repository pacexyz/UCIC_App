import { Injectable, Pipe } from '@angular/core';
import { Config } from '../service/config.service';

@Pipe({
	name: 'price'
})
@Injectable()
export class Price {
	currency:Object;
	
	constructor(private config: Config){
		this.currency = config['currency'];
	}
	transform(value:Number):string {
		let _value:any = Number(value);
		if(!_value) _value = 0;
		if(this.currency){
			if(_value && _value.toString().split('.').length == 2){
				let decimal = _value.toString().split('.');
				if(decimal[1].charAt(this.currency['number_of_decimals']) == 5){
					decimal[1] = Number(decimal[1].substring(0, this.currency['number_of_decimals'])) +1;
					_value = Number(decimal.join('.'));
				}
			}
			_value = _value.toFixed(this.currency['number_of_decimals']);
			_value = _value.split('.');
			_value.splice(1, 0, this.currency['decimal_separator']);
			_value[0] = _value[0].replace(/\B(?=(\d{3})+(?!\d))/g, this.currency['thousand_separator']);
			let symbol = document.createElement('textarea');
			symbol.innerHTML = this.currency['currency_symbol'];
			switch (this.currency['currency_position']){
				case 'left':
					_value.unshift(symbol.value);
					break;
				case 'left_space':
					_value.unshift(symbol.value+' ');
					break;
				case 'right':
					_value.push(symbol.value);
					break;
				case 'right_space':
					_value.push(' '+symbol.value);
					break;
			}
			_value = _value.join('');
		}
		return _value;
	}
}