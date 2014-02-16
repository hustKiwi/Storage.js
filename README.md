Storage.js
==========

对localStorage本地存储方案的兼容封装及扩展，主要让费如下：

## set(key, value, expires)
存储键值对，需指定key和对应的value。expires为可选参数（单位毫秒），用于控制set成功后的自动过期时间。

## get(key)
获取storage中保存的key对应的value。

## remove(key, value)
移除storage中对应key的存储。若原存储值为数组, 则可通过value来指定需移除的数组元素。

## add(key, value, options)
把指定key对应的storage看作一个数组，往其中添加value。可选参数options有两个选项:  `type` 规定该储值数组的类型（默认是没有特别约束的list, 也可设为其中规范数组对象不重复的set类型）； `limit` 指代储值数组的最大容量（默认size为10）。

**Storage.js** 依赖了[jquery](http://jquery.com/)和[json2](https://github.com/douglascrockford/JSON-js)，如有必要，可以自行根据源码封装对应方法，解除依赖。