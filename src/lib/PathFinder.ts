import {Option, Some, None} from 'option-t';
import * as PathToRegexp from 'path-to-regexp';

export type PathParam = {
    [key: string]: string;
};
export class Path {
    private _key: Array<PathToRegexp.Key>;
    private _matcher: PathToRegexp.PathRegExp;
    private _serializer: PathToRegexp.PathFunction;

    /**
     *  @param  {string}    pattern
     *      please see the test case for this.
     */
    constructor(pattern: string) {
        const token = PathToRegexp.parse(pattern);
        // XXX; filter out a non paramter object.
        this._key = token.filter((item) => (typeof item !== 'string') ) as Array<PathToRegexp.Key>;

        this._matcher = PathToRegexp.tokensToRegExp(token, {
            sensitive: true,
            strict: false,
            end: true,
        });

        this._serializer = PathToRegexp.tokensToFunction(token);
        Object.seal(this);
    }

    destroty(): void {
        // XXX: assign to release the garbage object.
        this._key = null as any;
        this._matcher = null as any;
        this._serializer = null as any;

        Object.freeze(this);
    }

    tryMatch(path: string): Option<PathParam> {
        const result = this._matcher.exec(path);
        if (result === null) {
            return new None<PathParam>();
        }

        // XXX: remove the matched full path.
        result.shift();

        const map: PathParam = {};
        for (let i = 0, l = result.length; i < l; ++i) {
            let v = result[i];
            const key = this._key[i];
            const keyName = key.name;
            map[keyName] = v;
        }
        return new Some<PathParam>(map);
    }

    serialize(param: { [key: string]: (string | Array<string>) }): Option<string> {
        try {
            const result: string = this._serializer(param, {
                pretty: false,
            });
            return new Some(result);
        }
        catch (_) {
            return new None<string>();
        }
    }
}
