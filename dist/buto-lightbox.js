/*!
 jQuery ColorBox v1.4.4 - 2013-03-10
 (c) 2013 Jack Moore - jacklmoore.com/colorbox
 license: http://www.opensource.org/licenses/mit-license.php
 */
(function ($, document, window) {
    var
    // Default settings object.
    // See http://jacklmoore.com/colorbox for details.
        defaults = {
            transition: "elastic",
            speed: 300,
            width: false,
            initialWidth: "600",
            innerWidth: false,
            maxWidth: false,
            height: false,
            initialHeight: "450",
            innerHeight: false,
            maxHeight: false,
            scalePhotos: true,
            scrolling: true,
            inline: false,
            html: false,
            iframe: false,
            fastIframe: true,
            photo: false,
            href: false,
            title: false,
            rel: false,
            opacity: 0.9,
            preloading: true,
            className: false,

            // alternate image paths for high-res displays
            retinaImage: false,
            retinaUrl: false,
            retinaSuffix: '@2x.$1',

            // internationalization
            current: "image {current} of {total}",
            previous: "previous",
            next: "next",
            close: "close",
            xhrError: "This content failed to load.",
            imgError: "This image failed to load.",

            open: false,
            returnFocus: true,
            reposition: true,
            loop: true,
            slideshow: false,
            slideshowAuto: true,
            slideshowSpeed: 2500,
            slideshowStart: "start slideshow",
            slideshowStop: "stop slideshow",
            photoRegex: /\.(gif|png|jp(e|g|eg)|bmp|ico)((#|\?).*)?$/i,

            onOpen: false,
            onLoad: false,
            onComplete: false,
            onCleanup: false,
            onClosed: false,
            overlayClose: true,
            escKey: true,
            arrowKey: true,
            top: false,
            bottom: false,
            left: false,
            right: false,
            fixed: false,
            data: undefined
        },

    // Abstracting the HTML and event identifiers for easy rebranding
        colorbox = 'colorbox',
        prefix = 'cbox',
        boxElement = prefix + 'Element',

    // Events
        event_open = prefix + '_open',
        event_load = prefix + '_load',
        event_complete = prefix + '_complete',
        event_cleanup = prefix + '_cleanup',
        event_closed = prefix + '_closed',
        event_purge = prefix + '_purge',

    // Special Handling for IE
        isIE = !$.support.leadingWhitespace, // IE6 to IE8
        isIE6 = isIE && !window.XMLHttpRequest, // IE6
        event_ie6 = prefix + '_IE6',

    // Cached jQuery Object Variables
        $overlay,
        $box,
        $wrap,
        $content,
        $topBorder,
        $leftBorder,
        $rightBorder,
        $bottomBorder,
        $related,
        $window,
        $loaded,
        $loadingBay,
        $loadingOverlay,
        $title,
        $current,
        $slideshow,
        $next,
        $prev,
        $close,
        $groupControls,
        $events = $({}),

    // Variables for cached values or use across multiple functions
        settings,
        interfaceHeight,
        interfaceWidth,
        loadedHeight,
        loadedWidth,
        element,
        index,
        photo,
        open,
        active,
        closing,
        loadingTimer,
        publicMethod,
        div = "div",
        className,
        requests = 0,
        init;

    // ****************
    // HELPER FUNCTIONS
    // ****************

    // Convience function for creating new jQuery objects
    function $tag(tag, id, css) {
        var element = document.createElement(tag);

        if (id) {
            element.id = prefix + id;
        }

        if (css) {
            element.style.cssText = css;
        }

        return $(element);
    }

    // Get the window height using innerHeight when available to avoid an issue with iOS
    // http://bugs.jquery.com/ticket/6724
    function winheight() {
        return window.innerHeight ? window.innerHeight : $(window).height();
    }

    // Determine the next and previous members in a group.
    function getIndex(increment) {
        var
            max = $related.length,
            newIndex = (index + increment) % max;

        return (newIndex < 0) ? max + newIndex : newIndex;
    }

    // Convert '%' and 'px' values to integers
    function setSize(size, dimension) {
        return Math.round((/%/.test(size) ? ((dimension === 'x' ? $window.width() : winheight()) / 100) : 1) * parseInt(size, 10));
    }

    // Checks an href to see if it is a photo.
    // There is a force photo option (photo: true) for hrefs that cannot be matched by the regex.
    function isImage(settings, url) {
        return settings.photo || settings.photoRegex.test(url);
    }

    function retinaUrl(settings, url) {
        return settings.retinaUrl && window.devicePixelRatio > 1 ? url.replace(settings.photoRegex, settings.retinaSuffix) : url;
    }

    function trapFocus(e) {
        if ('contains' in $box[0] && !$box[0].contains(e.target)) {
            e.stopPropagation();
            $box.focus();
        }
    }

    // Assigns function results to their respective properties
    function makeSettings() {
        var i,
            data = $.data(element, colorbox);

        if (data == null) {
            settings = $.extend({}, defaults);
            if (console && console.log) {
                console.log('Error: cboxElement missing settings object');
            }
        } else {
            settings = $.extend({}, data);
        }

        for (i in settings) {
            if ($.isFunction(settings[i]) && i.slice(0, 2) !== 'on') { // checks to make sure the function isn't one of the callbacks, they will be handled at the appropriate time.
                settings[i] = settings[i].call(element);
            }
        }

        settings.rel = settings.rel || element.rel || $(element).data('rel') || 'nofollow';
        settings.href = settings.href || $(element).attr('href');
        settings.title = settings.title || element.title;

        if (typeof settings.href === "string") {
            settings.href = $.trim(settings.href);
        }
    }

    function trigger(event, callback) {
        // for external use
        $(document).trigger(event);

        // for internal use
        $events.trigger(event);

        if ($.isFunction(callback)) {
            callback.call(element);
        }
    }

    // Slideshow functionality
    function slideshow() {
        var
            timeOut,
            className = prefix + "Slideshow_",
            click = "click." + prefix,
            clear,
            set,
            start,
            stop;

        if (settings.slideshow && $related[1]) {
            clear = function () {
                clearTimeout(timeOut);
            };

            set = function () {
                if (settings.loop || $related[index + 1]) {
                    timeOut = setTimeout(publicMethod.next, settings.slideshowSpeed);
                }
            };

            start = function () {
                $slideshow
                    .html(settings.slideshowStop)
                    .unbind(click)
                    .one(click, stop);

                $events
                    .bind(event_complete, set)
                    .bind(event_load, clear)
                    .bind(event_cleanup, stop);

                $box.removeClass(className + "off").addClass(className + "on");
            };

            stop = function () {
                clear();

                $events
                    .unbind(event_complete, set)
                    .unbind(event_load, clear)
                    .unbind(event_cleanup, stop);

                $slideshow
                    .html(settings.slideshowStart)
                    .unbind(click)
                    .one(click, function () {
                        publicMethod.next();
                        start();
                    });

                $box.removeClass(className + "on").addClass(className + "off");
            };

            if (settings.slideshowAuto) {
                start();
            } else {
                stop();
            }
        } else {
            $box.removeClass(className + "off " + className + "on");
        }
    }

    function launch(target) {
        if (!closing) {

            element = target;

            makeSettings();

            $related = $(element);

            index = 0;

            if (settings.rel !== 'nofollow') {
                $related = $('.' + boxElement).filter(function () {
                    var data = $.data(this, colorbox),
                        relRelated;

                    if (data) {
                        relRelated =  $(this).data('rel') || data.rel || this.rel;
                    }

                    return (relRelated === settings.rel);
                });
                index = $related.index(element);

                // Check direct calls to ColorBox.
                if (index === -1) {
                    $related = $related.add(element);
                    index = $related.length - 1;
                }
            }

            $overlay.css({
                opacity: parseFloat(settings.opacity),
                cursor: settings.overlayClose ? "pointer" : "auto",
                visibility: 'visible'
            }).show();

            if (!open) {
                open = active = true; // Prevents the page-change action from queuing up if the visitor holds down the left or right keys.

                // Show colorbox so the sizes can be calculated in older versions of jQuery
                $box.css({visibility:'hidden', display:'block'});

                $loaded = $tag(div, 'LoadedContent', 'width:0; height:0; overflow:hidden').appendTo($content);

                // Cache values needed for size calculations
                interfaceHeight = $topBorder.height() + $bottomBorder.height() + $content.outerHeight(true) - $content.height();//Subtraction needed for IE6
                interfaceWidth = $leftBorder.width() + $rightBorder.width() + $content.outerWidth(true) - $content.width();
                loadedHeight = $loaded.outerHeight(true);
                loadedWidth = $loaded.outerWidth(true);


                // Opens inital empty ColorBox prior to content being loaded.
                settings.w = setSize(settings.initialWidth, 'x');
                settings.h = setSize(settings.initialHeight, 'y');
                publicMethod.position();

                if (isIE6) {
                    $window.bind('resize.' + event_ie6 + ' scroll.' + event_ie6, function () {
                        $overlay.css({width: $window.width(), height: winheight(), top: $window.scrollTop(), left: $window.scrollLeft()});
                    }).trigger('resize.' + event_ie6);
                }

                slideshow();

                trigger(event_open, settings.onOpen);

                $groupControls.add($title).hide();

                $close.html(settings.close).show();

                $box.focus();

                // Confine focus to the modal
                // Uses event capturing that is not supported in IE8-
                if (document.addEventListener) {

                    document.addEventListener('focus', trapFocus, true);

                    $events.one(event_closed, function () {
                        document.removeEventListener('focus', trapFocus, true);
                    });
                }

                // Return focus on closing
                if (settings.returnFocus) {
                    $events.one(event_closed, function () {
                        $(element).focus();
                    });
                }
            }

            publicMethod.load(true);
        }
    }

    // ColorBox's markup needs to be added to the DOM prior to being called
    // so that the browser will go ahead and load the CSS background images.
    function appendHTML() {
        if (!$box && document.body) {
            init = false;

            $window = $(window);
            $box = $tag(div).attr({
                id: colorbox,
                'class': isIE ? prefix + (isIE6 ? 'IE6' : 'IE') : '',
                role: 'dialog',
                tabindex: '-1'
            }).hide();
            $overlay = $tag(div, "Overlay", isIE6 ? 'position:absolute' : '').hide();
            $loadingOverlay = $tag(div, "LoadingOverlay").add($tag(div, "LoadingGraphic"));
            $wrap = $tag(div, "Wrapper");
            $content = $tag(div, "Content").append(
                $title = $tag(div, "Title"),
                $current = $tag(div, "Current"),
                $prev = $tag('button', "Previous"),
                $next = $tag('button', "Next"),
                $slideshow = $tag('button', "Slideshow"),
                $loadingOverlay,
                $close = $tag('button', "Close")
            );

            $wrap.append( // The 3x3 Grid that makes up ColorBox
                $tag(div).append(
                    $tag(div, "TopLeft"),
                    $topBorder = $tag(div, "TopCenter"),
                    $tag(div, "TopRight")
                ),
                $tag(div, false, 'clear:left').append(
                    $leftBorder = $tag(div, "MiddleLeft"),
                    $content,
                    $rightBorder = $tag(div, "MiddleRight")
                ),
                $tag(div, false, 'clear:left').append(
                    $tag(div, "BottomLeft"),
                    $bottomBorder = $tag(div, "BottomCenter"),
                    $tag(div, "BottomRight")
                )
            ).find('div div').css({'float': 'left'});

            $loadingBay = $tag(div, false, 'position:absolute; width:9999px; visibility:hidden; display:none');

            $groupControls = $next.add($prev).add($current).add($slideshow);

            $(document.body).append($overlay, $box.append($wrap, $loadingBay));
        }
    }

    // Add ColorBox's event bindings
    function addBindings() {
        function clickHandler(e) {
            // ignore non-left-mouse-clicks and clicks modified with ctrl / command, shift, or alt.
            // See: http://jacklmoore.com/notes/click-events/
            if (!(e.which > 1 || e.shiftKey || e.altKey || e.metaKey)) {
                e.preventDefault();
                launch(this);
            }
        }

        if ($box) {
            if (!init) {
                init = true;

                // Anonymous functions here keep the public method from being cached, thereby allowing them to be redefined on the fly.
                $next.click(function () {
                    publicMethod.next();
                });
                $prev.click(function () {
                    publicMethod.prev();
                });
                $close.click(function () {
                    publicMethod.close();
                });
                $overlay.click(function () {
                    if (settings.overlayClose) {
                        publicMethod.close();
                    }
                });

                // Key Bindings
                $(document).bind('keydown.' + prefix, function (e) {
                    var key = e.keyCode;
                    if (open && settings.escKey && key === 27) {
                        e.preventDefault();
                        publicMethod.close();
                    }
                    if (open && settings.arrowKey && $related[1] && !e.altKey) {
                        if (key === 37) {
                            e.preventDefault();
                            $prev.click();
                        } else if (key === 39) {
                            e.preventDefault();
                            $next.click();
                        }
                    }
                });

                if ($.isFunction($.fn.on)) {
                    // For jQuery 1.7+
                    $(document).on('click.'+prefix, '.'+boxElement, clickHandler);
                } else {
                    // For jQuery 1.3.x -> 1.6.x
                    // This code is never reached in jQuery 1.9, so do not contact me about 'live' being removed.
                    // This is not here for jQuery 1.9, it's here for legacy users.
                    $('.'+boxElement).live('click.'+prefix, clickHandler);
                }
            }
            return true;
        }
        return false;
    }

    // Don't do anything if ColorBox already exists.
    if ($.colorbox) {
        return;
    }

    // Append the HTML when the DOM loads
    $(appendHTML);


    // ****************
    // PUBLIC FUNCTIONS
    // Usage format: $.fn.colorbox.close();
    // Usage from within an iframe: parent.$.fn.colorbox.close();
    // ****************

    publicMethod = $.fn[colorbox] = $[colorbox] = function (options, callback) {
        var $this = this;

        options = options || {};

        appendHTML();

        if (addBindings()) {
            if ($.isFunction($this)) { // assume a call to $.colorbox
                $this = $('<a/>');
                options.open = true;
            } else if (!$this[0]) { // colorbox being applied to empty collection
                return $this;
            }

            if (callback) {
                options.onComplete = callback;
            }

            $this.each(function () {
                $.data(this, colorbox, $.extend({}, $.data(this, colorbox) || defaults, options));
            }).addClass(boxElement);

            if (($.isFunction(options.open) && options.open.call($this)) || options.open) {
                launch($this[0]);
            }
        }

        return $this;
    };

    publicMethod.position = function (speed, loadedCallback) {
        var
            css,
            top = 0,
            left = 0,
            offset = $box.offset(),
            scrollTop,
            scrollLeft;

        $window.unbind('resize.' + prefix);

        // remove the modal so that it doesn't influence the document width/height
        $box.css({top: -9e4, left: -9e4});

        scrollTop = $window.scrollTop();
        scrollLeft = $window.scrollLeft();

        if (settings.fixed && !isIE6) {
            offset.top -= scrollTop;
            offset.left -= scrollLeft;
            $box.css({position: 'fixed'});
        } else {
            top = scrollTop;
            left = scrollLeft;
            $box.css({position: 'absolute'});
        }

        // keeps the top and left positions within the browser's viewport.
        if (settings.right !== false) {
            left += Math.max($window.width() - settings.w - loadedWidth - interfaceWidth - setSize(settings.right, 'x'), 0);
        } else if (settings.left !== false) {
            left += setSize(settings.left, 'x');
        } else {
            left += Math.round(Math.max($window.width() - settings.w - loadedWidth - interfaceWidth, 0) / 2);
        }

        if (settings.bottom !== false) {
            top += Math.max(winheight() - settings.h - loadedHeight - interfaceHeight - setSize(settings.bottom, 'y'), 0);
        } else if (settings.top !== false) {
            top += setSize(settings.top, 'y');
        } else {
            top += Math.round(Math.max(winheight() - settings.h - loadedHeight - interfaceHeight, 0) / 2);
        }

        $box.css({top: offset.top, left: offset.left, visibility:'visible'});

        // setting the speed to 0 to reduce the delay between same-sized content.
        speed = ($box.width() === settings.w + loadedWidth && $box.height() === settings.h + loadedHeight) ? 0 : speed || 0;

        // this gives the wrapper plenty of breathing room so it's floated contents can move around smoothly,
        // but it has to be shrank down around the size of div#colorbox when it's done.  If not,
        // it can invoke an obscure IE bug when using iframes.
        $wrap[0].style.width = $wrap[0].style.height = "9999px";

        function modalDimensions(that) {
            $topBorder[0].style.width = $bottomBorder[0].style.width = $content[0].style.width = (parseInt(that.style.width,10) - interfaceWidth)+'px';
            $content[0].style.height = $leftBorder[0].style.height = $rightBorder[0].style.height = (parseInt(that.style.height,10) - interfaceHeight)+'px';
        }

        css = {width: settings.w + loadedWidth + interfaceWidth, height: settings.h + loadedHeight + interfaceHeight, top: top, left: left};

        if(speed===0){ // temporary workaround to side-step jQuery-UI 1.8 bug (http://bugs.jquery.com/ticket/12273)
            $box.css(css);
        }
        $box.dequeue().animate(css, {
            duration: speed,
            complete: function () {
                modalDimensions(this);

                active = false;

                // shrink the wrapper down to exactly the size of colorbox to avoid a bug in IE's iframe implementation.
                $wrap[0].style.width = (settings.w + loadedWidth + interfaceWidth) + "px";
                $wrap[0].style.height = (settings.h + loadedHeight + interfaceHeight) + "px";

                if (settings.reposition) {
                    setTimeout(function () {  // small delay before binding onresize due to an IE8 bug.
                        $window.bind('resize.' + prefix, publicMethod.position);
                    }, 1);
                }

                if (loadedCallback) {
                    loadedCallback();
                }
            },
            step: function () {
                modalDimensions(this);
            }
        });
    };

    publicMethod.resize = function (options) {
        if (open) {
            options = options || {};

            if (options.width) {
                settings.w = setSize(options.width, 'x') - loadedWidth - interfaceWidth;
            }
            if (options.innerWidth) {
                settings.w = setSize(options.innerWidth, 'x');
            }
            $loaded.css({width: settings.w});

            if (options.height) {
                settings.h = setSize(options.height, 'y') - loadedHeight - interfaceHeight;
            }
            if (options.innerHeight) {
                settings.h = setSize(options.innerHeight, 'y');
            }
            if (!options.innerHeight && !options.height) {
                $loaded.css({height: "auto"});
                settings.h = $loaded.height();
            }
            $loaded.css({height: settings.h});

            publicMethod.position(settings.transition === "none" ? 0 : settings.speed);
        }
    };

    publicMethod.prep = function (object) {
        if (!open) {
            return;
        }

        var callback, speed = settings.transition === "none" ? 0 : settings.speed;

        $loaded.empty().remove(); // Using empty first may prevent some IE7 issues.

        $loaded = $tag(div, 'LoadedContent').append(object);

        function getWidth() {
            settings.w = settings.w || $loaded.width();
            settings.w = settings.mw && settings.mw < settings.w ? settings.mw : settings.w;
            return settings.w;
        }
        function getHeight() {
            settings.h = settings.h || $loaded.height();
            settings.h = settings.mh && settings.mh < settings.h ? settings.mh : settings.h;
            return settings.h;
        }

        $loaded.hide()
            .appendTo($loadingBay.show())// content has to be appended to the DOM for accurate size calculations.
            .css({width: getWidth(), overflow: settings.scrolling ? 'auto' : 'hidden'})
            .css({height: getHeight()})// sets the height independently from the width in case the new width influences the value of height.
            .prependTo($content);

        $loadingBay.hide();

        // floating the IMG removes the bottom line-height and fixed a problem where IE miscalculates the width of the parent element as 100% of the document width.

        $(photo).css({'float': 'none'});

        callback = function () {
            var total = $related.length,
                iframe,
                frameBorder = 'frameBorder',
                allowTransparency = 'allowTransparency',
                complete;

            if (!open) {
                return;
            }

            function removeFilter() {
                if (isIE) {
                    $box[0].style.removeAttribute('filter');
                }
            }

            complete = function () {
                clearTimeout(loadingTimer);
                $loadingOverlay.hide();
                trigger(event_complete, settings.onComplete);
            };

            if (isIE) {
                //This fadeIn helps the bicubic resampling to kick-in.
                if (photo) {
                    $loaded.fadeIn(100);
                }
            }

            $title.html(settings.title).add($loaded).show();

            if (total > 1) { // handle grouping
                if (typeof settings.current === "string") {
                    $current.html(settings.current.replace('{current}', index + 1).replace('{total}', total)).show();
                }

                $next[(settings.loop || index < total - 1) ? "show" : "hide"]().html(settings.next);
                $prev[(settings.loop || index) ? "show" : "hide"]().html(settings.previous);

                if (settings.slideshow) {
                    $slideshow.show();
                }

                // Preloads images within a rel group
                if (settings.preloading) {
                    $.each([getIndex(-1), getIndex(1)], function(){
                        var src,
                            img,
                            i = $related[this],
                            data = $.data(i, colorbox);

                        if (data && data.href) {
                            src = data.href;
                            if ($.isFunction(src)) {
                                src = src.call(i);
                            }
                        } else {
                            src = $(i).attr('href');
                        }

                        if (src && isImage(data, src)) {
                            src = retinaUrl(data, src);
                            img = new Image();
                            img.src = src;
                        }
                    });
                }
            } else {
                $groupControls.hide();
            }

            if (settings.iframe) {
                iframe = $tag('iframe')[0];

                if (frameBorder in iframe) {
                    iframe[frameBorder] = 0;
                }

                if (allowTransparency in iframe) {
                    iframe[allowTransparency] = "true";
                }

                if (!settings.scrolling) {
                    iframe.scrolling = "no";
                }

                $(iframe)
                    .attr({
                        src: settings.href,
                        name: (new Date()).getTime(), // give the iframe a unique name to prevent caching
                        'class': prefix + 'Iframe',
                        allowFullScreen : true, // allow HTML5 video to go fullscreen
                        webkitAllowFullScreen : true,
                        mozallowfullscreen : true
                    })
                    .one('load', complete)
                    .appendTo($loaded);

                $events.one(event_purge, function () {
                    iframe.src = "//about:blank";
                });

                if (settings.fastIframe) {
                    $(iframe).trigger('load');
                }
            } else {
                complete();
            }

            if (settings.transition === 'fade') {
                $box.fadeTo(speed, 1, removeFilter);
            } else {
                removeFilter();
            }
        };

        if (settings.transition === 'fade') {
            $box.fadeTo(speed, 0, function () {
                publicMethod.position(0, callback);
            });
        } else {
            publicMethod.position(speed, callback);
        }
    };

    publicMethod.load = function (launched) {
        var href, setResize, prep = publicMethod.prep, $inline, request = ++requests;

        active = true;

        photo = false;

        element = $related[index];

        if (!launched) {
            makeSettings();
        }

        if (className) {
            $box.add($overlay).removeClass(className);
        }
        if (settings.className) {
            $box.add($overlay).addClass(settings.className);
        }
        className = settings.className;

        trigger(event_purge);

        trigger(event_load, settings.onLoad);

        settings.h = settings.height ?
        setSize(settings.height, 'y') - loadedHeight - interfaceHeight :
        settings.innerHeight && setSize(settings.innerHeight, 'y');

        settings.w = settings.width ?
        setSize(settings.width, 'x') - loadedWidth - interfaceWidth :
        settings.innerWidth && setSize(settings.innerWidth, 'x');

        // Sets the minimum dimensions for use in image scaling
        settings.mw = settings.w;
        settings.mh = settings.h;

        // Re-evaluate the minimum width and height based on maxWidth and maxHeight values.
        // If the width or height exceed the maxWidth or maxHeight, use the maximum values instead.
        if (settings.maxWidth) {
            settings.mw = setSize(settings.maxWidth, 'x') - loadedWidth - interfaceWidth;
            settings.mw = settings.w && settings.w < settings.mw ? settings.w : settings.mw;
        }
        if (settings.maxHeight) {
            settings.mh = setSize(settings.maxHeight, 'y') - loadedHeight - interfaceHeight;
            settings.mh = settings.h && settings.h < settings.mh ? settings.h : settings.mh;
        }

        href = settings.href;

        loadingTimer = setTimeout(function () {
            $loadingOverlay.show();
        }, 100);

        if (settings.inline) {
            // Inserts an empty placeholder where inline content is being pulled from.
            // An event is bound to put inline content back when ColorBox closes or loads new content.
            $inline = $tag(div).hide().insertBefore($(href)[0]);

            $events.one(event_purge, function () {
                $inline.replaceWith($loaded.children());
            });

            prep($(href));
        } else if (settings.iframe) {
            // IFrame element won't be added to the DOM until it is ready to be displayed,
            // to avoid problems with DOM-ready JS that might be trying to run in that iframe.
            prep(" ");
        } else if (settings.html) {
            prep(settings.html);
        } else if (isImage(settings, href)) {

            href = retinaUrl(settings, href);

            $(photo = new Image())
                .addClass(prefix + 'Photo')
                .bind('error',function () {
                    settings.title = false;
                    prep($tag(div, 'Error').html(settings.imgError));
                })
                .one('load', function () {
                    var percent;

                    if (request !== requests) {
                        return;
                    }

                    if (settings.retinaImage && window.devicePixelRatio > 1) {
                        photo.height = photo.height / window.devicePixelRatio;
                        photo.width = photo.width / window.devicePixelRatio;
                    }

                    if (settings.scalePhotos) {
                        setResize = function () {
                            photo.height -= photo.height * percent;
                            photo.width -= photo.width * percent;
                        };
                        if (settings.mw && photo.width > settings.mw) {
                            percent = (photo.width - settings.mw) / photo.width;
                            setResize();
                        }
                        if (settings.mh && photo.height > settings.mh) {
                            percent = (photo.height - settings.mh) / photo.height;
                            setResize();
                        }
                    }

                    if (settings.h) {
                        photo.style.marginTop = Math.max(settings.mh - photo.height, 0) / 2 + 'px';
                    }

                    if ($related[1] && (settings.loop || $related[index + 1])) {
                        photo.style.cursor = 'pointer';
                        photo.onclick = function () {
                            publicMethod.next();
                        };
                    }

                    if (isIE) {
                        photo.style.msInterpolationMode = 'bicubic';
                    }

                    setTimeout(function () { // A pause because Chrome will sometimes report a 0 by 0 size otherwise.
                        prep(photo);
                    }, 1);
                });

            setTimeout(function () { // A pause because Opera 10.6+ will sometimes not run the onload function otherwise.
                photo.src = href;
            }, 1);
        } else if (href) {
            $loadingBay.load(href, settings.data, function (data, status) {
                if (request === requests) {
                    prep(status === 'error' ? $tag(div, 'Error').html(settings.xhrError) : $(this).contents());
                }
            });
        }
    };

    // Navigates to the next page/image in a set.
    publicMethod.next = function () {
        if (!active && $related[1] && (settings.loop || $related[index + 1])) {
            index = getIndex(1);
            publicMethod.load();
        }
    };

    publicMethod.prev = function () {
        if (!active && $related[1] && (settings.loop || index)) {
            index = getIndex(-1);
            publicMethod.load();
        }
    };

    // Note: to use this within an iframe use the following format: parent.$.fn.colorbox.close();
    publicMethod.close = function () {
        if (open && !closing) {

            closing = true;

            open = false;

            trigger(event_cleanup, settings.onCleanup);

            $window.unbind('.' + prefix + ' .' + event_ie6);

            $overlay.fadeTo(200, 0);

            $box.stop().fadeTo(300, 0, function () {

                $box.add($overlay).css({'opacity': 1, cursor: 'auto'}).hide();

                trigger(event_purge);

                $loaded.empty().remove(); // Using empty first may prevent some IE7 issues.

                setTimeout(function () {
                    closing = false;
                    trigger(event_closed, settings.onClosed);
                }, 1);
            });
        }
    };

    // Removes changes ColorBox made to the document, but does not remove the plugin
    // from jQuery.
    publicMethod.remove = function () {
        $([]).add($box).add($overlay).remove();
        $box = null;
        $('.' + boxElement)
            .removeData(colorbox)
            .removeClass(boxElement);

        $(document).unbind('click.'+prefix);
    };

    // A method for fetching the current element ColorBox is referencing.
    // returns a jQuery object.
    publicMethod.element = function () {
        return $(element);
    };

    publicMethod.settings = defaults;

}(jQuery, document, window));;/**
 * Copyright (c) 2011-2014 Felix Gnass
 * Licensed under the MIT license
 */
(function(root, factory) {

    /* CommonJS */
    if (typeof exports == 'object')  module.exports = factory()

    /* AMD module */
    else if (typeof define == 'function' && define.amd) define(factory)

    /* Browser global */
    else root.Spinner = factory()
}
(this, function() {
    "use strict";

    var prefixes = ['webkit', 'Moz', 'ms', 'O'] /* Vendor prefixes */
        , animations = {} /* Animation rules keyed by their name */
        , useCssAnimations /* Whether to use CSS animations or setTimeout */

    /**
     * Utility function to create elements. If no tag name is given,
     * a DIV is created. Optionally properties can be passed.
     */
    function createEl(tag, prop) {
        var el = document.createElement(tag || 'div')
            , n

        for(n in prop) el[n] = prop[n]
        return el
    }

    /**
     * Appends children and returns the parent.
     */
    function ins(parent /* child1, child2, ...*/) {
        for (var i=1, n=arguments.length; i<n; i++)
            parent.appendChild(arguments[i])

        return parent
    }

    /**
     * Insert a new stylesheet to hold the @keyframe or VML rules.
     */
    var sheet = (function() {
        var el = createEl('style', {type : 'text/css'})
        ins(document.getElementsByTagName('head')[0], el)
        return el.sheet || el.styleSheet
    }())

    /**
     * Creates an opacity keyframe animation rule and returns its name.
     * Since most mobile Webkits have timing issues with animation-delay,
     * we create separate rules for each line/segment.
     */
    function addAnimation(alpha, trail, i, lines) {
        var name = ['opacity', trail, ~~(alpha*100), i, lines].join('-')
            , start = 0.01 + i/lines * 100
            , z = Math.max(1 - (1-alpha) / trail * (100-start), alpha)
            , prefix = useCssAnimations.substring(0, useCssAnimations.indexOf('Animation')).toLowerCase()
            , pre = prefix && '-' + prefix + '-' || ''

        if (!animations[name]) {
            sheet.insertRule(
                '@' + pre + 'keyframes ' + name + '{' +
                '0%{opacity:' + z + '}' +
                start + '%{opacity:' + alpha + '}' +
                (start+0.01) + '%{opacity:1}' +
                (start+trail) % 100 + '%{opacity:' + alpha + '}' +
                '100%{opacity:' + z + '}' +
                '}', sheet.cssRules.length)

            animations[name] = 1
        }

        return name
    }

    /**
     * Tries various vendor prefixes and returns the first supported property.
     */
    function vendor(el, prop) {
        var s = el.style
            , pp
            , i

        prop = prop.charAt(0).toUpperCase() + prop.slice(1)
        for(i=0; i<prefixes.length; i++) {
            pp = prefixes[i]+prop
            if(s[pp] !== undefined) return pp
        }
        if(s[prop] !== undefined) return prop
    }

    /**
     * Sets multiple style properties at once.
     */
    function css(el, prop) {
        for (var n in prop)
            el.style[vendor(el, n)||n] = prop[n]

        return el
    }

    /**
     * Fills in default values.
     */
    function merge(obj) {
        for (var i=1; i < arguments.length; i++) {
            var def = arguments[i]
            for (var n in def)
                if (obj[n] === undefined) obj[n] = def[n]
        }
        return obj
    }

    /**
     * Returns the absolute page-offset of the given element.
     */
    function pos(el) {
        var o = { x:el.offsetLeft, y:el.offsetTop }
        while((el = el.offsetParent))
            o.x+=el.offsetLeft, o.y+=el.offsetTop

        return o
    }

    /**
     * Returns the line color from the given string or array.
     */
    function getColor(color, idx) {
        return typeof color == 'string' ? color : color[idx % color.length]
    }

    // Built-in defaults

    var defaults = {
        lines: 12,            // The number of lines to draw
        length: 7,            // The length of each line
        width: 5,             // The line thickness
        radius: 10,           // The radius of the inner circle
        rotate: 0,            // Rotation offset
        corners: 1,           // Roundness (0..1)
        color: '#000',        // #rgb or #rrggbb
        direction: 1,         // 1: clockwise, -1: counterclockwise
        speed: 1,             // Rounds per second
        trail: 100,           // Afterglow percentage
        opacity: 1/4,         // Opacity of the lines
        fps: 20,              // Frames per second when using setTimeout()
        zIndex: 2e9,          // Use a high z-index by default
        className: 'spinner', // CSS class to assign to the element
        top: '50%',           // center vertically
        left: '50%',          // center horizontally
        position: 'absolute'  // element position
    }

    /** The constructor */
    function Spinner(o) {
        this.opts = merge(o || {}, Spinner.defaults, defaults)
    }

    // Global defaults that override the built-ins:
    Spinner.defaults = {}

    merge(Spinner.prototype, {

        /**
         * Adds the spinner to the given target element. If this instance is already
         * spinning, it is automatically removed from its previous target b calling
         * stop() internally.
         */
        spin: function(target) {
            this.stop()

            var self = this
                , o = self.opts
                , el = self.el = css(createEl(0, {className: o.className}), {position: o.position, width: 0, zIndex: o.zIndex})
                , mid = o.radius+o.length+o.width

            css(el, {
                left: o.left,
                top: o.top
            })

            if (target) {
                target.insertBefore(el, target.firstChild||null)
            }

            el.setAttribute('role', 'progressbar')
            self.lines(el, self.opts)

            if (!useCssAnimations) {
                // No CSS animation support, use setTimeout() instead
                var i = 0
                    , start = (o.lines - 1) * (1 - o.direction) / 2
                    , alpha
                    , fps = o.fps
                    , f = fps/o.speed
                    , ostep = (1-o.opacity) / (f*o.trail / 100)
                    , astep = f/o.lines

                    ;(function anim() {
                    i++;
                    for (var j = 0; j < o.lines; j++) {
                        alpha = Math.max(1 - (i + (o.lines - j) * astep) % f * ostep, o.opacity)

                        self.opacity(el, j * o.direction + start, alpha, o)
                    }
                    self.timeout = self.el && setTimeout(anim, ~~(1000/fps))
                })()
            }
            return self
        },

        /**
         * Stops and removes the Spinner.
         */
        stop: function() {
            var el = this.el
            if (el) {
                clearTimeout(this.timeout)
                if (el.parentNode) el.parentNode.removeChild(el)
                this.el = undefined
            }
            return this
        },

        /**
         * Internal method that draws the individual lines. Will be overwritten
         * in VML fallback mode below.
         */
        lines: function(el, o) {
            var i = 0
                , start = (o.lines - 1) * (1 - o.direction) / 2
                , seg

            function fill(color, shadow) {
                return css(createEl(), {
                    position: 'absolute',
                    width: (o.length+o.width) + 'px',
                    height: o.width + 'px',
                    background: color,
                    boxShadow: shadow,
                    transformOrigin: 'left',
                    transform: 'rotate(' + ~~(360/o.lines*i+o.rotate) + 'deg) translate(' + o.radius+'px' +',0)',
                    borderRadius: (o.corners * o.width>>1) + 'px'
                })
            }

            for (; i < o.lines; i++) {
                seg = css(createEl(), {
                    position: 'absolute',
                    top: 1+~(o.width/2) + 'px',
                    transform: o.hwaccel ? 'translate3d(0,0,0)' : '',
                    opacity: o.opacity,
                    animation: useCssAnimations && addAnimation(o.opacity, o.trail, start + i * o.direction, o.lines) + ' ' + 1/o.speed + 's linear infinite'
                })

                if (o.shadow) ins(seg, css(fill('#000', '0 0 4px ' + '#000'), {top: 2+'px'}))
                ins(el, ins(seg, fill(getColor(o.color, i), '0 0 1px rgba(0,0,0,.1)')))
            }
            return el
        },

        /**
         * Internal method that adjusts the opacity of a single line.
         * Will be overwritten in VML fallback mode below.
         */
        opacity: function(el, i, val) {
            if (i < el.childNodes.length) el.childNodes[i].style.opacity = val
        }

    })


    function initVML() {

        /* Utility function to create a VML tag */
        function vml(tag, attr) {
            return createEl('<' + tag + ' xmlns="urn:schemas-microsoft.com:vml" class="spin-vml">', attr)
        }

        // No CSS transforms but VML support, add a CSS rule for VML elements:
        sheet.addRule('.spin-vml', 'behavior:url(#default#VML)')

        Spinner.prototype.lines = function(el, o) {
            var r = o.length+o.width
                , s = 2*r

            function grp() {
                return css(
                    vml('group', {
                        coordsize: s + ' ' + s,
                        coordorigin: -r + ' ' + -r
                    }),
                    { width: s, height: s }
                )
            }

            var margin = -(o.width+o.length)*2 + 'px'
                , g = css(grp(), {position: 'absolute', top: margin, left: margin})
                , i

            function seg(i, dx, filter) {
                ins(g,
                    ins(css(grp(), {rotation: 360 / o.lines * i + 'deg', left: ~~dx}),
                        ins(css(vml('roundrect', {arcsize: o.corners}), {
                                width: r,
                                height: o.width,
                                left: o.radius,
                                top: -o.width>>1,
                                filter: filter
                            }),
                            vml('fill', {color: getColor(o.color, i), opacity: o.opacity}),
                            vml('stroke', {opacity: 0}) // transparent stroke to fix color bleeding upon opacity change
                        )
                    )
                )
            }

            if (o.shadow)
                for (i = 1; i <= o.lines; i++)
                    seg(i, -2, 'progid:DXImageTransform.Microsoft.Blur(pixelradius=2,makeshadow=1,shadowopacity=.3)')

            for (i = 1; i <= o.lines; i++) seg(i)
            return ins(el, g)
        }

        Spinner.prototype.opacity = function(el, i, val, o) {
            var c = el.firstChild
            o = o.shadow && o.lines || 0
            if (c && i+o < c.childNodes.length) {
                c = c.childNodes[i+o]; c = c && c.firstChild; c = c && c.firstChild
                if (c) c.opacity = val
            }
        }
    }

    var probe = css(createEl('group'), {behavior: 'url(#default#VML)'})

    if (!vendor(probe, 'transform') && probe.adj) initVML()
    else useCssAnimations = vendor(probe, 'animation')

    return Spinner

}));;/**
 * Buto.tv lightbox plugin created and tested with jquery 1.9.0
 * will create a image of the poster frame of a buto video
 * when you click on the image then you get a lightbox with the video
 * inside ready to play.
 * The JS will call the Buto api to get some data about the video such
 * as poster frame uri, video uri in our CDN.  It's all CORS safe so don't worry
 * our api supports Jsonp so that's how we get the ie6+ support
 * @link text http://get.buto.tv
 *
 * Included libraries thanks to:
 * @link https://github.com/jackmoore/colorbox/
 * @link https://github.com/fgnass/spin.js
 * Thanks dudes, your work is awesome
 *
 * basic usage:
 * <div class='buto-lightbox-here' data-id='12345' style='width:451px;height:254px'>Buto Poster frame goes in here</div>
 * $('div.buto-lightbox-here').butoLightbox();
 * function will use basic dimensions that you've set of the container element
 * NB the data-id which must contain the buto video_id otherwise it won't work
 *
 * License is MIT, go nuts; 'cos that's how we roll here at Buto
 * @link http://opensource.org/licenses/mit-license.php
 *
 */
(function ($) {
    /**
     *
     * method Get's the json api data from the BUTO api
     * @private
     * @param string object_id the buto video/playlist/livestream id
     * @param string uri the uri to the buto api
     * @returns void have to use 'promise' to get the data a it's async http://stackoverflow.com/questions/5316697/jquery-return-data-after-ajax-call-success
     */
    var getObjectData = function (object_id, uri) {
        return $.ajax({
            dataType: "jsonp",
            type: 'get',
            jsonpCallback: 'callback' + object_id + 'a', //each callback has to have a uniqiue name otherwise the namespace gets poluted and things go very funky indeed
            url: uri + '/' + object_id + '.jsonp?callback=?' //buto's v2 api supports JsonP - oh yeah!!!!
        });
    };

    /**
     * buto light box function
     * @param mixed options user specified options, will override defaults
     * @returns this for fluid interface
     */
    $.fn.butoLightbox = function (options) {
        var settings = $.extend({// Create some defaults, extending them with any options that were provided
            api_uri: '//api.buto.tv/v2/video',
            play_icon: 'https://d3lkew8zknjt1t.cloudfront.net/butotv/live/static/buto/img/html_5_embed_play_icon_60x60.png',
            class_name: 'buto-lightbox-container'
        }, options);
        return this.each(function () {

            var element = $(this); //assign to a slightly global var 'cos we'll need it later when we go into a deeper scope

            //add a class to the container so we can namespace the css
            element.addClass(settings.class_name);

            //get the video_id
            var object_id = element.data('id');

            //start spinner before we call data
            var spinner = new Spinner().spin(this);

            //get video data
            var video_response = getObjectData(object_id, settings.api_uri);

            //on successful retrieval of the video json
            video_response.success(function (data) {

                //#1957 - enable used of media or video title
                var title = data.media_title; //default to media title
                if (options !== undefined && options.hasOwnProperty('title')) {
                    //optionally set title
                    if (options.title === 'video') {
                        title = data.video_title;
                    }
                }

                //create an <a> element
                var anchor = $('<a>').prop('href', '//embed.buto.tv/' + object_id).prop('title', title);

                //create an <img> element for our play icon
                var play_icon = $('<img>').prop('src', settings.play_icon).addClass('buto-lightbox-play-icon');
                play_icon.on('load', function (e) {
                    var play_icon_width = e.target.clientWidth / 2;
                    var play_icon_height = e.target.clientHeight / 2;
                    e.target.setAttribute('style', 'margin-left:-' + play_icon_width + 'px;margin-top:-' + play_icon_height + 'px');
                });

                //create poster frame image
                var image = $('<img>').prop('src', data.uri.poster_frame).prop('alt', title);

                if (element.height() === 0 || element.height() === undefined) { //if the height is not specified (width will always be specified as it will default to parent width, but height will be 0 if not speccd)
                    image.prop('height', data.published_height).prop('width', data.published_width); //use json width & height
                }
                else {
                    image.prop('width', element.width()).prop('height', element.height());
                }

                //put play_icon into anchor tag
                anchor.append(play_icon);

                //put image into anchor tags
                anchor.append(image);

                //instantiate lightbox courtesy of http://www.jacklmoore.com/colorbox/
                anchor.colorbox({iframe: true, innerWidth: data.published_width, innerHeight: data.published_height});

                //stop the spinner
                spinner.stop();

                //append content to div
                element.append(anchor);
            });
        });
    };
})(jQuery);