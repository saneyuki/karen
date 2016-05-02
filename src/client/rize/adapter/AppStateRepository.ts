import {Option, None} from 'option-t';

export class AppStateRepository {
    private _currentTabId: Option<string>;

    constructor() {
        this._currentTabId = new None<string>();
    }

    currentTabId(): Option<string> {
        return this._currentTabId;
    }
}