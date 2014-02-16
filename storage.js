(function(root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        if (typeof root.storage === 'undefined') {
            root.storage = factory();
        }
    }
})(this, function(cfg) {
    var win = window,
        doc = document,

        slice = [].slice,

        // 参考: http://stackoverflow.com/questions/4599857/is-eval-and-new-function-the-same-thing
        // 使用new Function的方式不会污染变量, Stoyan的Javascript Patterns
        // 中也推荐在不得不使用eval时, 不妨换用new Function()替代eval()
        /*jshint evil:true*/
        evaluate = function(code) {
            if (!code) {
                return '';
            }
            return (new Function('return (' + code + ')')());
        },
        /*jshint evil:false*/

        difference = function(a, b) {
            if (!$.isArray(b)) {
                b = [b];
            }
            return $.grep(a, function(x) {
                return $.inArray(x, b) < 0;
            });
        },

        // copy from underscore.js
        first = function(array, n, guard) {
            if (array == null) return void 0;
            if ((n == null) || guard) return array[0];
            if (n < 0) return [];
            return slice.call(array, 0, n);
        },

        decode = function(s) {
            // 参考jquery cookie的实现: https://github.com/carhartl/jquery-cookie/blob/master/jquery.cookie.js
            if (s.indexOf('"') === 0) {
                s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            }
            try {
                return decodeURIComponent(s);
            } catch(e) {
                return null;
            }
        },
        encode = encodeURIComponent,

        isSupportLocalStorage = (function () {
            try {
                var support = 'localStorage' in win && win['localStorage'] !== null,
                    test = {
                        k: 'test key',
                        v: 'test value'
                    };
                if (support) {
                    localStorage.setItem(test.k, test.v);
                    support = test.v === localStorage.getItem(test.k);
                }
                return support;
            } catch (e) {
                return false;
            }
        }()),

        stringify = function(v) {
            if ($.type(v) !== 'string') {
                v = JSON.stringify(v);
            }
            return encode(v);
        },

        validateCookieName = function(name) {
            if ($.type(v) !== 'string' || name === '') {
                throw new TypeError('Cookie name must be a non-empty string!');
            }
        },

        // TODO: 不支持localStorage时换用cookie存储
        // 现在在某些浏览器下可能存在cookie数量的限制
        // 之后可能的优化是使用subcookie的方式: https://developer.yahoo.com/yui/cookie/#subcookies
        // 最好优先实现flash的存储兼容方案, 尽量少依赖cookie
        s = isSupportLocalStorage ? localStorage : {
            setItem: function(k, v, days) {
                validateCookieName(k);

                // 默认cookie中的结果缓存7天
                days = days || 7;
                var expires = new Date();
                expires.setDate(expires.getDate() + days);

                v = evaluate(v);
                if ($.isArray(v)) {
                    v = v[0];
                    expires = new Date(parseInt(v[1], 10));
                }

                k = stringify(k);
                v = stringify(v);

                doc.cookie = k + '=' + v + '; expires=' + expires.toGMTString();
            },

            getItem: function(k) {
                validateCookieName(k);

                k = stringify(k) + '=';

                var v = null,
                    cookie = doc.cookie,
                    start = cookie.indexOf(k);

                if (start > -1) {
                    var end = cookie.indexOf(';', start);
                    if (end === -1) {
                        end = cookie.length;
                    }
                    v = decode(cookie.substring(start + k.length, end));
                }

                return v;
            },

            removeItem: function(k) {
                this.setItem(k, '', -1);
            }
        },

        prefix = '_BM:';

    return {
        isSupportLocalStorage: isSupportLocalStorage,

        set: function(k, v, expires) {
            if ($.isNumeric(expires)) {
                expires = +new Date() + expires;
            }
            s.setItem(prefix + k, JSON.stringify({
                value: v,
                expires: expires
            }));
        },

        get: function(k) {
            var v = JSON.parse(s.getItem(prefix + k)),
                expires;

            if (!v) {
                return;
            }

            expires = parseInt(v.expires, 10);
            v = v.value;

            if (expires) {
                if (+new Date() < expires) {
                    return v;
                }
                this.remove(k);
            }

            return v;
        },

        remove: function(k, v) {
            if (v) {
                try {
                    this.set(k, difference(this.get(k), v));
                } catch (e) {
                }
            } else {
                s.removeItem(prefix + k);
            }
        },

        add: function(k, v, options) {
            var old = this.get(k),

                defaults = {
                    type: 'list',
                    limit: 10
                },
                opts = $.extend(defaults, options),

                type = opts.type,
                expires = opts.expires,
                limit = opts.limit;

            // TODO: 有潜在的bug, 比如之前存储的是array类型
            if (!$.isArray(old)) {
                old = typeof old === 'undefined' && [] || [old];
            }

            if (type === 'set' && $.inArray(v, old) !== -1) {
                return;
            }

            if ($.isNumeric(limit) && limit > 0) {
                old = first(old, limit - 1);
            }

            old.unshift(v);

            this.set(k, old, expires);
        }
    };
});
