(function($, window, document) {

    if (typeof window.okular == 'undefined') {
        window.okular = {
            fake: true,
            KoalaNochange: function() {},
            Beep: function() {},
            BeepSoft: -1,
            BeepHard: -1,
            SetFrontligh: function() {},
            nm_host: undefined,
            device_uuid: undefined,
            RSSI: -1,
            BatteryLevel: -1,
            ExternalBatteryLevel: -1,
            Temperature: -1,
            Charger: -1
        };
    }

    $.extend(window.okular, {
        init: function(options) {
            this.rectangles = [];
            this.nextUpdate = null;
            this.settings = $.extend({}, this.defaults, options);
            if (!okular.fake) {
                this.settings.debug = false;
            }

            $('#tmOverlay').remove();
            if (this.settings.debug) {
                overlay = $('<div id="tmOverlay"></div>').css({
                    position: 'absolute',
                    width: this.settings.width-4,
                    height: this.settings.height-4,
                    top: this.settings.position == 'right' ? 0 : this.settings.height+this.settings.debugOffset,
                    left: this.settings.position == 'right' ? this.settings.width+this.settings.debugOffset : 0,
                    border: '2px solid red',
                    opacity: 0.4
                });
                $('body').append(overlay);
            }
        },

        add: function(options) {
            var rectangle = $.extend({}, this.defaultRectangleOptions, options);
            if ('width' in rectangle && 'height' in rectangle) {

                
                var same = $.grep(this.rectangles, function(e) {
                    return  e.width == rectangle.width &&
                            e.height == rectangle.height &&
                            e.bitDepth == rectangle.bitDepth &&
                            e.A2 == rectangle.A2 &&
                            e.inverse == rectangle.inverse &&
                            e.dithering == rectangle.dithering &&
                            e.renderDelay == rectangle.renderDelay &&
                            e.top == rectangle.top &&
                            e.left == rectangle.left;
                });

                if (same.length == 0) {
                    rectangle.timestamp = new Date();
                    this.rectangles.push(rectangle);
                    
                    if (this.rectangles.length == 1) {
                        var timeout = this.nextUpdate ? this.nextUpdate - (new Date()) : this.settings.timeoutFirst;
                        if (timeout < this.settings.timeoutFirst ) {
                            timeout = this.settings.timeoutFirst;
                        }
                        window.setTimeout($.proxy(this.sendToKoala, this), timeout);
                    }
                }

                if (okular.noChangeTimer) {
                    clearTimeout(okular.noChangeTimer);
                    okular.noChangeTimer = null;
                }
            } else {
                throw new Error("Rectangle must have width and height properties!");
            }
        },

        sendToKoala: function() {
            var koalaRectangles = [],
                now = new Date(),
                nextCallTimeout = this.settings.timeoutFirst,
                bitDepth = 1,
                A2 = false,
                PIP = false,
                inverse = false,
                self = this;

            if (this.settings.debug) {
                $('.tmRectangle').remove();
            }

            $.each($.extend({}, this.rectangles), function(index) {
                var rectangle = this;
                if (now - rectangle.timestamp >= rectangle.renderDelay) {
                    // calculate time until next render 
                    var timeout;
                    if (rectangle.A2) {
                        timeout = self.settings.timeoutA2;
                    } else if(rectangle.bitDepth == 1) {
                        timeout = self.settings.timeout1bit;
                    } else {
                        timeout = self.settings.timeout4bit;
                    }
                    if (timeout > nextCallTimeout) {
                        nextCallTimeout = timeout;
                    }

                    koalaRectangles.push(rectangle.left);
                    koalaRectangles.push(rectangle.top);
                    koalaRectangles.push(rectangle.width);
                    koalaRectangles.push(rectangle.height);

                    if (self.settings.newRectangleFormat) {
                        koalaRectangles.push(rectangle.inverse << 6 | rectangle.PIP << 5 | rectangle.A2 << 4 | rectangle.bitDepth);
                        koalaRectangles.push(rectangle.dithering);
                    } else {
                        if (rectangle.A2 && !A2) {
                            A2 = true;
                        }
                        if (rectangle.PIP && !PIP) {
                            PIP = true;
                        }
                        if (rectangle.inverse && !inverse) {
                            inverse = true;
                        }
                        if (rectangle.bitDepth > bitDepth) {
                            bitDepth = rectangle.bitDepth;
                        }
                    }

                    if (self.settings.debug) {
                        $('<div class="tmRectangle"></div>').css({
                            position: 'absolute',
                            width: rectangle.width,
                            height: rectangle.height,
                            top: rectangle.top-2,
                            left: rectangle.left-2,
                            'background-color': rectangle.bitDepth == 4 ? 'red' : 'blue',
                            opacity: 0.4
                        }).appendTo('#tmOverlay');
                    }
                    
                    self.rectangles.splice(self.rectangles.indexOf(rectangle), 1);
                }
            });

            
            if (this.settings.debug) {
                console.log("Sending " + koalaRectangles.length/(self.settings.newRectangleFormat ? 6 : 4) + " changes to koala: [" + koalaRectangles.join(', ') + "]");
            }

            if('KoalaRenderRectangles' in okular) {
                if (this.settings.newRectangleFormat) {
                    okular.KoalaRenderRectangles(koalaRectangles.length, koalaRectangles);
                } else {
                    if (A2) {
                        okular.KoalaUseA2Waveform();
                    }
                    if (PIP) {
                        okular.KoalaUsePIPLayerOnce();
                    }
                    if (inverse) {
                       okular.KoalaInverseNextRender();
                    }
                    okular.KoalaRender(koalaRectangles.length, koalaRectangles, bitDepth);
                }
            }

            if (this.rectangles.length > 0) {
                if (nextCallTimeout == this.settings.timeoutFirsts) {
                    min = Math.min.apply(null, $.map(this.rectangles, function(rectangle) {
                        return rectangle.renderDelay - (now-rectangle.timestamp);
                    }));
                    if (min > nextCallTimeout) {
                        nextCallTimeout = min;
                    }
                }
                setTimeout($.proxy(this.sendToKoala, this), nextCallTimeout);
            }

            this.nextUpdate = new Date();
            this.nextUpdate.setMilliseconds(this.nextUpdate.getMilliseconds() + nextCallTimeout);
        }
    });

    okular.dithering = {
        default: 0,
        none: 1,
        Bayer: 2,
        FloydSteinberg: 3
    };

    okular.defaults = {
        width: 600,
        height: 800,
        debug: true,
        debugOffset: 10,
        position: 'right',
        newRectangleFormat: false,

        bitDepth: 4,
        dithering: okular.dithering.default,
        renderDelay: 0,
        timeoutFirst: 10,
        timeoutA2: 205,
        timeout1bit: 250,
        timeout4bit: 750,
        timeoutClick: 50
    };

    okular.defaultRectangleOptions = {
        bitDepth: okular.defaults.bitDepth,
        A2: false,
        PIP: false,
        inverse: false,
        dithering: okular.defaults.dithering,
        renderDelay: okular.defaults.renderDelay,
        top: 0,
        left: 0
    };


    $.fn.tmList = function(options) {
        var rectangle = options || {};

        $(this).each(function() {
            var $this = $(this);
            if ($this.is(':visible')) {
                rectangle.width = $this.outerWidth();
                rectangle.height = $this.outerHeight();
                rectangle.left = $this.offset().left;
                rectangle.top = $this.offset().top;

                //check if the object is really visible (ie not under another via z-index)
                var realElement=$(document.elementFromPoint(rectangle.left, rectangle.top))[0];
                if($this[0]==realElement || $this.has($(realElement))) {
                    okular.add(rectangle);
                }
            }
        });
    }

    $('body').click(function() {
        okular.noChangeTimer = setTimeout(function() {
            if (okular.rectangles.length == 0) {
                okular.KoalaNochange();
            }
            okular.noChangeTimer = null;
        }, okular.settings.timeoutClick);
    });


    //backward compatibility
    $.tmListEmpty = function() { 
        console.log("$.tmListRender is DEPRECATED, you don't need to use it anymore.");
    }
    $.tmListRender = function() {
        console.log("$.tmListRender is DEPRECATED, you don't need to use it anymore.");
    }
    $.tmList = function(options) {
        okular.add(options);
        console.log("$.tmList is DEPRECATED, use okular.add instead.");
    }
    $.tmListAddCoords = function(top, left, height, width, bitDepth) {
        okular.add({
            top: top,
            left: left,
            height: height,
            width: width,
            bitDepth: bitDepth
        });
        console.log("$.tmListAddCoords is DEPRECATED, use okular.add instead.");
    }

    okular.init();
 
})(jQuery, window, document);