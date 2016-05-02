import * as Rx from 'rxjs';

import {Action} from './lib';

import {JoinNetworkCommand} from '../domain/NetworkDomain';

export class IrcAction implements Action<IrcDispatcher> {

    private _dispatcher: IrcDispatcher;

    constructor() {
        this._dispatcher = new IrcDispatcher();
    }

    dispatcher(): IrcDispatcher {
        return this._dispatcher;
    }

    tryJoinNetwork(arg: JoinNetworkCommand): void {
        this._dispatcher.joinNetwork.next(arg);
    }
}

export class IrcDispatcher {

    readonly joinNetwork: Rx.Subject<JoinNetworkCommand>;

    constructor() {
        this.joinNetwork = new Rx.Subject<JoinNetworkCommand>();
    }

    destroy(): void {
        this.joinNetwork.unsubscribe();
    }
}