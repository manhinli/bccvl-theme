
// JS code to initialise the visualiser

window.bccvl || (window.bccvl = {});

window.bccvl.visualiser = {

    init: function() {
        try {
            this.visualiserBaseUrl = window.bccvl.config.visualiser.baseUrl;
            console.log("Determined visualiser baseUrl: " + this.visualiserBaseUrl);
        } catch (err) {
            // swallow the exception (i.e. don't re-throw)
            console.warn(["Failed to determine visualiser base url", err]);
        }

        // This goes looking for viz buttons, and attaches a click event.
        // The buttons (or links or whatever) should look like this:
        // <button class=".bccvl-occurrence-viz" data-viz-id="someId">

        // here's a list of all the viz-able things.   We'll loop through this below.
        // each item looks like this:
        //     'itemType': {                         # viz buttons should use a class name of '.bccvl-{itemType}-viz'
        //         apiType: 'vizApiName',            # [reqd] the API type the visualiser should use.
        //         resolveId: function(rawId) {...}  # [optional] function to re-map the ID from the DOM element to
        //                                           # the id that should be given to the vizualiser.
        //     }
        visualisableTypes = {
            // - - - - - - - - - - - - - - - - - - - - -
            'occurrence': {
                apiType:   'point',
                resolveId: function(rawId) { return window.bccvl.lookups.occurrencesMap[rawId].file; }
            },
            // - - - - - - - - - - - - - - - - - - - - -
            'raster': {
                apiType:   'raster',
                resolveId: function(rawId) { return window.location.protocol + '//' + window.location.host + rawId; }
            },
            // - - - - - - - - - - - - - - - - - - - - -
            'r': {
                apiType:   'r',
                resolveId: function(rawId) { return window.location.protocol + '//' + window.location.host + rawId; }
            },
            // - - - - - - - - - - - - - - - - - - - - -
            'auto': {
                apiType:   'auto_detect',
                resolveId: function(rawId) { return window.location.protocol + '//' + window.location.host + rawId; }
            },
            // - - - - - - - - - - - - - - - - - - - - -
        }


        $.each(visualisableTypes, function(name, vizType) {
            var $vizInvokers = $('.bccvl-' + name + '-viz');

            $.each($vizInvokers, function(vIndex, invoker) {
                // each invoker should have a data-viz-id.. bail if it doesn't
                var $invoker = $(invoker);
                var id = $invoker.attr('data-viz-id');
                if (!id) return;

                if (vizType.resolveId) {
                    id = vizType.resolveId(id);
                }

                $invoker.addClass('fine');

                // attach some click behaviour to the thing
                $invoker.click(function(evt) {
                    bccvl.visualiser.visualise(id, $invoker, { apiType: vizType.apiType });
                    evt.preventDefault();
                    return false;
                });
            });
        });
    },

    visualise: function(dataId, vizElement, options) {
        var opts = {
            apiType: 'auto_detect',
            apiVersion: '1',
            vizType: 'default',
        };
        // merge in the caller's options
        if (options) {
            for (var opt in options) { opts[opt] = options[opt]; }
        }

        var $vizFrame = $(vizElement);
        if (! $vizFrame.is('iframe')) {
            // if the vizElement isn't an iframe, find the closest iframe
            $vizFrame = $(vizElement).closest('.tab-pane, body').find('iframe.bccvl-viz'); // TODO: don't assume tabs
        }

        $vizFrame.attr('src', this.visualiserBaseUrl +
            'api/' + encodeURIComponent(opts.apiType) +
            '/' + encodeURIComponent(opts.apiVersion) +
            '/' + encodeURIComponent(opts.vizType) +
            '?data_url=' + encodeURIComponent(dataId)
        );
    }

};
