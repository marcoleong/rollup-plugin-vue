import _regeneratorRuntime from 'babel-runtime/regenerator';
import _asyncToGenerator from 'babel-runtime/helpers/asyncToGenerator';
import { createFilter } from 'rollup-pluginutils';
import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _Object$assign from 'babel-runtime/core-js/object/assign';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import deIndent from 'de-indent';
import htmlMinifier from 'html-minifier';
import parse5 from 'parse5';
import templateValidator from 'vue-template-validator';
import _Object$keys from 'babel-runtime/core-js/object/keys';
import { existsSync, mkdirSync, writeFile } from 'fs';
import path, { dirname, isAbsolute, relative, resolve } from 'path';
import _defineProperty from 'babel-runtime/helpers/defineProperty';
import _Promise from 'babel-runtime/core-js/promise';
import _extends from 'babel-runtime/helpers/extends';
import postcss from 'postcss';
import _typeof from 'babel-runtime/helpers/typeof';
import postcssrc from 'postcss-load-config';
import modules from 'postcss-modules';
import selectorParser from 'postcss-selector-parser';
import camelcase from 'camelcase';
import _Object$create from 'babel-runtime/core-js/object/create';
import hash from 'hash-sum';
import debug from 'debug';
import postHtml from 'posthtml';
import parseAttrs from 'posthtml-attrs-parser';
import MagicString from 'magic-string';
import transpileVueTemplate from 'vue-template-es2015-compiler';
import { ModuleKind, ModuleResolutionKind, transpileModule } from 'typescript';
import mergeOptions from 'merge-options';

/* eslint-disable complexity */
var postcssLoadConfig = (function () {var _ref = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(postcssOpt) {var options, plugins;return _regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:
                        options = {};
                        plugins = [];

                        if (typeof postcssOpt === 'function') {
                            plugins = postcssOpt.call(this);
                        } else if (Array.isArray(postcssOpt)) {
                            plugins = postcssOpt;
                        } else if ((typeof postcssOpt === 'undefined' ? 'undefined' : _typeof(postcssOpt)) === 'object') {
                            plugins = typeof postcssOpt.plugins === 'function' ? postcssOpt.plugins.call(this) : postcssOpt.plugins || [];
                            options = postcssOpt.options || {};
                        }return _context.abrupt('return',

                        postcssrc().then(function (config) {
                            if (config.plugins) {
                                plugins = plugins.concat(config.plugins);
                            }

                            if (config.options) {
                                options = _Object$assign(options, config.options);
                            }
                            return { plugins: plugins, options: options };
                        }).catch(function () {return { plugins: plugins, options: options };}));case 4:case 'end':return _context.stop();}}}, _callee, this);}));return function (_x) {return _ref.apply(this, arguments);};})();

// used in scoped CSS rewriting
var cache = _Object$create(null);

function genScopeID(file) {
    var modified = path.relative(process.cwd(), file);

    if (!cache[modified]) {
        cache[modified] = 'data-v-' + hash(modified);
    }

    return cache[modified];
}

var debug$1 = debug('rollup-plugin-vue');

// import MagicString from 'magic-string'
/**
                               * filter invalid tag, e.g. percentage, keyword(from, to)...
                               * @param tag
                               * @returns {boolean}
                               */
function isInvalidTag(tag) {
    if (
    tag === 'from' ||
    tag === 'to' ||
    /^\d/.test(tag))
    {
        return true;
    }
}

var addScopeID = postcss.plugin('add-scope-id', function (_ref) {var scopeID = _ref.scopeID;
    var selectorTransformer = selectorParser(function (selectors) {
        selectors.each(function (selector) {
            var target = null;
            /* eslint-disable complexity */
            selector.each(function (n) {
                if (n.type === 'combinator' && n.value === '>>>') {
                    n.value = ' ';
                    n.spaces.before = n.spaces.after = '';
                    return false;
                }

                if (n.type === 'tag') {
                    if (n.value === '/deep/') {
                        var next = n.next();

                        if (next.type === 'combinator' && next.value === ' ') {
                            next.remove();
                        }

                        n.remove();
                        return false;
                    } else if (isInvalidTag(n.value)) {
                        return;
                    }
                }

                if (n.type !== 'pseudo' && n.type !== 'combinator') {
                    target = n;
                }
            });
            /* eslint-enable complexity */

            target && selector.insertAfter(target, selectorParser.attribute({
                attribute: scopeID }));

        });
    });

    return function (root) {
        root.walkRules(function (rule) {
            rule.selector = selectorTransformer.process(rule.selector).result;
        });
    };
});

