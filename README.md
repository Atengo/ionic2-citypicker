# ionic2-citypicker
citypicker base ionic2
使用方法：app.module中导入

```js
import { CityPickerModel,CityModal } from '../util/citypicker/citypicker';
```
在页面中直接使用：
```html
<span [(CityPickerModel)]="setting.city" split="-" (CityPickerModelChange)="checkChange()"></span>
```
