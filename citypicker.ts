import { Directive, ElementRef, Input, Output } from "@angular/core";
import { EventEmitter } from "@angular/forms/src/facade/async";
import { OnChanges } from "@angular/core";
import { isPropertyUpdated } from "@angular/forms/src/directives/shared";
import { Http } from '@angular/http';
import { cityData } from './citydata';
import { ModalController, NavParams, ViewController } from 'ionic-angular';
import { Component, ViewChild, NgZone } from '@angular/core';
import { Content } from 'ionic-angular';

@Directive({
    selector: '[CityPickerModel]',
    host: {
        '(click)': 'openCityPicker()'
    }
})
export class CityPickerModel implements OnChanges {
    @Input('CityPickerModel') model: any;
    @Input('split') split: String;
    @Output('CityPickerModelChange') update = new EventEmitter();

    private lastViewModel: any;
    constructor(private elRef: ElementRef,
        private http: Http,
        private modalCtrl: ModalController
    ) { }
    ngOnChanges(changes) {
        console.log('CityPickerModelChange')
        if (isPropertyUpdated(changes, this.lastViewModel)) {
            this.lastViewModel = this.model
            this.refreshView()
        }
    }

    openCityPicker() {
        //获取默认值
        var value = this.elRef.nativeElement.innerText
        this.lastViewModel = value
        let city = cityData();
        let start = value.split(this.split);
        let cityModal = this.modalCtrl.create(CityModal, {
            start: start,
            data: city
        });
        cityModal.onDidDismiss(data => {
            if (data.type == "ok") {
                console.log(data);
                this.model = data.province + this.split + data.city + (data.country ? (this.split + data.country) : '')
                this.refreshView();
            }
        });
        cityModal.present();

    }

    private refreshView() {
        this.update.emit(this.model);
        this.elRef.nativeElement.innerText = this.model;
    }
}


@Component({
    templateUrl: 'citypicker.html',
})
export class CityModal {
    @ViewChild('province') provinceContent: Content;
    @ViewChild('city') cityContent: Content;
    @ViewChild('country') countryContent: Content;
    cityData
    startData
    province
    city
    country
    cityArr
    countryArr
    provinceIndex
    cityIndex
    countryIndex
    canSelect = false
    cancelType = "ok"
    constructor(public viewCtrl: ViewController,
        public params: NavParams,
        private zone: NgZone
    ) {
        this.startData = this.params.get('start')
        this.cityData = this.params.get('data')
        this.province = this.startData[0]
        this.city = this.startData[1]
        this.country = this.startData[2];
        // 没有数据时默认省市区
        if (!this.province||this.province=="未设置") {
            this.cityArr = this.cityData[0].sub;
            this.countryArr = this.cityArr[0].sub;
            this.provinceIndex = 0;
            this.cityIndex = 0;
            this.countryIndex = 0;
            this.province = this.cityData[0].name;
            this.city = this.cityArr[0].name;
            this.countryArr && (this.country = this.countryArr[0].name);
        }
        // 获取开始省市区的位置
        else {
            this.cityData.forEach((val, i) => {
                if (val.name == this.province) {
                    this.provinceIndex = i;
                    this.cityArr = this.cityData[i].sub;
                    if (this.city) {
                        this.cityArr.forEach((val, i) => {
                            if (val.name == this.city) {
                                this.cityIndex = i;
                                this.countryArr = this.cityArr[i].sub;
                                if (this.country) {
                                    this.countryArr.forEach((val, i) => {
                                        if (val.name == this.country) {
                                            this.countryIndex = i;
                                        }
                                    })
                                }
                                else {
                                    this.countryIndex = 0;
                                    this.countryArr && (this.country = this.countryArr[0].name);
                                }

                            }
                        })
                    }
                    else {
                        this.cityIndex = 0;
                        this.countryIndex = 0;
                        this.countryArr = this.cityArr[0].sub;
                        this.countryArr && (this.country = this.countryArr[0].name);
                    }
                }
            })
        }
        //重置省市区的位置
        this.viewCtrl.didEnter.subscribe(() => {
            this.provinceContent.scrollTo(0, this.provinceIndex * 36, 200)
            this.cityContent.scrollTo(0, this.cityIndex * 36, 300)
            this.countryContent.scrollTo(0, this.countryIndex * 36, 460).then(() => {
                this.canSelect = true;
            });
        })
    }
    getData(name) {
        if (!this.canSelect) return false;
        let length;
        let content = name + "Content";
        switch (name) {
            case 'province':
                length = this.cityData.length;
                break;
            case 'city':
                if (!this.cityArr) return false;
                length = this.cityArr.length;
                break;
            case 'country':
                if (!this.countryArr) return false;
                length = this.countryArr.length;
                break;
        }
        var top = this[content].scrollTop; //当前滚动位置
        var index = Math.round(top / 36);
        if (index < 0) index = 0; //超出头
        if (index > length - 1) index = length - 1; //超出尾
        if (top === index * 36) {
            this.zone.run(() => {
                switch (name) {
                    case 'province':
                        this.city = '';
                        this.country = '';
                        this.cityArr = this.cityData[index].sub;
                        this.province = this.cityData[index].name;
                        this.cityContent.scrollToTop(200);
                        this.city = this.cityArr[0].name;
                        this.countryArr = this.cityArr[0].sub;
                        if (this.countryArr) {
                            this.countryContent.scrollToTop(200);
                            this.country = this.countryArr[0].name;
                        }
                        break;
                    case 'city':
                        this.country = '';
                        this.countryArr = this.cityArr[index].sub;
                        this.city = this.cityArr[index].name;
                        if (this.countryArr) {
                            this.countryContent.scrollToTop(200);
                            this.country = this.countryArr[0].name;
                        }
                        break;
                    case 'country':
                        this.country = this.countryArr[index].name;
                        break;
                }
            })
        } else {
            this[content].scrollTo(0, index * 36, 200)
        }
    }
    cancel(type) {
        this.cancelType = type;
        this.dismiss()
    }
    dismiss() {
        let data = {
            type: this.cancelType,
            province: this.province,
            city: this.city,
            country: this.country
        };
        this.viewCtrl.dismiss(data);
    }

}