function compileModule(code, map, source, options) {
    var style = void 0;
    debug$1('CSS Modules: ' + source.id);

    return postcss([
    modules(_extends({
        getJSON: function getJSON(filename, json) {
            style = json;
        } },
    options.cssModules))]).

    process(code, { map: { inline: false, prev: map }, from: source.id, to: source.id }).
    then(
    function (result) {return { code: result.css, map: result.map.toString(), module: style };},
    function (error) {
        throw error;
    });

}

function escapeRegExp(str) {
    return str.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
}

var compileCSS = (function () {var _ref2 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(promise, options) {var style, _ref3, code, map, initPostcssOptions, hasModule, hasScope, postcssConfig, plugins, processPromise, curOptions;return _regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:_context.next = 2;return (
                            promise);case 2:style = _context.sent;
                        debug$1('CSS: ' + style.id);_ref3 =
                        '$compiled' in style ? style.$compiled : style, code = _ref3.code, map = _ref3.map;
                        initPostcssOptions = { map: { inline: false, prev: map }, from: style.id, to: style.id };
                        hasModule = style.module === true;
                        hasScope = style.scoped === true;_context.next = 10;return (
                            postcssLoadConfig(options.postcss));case 10:postcssConfig = _context.sent;
                        plugins = postcssConfig.plugins || [];
                        processPromise = _Promise.resolve();

                        if (hasScope) {
                            debug$1('Scoped CSS: ' + style.id);
                            plugins.push(addScopeID({
                                scopeID: genScopeID(style.id) }));

                        }

                        if (hasModule) {
                            // TODO: I found this plugin makes all postcss plugin run twice.
                            processPromise = compileModule(code, map, style, options);
                        }

                        curOptions = _Object$assign({}, postcssConfig.options, initPostcssOptions);return _context.abrupt('return',

                        processPromise.then(function (firstResult) {
                            var moduleNames = firstResult && firstResult.module;
                            return postcss(plugins).
                            process(firstResult ? firstResult.code : code, curOptions).
                            then(function (result) {
                                var compiled = {
                                    code: result.css,
                                    map: result.map.toString() };

                                if (style.$compiled) {
                                    compiled.$prev = style.$compiled;
                                }

                                if (hasModule) {(function () {
                                        var classes = _Object$keys(moduleNames);
                                        var cssModule = {};

                                        if (classes.length) {
                                            // Apply CSS modules to actual source.
                                            // TODO: Update source map.
                                            // const original = style.code

                                            style.code = classes.reduce(
                                            function (result, original) {
                                                var transformed = moduleNames[original];
                                                cssModule[camelcase(original)] = transformed;
                                                cssModule[original] = transformed;

                                                return result.replace(new RegExp(escapeRegExp('.' + original), 'g'), '.' + transformed);
                                            },
                                            style.code);

                                            // style.map = (new MagicString(original))

                                            compiled.module =
                                            typeof style.module === 'string' && style.attrs.module.length ? _defineProperty({},
                                            style.module, cssModule) : cssModule;
                                        }})();
                                }

                                style.$compiled = compiled;

                                return style;
                            }).
                            catch(function (error) {return debug$1(error);});
                        }));case 17:case 'end':return _context.stop();}}}, _callee, this);}));return function (_x, _x2) {return _ref2.apply(this, arguments);};})();

function compileSCSS (style, options) {
    var sass = require('node-sass');
    debug$1('SASS: ' + style.id);var _sass$renderSync =
    sass.renderSync(_extends({
        file: style.id,
        data: 'data' in options.scss ? options.scss.data + '\n' + style.code : style.code,
        omitSourceMapUrl: true,
        sourceMap: true,
        outFile: style.id,
        indentedSyntax: style.lang === 'sass' },
    options.scss)),css = _sass$renderSync.css,map = _sass$renderSync.map;


    style.$compiled = {
        code: css.toString(),
        map: map.toString() };


    return style;
}

var compileLESS = (function () {var _ref = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(style, options) {var less, config, _ref2, css, map;return _regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:
                        less = require('less');
                        config = _extends({
                            plugins: [],
                            paths: [],
                            sourceMap: {
                                sourceMapFullFilename: style.id,
                                sourceMapFileInline: false } },

                        options.less);


                        config.paths.unshift(path.dirname(style.id));_context.next = 5;return (

                            less.render(
                            'data' in options.less ? options.less.data + '\n' + style.code : style.code, config));case 5:_ref2 = _context.sent;css = _ref2.css;map = _ref2.map;


                        style.$compiled = {
                            code: css && css.toString() || '',
                            map: map && map.toString() || '' };return _context.abrupt('return',


                        style);case 10:case 'end':return _context.stop();}}}, _callee, this);}));return function (_x, _x2) {return _ref.apply(this, arguments);};})();

