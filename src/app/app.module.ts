import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';

import { HttpModule, Http } from '@angular/http';
import { TranslateModule, TranslateLoader, TranslateStaticLoader } from '../module/ng2-translate';
export function createTranslateLoader(http: Http) {
  return new TranslateStaticLoader(http, './assets/i18n', '.json');
}

import { IonicStorageModule } from '@ionic/storage';
import { AboutFooterComponent } from '../components/about-footer/about-footer';
import { ButtonCartComponent } from '../components/button-cart/button-cart';
import { FooterTabsComponent } from '../components/footer-tabs/footer-tabs';
import { ButtonQuantityComponent } from '../components/button-quantity/button-quantity';
import { HideShowComponent } from '../components/hide-show/hide-show';
import { Config } from '../service/config.service';
import { Filter } from '../pipes/filter';
import { ArrayJoin } from '../pipes/array-join';
import { ObjectToArray } from '../pipes/object-to-array';
import { OrderBy } from '../pipes/order-by';
import { Range } from '../pipes/range';
import { Price } from '../pipes/price';
import { TimeAgo } from '../pipes/time-ago';
import { Static } from '../pipes/static';
import { Viewmore } from '../pipes/viewmore';
import { DatePipe } from '@angular/common';
import { HomePage } from '../pages/home/home';
import { CategoriesPage } from '../pages/categories/categories';
import { DetailCategoryPage } from '../pages/detail-category/detail-category';
import { SearchPage } from '../pages/search/search';
import { AccountPage } from '../pages/account/account';
import { LoginPage } from '../pages/login/login';
import { SignupPage } from '../pages/signup/signup';
import { DetailPage } from '../pages/detail/detail';
import { CartPage } from '../pages/cart/cart';
import { CommentsPage } from '../pages/comments/comments';
import { RatingPage } from '../pages/rating/rating';
import { OrderPage } from '../pages/order/order';
import { FavoritePage } from '../pages/favorite/favorite';
import { TermsPage } from '../pages/terms/terms';
import { PrivacyPage } from '../pages/privacy/privacy';
import { ContactPage } from '../pages/contact/contact';
import { AboutPage } from '../pages/about/about';
import { PopupadsPage } from '../pages/popupads/popupads';
import { ProfilePage } from '../pages/profile/profile';
import { AddressPage } from '../pages/address/address';
import { CheckoutPage } from '../pages/checkout/checkout';
import { DetailOrderPage } from '../pages/detail-order/detail-order';
import { ThanksPage } from '../pages/thanks/thanks';
import { LatestPage } from '../pages/latest/latest';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { Camera } from '@ionic-native/camera';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { Network } from '@ionic-native/network';
import { OneSignal } from '@ionic-native/onesignal';
import { SocialSharing } from '@ionic-native/social-sharing';
import { Toast } from '@ionic-native/toast';

// import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
// import { TranslateHttpLoader } from '@ngx-translate/http-loader';

// import {HttpClientModule, HttpClient} from '@angular/common/http';
// export function createTranslateLoader(http: HttpClient) {
//   return new TranslateHttpLoader(http, './assets/i18n/', '.json');
// }
// import { PipesModule } from '../pipes/pipes.module';
// import { ComponentsModule } from '../components/components.module';
// import { HttpModule, Http } from '@angular/http';

// import { AboutPage } from '../pages/about/about';
// import { ContactPage } from '../pages/contact/contact';
// import { TabsPage } from '../pages/tabs/tabs';

// import { StatusBar } from '@ionic-native/status-bar';
// import { SplashScreen } from '@ionic-native/splash-screen';
// import { InAppBrowser } from '@ionic-native/in-app-browser';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    AboutFooterComponent,
    CategoriesPage,
    DetailCategoryPage,
    SearchPage,
    AccountPage,
    LoginPage,
    SignupPage,
    ButtonCartComponent,
    FooterTabsComponent,
    DetailPage,
    CartPage,
    ButtonQuantityComponent,
    Filter,
    ArrayJoin,
    ObjectToArray,
    CommentsPage,
    RatingPage,
    OrderPage,
    FavoritePage,
    TermsPage,
    PrivacyPage,
    ContactPage,
    AboutPage,
    PopupadsPage,
    HideShowComponent,
    OrderBy,
    ProfilePage,
    AddressPage,
    CheckoutPage,
    Range,
    Price,
    DetailOrderPage,
    ThanksPage,
    TimeAgo,
    LatestPage,
    Static,
    Viewmore
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp, {
      backButtonText: '',
      backButtonIcon: 'md-arrow-back',
      mode: 'ios',
      pageTransition: 'md-transition',
      animate: false,
      scrollAssist: false,
      autoFocusAssist: false,
      platforms: {
              ios: {
                statusbarPadding: true,
                tabsHideOnSubPages: true
              }
          }
    }),
    HttpModule,
    TranslateModule.forRoot({
      provide: TranslateLoader,
      useFactory: (createTranslateLoader),
      deps: [Http]
    }),
    IonicStorageModule.forRoot({ 
      name: 'woocommerce_application', 
      driverOrder: ['sqlite', 'websql', 'indexeddb'] 
    })
  ],
    bootstrap: [IonicApp],
    entryComponents: [
        MyApp,
        HomePage,
        CategoriesPage,
        DetailCategoryPage,
        SearchPage,
        AccountPage,
        LoginPage,
        SignupPage,
        DetailPage,
        CartPage,
        CommentsPage,
        RatingPage,
        OrderPage,
        FavoritePage,
        TermsPage,
        PrivacyPage,
        ContactPage,
        AboutPage,
        ProfilePage,
        PopupadsPage,
        AddressPage,
        CheckoutPage,
        DetailOrderPage,
        ThanksPage,
        LatestPage,
    ],
    providers: [
        Config,
        DatePipe,
        SplashScreen,
        StatusBar,
        Camera,
        InAppBrowser,
        Network,
        OneSignal,
        SocialSharing,
        Toast,
        {provide: ErrorHandler, useClass: IonicErrorHandler}
    ]
})
export class AppModule {}
