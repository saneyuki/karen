import {ViewContext} from '../../script/lib/ViewContext';

export class SettingContext implements ViewContext {
    onActivate(_mountpoint: Element): void {}
    onDestroy(_mountpoint: Element): void {}
    onResume(_mountpoint: Element): void {}
    onSuspend(_mountpoint: Element): void {}
}
