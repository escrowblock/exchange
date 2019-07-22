/*!
 * # Semantic UI 2.0.0 - Video
 * http://github.com/semantic-org/semantic-ui/
 *
 *
 * Copyright 2014 Contributors
 * Released under the MIT license
 * http://opensource.org/licenses/MIT
 *
 */

(function ($, window, document, undefined) {
    $.fn.video = function(parameters) {
        const
            $allModules = $(this);

        const moduleSelector = $allModules.selector || '';

        let time = new Date().getTime();
        let performance = [];

        const query = arguments[0];
        const methodInvoked = (typeof query === 'string');
        const queryArguments = [].slice.call(arguments, 1);

        const requestAnimationFrame = window.requestAnimationFrame
      || window.mozRequestAnimationFrame
      || window.webkitRequestAnimationFrame
      || window.msRequestAnimationFrame
      || function(callback) { setTimeout(callback, 0); };

        let returnedValue;
        $allModules
            .each(function() {
                const
                    settings = ($.isPlainObject(parameters))
                        ? $.extend(true, {}, $.fn.video.settings, parameters)
                        : $.extend({}, $.fn.video.settings);

                const { selector } = settings;
                const { className } = settings;
                const { error } = settings;
                const { metadata } = settings;
                const { namespace } = settings;
                const { templates } = settings;

                const eventNamespace = `.${namespace}`;
                const moduleNamespace = `module-${namespace}`;

                const $window = $(window);
                const $module = $(this);
                let $placeholder = $module.find(selector.placeholder);
                let $playButton = $module.find(selector.playButton);
                let $embed = $module.find(selector.embed);

                const element = this;
                let instance = $module.data(moduleNamespace);
                let module;
                module = {

                    initialize() {
                        module.debug('Initializing video');
                        module.create();
                        $module
                            .on(`click${eventNamespace}`, selector.placeholder, module.play)
                            .on(`click${eventNamespace}`, selector.playButton, module.play);
                        module.instantiate();
                    },

                    instantiate() {
                        module.verbose('Storing instance of module', module);
                        instance = module;
                        $module
                            .data(moduleNamespace, module);
                    },

                    create() {
                        const
                            image = $module.data(metadata.image);
                        const html = templates.video(image);
                        $module.html(html);
                        module.refresh();
                        if (!image) {
                            module.play();
                        }
                        module.debug('Creating html for video element', html);
                    },

                    destroy() {
                        module.verbose('Destroying previous instance of video');
                        module.reset();
                        $module
                            .removeData(moduleNamespace)
                            .off(eventNamespace);
                    },

                    refresh() {
                        module.verbose('Refreshing selector cache');
                        $placeholder = $module.find(selector.placeholder);
                        $playButton = $module.find(selector.playButton);
                        $embed = $module.find(selector.embed);
                    },

                    // sets new video
                    change(source, id, url) {
                        module.debug('Changing video to ', source, id, url);
                        $module
                            .data(metadata.source, source)
                            .data(metadata.id, id)
                            .data(metadata.url, url);
                        settings.onChange();
                    },

                    // clears video embed
                    reset() {
                        module.debug('Clearing video embed and showing placeholder');
                        $module
                            .removeClass(className.active);
                        $embed
                            .html(' ');
                        $placeholder
                            .show();
                        settings.onReset();
                    },

                    // plays current video
                    play() {
                        module.debug('Playing video');
                        const
                            source = $module.data(metadata.source) || false;
                        const url = $module.data(metadata.url) || false;
                        const id = $module.data(metadata.id) || false;
                        $embed
                            .html(module.generate.html(source, id, url));
                        $module
                            .addClass(className.active);
                        settings.onPlay();
                    },

                    get: {
                        source(url) {
                            if (typeof url !== 'string') {
                                return false;
                            }
                            if (url.search('youtube.com') !== -1) {
                                return 'youtube';
                            }
                            if (url.search('vimeo.com') !== -1) {
                                return 'vimeo';
                            }
                            return false;
                        },
                        id(url) {
                            if (url.match(settings.regExp.youtube)) {
                                return url.match(settings.regExp.youtube)[1];
                            }
                            if (url.match(settings.regExp.vimeo)) {
                                return url.match(settings.regExp.vimeo)[2];
                            }
                            return false;
                        },
                    },

                    generate: {
                        // generates iframe html
                        html(source, id, url) {
                            module.debug('Generating embed html');
                            let
                                html
            ;
            // allow override of settings
                            source = source || settings.source;
                            id = id || settings.id;
                            if ((source && id) || url) {
                                if (!source || !id) {
                                    source = module.get.source(url);
                                    id = module.get.id(url);
                                }
                                if (source == 'vimeo') {
                                    html = `${''
                  + '<iframe src="//player.vimeo.com/video/'}${id}?=${module.generate.url(source)}"`
                  + ' width="100%" height="100%"'
                  + ' frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>';
                                } else if (source == 'youtube') {
                                    html = `${''
                  + '<iframe src="//www.youtube.com/embed/'}${id}?=${module.generate.url(source)}"`
                  + ' width="100%" height="100%"'
                  + ' frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>';
                                }
                            } else {
                                module.error(error.noVideo);
                            }
                            return html;
                        },

                        // generate url parameters
                        url(source) {
                            const
                                api = (settings.api)
                                    ? 1
                                    : 0;
                            const autoplay = (settings.autoplay === 'auto')
                                ? ($module.data('image') !== undefined)
                                : settings.autoplay;
                            const hd = (settings.hd)
                                ? 1
                                : 0;
                            const showUI = (settings.showUI)
                                ? 1
                                : 0;
                                // opposite used for some params
                            const hideUI = !(settings.showUI)
                                ? 1
                                : 0;
                            let url = '';
                            if (source == 'vimeo') {
                                url = `${''
                + 'api='}${api
                                }&amp;title=${showUI
                                }&amp;byline=${showUI
                                }&amp;portrait=${showUI
                                }&amp;autoplay=${autoplay}`;
                                if (settings.color) {
                                    url += `&amp;color=${settings.color}`;
                                }
                            }
                            if (source == 'ustream') {
                                url = `${''
                + 'autoplay='}${autoplay}`;
                                if (settings.color) {
                                    url += `&amp;color=${settings.color}`;
                                }
                            } else if (source == 'youtube') {
                                url = `${''
                + 'enablejsapi='}${api
                                }&amp;autoplay=${autoplay
                                }&amp;autohide=${hideUI
                                }&amp;hq=${hd
                                }&amp;modestbranding=1`;
                                if (settings.color) {
                                    url += `&amp;color=${settings.color}`;
                                }
                            }
                            return url;
                        },
                    },

                    setting(name, value) {
                        module.debug('Changing setting', name, value);
                        if ($.isPlainObject(name)) {
                            $.extend(true, settings, name);
                        } else if (value !== undefined) {
                            settings[name] = value;
                        } else {
                            return settings[name];
                        }
                    },
                    internal(name, value) {
                        if ($.isPlainObject(name)) {
                            $.extend(true, module, name);
                        } else if (value !== undefined) {
                            module[name] = value;
                        } else {
                            return module[name];
                        }
                    },
                    debug() {
                        if (settings.debug) {
                            if (settings.performance) {
                                module.performance.log(arguments);
                            } else {
                                module.debug = Function.prototype.bind.call(console.info, console, `${settings.name}:`);
                                module.debug.apply(console, arguments);
                            }
                        }
                    },
                    verbose() {
                        if (settings.verbose && settings.debug) {
                            if (settings.performance) {
                                module.performance.log(arguments);
                            } else {
                                module.verbose = Function.prototype.bind.call(console.info, console, `${settings.name}:`);
                                module.verbose.apply(console, arguments);
                            }
                        }
                    },
                    error() {
                        module.error = Function.prototype.bind.call(console.error, console, `${settings.name}:`);
                        module.error.apply(console, arguments);
                    },
                    performance: {
                        log(message) {
                            let
                                currentTime;
                            let executionTime;
                            let previousTime;
                            if (settings.performance) {
                                currentTime = new Date().getTime();
                                previousTime = time || currentTime;
                                executionTime = currentTime - previousTime;
                                time = currentTime;
                                performance.push({
                                    Name: message[0],
                                    Arguments: [].slice.call(message, 1) || '',
                                    Element: element,
                                    'Execution Time': executionTime,
                                });
                            }
                            clearTimeout(module.performance.timer);
                            module.performance.timer = setTimeout(module.performance.display, 500);
                        },
                        display() {
                            let
                                title = `${settings.name}:`;
                            let totalTime = 0;
                            time = false;
                            clearTimeout(module.performance.timer);
                            $.each(performance, function(index, data) {
                                totalTime += data['Execution Time'];
                            });
                            title += ` ${totalTime}ms`;
                            if (moduleSelector) {
                                title += ` '${moduleSelector}'`;
                            }
                            if ($allModules.length > 1) {
                                title += `${' ' + '('}${$allModules.length})`;
                            }
                            if ((console.group !== undefined || console.table !== undefined) && performance.length > 0) {
                                console.groupCollapsed(title);
                                if (console.table) {
                                    console.table(performance);
                                } else {
                                    $.each(performance, function(index, data) {
                                        console.log(`${data.Name}: ${data['Execution Time']}ms`);
                                    });
                                }
                                console.groupEnd();
                            }
                            performance = [];
                        },
                    },
                    invoke(query, passedArguments, context) {
                        let
                            object = instance;
                        let maxDepth;
                        let found;
                        let response;
                        passedArguments = passedArguments || queryArguments;
                        context = element || context;
                        if (typeof query === 'string' && object !== undefined) {
                            query = query.split(/[\. ]/);
                            maxDepth = query.length - 1;
                            $.each(query, function(depth, value) {
                                const camelCaseValue = (depth != maxDepth)
                                    ? value + query[depth + 1].charAt(0).toUpperCase() + query[depth + 1].slice(1)
                                    : query;
                                if ($.isPlainObject(object[camelCaseValue]) && (depth != maxDepth)) {
                                    object = object[camelCaseValue];
                                } else if (object[camelCaseValue] !== undefined) {
                                    found = object[camelCaseValue];
                                    return false;
                                } else if ($.isPlainObject(object[value]) && (depth != maxDepth)) {
                                    object = object[value];
                                } else if (object[value] !== undefined) {
                                    found = object[value];
                                    return false;
                                } else {
                                    module.error(error.method, query);
                                    return false;
                                }
                            });
                        }
                        if ($.isFunction(found)) {
                            response = found.apply(context, passedArguments);
                        } else if (found !== undefined) {
                            response = found;
                        }
                        if ($.isArray(returnedValue)) {
                            returnedValue.push(response);
                        } else if (returnedValue !== undefined) {
                            returnedValue = [returnedValue, response];
                        } else if (response !== undefined) {
                            returnedValue = response;
                        }
                        return found;
                    },
                };

                if (methodInvoked) {
                    if (instance === undefined) {
                        module.initialize();
                    }
                    module.invoke(query);
                } else {
                    if (instance !== undefined) {
                        instance.invoke('destroy');
                    }
                    module.initialize();
                }
            });
        return (returnedValue !== undefined)
            ? returnedValue
            : this;
    };

    $.fn.video.settings = {

        name: 'Video',
        namespace: 'video',

        debug: false,
        verbose: false,
        performance: true,

        metadata: {
            id: 'id',
            image: 'image',
            source: 'source',
            url: 'url',
        },

        source: false,
        url: false,
        id: false,

        aspectRatio: (16 / 9),

        onPlay() {},
        onReset() {},
        onChange() {},

        // callbacks not coded yet (needs to use jsapi)
        onPause() {},
        onStop() {},

        width: 'auto',
        height: 'auto',

        autoplay: 'auto',
        color: '#442359',
        hd: true,
        showUI: false,
        api: true,

        regExp: {
            youtube: /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/,
            vimeo: /http:\/\/(www\.)?vimeo.com\/(\d+)($|\/)/,
        },

        error: {
            noVideo: 'No video specified',
            method: 'The method you called is not defined',
        },

        className: {
            active: 'active',
        },

        selector: {
            embed: '.embed',
            placeholder: '.placeholder',
            playButton: '.play',
        },
    };

    $.fn.video.settings.templates = {
        video(image) {
            let
                html = '';
            if (image) {
                html += `${''
        + '<i class="video play icon"></i>'
        + '<img class="placeholder" src="'}${image}">`;
            }
            html += '<div class="embed"></div>';
            return html;
        },
    };
}(jQuery, window, document));