var compileSTYLUS = (function () {var _ref = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(style, options) {var stylus, stylusObj, code, map;return _regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:
                        stylus = require('stylus');
                        stylusObj = stylus('data' in options.stylus ? options.stylus.data + '\n' + style.code : style.code, _extends({}, options.stylus)).
                        set('filename', style.id).
                        set('sourcemap', {
                            'comment': false });_context.next = 4;return (


                            stylusObj.render());case 4:code = _context.sent;
                        map = stylusObj.sourcemap;

                        style.$compiled = {
                            code: code,
                            map: map };return _context.abrupt('return',


                        style);case 8:case 'end':return _context.stop();}}}, _callee, this);}));return function (_x, _x2) {return _ref.apply(this, arguments);};})();

var compilers = {
    scss: compileSCSS,
    sass: compileSCSS,
    less: compileLESS,
    stylus: compileSTYLUS };


var compile = function () {var _ref = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(style, options) {var output;return _regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:
                        output = void 0;if (!(

                        style.lang === 'css' || style.lang === 'postcss')) {_context.next = 7;break;}_context.next = 4;return (
                            compileCSS(style, options));case 4:output = _context.sent;_context.next = 15;break;case 7:_context.t0 =

                        compileCSS;_context.next = 10;return compilers[style.lang].call(null, style, options);case 10:_context.t1 = _context.sent;_context.t2 = options;_context.next = 14;return (0, _context.t0)(_context.t1, _context.t2);case 14:output = _context.sent;case 15:return _context.abrupt('return',


                        output);case 16:case 'end':return _context.stop();}}}, _callee, this);}));return function compile(_x, _x2) {return _ref.apply(this, arguments);};}();


function ensureDirectory(directory) {
    if (!existsSync(directory)) {
        ensureDirectory(dirname(directory));

        mkdirSync(directory);
    }
}

/* eslint-disable complexity */
function compileStyle (files, options) {
    if (typeof options.css === 'boolean') {
        return;
    }

    // Combine all stylesheets.
    var css = '';
    var allStyles = [];

    _Object$keys(files).forEach(function (file) {
        files[file].forEach(function (style) {
            css += '$compiled' in style ? style.$compiled.code + '\n' : style.code + '\n';

            allStyles.push(style);
        });
    });

    // Emit styles through callback
    if (typeof options.css === 'function') {
        options.css(css, allStyles, compile);

        return;
    }

    // Don't generate empty style file.
    if (!css.trim().length) {
        return;
    }

    var dest = options.css;

    if (typeof dest !== 'string') {
        return;
    }

    dest = isAbsolute(dest) ? dest : resolve(process.cwd(), dest);
    // Emit styles to file
    ensureDirectory(dirname(dest));
    writeFile(dest, css, function (err) {
        if (err) throw err;
    });
}
/* eslint-enable complexity */

var plugin = function plugin(modules$$1) {
    return function cssModules(tree) {
        tree.match({ attrs: { 'class': /\w+/ } }, function (node) {
            var attrs = parseAttrs(node.attrs);

            if (attrs.class) {
                attrs.class = attrs.class.map(function (c) {return modules$$1[c] || c;});

                node.attrs = attrs.compose();
            }

            return node;
        });
    };
};

var compileHTML = (function () {var _ref = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(template, extras, options) {var output;return _regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:if (!(
                        'modules' in extras && _Object$keys(extras.modules).length)) {_context.next = 5;break;}_context.next = 3;return (
                            postHtml([
                            plugin(extras.modules)]).
                            process(template));case 3:output = _context.sent;return _context.abrupt('return',

                        output.html);case 5:return _context.abrupt('return',


                        template);case 6:case 'end':return _context.stop();}}}, _callee, this);}));return function (_x, _x2, _x3) {return _ref.apply(this, arguments);};})();

var compilePug = (function () {var _ref = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(template, extras, options) {var pug, compiler;return _regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:
                        pug = require('pug');
                        compiler = pug.compile(template, _extends({ filename: extras.id, doctype: 'html' }, options.pug));return _context.abrupt('return',

                        compiler({ css: extras.modules || {} }));case 3:case 'end':return _context.stop();}}}, _callee, this);}));return function (_x, _x2, _x3) {return _ref.apply(this, arguments);};})();

var compilers$1 = {
    html: compileHTML,
    pug: compilePug,
    jade: compilePug };


var templateProcessor = (function () {var _ref = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(template, extras, options) {return _regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:_context.next = 2;return (
                            compilers$1[extras.lang || 'html'].call(null, template, extras, options));case 2:return _context.abrupt('return', _context.sent);case 3:case 'end':return _context.stop();}}}, _callee, this);}));return function (_x, _x2, _x3) {return _ref.apply(this, arguments);};})();

