import {Result} from 'option-t/src/Result';
import {Observable} from 'rxjs';

import {RizeMessageGateway} from '../adapter/RizeMessageGateway';
import {Command} from './Message';

export function sendMessage(intent: Observable<Command>, gateway: RizeMessageGateway): Observable<Result<void, void>> {
    const request = intent.flatMap(function (command: Command) {
        const req = gateway.sendCommand(command);
        return req;
    });
    return request;
}