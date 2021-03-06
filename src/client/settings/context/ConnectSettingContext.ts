/*global jQuery:true */
/**
 * @license MIT License
 *
 * Copyright (c) 2015 Tetsuharu OHZEKI <saneyuki.snyk@gmail.com>
 * Copyright (c) 2015 Yusuke Suzuki <utatane.tea@gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Rx from 'rxjs';

import { ConnectSettingWindow } from '../view/ConnectSettingWindow';

import { MessageGateway } from '../../adapter/MessageGateway';
import { ConnectionActionCreator } from '../intent/ConnectionSettingIntent';
import { ConnectionStore } from '../viewmodel/ConnectionStore';
import { ConnectionValue } from '../domain/value/ConnectionSettings';

import { ViewContext } from '../../../lib/ViewContext';

export class ConnectSettingContext implements ViewContext {

    private _action: ConnectionActionCreator;
    private _store: ConnectionStore;
    private _viewDisposer: Rx.Subscription | undefined;

    constructor(gateway: MessageGateway) {
        if (!gateway) {
            throw new Error();
        }

        this._action = new ConnectionActionCreator();
        this._store = new ConnectionStore(this._action.dispatcher(), gateway);
        this._viewDisposer = undefined;
    }

    private _destroy(): void {
        // tslint:disable-next-line:no-non-null-assertion
        this._viewDisposer!.unsubscribe();
        this._store.dispose();
        this._action.dispose();
    }

    onActivate(mountpoint: Element): void {
        this._viewDisposer = this._mount(mountpoint);
    }

    onDestroy(_mountpoint: Element): void {
        this._destroy();
    }

    onResume(_mountpoint: Element): void { }
    onSuspend(_mountpoint: Element): void { }

    private _mount(mountpoint: Element): Rx.Subscription {
        const observer: Rx.Subscriber<ConnectionValue> = Rx.Subscriber.create((data: ConnectionValue) => {
            const view = React.createElement(ConnectSettingWindow, {
                viewmodel: this._store.viewmodel(),
                action: this._action,
                data: data,
            });
            ReactDOM.render(view, mountpoint);
        }, () => { }, () => {
            ReactDOM.unmountComponentAtNode(mountpoint);
        });
        return this._store.subscribe(observer);
    }
}
