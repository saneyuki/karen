//import {Option} from 'option-t';
import {Result} from 'option-t/src/Result';
import {Observable} from 'rxjs';

//import {AppStateRepository} from '../adapter/AppStateRepository';
//import {NotificationService} from '../adapter/NotificationService';
import {RizeChannelRepository} from '../adapter/RizeChannelRepository';
import {RizeMessageGateway} from '../adapter/RizeMessageGateway';
//import {RizeMessageRepository} from '../adapter/RizeMessageRepository';
import {RizeNetworkRepository} from '../adapter/RizeNetworkRepository';
//import {RizeUserListRepository} from '../adapter/RizeUserListRepository';

import {IrcDispatcher} from '../intent/IrcAction';

import {JoinNetworkCommand} from './NetworkDomain';

export interface RizeIrcSagaArg {
    intent: IrcDispatcher;
    gateway: RizeMessageGateway;
    network: RizeNetworkRepository;
    channel: RizeChannelRepository;
}

export class RizeIrcSaga {

    private _intent: IrcDispatcher;

    constructor(args: RizeIrcSagaArg) {
        this._intent = args.intent;
    }
}


export function joinNetwork(intent: Observable<JoinNetworkCommand>,
                            gateway: RizeMessageGateway): Observable<Result<JoinNetworkCommand, void>> {
    return intent.flatMap((value) => {
        const request = gateway.joinToNetwork(value);
        return request;
    });
}

interface WriteToRepositoryArg {
    source: Observable<JoinNetworkCommand>;
}

export function writeToRepository(args: WriteToRepositoryArg): Observable<void> {
    return null;
}