function findInjectionPosition(script) {
    var hasDefaultExportObject = /(export default[^{]*\{)/g.exec(script);

    if (hasDefaultExportObject) return { script: script, matches: hasDefaultExportObject };

    var hasDefaultExportReference = /(export default[\s]+((?!(?:do|if|in|for|let|new|try|var|case|else|enum|eval|false|null|this|true|void|with|break|catch|class|const|super|throw|while|yield|delete|export|import|public|return|static|switch|typeof|default|extends|finally|package|private|continue|debugger|function|arguments|interface|protected|implements|instanceof)$)[$A-Z_a-z\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc][$A-Z_a-z\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc0-9\u0300-\u036f\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u08e4-\u08fe\u0900-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c01-\u0c03\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c82\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0d02\u0d03\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19b0-\u19c0\u19c8\u19c9\u19d0-\u19d9\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf2-\u1cf4\u1dc0-\u1de6\u1dfc-\u1dff\u200c\u200d\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua620-\ua629\ua66f\ua674-\ua67d\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua880\ua881\ua8b4-\ua8c4\ua8d0-\ua8d9\ua8e0-\ua8f1\ua900-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe26\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f]*))/g.exec(script);

    if (!hasDefaultExportReference) return { script: script, matches: null };

    var name = hasDefaultExportReference[2].replace('$', '\\$');

    var result = new RegExp('(' + name + '[\\s]=[^{]*\\{)', 'g').exec(script);
    if (result) return { script: script, matches: result };

    /* Now the code below will transform
                                                                    export default VarName
                                                               into code below and inject code to here      v
                                                                    var __$VarName = Object.assign(VarName, {})
                                                                    __$VarName.prototype = VarName.prototype
                                                                    export default __$VarName
                                                            */
    var lit = new RegExp('export\\s+default\\s+' + name, 'g');
    script = script.replace(lit, ';\n    var __$' +
    name + ' = Object.assign(' + name + ', {})\n    __$' +
    name + '.prototype = ' + name + '.prototype\n    export default __$' +
    name + '\n    ');

    var data = {
        matches: new RegExp('(__\\$' + name + ' = Object\\.assign\\(' + name + ', \\{)', 'g').exec(script),
        script: script };

    return data;
}
function templateJs(rawScript, template, lang, id, options, modules$$1) {
    if (template === undefined) return rawScript;var _findInjectionPositio =

    findInjectionPosition(rawScript),matches = _findInjectionPositio.matches,script = _findInjectionPositio.script;

    if (matches && matches.length) {
        return script.split(matches[1]).join(matches[1] + ' template: ' + _JSON$stringify(template) + ',');
    }

    throw new Error('[rollup-plugin-vue] Template is injected in the default export of .vue file (lang: ' +
    lang + '). In ' + id + ', it cannot find \'export defaults\'.');

}

/**
   * Wrap code inside a with statement inside a function
   * This is necessary for Vue 2 template compilation
   */
function wrapRenderFunction(code) {
    return 'function(){' + code + '}';
}

function renderJs(rawScript, render, lang, id, options) {var _findInjectionPositio2 =
    findInjectionPosition(rawScript),matches = _findInjectionPositio2.matches,script = _findInjectionPositio2.script;

    if (matches && matches.length) {
        var renderScript = 'module.exports={' + ('render: ' +
        wrapRenderFunction(render.render) + ',') +
        'staticRenderFns: [' + (
        render.staticRenderFns.map(wrapRenderFunction).join(',') + '],}');

        if (options.stripWith !== false) {
            renderScript = transpileVueTemplate(renderScript, options.vue);
        }

        return script.split(matches[1]).join(renderScript.replace('module.exports={', matches[1]).replace(/\}$/, ''));
    }

    throw new Error('[rollup-plugin-vue] Generated render function is injected in the default export of .vue file (lang: ' +
    lang + '). In ' + id + ', it cannot find \'export defaults\'.');

}
function moduleJs(rawScript, modules$$1, lang, id, options) {
    if (_Object$keys(modules$$1).length === 0) return rawScript;var _findInjectionPositio3 =

    findInjectionPosition(rawScript),matches = _findInjectionPositio3.matches,script = _findInjectionPositio3.script;
    if (matches && matches.length) {
        var moduleScript = matches[1] + 'cssModules: ' + _JSON$stringify(modules$$1) + ',';

        return script.split(matches[1]).join(moduleScript);
    }

    throw new Error('[rollup-plugin-vue] CSS modules are injected in the default export of .vue file (lang: ' +
    lang + '). In ' + id + ', it cannot find \'export defaults\'.');

}
function scopeJs(rawScript, scopeID, lang, id, options) {var _findInjectionPositio4 =
    findInjectionPosition(rawScript),matches = _findInjectionPositio4.matches,script = _findInjectionPositio4.script;

    if (matches && matches.length) {
        var scopeScript = matches[1] + '_scopeId: \'' + scopeID + '\',';

        return script.split(matches[1]).join(scopeScript);
    }

    throw new Error('[rollup-plugin-vue] Scope ID is injected in the default export of .vue file (lang: ' +
    lang + '). In ' + id + ', it cannot find \'export defaults\'.');

}

function injectTemplate(script, template, lang, id, options) {
    if (lang in options.inject.template) {
        return options.inject.template[lang](script, template, lang, id, options);
    }
    throw new Error('[rollup-plugin-vue] Template is injected in the default export of .vue file. In ' +
    id + ', it cannot find \'export defaults\'.');

}

function injectRender(script, render, lang, id, options) {
    if (lang in options.inject.render) {
        return options.inject.render[lang](script, render, lang, id, options);
    }

    throw new Error('[rollup-plugin-vue] Generated render function is injected in the default export of .vue file. In ' +
    id + ', it cannot find \'export defaults\'.');

}

function injectModule(script, modules$$1, lang, id, options) {
    if (lang in options.inject.module) {
        return options.inject.module[lang](script, modules$$1, lang, id, options);
    }

    throw new Error('[rollup-plugin-vue] CSS modules are injected in the default export of .vue file. In ' +
    id + ', it cannot find \'export defaults\' in ' + script + '.');

}

function injectScopeID(script, scopeID, lang, id, options) {
    if (lang in options.inject.scoped) {
        return options.inject.scoped[lang](script, scopeID, lang, id, options);
    }

    throw new Error('[rollup-plugin-vue] Scope ID is injected in the default export of .vue file. In ' +
    id + ', it cannot find \'export defaults\'.');

}

/**
                                                                                                                                                                                                                                                                                                                                       * Compile template: DeIndent and minify html.
                                                                                                                                                                                                                                                                                                                                       */var processTemplate = function () {var _ref = _asyncToGenerator(_regeneratorRuntime.mark(
    function _callee(source, id, content, options, nodes, modules$$1) {var extras, code, template;return _regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:if (!(
                        source === undefined)) {_context.next = 2;break;}return _context.abrupt('return', undefined);case 2:

                        debug$1('Process template: ' + id);

                        extras = { modules: modules$$1, id: id, lang: source.attrs.lang };
                        code = deIndent(source.code).trim();_context.next = 7;return (

                            options.disableCssModuleStaticReplacement !== true ?
                            templateProcessor(code, extras, options) :
                            code);case 7:template = _context.sent;


                        if (!options.compileTemplate) {
                            validateTemplate(code, content, id);
                        }return _context.abrupt('return',

                        htmlMinifier.minify(template, options.htmlMinifier));case 10:case 'end':return _context.stop();}}}, _callee, this);}));return function processTemplate(_x, _x2, _x3, _x4, _x5, _x6) {return _ref.apply(this, arguments);};}();


