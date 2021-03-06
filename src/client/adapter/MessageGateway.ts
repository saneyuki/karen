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

import {Option, Some, None} from 'option-t';
import * as Rx from 'rxjs';

import {MessageActionCreator} from '../intent/action/MessageActionCreator';
import {Channel} from '../domain/Channel';
import {ChannelId} from '../domain/ChannelDomain';
import {CommandType} from '../domain/CommandType';
import {
    ConnectionValue,
    NetworkValue as NetworkConnectionValue,
    PersonalValue as PersonalConnectionValue
} from '../settings/domain/value/ConnectionSettings';
import {SelectedTab} from '../domain/DomainState';
import {RecievedMessage} from '../domain/Message';
import {Network} from '../domain/Network';
import {NetworkId} from '../domain/NetworkDomain';
import {User} from '../domain/User';

import {SocketIoDriver} from './SocketIoDriver';

export class MessageGateway {

    private _socket: SocketIoDriver;
    private _disposer: Rx.Subscription;

    constructor(socket: SocketIoDriver, action: MessageActionCreator) {
        this._socket = socket;

        const disposer = new Rx.Subscription();
        this._disposer = disposer;

        const messageDispatcher = action.dispatcher();

        disposer.add(socket.error().subscribe(function (e: any) { // tslint:disable-line:no-any
            /*eslint-disable no-console*/
            console.log(e);
            /*eslint-enable*/
        }));

        disposer.add(messageDispatcher.sendCommand.subscribe(({ channelId, text }) => {
            this._sendCommand(channelId, text);
        }));

        disposer.add(messageDispatcher.queryWhoIs.subscribe(({ channelId, user }) => {
            this._queryWhoIs(channelId, user);
        }));

        disposer.add(messageDispatcher.fetchHiddenLog.subscribe(({ channelId, length, }) => {
            this._fetchHiddenLog(channelId, length);
        }));
    }

    socket(): SocketIoDriver {
        return this._socket;
    }

    showConnectSetting(): Rx.Observable<void> {
        return this._socket.init().filter<any>(function(data){ // tslint:disable-line:no-any
            return (data.networks.length === 0);
        });
    }

    invokeInit(): Rx.Observable<{ networks: Array<Network>; token: string; active: Option<ChannelId|string>; }> {
        return this._socket.init().map(function(data: any){ // tslint:disable-line:no-any
            const list = (data.networks.length !== 0) ?
                (data.networks as Array<any>).map(function(item){ // tslint:disable-line:no-any
                    return new Network(item);
                }) : [];
            return {
                networks: list,
                token: data.token,
                active: data.active.is_some ? new Some(data.active) : new None<ChannelId>(),
            };
        });
    }

    initialConnectionPreset(): Rx.Observable<[NetworkConnectionValue, PersonalConnectionValue]> {
        return this._socket.init().map(function(data: any) { // tslint:disable-line:no-any
            const preset: Array<any> = data.connections; // tslint:disable-line:no-any

            const first: any = preset[0]; // tslint:disable-line:no-any
            const network = new NetworkConnectionValue(first.name, first.host, first.port,
                                                       first.password, first.tls);
            const personal = new PersonalConnectionValue(first.nick, first.username, first.realname, first.join);
            return [network, personal] as [NetworkConnectionValue, PersonalConnectionValue];
        });
    }

    disconnected(): Rx.Observable<void> {
        const args = [
            this._socket.connectError(),
            this._socket.disconnect(),
        ];
        return Rx.Observable.merge<void, void>(...args);
    }

    addNetwork(): Rx.Observable<Network> {
        return this._socket.network().map(function(data): Network {
            const network = new Network(data.network);
            return network;
        });
    }

    setNickname(): Rx.Observable<{ networkId: NetworkId, nickname: string }> {
        return this._socket.nickname().map(function(data) {
            return {
                networkId: data.network,
                nickname: data.nick,
            };
        });
    }

    updateUserList(): Rx.Observable<{ channelId: ChannelId, list: Array<User>}> {
        return this._socket.users().map(function(data){
            const channelId = data.chan;
            const users = data.users.map(function(item: any){ // tslint:disable-line:no-any
                return new User(item);
            });

            return {
                channelId: channelId,
                list: users,
            };
        });
    }

    setTopic(): Rx.Observable<{ channelId: ChannelId, topic: string }> {
        return this._socket.topic().map(function(data) {
            return {
                channelId: data.chan,
                topic: data.topic,
            };
        });
    }

    recieveMessage(): Rx.Observable<RecievedMessage> {
        return this._socket.message().map(function(data){
            return {
                channelId: data.chan,
                message: data.msg,
            };
        });
    }

    joinChannel(): Rx.Observable<{networkId: NetworkId; channel: Channel}> {
        return this._socket.join().map(function(data){
            const networkId = data.network;
            const channel = new Channel(data.chan);
            return {
                networkId,
                channel,
            };
        });
    }

    partFromChannel(): Rx.Observable<ChannelId> { // channelId
        return this._socket.part().map(function(data){
            return data.chan as ChannelId;
        });
    }

    quitNetwork(): Rx.Observable<NetworkId> {
        return this._socket.quit().map(function(data) {
            const id = data.network as NetworkId;
            return id;
        });
    }

    saveCurrentTab(currentTab: SelectedTab): void {
        this._socket.emit('open', currentTab.id);
    }

    tryConnect(setting: ConnectionValue): void {
        const prop = setting.toJSON();
        this._socket.emit('conn', prop);
    }

    private _sendCommand(channelId: ChannelId, command: string): void {
        this._socket.emit('input', {
            target: channelId,
            text: command,
        });
    }

    private _queryWhoIs(channelId: ChannelId, who: string): void {
        const query = CommandType.WHOIS + ' ' + who;
        this._socket.emit('input', {
            target: channelId,
            text: query,
        });
    }

    private _fetchHiddenLog(channelId: ChannelId, length: number): void {
        this._socket.emit('more', {
            target: channelId,
            count: length,
        });
    }
}
