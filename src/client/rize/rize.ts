/**
 * @license MIT License
 *
 * Copyright (c) 2016 Tetsuharu OHZEKI <saneyuki.snyk@gmail.com>
 * Copyright (c) 2016 Yusuke Suzuki <utatane.tea@gmail.com>
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

//import {AppStateRepository} from './adapter/AppStateRepository';
//import {NotificationService} from './adapter/NotificationService';
import {RizeChannelRepository} from './adapter/RizeChannelRepository';
import {RizeMessageGateway} from './adapter/RizeMessageGateway';
//import {RizeMessageRepository} from './adapter/RizeMessageRepository';
import {RizeNetworkRepository} from './adapter/RizeNetworkRepository';
//import {RizeUserListRepository} from './adapter/RizeUserListRepository';

import {RizeIrcSaga} from './domain/RizeIrcSaga';

import {IrcAction} from './intent/IrcAction';

/**
 *  ReInitialiZEd Client
 */
export class RizeClient {

    constructor() {
        const ircAction = new IrcAction();

        const gateway = new RizeMessageGateway();
        const networkRepo = new RizeNetworkRepository();
        const channelRepo = new RizeChannelRepository();

        new RizeIrcSaga({
            intent: ircAction.dispatcher(),
            gateway: gateway,
            network: networkRepo,
            channel: channelRepo,
        });
    }
}