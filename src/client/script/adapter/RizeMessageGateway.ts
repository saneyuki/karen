import {Result, Ok} from 'option-t/src/Result';

import {Command} from '../domain/Message';

export class RizeMessageGateway {
    constructor() {
    }

    sendCommand(command: Command): Promise<Result<void, void>> {
        // TODO:
        const result = new Ok<void, void>(undefined);
        return Promise.resolve(result);
    }
}