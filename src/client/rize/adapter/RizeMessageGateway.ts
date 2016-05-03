import {Result, Ok} from 'option-t/src/Result';

import {Command} from '../../script/domain/Message';

import {ChannelId} from '../domain/ChannelDomain';
import {JoinNetworkCommand} from '../domain/NetworkDomain';

export class RizeMessageGateway {
    constructor() {
    }

    sendCommand(command: Command): Promise<Result<void, void>> {
        // TODO:
        const result = new Ok<void, void>(undefined);
        return Promise.resolve(result);
    }

    joinToNetwork(param: JoinNetworkCommand): Promise<Result<JoinNetworkCommand, void>> {
        // TODO:
        const result = new Ok<JoinNetworkCommand, void>(null);
        return Promise.resolve(result);
    }

    partFromChannel(channelId: ChannelId): Promise<Result<void, void>> {
        // TODO:
        const result = new Ok<void, void>(undefined);
        return Promise.resolve(result);
    }
}