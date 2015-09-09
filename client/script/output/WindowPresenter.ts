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

/// <reference path="../../../tsd/core-js.d.ts" />
/// <reference path="../../../node_modules/option-t/option-t.d.ts" />
/// <reference path="../../../node_modules/rx/ts/rx.all.es6.d.ts" />

import * as Rx from 'rx';
import arrayFindIndex from 'core-js/library/fn/array/find-index';
import AppActionCreator from '../intent/action/AppActionCreator';
import Channel from '../domain/Channel';
import {DomainState, SelectedTab} from '../domain/DomainState';
import UIActionCreator from '../intent/action/UIActionCreator';
import {Option} from 'option-t';

export class WindowPresenter implements EventListenerObject {

    private _domain: DomainState;
    private _disposer: Rx.CompositeDisposable;

    private _currenTab: SelectedTab;

    constructor(domain: DomainState) {
        this._domain = domain;
        this._disposer = new Rx.CompositeDisposable();

        this._disposer.add(AppActionCreator.getDispatcher().reload.subscribe(function () {
            window.onbeforeunload = null;

            location.reload();
        }));

        this._disposer.add(UIActionCreator.getDispatcher().focusWindow.subscribe(function(){
            window.focus();
        }));

        this._disposer.add(UIActionCreator.getDispatcher().setQuitConfirmDialog.subscribe(() => {
            if (document.body.classList.contains('public')) {
                window.onbeforeunload = this._onBeforeUnload;
            }
        }));

        this._currenTab = null;
        this._disposer.add(domain.getCurrentTab().subscribe((tab) => {
            this._currenTab = tab;
        }));

        window.document.documentElement.addEventListener('keydown', this);
        window.addEventListener('resize', this);
        window.addEventListener('focus', this);
    }

    handleEvent(event: Event): void {
        switch (event.type) {
            case 'resize':
                this.onResize(<UIEvent>event);
                break;
            case 'keydown':
                this.onKeydown(<KeyboardEvent>event);
                break
            case 'focus':
                this.onFocus(<FocusEvent>event);
                break;
        }
    }

    destroy(): void {
        window.removeEventListener('focus', this);
        window.removeEventListener('resize', this);
        window.document.documentElement.removeEventListener('keydown', this);

        this._disposer.dispose();

        this._currenTab = null;
        this._disposer = null;
        this._domain = null;
    }

    private _onBeforeUnload(aEvent: Event): string {
        // This function is called on `beforeunload` event,
        // we cannnot call window.confirm, alert, prompt during the event.
        // Thus we need to use classical way to show a modal prompt.
        return 'Are you sure you want to navigate away from this page?';
    }

    onResize(event: UIEvent): void {
        if (this._currenTab === null) {
            return;
        }

        this._currenTab.channelId.map(function(channelId: number){
            UIActionCreator.showLatestInChannel(channelId);
        });
    }

    onKeydown(event: KeyboardEvent): void {
        const isPressedMeta = event.metaKey;
        const isPressedCtrl = event.ctrlKey;
        if ( !(isPressedMeta || isPressedCtrl) ) {
            return;
        }

        let key = '';
        if (event.key !== undefined) {
            key = event.key;
        }
        else {
            const keyCode = event.keyCode;
            switch (keyCode) {
                case 38:
                    key = "ArrowUp";
                    break;
                case 40:
                    key = "ArrowDown";
                    break;
            }
        }

        this.handleShortcut(key);
    }

    handleShortcut(key: string): void {
        const channelList: Array<Channel> = this._domain.networkSet.getChannelList();
        const currentIndex: Option<number> = this._domain.currentTab.channelId.map(function(currentId: number) {
            return arrayFindIndex(channelList, function(channel: Channel){
                return channel.id === currentId;
            });
        });

        if (currentIndex.isNone) {
            return;
        }

        const index = currentIndex.unwrap();
        const length = channelList.length;
        switch (key) {
            case 'ArrowUp': {
                // Loop
                const target = (length + (index - 1 + length)) % length;
                const id = channelList[target].id;
                event.preventDefault();
                UIActionCreator.selectChannel(id);
                break;
            }

            case 'ArrowDown': {
                // Loop
                const target = (length + (index + 1 + length)) % length;
                const id = channelList[target].id;
                event.preventDefault();
                UIActionCreator.selectChannel(id);
                break;
            }
        }
    }

    onFocus(event: FocusEvent): void {
        if (this._currenTab.channelId.isNone && window.screen.width < 767) {
            return;
        }

        UIActionCreator.focusInputBox();
    }
}