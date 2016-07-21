import * as assert from 'assert';
import {Option} from 'option-t';

import {Path, PathParam} from '../PathFinder';

interface PathTestPattern {
    pattern: string;
    tryMatch: Array<TryMatchTestCase>;
    serialize: Array<SerializeTestCase>;
}

abstract class ValidCase {
    readonly isValid: boolean;
    constructor() {
        this.isValid = true;
    }
}
abstract class InvalidCase {
    readonly isValid: boolean;
    constructor() {
        this.isValid = false;
    }
}

class ValidTryMatch extends ValidCase {
    constructor(public readonly path: string, public readonly result: any) {
        super();
    }
}
class InvalidTryMatch extends InvalidCase {
    public readonly result: any;
    constructor(public readonly path: string) {
        super();
    }
}
type TryMatchTestCase = ValidTryMatch | InvalidTryMatch;

class ValidSerialize extends ValidCase {
    constructor(public readonly param: any, public readonly result: string) {
        super();
    }
}
class InvalidSerialize extends InvalidCase {
    public readonly result: string;
    constructor(public readonly param: any) {
        super();
    }
}
type SerializeTestCase = ValidSerialize | InvalidSerialize;

function testHelper(param: PathTestPattern): void {
    const pattern = param.pattern;
    describe('pattern:' + param.pattern, () => {
        describe('tryMatch()', () => {
            param.tryMatch.forEach((item, i) => testHelperTryMatch(pattern, item, i));
        });

        describe('serialize()', () => {
            param.serialize.forEach((item, i) => testHelperSerialize(pattern, item, i));
        });
    });
}
function testHelperTryMatch(pattern: string, param: TryMatchTestCase, index: number): void {
    if (param.isValid) {
        describe(`valid pattern ${index} (\`${param.path}\`)`, () => {
            const TEST_PARAM = param.path;
            let result: Option<PathParam|string>;
            before(() => {
                const path = new Path(pattern);
                result = path.tryMatch(TEST_PARAM);
            });

            it('should be the expected result type', () => {
                assert.strictEqual(result.isSome, true);
            });

            it('should be the expected result value', () => {
                assert.deepStrictEqual(result.unwrap(), param.result);
            });
        });
    }
    else {
        describe(`invalid pattern ${index} (\`${param.path}\`)`, () => {
            let result: Option<PathParam|string>;
            before(() => {
                const path = new Path(pattern);
                result = path.tryMatch(param.path);
            });

            it('should be the expected result type', () => {
                assert.strictEqual(result.isNone, true);
            });
        });
    }
}
function testHelperSerialize(pattern: string, param: SerializeTestCase, index: number): void {
    if (param.isValid) {
        describe(`valid pattern ${index} (\`${JSON.stringify(param.param)}\`)`, () => {
            let path: Path;
            before(() => {
                path = new Path(pattern);
            });

            it('should be the expected result type', () => {
                assert.strictEqual(path.serialize(param.param).isSome, true);
            });

            it('should be the expected result value', () => {
                assert.strictEqual(path.serialize(param.param).unwrap(), param.result);
            });
        });
    }
    else {
        describe(`invalid pattern ${index} (\`${JSON.stringify(param.param)}\`)`, () => {
            let path: Path;
            before(() => {
                path = new Path(pattern);
            });

            it('should be the expected result type', () => {
                assert.strictEqual(path.serialize(param.param).isNone, true);
            });
        });
    }
}

