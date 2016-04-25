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
'use strict';

const del = require('del');
const gulp = require('gulp');
const path = require('path');

const copyMod = require('./tools/build/cp');
const doCopy = copyMod.doCopy;

const scriptMod = require('./tools/build/script');
const compileTypeScript = scriptMod.compileTypeScript;
const buildLegacyLib = scriptMod.buildLegacyLib;
const runLinkerForClient = scriptMod.runLinkerForClient;
const compileScriptForServer = scriptMod.compileScriptForServer;

const lintMod = require('./tools/build/lint');
const runESLint = lintMod.runESLint;
const runTSLint = lintMod.runTSLint;

const styleMod = require('./tools/build/style');
const buildCSS = styleMod.buildCSS;

const isRelease = process.env.NODE_ENV === 'production';
const isEnableRize = process.env.ENABLE_RIZE === '1';

const NPM_MOD_DIR = path.resolve(__dirname, './node_modules/');

const SRC_DIR = path.resolve(__dirname, './src/');
const OBJ_DIR = path.resolve(__dirname, './obj/');
const DIST_DIR = path.resolve(__dirname, './dist/');

const OBJ_CLIENT = path.resolve(OBJ_DIR, './client/');
const OBJ_SERVER = path.resolve(OBJ_DIR, './server/');

const DIST_SERVER = path.resolve(DIST_DIR, './server/');
const DIST_CLIENT = path.resolve(DIST_DIR, './client/');
const DIST_CLIENT_JS = path.resolve(DIST_CLIENT, './js/');
const DIST_CLIENT_CSS = path.resolve(DIST_CLIENT, './css/');

const CLIENT_SRC_JS = [
    path.resolve(NPM_MOD_DIR, './moment/moment.js'),
    path.resolve(SRC_DIR, './client/js/libs/stringcolor.js'),
    path.resolve(SRC_DIR, './client/js/libs/parse.js'),
    path.resolve(NPM_MOD_DIR, './urijs/src/URI.js'),
];

const CWD = path.relative(__dirname, '');

/**
 *  # The rules of task name
 *
 *  ## public task
 *  - This is completed in itself.
 *  - This is callable as `gulp <taskname>`.
 *
 *  ## private task
 *  - This has some sideeffect in dependent task trees
 *    and it cannot recovery by self.
 *  - This is __callable only from public task__.
 *    DONT CALL as `gulp <taskname>`.
 *  - MUST name `__taskname`.
 */

// clean up
gulp.task('__clean:client:js:obj', function () {
    return del(path.join(OBJ_CLIENT, '**', '*.*'));
});
gulp.task('__clean:client:js:dist', function () {
    return del(path.join(DIST_CLIENT_JS, '**', '*.*'));
});

gulp.task('__clean:client:css:dist', function () {
    return del(path.join(DIST_CLIENT_CSS, '**', '*.*'));
});

gulp.task('__clean:server:obj', function () {
    return del(path.join(OBJ_SERVER, '**', '*.*'));
});
gulp.task('__clean:server:dist', function () {
    return del(path.join(DIST_SERVER, '**', '*.*'));
});

// make obj/
gulp.task('__cp:client:js:obj', ['__cp:client:js::obj:rize', '__cp:client:js:obj:classic']);
gulp.task('__cp:client:js:obj:classic', ['__clean:client:js:obj'], function () {
    const src = ['./src/client/script/**/*.@(js|jsx)'];
    const objDir = path.resolve(OBJ_CLIENT, './script');
    return doCopy(src, objDir);
});
gulp.task('__cp:client:js::obj:rize', ['__clean:client:js:obj'], function () {
    if (!isEnableRize) {
        return Promise.resolve();
    }
    else {
        const src = ['./src/client/rize/**/*.@(js|jsx)'];
        const objDir = path.resolve(OBJ_CLIENT, './rize');
        return doCopy(src, objDir);
    }
});
gulp.task('__cp:server:js:obj', ['__clean:server:obj'], function () {
    const src = ['./src/server/**/*.@(js|jsx)'];
    return doCopy(src, OBJ_SERVER);
});

gulp.task('__typescript', ['__clean:client:js:obj'], function () {
    return compileTypeScript(CWD, NPM_MOD_DIR);
});

// make dist/
gulp.task('__link:client:js', ['__clean:client:js:dist', '__cp:client:js:obj', '__typescript'], function () {
    const root = isEnableRize ?
        './rize/index.js' : './script/karen.js';
    const ENTRY_POINT = path.resolve(OBJ_CLIENT, root);

    return runLinkerForClient(ENTRY_POINT, DIST_CLIENT_JS, 'karen.js', isRelease);
});

gulp.task('__babel:server', ['__clean:server:dist', '__cp:server:js:obj'], function () {
    return compileScriptForServer(CWD, NPM_MOD_DIR, OBJ_SERVER, DIST_SERVER, isRelease);
});

// lint
gulp.task('__eslint', function () {
    const src = [
        './.eslintrc.js',
        './gulpfile.js',
        './defaults/',
        './src/client/.eslintrc.js',
        './src/client/script/',
        './src/client/rize/',
        './src/server/',
        './src/server/.eslintrc.js',
        './tools/',
    ];
    return runESLint(CWD, NPM_MOD_DIR, src);
});

gulp.task('__tslint', function () {
    const SRC = [
        './src/client/**/*.@(ts|tsx)',
        './src/server/**/*.@(ts|tsx)',
    ];
    return runTSLint(CWD, NPM_MOD_DIR, SRC);
});

// others
gulp.task('__postcss', ['__clean:client:css:dist'], function () {
    return buildCSS('./src/client/css/style.css', DIST_CLIENT_CSS);
});

gulp.task('__uglify', ['__clean:client:js:dist'], function () {
    if (isEnableRize) {
        return Promise.resolve();
    }
    else {
        return buildLegacyLib(CLIENT_SRC_JS, DIST_CLIENT_JS, 'libs.min.js');
    }
});

gulp.task('__build:server', ['__babel:server']);
gulp.task('__build:client:js', ['__uglify', '__link:client:js']);
gulp.task('__build:client:css', ['__postcss']);

// public target
gulp.task('jslint', ['__eslint', '__tslint']);
gulp.task('tsc', ['__typescript']);
gulp.task('build:server', ['jslint', '__build:server']);
gulp.task('build:client', ['jslint', '__build:client:js', '__build:client:css']);
gulp.task('build', ['build:server', 'build:client']);
gulp.task('clean:server', ['__clean:server:obj', '__clean:server:dist']);
gulp.task('clean:client', ['__clean:client:js:obj', '__clean:client:js:dist', '__clean:client:css:dist']);
gulp.task('clean', ['clean:client', 'clean:server']);
gulp.task('default', ['build']);