/* eslint-disable complexity */














/* eslint-enable complexity */var processScript = function () {var _ref2 = _asyncToGenerator(_regeneratorRuntime.mark(

    function _callee2(source, id, content, options, nodes, modules$$1, scoped) {var template, lang, script, map;return _regeneratorRuntime.wrap(function _callee2$(_context2) {while (1) {switch (_context2.prev = _context2.next) {case 0:_context2.next = 2;return (
                            processTemplate(nodes.template[0], id, content, options, nodes, modules$$1));case 2:template = _context2.sent;

                        debug$1('Process script: ' + id);
                        lang = normalizeLang(source.attrs.lang);

                        if (source.attrs.src) {
                            source.code = 'import __vue_module__ from \'' + source.attrs.src + '\'; export default __vue_module__;';
                        }if (!(

                        source.attrs.lang && ['js', 'babel'].indexOf(source.attrs.lang) < 0)) {_context2.next = 12;break;}if (
                        source.attrs.lang in options.script) {_context2.next = 9;break;}throw (
                            new Error('[rollup-plugin-vue] ' + source.attrs.lang + ' is not yet supported in .vue files.'));case 9:_context2.next = 11;return (


                            options.script[source.attrs.lang](source, id, content, options, nodes));case 11:source = _context2.sent;case 12:


                        script = deIndent(padContent(content.slice(0, content.indexOf(source.code))) + source.code);
                        map = new MagicString(script).generateMap({ hires: true });

                        script = processScriptForStyle(script, modules$$1, scoped, lang, id, options);_context2.next = 17;return (

                            processScriptForRender(script, template, lang, id, options));case 17:script = _context2.sent;return _context2.abrupt('return',

                        { map: map, code: script });case 19:case 'end':return _context2.stop();}}}, _callee2, this);}));return function processScript(_x7, _x8, _x9, _x10, _x11, _x12, _x13) {return _ref2.apply(this, arguments);};}();var processScriptForRender = function () {var _ref3 = _asyncToGenerator(_regeneratorRuntime.mark(













    function _callee3(script, template, lang, id, options) {var render;return _regeneratorRuntime.wrap(function _callee3$(_context3) {while (1) {switch (_context3.prev = _context3.next) {case 0:if (!(
                        template && options.compileTemplate)) {_context3.next = 5;break;}
                        render = require('vue-template-compiler').compile(template, options.compileOptions);_context3.next = 4;return (

                            injectRender(script, render, lang, id, options));case 4:return _context3.abrupt('return', _context3.sent);case 5:if (!


                        template) {_context3.next = 9;break;}_context3.next = 8;return (
                            injectTemplate(script, template, lang, id, options));case 8:return _context3.abrupt('return', _context3.sent);case 9:return _context3.abrupt('return',


                        script);case 10:case 'end':return _context3.stop();}}}, _callee3, this);}));return function processScriptForRender(_x14, _x15, _x16, _x17, _x18) {return _ref3.apply(this, arguments);};}();