describe('PathFinder::Path', () => {
    const testcase: Array<PathTestPattern> = [
        {
            pattern: '/bar',
            tryMatch: [
                new ValidTryMatch('/bar', {
                }),
                new ValidTryMatch('/bar/', {
                }),
                new InvalidTryMatch('/bar/123'),
                new InvalidTryMatch('bar/foo'),
                new InvalidTryMatch('bar'),
                new InvalidTryMatch('/foo/bar'),
            ],
            serialize: [
                new ValidSerialize({
                }, '/bar'),
                new ValidSerialize({
                    bar: '123',
                }, '/bar'),
            ],
        },

        {
            pattern: '/bar/',
            tryMatch: [
                new ValidTryMatch('/bar', {
                }),
                new ValidTryMatch('/bar/', {
                }),
                new InvalidTryMatch('/bar/123'),
                new InvalidTryMatch('bar/foo'),
                new InvalidTryMatch('bar'),
                new InvalidTryMatch('/foo/bar'),
            ],
            serialize: [
                new ValidSerialize({
                }, '/bar/'),
                new ValidSerialize({
                    bar: '123',
                }, '/bar/'),
            ],
        },

        {
            pattern: '/bar/:id',
            tryMatch: [
                new ValidTryMatch('/bar/123', {
                    id: '123',
                }),
                new ValidTryMatch('/bar/123/', {
                    id: '123',
                }),
                new InvalidTryMatch('/foo/123'),
                new InvalidTryMatch('bar/foo'),
                new InvalidTryMatch('/bar/123/456'),
            ],
            serialize: [
                new ValidSerialize({
                        id: '123',
                }, '/bar/123'),

                new InvalidSerialize({
                    id: ['123', '456'],
                }),

                new InvalidSerialize({
                    barfoo: '123',
                }),
            ],
        },

        {
            pattern: '/bar/:id*',
            tryMatch: [
                new ValidTryMatch('/bar/123', {
                    id: '123',
                }),
                new ValidTryMatch('/bar/123/', {
                    id: '123',
                }),
                new ValidTryMatch('/bar/123/456', {
                    id: '123/456',
                }),
                new ValidTryMatch('/bar/123/456/', {
                    id: '123/456',
                }),
                new InvalidTryMatch('/foo/123'),
                new InvalidTryMatch('bar/foo'),
            ],
            serialize: [
                new ValidSerialize({
                    id: '123',
                }, '/bar/123'),
                new ValidSerialize({
                    id: '123/456',
                }, '/bar/123%2F456'),
                new ValidSerialize({
                    id: ['123', '456'],
                }, '/bar/123/456'),
                new ValidSerialize({
                    barfoo: '123',
                }, '/bar'),
                new ValidSerialize({
                    foo: '123',
                }, '/bar'),
            ],
        },

        {
            pattern: '/bar/:id+',
            tryMatch: [
                new ValidTryMatch('/bar/123', {
                    id: '123',
                }),
                new ValidTryMatch('/bar/123/', {
                    id: '123',
                }),
                new ValidTryMatch('/bar/123/456', {
                    id: '123/456',
                }),
                new ValidTryMatch('/bar/123/456/', {
                    id: '123/456',
                }),

                new InvalidTryMatch('/foo/123'),
                new InvalidTryMatch('bar/foo'),
            ],
            serialize: [
                new ValidSerialize({
                    id: '123',
                }, '/bar/123'),

                new ValidSerialize({
                    id: ['123', '456'],
                }, '/bar/123/456'),

                new ValidSerialize({
                    id: '123/456',
                }, '/bar/123%2F456'),

                new InvalidSerialize({
                    barfoo: '123',
                }),

                new InvalidSerialize({
                    foo: '123',
                }),
            ],
        },

        {
            pattern: '/bar/:a/:b',
            tryMatch: [
                new ValidTryMatch('/bar/123/456', {
                    a: '123',
                    b: '456',
                }),
                new ValidTryMatch('/bar/123/456/', {
                    a: '123',
                    b: '456',
                }),
                new InvalidTryMatch('/bar/123'),
                new InvalidTryMatch('/bar/123/'),
                new InvalidTryMatch('/bar//456'),
                new InvalidTryMatch('/bar//456/'),
            ],
            serialize: [
                new ValidSerialize({
                    a: '123',
                    b: '456',
                }, '/bar/123/456'),
                new InvalidSerialize({
                    a: '123',
                    b: ['456', '789'],
                }),
                new ValidSerialize({
                    a: '123',
                    b: '456/789',
                }, '/bar/123/456%2F789'),
                new InvalidSerialize({
                    a: '123',
                }),
                new InvalidSerialize({
                    b: '456',
                }),
            ],
        },

        {
            pattern: '/bar/:a/:b',
            tryMatch: [
                new ValidTryMatch('/bar/123/456', {
                    a: '123',
                    b: '456',
                }),
                new ValidTryMatch('/bar/123/456/', {
                    a: '123',
                    b: '456',
                }),
                new InvalidTryMatch('/bar/123'),
                new InvalidTryMatch('/bar/123/'),
                new InvalidTryMatch('/bar//456'),
                new InvalidTryMatch('/bar//456/'),
            ],
            serialize: [
                new ValidSerialize({
                    a: '123',
                    b: '456',
                }, '/bar/123/456'),
                new InvalidSerialize({
                    a: '123',
                    b: ['456', '789'],
                }),
                new ValidSerialize({
                    a: '123',
                    b: '456/789',
                }, '/bar/123/456%2F789'),
                new InvalidSerialize({
                    a: '123',
                }),
                new InvalidSerialize({
                    b: '456',
                }),
            ],
        },

        {
            pattern: '/bar/:a+/:b',
            tryMatch: [
                new ValidTryMatch('/bar/123/456', {
                    a: '123',
                    b: '456',
                }),
                new ValidTryMatch('/bar/123/456/', {
                    a: '123',
                    b: '456',
                }),
                new ValidTryMatch('/bar/123/456/789', {
                    a: '123/456',
                    b: '789',
                }),
                new ValidTryMatch('/bar/123/456/789/', {
                    a: '123/456',
                    b: '789',
                }),
                new InvalidTryMatch('/bar/123'),
                new InvalidTryMatch('/bar/123/'),
                new InvalidTryMatch('/bar//456'),
                new InvalidTryMatch('/bar//456/'),
                new InvalidTryMatch('/bar/123//456'),
                new InvalidTryMatch('/bar/123//456/'),
            ],
            serialize: [
                new ValidSerialize({
                    a: '123',
                    b: '456',
                }, '/bar/123/456'),
                new ValidSerialize({
                    a: '123/123',
                    b: '456',
                }, '/bar/123%2F123/456'),
                new ValidSerialize({
                    a: ['123', '123'],
                    b: '456',
                }, '/bar/123/123/456'),
                new InvalidSerialize({
                    a: '123',
                    b: ['456', '789'],
                }),
                new ValidSerialize({
                    a: '123',
                    b: '456/789',
                }, '/bar/123/456%2F789'),
                new InvalidSerialize({
                    a: '123',
                }),
                new InvalidSerialize({
                    b: '456',
                }),
            ],
        },

        {
            pattern: '/bar/:a*/:b',
            tryMatch: [
                new ValidTryMatch('/bar/123/456', {
                    a: '123',
                    b: '456',
                }),
                new ValidTryMatch('/bar/123/456/', {
                    a: '123',
                    b: '456',
                }),
                new ValidTryMatch('/bar/123/456/789', {
                    a: '123/456',
                    b: '789',
                }),
                new ValidTryMatch('/bar/123/456/789/', {
                    a: '123/456',
                    b: '789',
                }),
                new ValidTryMatch('/bar/123', {
                    a: undefined,
                    b: '123',
                }),
                new ValidTryMatch('/bar/123/', {
                    a: undefined,
                    b: '123',
                }),
                new InvalidTryMatch('/bar//456'),
                new InvalidTryMatch('/bar//456/'),
                new InvalidTryMatch('/bar/123//456'),
                new InvalidTryMatch('/bar/123//456/'),
            ],
            serialize: [
                new ValidSerialize({
                    a: '123',
                    b: '456',
                }, '/bar/123/456'),
                new ValidSerialize({
                    a: '123/123',
                    b: '456',
                }, '/bar/123%2F123/456'),
                new ValidSerialize({
                    a: ['123', '123'],
                    b: '456',
                }, '/bar/123/123/456'),
                new InvalidSerialize({
                    a: '123',
                    b: ['456', '789'],
                }),
                new ValidSerialize({
                    a: '123',
                    b: '456/789',
                }, '/bar/123/456%2F789'),
                new InvalidSerialize({
                    a: '123',
                }),
                new ValidSerialize({
                    b: '456',
                }, '/bar/456'),
            ],
        },

        {
            pattern: '/bar/:a/:b+',
            tryMatch: [
                new ValidTryMatch('/bar/123/456', {
                    a: '123',
                    b: '456',
                }),
                new ValidTryMatch('/bar/123/456/', {
                    a: '123',
                    b: '456',
                }),
                new ValidTryMatch('/bar/123/456/789', {
                    a: '123',
                    b: '456/789',
                }),
                new InvalidTryMatch('/bar/123'),
                new InvalidTryMatch('/bar/123/'),
                new InvalidTryMatch('/bar/123//'),
                new InvalidTryMatch('/bar//456'),
                new InvalidTryMatch('/bar//456/'),
            ],
            serialize: [
                new ValidSerialize({
                    a: '123',
                    b: '456',
                }, '/bar/123/456'),
                new ValidSerialize({
                    a: '123',
                    b: ['456', '789'],
                }, '/bar/123/456/789'),
                new ValidSerialize({
                    a: '123',
                    b: '456/789',
                }, '/bar/123/456%2F789'),
                new InvalidSerialize({
                    a: '123',
                }),
                new InvalidSerialize({
                    b: '456',
                }),
            ],
        },

        {
            pattern: '/bar/:a/:b*',
            tryMatch: [
                new ValidTryMatch('/bar/123/456', {
                    a: '123',
                    b: '456',
                }),
                new ValidTryMatch('/bar/123/456/', {
                    a: '123',
                    b: '456',
                }),
                new ValidTryMatch('/bar/123/456/789', {
                    a: '123',
                    b: '456/789',
                }),
                new ValidTryMatch('/bar/123/456/789/', {
                    a: '123',
                    b: '456/789',
                }),
                new ValidTryMatch('/bar/123', {
                    a: '123',
                    b: undefined,
                }),
                new ValidTryMatch('/bar/123/', {
                    a: '123',
                    b: undefined,
                }),
                new InvalidTryMatch('/bar//456'),
                new InvalidTryMatch('/bar//456/'),
                new InvalidTryMatch('/bar/123//456'),
                new InvalidTryMatch('/bar/123//456/'),
            ],
            serialize: [
                new ValidSerialize({
                    a: '123',
                    b: '456',
                }, '/bar/123/456'),
                new ValidSerialize({
                    a: '123/123',
                    b: '456',
                }, '/bar/123%2F123/456'),
                new InvalidSerialize({
                    a: ['123', '123'],
                    b: '456',
                }),
                new ValidSerialize({
                    a: '123',
                    b: ['456', '789'],
                }, '/bar/123/456/789'),
                new ValidSerialize({
                    a: '123',
                    b: '456/789',
                }, '/bar/123/456%2F789'),
                new ValidSerialize({
                    a: '123',
                }, '/bar/123'),
                new InvalidSerialize({
                    b: '456',
                }),
            ],
        },

        {
            pattern: '/bar/:a+/foo',
            tryMatch: [
                new ValidTryMatch('/bar/123/foo', {
                    a: '123',
                }),
                new ValidTryMatch('/bar/123/foo/', {
                    a: '123',
                }),
                new ValidTryMatch('/bar/123/456/foo', {
                    a: '123/456',
                }),
                new ValidTryMatch('/bar/123/456/foo/', {
                    a: '123/456',
                }),
                new ValidTryMatch('/bar/123/456/789/foo', {
                    a: '123/456/789',
                }),
                new ValidTryMatch('/bar/123/456/789/foo/', {
                    a: '123/456/789',
                }),
                new InvalidTryMatch('/bar/123'),
                new InvalidTryMatch('/bar/123/'),
                new InvalidTryMatch('/bar/123//'),
                new InvalidTryMatch('/bar//foo'),
                new InvalidTryMatch('/bar//foo/'),
            ],
            serialize: [
                new ValidSerialize({
                    a: '123',
                }, '/bar/123/foo'),
                new ValidSerialize({
                    a: ['123', '456'],
                }, '/bar/123/456/foo'),
                new ValidSerialize({
                    a: '123/456',
                }, '/bar/123%2F456/foo'),
                new InvalidSerialize({
                }),
                new InvalidSerialize({
                    b: '456',
                }),
            ],
        },

        {
            pattern: '/bar/:a+/foo/:b+',
            tryMatch: [
                new ValidTryMatch('/bar/123/foo/456', {
                    a: '123',
                    b: '456',
                }),
                new ValidTryMatch('/bar/123/foo/456/', {
                    a: '123',
                    b: '456',
                }),
                new ValidTryMatch('/bar/123/456/foo/789', {
                    a: '123/456',
                    b: '789',
                }),
                new ValidTryMatch('/bar/123/456/foo/789/', {
                    a: '123/456',
                    b: '789',
                }),
                new ValidTryMatch('/bar/123/456/789/foo/abc', {
                    a: '123/456/789',
                    b: 'abc',
                }),
                new ValidTryMatch('/bar/123/456/789/foo/abc/', {
                    a: '123/456/789',
                    b: 'abc',
                }),
                new InvalidTryMatch('/bar/123'),
                new InvalidTryMatch('/bar/123/'),
                new InvalidTryMatch('/bar/123//'),
                new InvalidTryMatch('/bar/123/foo'),
                new InvalidTryMatch('/bar/123/foo/'),
                new InvalidTryMatch('/bar//456'),
                new InvalidTryMatch('/bar//456/'),
                new InvalidTryMatch('/bar//foo/456'),
                new InvalidTryMatch('/bar//foo/456/'),
            ],
            serialize: [
                new ValidSerialize({
                    a: '123',
                    b: '456',
                }, '/bar/123/foo/456'),
                new ValidSerialize({
                    a: ['123', '456'],
                    b: ['789', 'abc'],
                }, '/bar/123/456/foo/789/abc'),
                new ValidSerialize({
                    a: '123',
                    b: '456/789',
                }, '/bar/123/foo/456%2F789'),
                new InvalidSerialize({
                    a: '123',
                }),
                new InvalidSerialize({
                    b: '456',
                }),
            ],
        },

        {
            pattern: '/bar/:a+/:b+',
            tryMatch: [
                new ValidTryMatch('/bar/123/456', {
                    a: '123',
                    b: '456',
                }),
                new ValidTryMatch('/bar/123/456/', {
                    a: '123',
                    b: '456',
                }),
                new ValidTryMatch('/bar/123/456/789', {
                    a: '123/456',
                    b: '789',
                }),
                new ValidTryMatch('/bar/123/456/789/', {
                    a: '123/456',
                    b: '789',
                }),
                new ValidTryMatch('/bar/123/456/789/abc', {
                    a: '123/456/789',
                    b: 'abc',
                }),
                new ValidTryMatch('/bar/123/456/789/abc/', {
                    a: '123/456/789',
                    b: 'abc',
                }),
                new InvalidTryMatch('/bar/123'),
                new InvalidTryMatch('/bar/123/'),
                new InvalidTryMatch('/bar/123//'),
                new InvalidTryMatch('/bar//456'),
                new InvalidTryMatch('/bar//456/'),
            ],
            serialize: [
                new ValidSerialize({
                    a: '123',
                    b: '456',
                }, '/bar/123/456'),
                new ValidSerialize({
                    a: ['123', '456'],
                    b: ['789', 'abc'],
                }, '/bar/123/456/789/abc'),
                new ValidSerialize({
                    a: '123',
                    b: '456/789',
                }, '/bar/123/456%2F789'),
                new InvalidSerialize({
                    a: '123',
                }),
                new InvalidSerialize({
                    b: '456',
                }),
            ],
        },

        {
            pattern: '/bar/:a+/:b*',
            tryMatch: [
                new ValidTryMatch('/bar/123/456', {
                    a: '123/456',
                    b: undefined,
                }),
                new ValidTryMatch('/bar/123/456/', {
                    a: '123/456',
                    b: undefined,
                }),
                new ValidTryMatch('/bar/123/456/789', {
                    a: '123/456/789',
                    b: undefined,
                }),
                new ValidTryMatch('/bar/123/456/789/', {
                    a: '123/456/789',
                    b: undefined,
                }),
                new ValidTryMatch('/bar/123/456/789/abc', {
                    a: '123/456/789/abc',
                    b: undefined,
                }),
                new ValidTryMatch('/bar/123/456/789/abc/', {
                    a: '123/456/789/abc',
                    b: undefined,
                }),
                new ValidTryMatch('/bar/123', {
                    a: '123',
                    b: undefined,
                }),
                new ValidTryMatch('/bar/123/', {
                    a: '123',
                    b: undefined,
                }),
                new InvalidTryMatch('/bar/123//'),
                new InvalidTryMatch('/bar//456'),
                new InvalidTryMatch('/bar//456/'),
            ],
            serialize: [
                new ValidSerialize({
                    a: '123',
                    b: '456',
                }, '/bar/123/456'),
                new ValidSerialize({
                    a: ['123', '456'],
                    b: ['789', 'abc'],
                }, '/bar/123/456/789/abc'),
                new ValidSerialize({
                    a: '123',
                    b: '456/789',
                }, '/bar/123/456%2F789'),
                new ValidSerialize({
                    a: '123',
                }, '/bar/123'),
                new ValidSerialize({
                    a: '123/456',
                }, '/bar/123%2F456'),
                new ValidSerialize({
                    a: ['123', '456'],
                }, '/bar/123/456'),
                new InvalidSerialize({
                    b: '456',
                }),
            ],
        },

        {
            pattern: '/bar/:a*/:b+',
            tryMatch: [
                new ValidTryMatch('/bar/123/456', {
                    a: '123',
                    b: '456',
                }),
                new ValidTryMatch('/bar/123/456/', {
                    a: '123',
                    b: '456',
                }),
                new ValidTryMatch('/bar/123/456/789', {
                    a: '123/456',
                    b: '789',
                }),
                new ValidTryMatch('/bar/123/456/789/', {
                    a: '123/456',
                    b: '789',
                }),
                new ValidTryMatch('/bar/123/456/789/abc', {
                    a: '123/456/789',
                    b: 'abc',
                }),
                new ValidTryMatch('/bar/123/456/789/abc/', {
                    a: '123/456/789',
                    b: 'abc',
                }),
                new ValidTryMatch('/bar/123', {
                    a: undefined,
                    b: '123',
                }),
                new ValidTryMatch('/bar/123/', {
                    a: undefined,
                    b: '123',
                }),
                new InvalidTryMatch('/bar/123//'),
                new InvalidTryMatch('/bar//456'),
                new InvalidTryMatch('/bar//456/'),
            ],
            serialize: [
                new ValidSerialize({
                    a: '123',
                    b: '456',
                }, '/bar/123/456'),
                new ValidSerialize({
                    a: ['123', '456'],
                    b: ['789', 'abc'],
                }, '/bar/123/456/789/abc'),
                new ValidSerialize({
                    a: '123',
                    b: '456/789',
                }, '/bar/123/456%2F789'),
                new InvalidSerialize({
                    a: '123',
                }),
                new ValidSerialize({
                    b: '456',
                }, '/bar/456'),
                new ValidSerialize({
                    b: ['456', '789'],
                }, '/bar/456/789'),
            ],
        },

        {
            pattern: '/bar/:a*/:b*',
            tryMatch: [
                new ValidTryMatch('/bar/123/456', {
                    a: '123/456',
                    b: undefined,
                }),
                new ValidTryMatch('/bar/123/456/', {
                    a: '123/456',
                    b: undefined,
                }),
                new ValidTryMatch('/bar/123/456/789', {
                    a: '123/456/789',
                    b: undefined,
                }),
                new ValidTryMatch('/bar/123/456/789/', {
                    a: '123/456/789',
                    b: undefined,
                }),
                new ValidTryMatch('/bar/123/456/789/abc', {
                    a: '123/456/789/abc',
                    b: undefined,
                }),
                new ValidTryMatch('/bar/123/456/789/abc/', {
                    a: '123/456/789/abc',
                    b: undefined,
                }),
                new ValidTryMatch('/bar/123', {
                    a: '123',
                    b: undefined,
                }),
                new ValidTryMatch('/bar/123', {
                    a: '123',
                    b: undefined,
                }),
                new InvalidTryMatch('/bar/123//'),
                new InvalidTryMatch('/bar//456'),
                new InvalidTryMatch('/bar//456/'),
            ],
            serialize: [
                new ValidSerialize({
                    a: '123',
                    b: '456',
                }, '/bar/123/456'),
                new ValidSerialize({
                    a: ['123', '456'],
                    b: ['789', 'abc'],
                }, '/bar/123/456/789/abc'),
                new ValidSerialize({
                    a: '123',
                    b: '456/789',
                }, '/bar/123/456%2F789'),
                new ValidSerialize({
                    a: '123',
                }, '/bar/123'),
                new ValidSerialize({
                    a: ['123', '456'],
                }, '/bar/123/456'),
                new ValidSerialize({
                    b: '456',
                }, '/bar/456'),
                new ValidSerialize({
                    b: ['456', '789'],
                }, '/bar/456/789'),
            ],
        },
    ];

    testcase.forEach(testHelper);
});
