import { FormControl } from '@angular/forms';
 
export class CoreValidator {
    static isEmail(control: FormControl): any {
		 let regExp = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
		if (!regExp.test(control.value)) {
			return {"invalidEmail": true};
		}
        return null;
    }
    static isPhone(control: FormControl): any {
		let regExp = /^[0-9\-\+]{9,15}$/;
		if (!regExp.test(control.value)) {
			return {"invalidMobile": true};
		}
        return null;
    }
	static confirmPassword(control: FormControl): any {
        let e = control.root.value["password"];
        if (e && control.value != e) {
			return {"invalidEqual": true};
        }
        return null;
    }	
}