// eslint-disable-next-line complexity
var processStyle = function () {var _ref4 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee4(styles, id, content, options) {var outputs, i, style, code, map, output;return _regeneratorRuntime.wrap(function _callee4$(_context4) {while (1) {switch (_context4.prev = _context4.next) {case 0:
                        debug$1('Process styles: ' + id);
                        outputs = [];
                        i = 0;case 3:if (!(i < styles.length)) {_context4.next = 21;break;}
                        style = styles[i];

                        code = deIndent(
                        padContent(content.slice(0, content.indexOf(style.code))) + style.code);


                        map = new MagicString(code).generateMap({ hires: true });

                        output = {
                            id: id,
                            code: code,
                            map: map,
                            lang: style.attrs.lang || 'css',
                            module: 'module' in style.attrs ? style.attrs.module || true : false,
                            scoped: 'scoped' in style.attrs };_context4.t0 =


                        outputs;if (!(options.autoStyles || output.scoped || output.module)) {_context4.next = 15;break;}_context4.next = 12;return compile(output, options);case 12:_context4.t1 = _context4.sent;_context4.next = 16;break;case 15:_context4.t1 = output;case 16:_context4.t2 = _context4.t1;_context4.t0.push.call(_context4.t0, _context4.t2);case 18:i += 1;_context4.next = 3;break;case 21:return _context4.abrupt('return',


                        outputs);case 22:case 'end':return _context4.stop();}}}, _callee4, this);}));return function processStyle(_x19, _x20, _x21, _x22) {return _ref4.apply(this, arguments);};}();function getNodeAttrs(node) {if (node.attrs) {var attributes = {};var _iteratorNormalCompletion = true;var _didIteratorError = false;var _iteratorError = undefined;try {for (var _iterator = _getIterator(node.attrs), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {var attr = _step.value;attributes[attr.name] = attr.value;}} catch (err) {_didIteratorError = true;_iteratorError = err;} finally {try {if (!_iteratorNormalCompletion && _iterator.return) {_iterator.return();}} finally {if (_didIteratorError) {throw _iteratorError;}}}return attributes;}return {};} /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             * Pad content with empty lines to get correct line number in errors.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             */function padContent(content) {return content.split(/\r?\n/g).map(function () {return '';}).join('\n');}function validateTemplate(code, content, id) {var warnings = templateValidator(code, content);if (Array.isArray(warnings)) {(function () {var relativePath = relative(process.cwd(), id);warnings.forEach(function (msg) {console.warn('\n Warning in ' + relativePath + ':\n ' + msg);});})();}}function normalizeLang(any) {switch (any) {case 'coffee':case 'coffeescript':case 'coffee-script':return 'coffee';case 'ts':case 'typescript':case 'type-script':return 'ts';default:return 'js';}}function processScriptForStyle(script, modules$$1, scoped, lang, id, options) {script = injectModule(script, modules$$1, lang, id, options);if (scoped) {var scopeID = genScopeID(id);script = injectScopeID(script, scopeID, lang, id, options);}return script;}
function parseTemplate(code) {
    debug$1('Parsing template....');
    var fragment = parse5.parseFragment(code, { locationInfo: true });

    var nodes = {
        template: [],
        script: [],
        style: [] };


    for (var i = fragment.childNodes.length - 1; i >= 0; i -= 1) {
        var name = fragment.childNodes[i].nodeName;
        if (!(name in nodes)) {
            continue;
        }

        var start = fragment.childNodes[i].__location.startTag.endOffset;
        var end = fragment.childNodes[i].__location.endTag.startOffset;

        nodes[name].push({
            node: fragment.childNodes[i],
            code: code.substr(start, end - start),
            attrs: getNodeAttrs(fragment.childNodes[i]) });

    }

    if (nodes.script.length === 0) {
        nodes.script.push({
            node: null,
            code: 'export default {\n}',
            attrs: {} });

    }

    return nodes;
}

var getModules = function getModules(styles) {
    var all = {};

    for (var i = 0; i < styles.length; i += 1) {
        var style = styles[i];

        if (style.module) {
            all = _Object$assign(all, style.$compiled.module);
        }
    }

    return all;
};

var hasScoped = function hasScoped(styles) {
    return styles.reduce(function (scoped, style) {
        return scoped || style.scoped;
    }, false);
};
var vueTransform = (function () {var _ref5 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee5(code, id, options) {var nodes, css, modules$$1, scoped, js, isProduction, isWithStripped, style, _style, styleCode;return _regeneratorRuntime.wrap(function _callee5$(_context5) {while (1) {switch (_context5.prev = _context5.next) {case 0:
                        nodes = parseTemplate(code);_context5.next = 3;return (
                            processStyle(nodes.style, id, code, options, nodes));case 3:css = _context5.sent;
                        modules$$1 = getModules(css);
                        scoped = hasScoped(css);_context5.next = 8;return (
                            processScript(nodes.script[0], id, code, options, nodes, modules$$1, scoped));case 8:js = _context5.sent;

                        isProduction = process.env.NODE_ENV === 'production';
                        isWithStripped = options.stripWith !== false;

                        if (!isProduction && !isWithStripped) {
                            js.code = js.code + '\nmodule.exports.render._withStripped = true';
                        }if (!(

                        options.styleToImports === true)) {_context5.next = 17;break;}
                        style = css.map(function (s, i) {return 'import ' + _JSON$stringify(id + '.' + i + '.vue.component.' + s.lang) + ';';}).join(' ');return _context5.abrupt('return',

                        { css: css, code: style + js.code, map: js.map });case 17:if (!(
                        options.css === true)) {_context5.next = 21;break;}
                        _style = css.map(function (s) {return '$compiled' in s ? s.$compiled.code : s.code;}).join('\n').replace(/(\r?\n|[\s])+/g, ' ');
                        styleCode = ('\n        (function(){\n            if(typeof document !== \'undefined\'){\n                var head=document.head||document.getElementsByTagName(\'head\')[0],\n                    style=document.createElement(\'style\'),\n                    css=' +




                        _JSON$stringify(_style) + ';\n                 style.type=\'text/css\';\n                 if (style.styleSheet){\n                   style.styleSheet.cssText = css;\n                 } else {\n                   style.appendChild(document.createTextNode(css));\n                 }\n                 head.appendChild(style);\n             }\n         })();\n         ').









                        replace(/(\r?\n|[\s])+/g, ' ').trim();return _context5.abrupt('return',

                        { css: css, code: styleCode + js.code, map: js.map });case 21:return _context5.abrupt('return',


                        { css: css, code: js.code, map: js.map });case 22:case 'end':return _context5.stop();}}}, _callee5, this);}));function vueTransform(_x23, _x24, _x25) {return _ref5.apply(this, arguments);}return vueTransform;})();

