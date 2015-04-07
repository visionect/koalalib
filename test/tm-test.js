buster.spec.expose();
var assert = buster.assert,
    refute = buster.refute;

buster.testCase("TM test case", {
    setUp: function() {
        if(okular.fake) {
            okular.KoalaRenderRectangles = this.stub();
            okular.KoalaRender = this.stub();
            okular.KoalaInverseNextRender = this.stub();
            okular.KoalaUseA2Waveform = this.stub();
        } else {
            this.spy(okular, 'KoalaRenderRectangles');
            this.spy(okular, 'KoalaRender');
            this.spy(okular, 'KoalaInverseNextRender');
            this.spy(okular, 'KoalaUseA2Waveform');
        }
        okular.init();
        this.clock = buster.sinon.useFakeTimers();
    },
    tearDown: function() {
        this.clock.restore();
    },
    "debug display init": function () {
        okular.init({debug: false});
        var overlay = $('#tmOverlay');
        assert.equals(overlay.length, 0);

        okular.init({debug: true});
        overlay = $('#tmOverlay');
        assert.equals(overlay.length, 1);
        assert.equals(overlay.height(), okular.defaults.height-4);
        assert.equals(overlay.width(), okular.defaults.width-4);
        assert.equals(parseInt(overlay.css('left'), 10), okular.defaults.width+okular.defaults.debugOffset);
        assert.equals(parseInt(overlay.css('top'), 10), 0);

        okular.init({position: 'bottom', debug: true});
        overlay = $('#tmOverlay');
        assert.equals(parseInt(overlay.css('left'), 10), 0);
        assert.equals(parseInt(overlay.css('top'), 10), okular.defaults.height+okular.defaults.debugOffset);
    },
    "basic tmList with new rectangle format": function() {
        okular.init({
            newRectangleFormat: true,
            combineRectangles: false
        });

        // should throw an exception without width and height properties.
        assert.exception(okular.add);

        okular.add({
            width: 100,
            height: 100,
        });

        okular.add({
            width: 100,
            height: 200,
            top: 300,
            left: 400,
            renderDelay: 50
        });

        this.clock.tick(okular.defaults.timeoutFirst);
        assert.calledOnceWith(okular.KoalaRenderRectangles, 6, [0, 0, 100, 100, okular.defaults.bitDepth, okular.defaults.dithering]);

        var overlays = $('.tmRectangle'),
            overlay = $(overlays[0]);

        assert.equals(overlays.length, 1);
        assert.equals(overlay.width(), 100);
        assert.equals(overlay.height(), 100);

        setTimeout(function() {
            okular.add({
                width: 200,
                height: 200,
            });
        }, 100);

        this.clock.tick(okular.defaults.timeout4bit);
        assert.equals(
            okular.KoalaRenderRectangles.getCall(1).args[1],
            [400, 300, 100, 200, okular.defaults.bitDepth, okular.defaults.dithering, 0, 0, 200, 200, okular.defaults.bitDepth, okular.defaults.dithering]
        );

        overlays = $('.tmRectangle');
        overlay = $(overlays[0]);

        assert.equals(overlays.length, 2);
        assert.equals(overlay.width(), 100);
        assert.equals(overlay.height(), 200);

        overlay = $(overlays[1]);
        assert.equals(overlay.width(), 200);
        assert.equals(overlay.height(), 200);

        okular.add({
            width: 100,
            height: 100,
            bitDepth: 1,
        });

        refute.calledThrice(okular.KoalaRenderRectangles);

        this.clock.tick(okular.defaults.timeout4bit);
        assert.calledThrice(okular.KoalaRenderRectangles);

        okular.add({
            width: 100,
            height: 100,
            bitDepth: 1,
            A2: true,
            inverse: true
        });

        this.clock.tick(okular.defaults.timeout1bit);
        assert.equals(okular.KoalaRenderRectangles.getCall(3).args[1], [0, 0, 100, 100, 0x51, okular.defaults.dithering]);
    },
    "basic tmList with old rectangle format": function() {
        okular.init({
            newRectangleFormat: false,
            combineRectangles: false
        });

        // should throw an exception without width and height properties.
        assert.exception(okular.add);

        okular.add({
            width: 100,
            height: 100,
        });

        okular.add({
            width: 100,
            height: 200,
            top: 300,
            left: 400,
            renderDelay: 50
        });

        this.clock.tick(okular.defaults.timeoutFirst);
        assert.calledOnceWith(okular.KoalaRender, 4, [0, 0, 100, 100], 4);

        var overlays = $('.tmRectangle'),
            overlay = $(overlays[0]);

        assert.equals(overlays.length, 1);
        assert.equals(overlay.width(), 100);
        assert.equals(overlay.height(), 100);

        setTimeout(function() {
            okular.add({
                width: 200,
                height: 200,
            });
        }, 100);

        this.clock.tick(okular.defaults.timeout4bit);
        assert.equals(okular.KoalaRender.getCall(1).args[1], [400, 300, 100, 200, 0, 0, 200, 200]);
        assert.equals(okular.KoalaRender.getCall(1).args[2], 4);

        overlays = $('.tmRectangle');
        overlay = $(overlays[0]);

        assert.equals(overlays.length, 2);
        assert.equals(overlay.width(), 100);
        assert.equals(overlay.height(), 200);

        overlay = $(overlays[1]);
        assert.equals(overlay.width(), 200);
        assert.equals(overlay.height(), 200);

        okular.add({
            width: 100,
            height: 100,
            bitDepth: 1,
        });

        refute.calledThrice(okular.KoalaRender);

        this.clock.tick(okular.defaults.timeout4bit);
        assert.calledThrice(okular.KoalaRender);

        okular.add({
            width: 250,
            height: 100,
            bitDepth: 1,
            A2: true,
            inverse: true
        });

        this.clock.tick(okular.defaults.timeout1bit);
        assert.equals(okular.KoalaRender.getCall(3).args[1], [0, 0, 250, 100]);
        assert.equals(okular.KoalaRender.getCall(3).args[2], 1);
    },
    "rectangle discarding": function() {
        okular.init({
            combineRectangles: false
        });

        okular.add({ width: 100, height: 100 });
        okular.add({ width: 100, height: 100 });
        okular.add({ width: 200, height: 100 });
        okular.add({ width: 100, height: 100 });
        okular.add({ width: 100, height: 100 });

        this.clock.tick(okular.defaults.timeoutFirst);
        assert.calledOnceWith(okular.KoalaRender, 8, [0, 0, 100, 100, 0, 0, 200, 100], 4);
    },
    "rectangle combining": function() {
        okular.add({ width: 100, height: 100, top: 10, left: 40, bitDepth: 1 });
        okular.add({ width: 100, height: 100, top: 400, left: 200, bitDepth: 1 });
        okular.add({ width: 100, height: 100, top: 40, left: 60, bitDepth: 1 });
        okular.add({ width: 50, height: 50, top: 200, left: 100, bitDepth: 4, combine: false });

        this.clock.tick(okular.defaults.timeoutFirst);
        assert.calledOnceWith(okular.KoalaRender, 8, [100, 200, 50, 50, 40, 10, 260, 490], 4);
    }
});
