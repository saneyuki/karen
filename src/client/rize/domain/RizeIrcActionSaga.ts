import {Option} from 'option-t';
import {Result} from 'option-t/src/Result';
import {Observable} from 'rxjs';

import {IrcDispatcher} from '../intent/IrcAction';


export interface RizeIrcSagaArg {
    intent: IrcDispatcher;
}

export class RizeIrcSaga {

    private _intent: IrcDispatcher;

    constructor(args: RizeIrcSagaArg) {
        this._intent = args.intent;
    }
}