function coffee (script) {
    var Compiler = require('coffeescript-compiler');
    var coffee = new Compiler();
    return new _Promise(function (resolve$$1, reject) {
        coffee.compile(script.code, { bare: true }, function (status, output) {
            if (status === 0) {
                script.code = output.replace(/^\/\/ Generated by CoffeeScript [\d]+.[\d]+.[\d]+/i, '');

                resolve$$1(script);
            } else {
                reject('Coffee compiler exited with status code ' + status + '.');
            }
        });
    });
}

var typescript = (function () {var _ref = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(script, id, content, options, nodes) {var config;return _regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:
                        debug$1('Typescript: Compiling ' + id);
                        options.typescript = options.typescript || {};
                        config = _Object$assign({}, options.typescript, { fileName: id });
                        config.compilerOptions = _Object$assign({}, options.typescript.compilerOptions, {
                            experimentalDecorators: true,
                            module: ModuleKind.ES2015,
                            moduleResolution: ModuleResolutionKind.NodeJs });_context.next = 6;return (

                            transpileModule(script.code, config));case 6:script.code = _context.sent.outputText;return _context.abrupt('return',
                        script);case 8:case 'end':return _context.stop();}}}, _callee, this);}));return function (_x, _x2, _x3, _x4, _x5) {return _ref.apply(this, arguments);};})();

var DEFAULT_OPTIONS = {
    // Style compilation options.
    styleToImports: false,
    autoStyles: true,
    disableCssModuleStaticReplacement: false,

    // Template compilation options.
    compileTemplate: true,

    compileOptions: {},

    // Config for html-minifier.
    htmlMinifier: {
        caseSensitive: true,
        customAttrSurround: [[/@/, new RegExp('')], [/:/, new RegExp('')]],
        collapseWhitespace: true,
        conservativeCollapse: true,
        keepClosingSlash: true,
        removeComments: true },


    // Handle with(this)
    vue: {
        // Remove all transforms added by vue since it's up to the user
        // to use whatever he wants
        // https://github.com/vuejs/vue-template-es2015-compiler/blob/master/index.js#L6
        transforms: {
            stripWith: true, // remove the with statement

            arrow: false,
            classes: false,
            collections: false,
            computedProperty: false,
            conciseMethodProperty: false,
            constLoop: false,
            dangerousForOf: false,
            dangerousTaggedTemplateString: false,
            defaultParameter: false,
            destructuring: false,
            forOf: false,
            generator: false,
            letConst: false,
            modules: false,
            numericLiteral: false,
            parameterDestructuring: false,
            reservedProperties: false,
            spreadRest: false,
            stickyRegExp: false,
            templateString: false,
            unicodeRegExp: false } },



    // Config for postcss-modules.
    cssModules: {
        generateScopedName: '[name]__[local]' },


    // Config for node-sass.
    scss: {},

    // Config for less.
    less: {},

    // Config for stylus.
    stylus: {},

    // Config for postcss.
    postcss: {},

    // Config for pug compiler.
    pug: {},

    // Custom injectors.
    inject: {
        template: {
            js: templateJs,
            ts: templateJs,
            coffee: templateJs },


        render: {
            js: renderJs,
            ts: renderJs,
            coffee: renderJs },


        module: {
            js: moduleJs,
            ts: moduleJs,
            coffee: moduleJs },


        scoped: {
            js: scopeJs,
            ts: scopeJs,
            coffee: scopeJs } },



    // script languages.
    script: {
        coffee: coffee,
        ts: typescript } };

function vue() {var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    debug$1('Yo! rolling vue!');
    var filter = createFilter(opts.include, opts.exclude);

    delete opts.include;
    delete opts.exclude;

    /* eslint-disable */
    try {
        var vueVersion = require('vue').version;
        if (parseInt(vueVersion.split('.')[0], 10) >= 2) {
            if (!('compileTemplate' in config)) {
                debug$1('Vue 2.0 detected. Compiling template.');
                opts.compileTemplate = true;
            }
        } else {
            if (opts.compileTemplate === true) {
                console.warn('Vue version < 2.0.0 does not support compiled template.');
            }
            opts.compileTemplate = false;
        }
    } catch (e) {
    }
    /* eslint-enable */

    var config = mergeOptions(DEFAULT_OPTIONS, opts);
    var styles = {};

    return {
        name: 'vue',
        options: function options(opts) {
            DEFAULT_OPTIONS.css = (opts.dest || 'bundle.js').replace(/js$/i, 'css');
        },
        resolveId: function resolveId(id) {
            if (id.indexOf('.vue.component.') > -1) {
                return id;
            }
        },
        load: function load(id) {
            if (id.indexOf('.vue.component.') < 0) return null;

            var component = id.replace(/\.[\d]+\.vue.component.*$/, '');
            var index = parseInt(id.replace(component + '.', '').split('.')[0]);

            if (index < styles[component].length) return styles[component][index];
        },

        transform: function transform(source, id) {var _this = this;return _asyncToGenerator(_regeneratorRuntime.mark(function _callee() {var _ref, code, css, map;return _regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:if (!(
                                !filter(id) || !id.endsWith('.vue'))) {_context.next = 3;break;}
                                debug$1('Ignore: ' + id);return _context.abrupt('return',
                                null);case 3:


                                debug$1('Compile: ' + id);_context.next = 6;return (

                                    vueTransform(source, id, config));case 6:_ref = _context.sent;code = _ref.code;css = _ref.css;map = _ref.map;

                                styles[id] = css;return _context.abrupt('return',

                                { code: code, map: map });case 12:case 'end':return _context.stop();}}}, _callee, _this);}))();
        },

        ongenerate: function ongenerate() {
            if (config.styleToImports !== true) {
                if (config.css === undefined || config.css === null) {
                    config.css = DEFAULT_OPTIONS.css;
                }

                compileStyle(styles, config);
            }
        } };

}

export default vue;
