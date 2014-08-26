
// JS code to initialise the visualiser map

define(     ['jquery', 'js/bccvl-preview-layout', 'OpenLayers', 'js/bccvl-visualiser-loading-panel'],
    function( $      ) {

        // REGISTER CLICK EVENT
        // -------------------------------------------------------------------------------------------
        /*$('.bccvl-auto-viz').click(function(){
            renderMap($(this).data('viz-id'), $('.bccvl-preview-pane:visible').attr('id'), 'auto');
        });

        $('.bccvl-occurrence-viz, .bccvl-absence-viz').click(function(){
            renderMap($(this).data('viz-id'), $('.bccvl-preview-pane:visible').attr('id'), 'occurence');
        }); */

        $('body').on('click', '.bccvl-occurrence-viz, .bccvl-absence-viz', function(event){
            event.preventDefault();
            renderMap($(this).data('uuid'), $(this).data('viz-id'), $('.bccvl-preview-pane:visible').attr('id'), 'occurence');
        });

        $('body').on('click', 'a.bccvl-auto-viz', function(event){
            event.preventDefault();
            renderMap($(this).data('uuid'),$(this).data('viz-id'), $('.bccvl-preview-pane:visible').attr('id'), 'auto', $(this).data('viz-layer'));
        });

        /* Global configuration */
        // ----------------------------------------------------------------
        // visualiser base url
        var visualiserBaseUrl = window.bccvl.config.visualiser.baseUrl;
        // dataset manager getMetadata endpoint url
        var dmurl = portal_url + '/dm/getMetadata';

        /* FUNCTIONS FOR CREATING COLOR SPECTRUMS AND CONSTRUCTING XML SLD DOCUMENTS TO PASS TO MAP TILE REQUESTS */
        // -------------------------------------------------------------------------------------------

        var styleObj = {"minVal":0,"maxVal":100,"steps":20,"startpoint":{r:255,g:255,b:255},"midpoint":{r:0,g:159,b:227},"endpoint":{r:30,g:77,b:155}};

        /*  Goal here is to determine minimum and maximum raster values in the map layer,
            dividing it by an arbitrary number of levels.  This is then used to make an array
            of thresholds for color values to be associated with.
        */

        /*  Important to note here that due to the structure of an SLD doc, the number of
            threshold values must always be one more than the number of desired color levels.
            The number of color values must then be one greater than the thresholds.
            SLD requests are packed like: Color-Threshold-*colorlevel*-Color...., so the end
            result will always have +1 threshold and +2 color values on top of your desired number of colour values.
        */

        function generateRangeArr(standard_range, minVal, maxVal, steps){

            if (standard_range == 'rainfall'){
                // rainfall BOM standard range
                var rangeArr = [0,200,300,400,500,600,800,1000,1200,1600,2000,2400,3200];
            } else if (standard_range == 'temperature') {
                // temperature BOM standard range
                var rangeArr = [-3,0,3,6,9,12,15,18,21,24,27,30,33,36,39];
            } else {
                // dummy max and min values, eventually replaced with relative-to-layer values
                if (minVal==undefined) minVal = 0;
                if (maxVal==undefined) maxVal = 215;
                if (steps==undefined) steps = 20; // must be even number for 3 color phase to work

                var rangeInt = (maxVal - minVal)/steps;
                var rangeArr = [];
                for (var i = 0; i < (steps+1); i++) {
                    rangeArr.push((rangeInt*i).toFixed(2));
                }
            }

            return rangeArr;
        }

        function generateColorArr(standard_range, steps, startpoint, midpoint, endpoint){
            /*  Generate array of hexidecimal colour values, note the extra value on top of threshold range. */
            if (standard_range == 'rainfall'){
                // rainfall BOM standard colours
                var colorArr = ['#FFFFFF','#fffee8','#fefdd1','#f6f8ab','#daeca2','#c1e3a3','#a8dba4','#8cd1a4','#6fc9a5','#45c1a4','#00b4a5','#00999a','#017b7d','#005b5c'];
            } else if (standard_range == 'temperature') {
                // temperature BOM standard colours
                var colorArr = ['#13a7ce','#0eb9d2','#54c5d2','#87d2d1','#b1e0d3','#c6e6d3','#d8eed4','#ecf6d5','#fefed7','#fef5bd','#fdea9b','#fcd78b','#fdc775','#f8a95b','#f58e41','#f3713e'];
            } else {
                // utility functions to convert RGB values into hex values for SLD styling.
                function byte2Hex(n) {
                    var nybHexString = "0123456789ABCDEF";
                    return String(nybHexString.substr((n >> 4) & 0x0F,1)) + nybHexString.substr(n & 0x0F,1);
                }
                function RGB2Color(r,g,b) {
                    return '#' + byte2Hex(r) + byte2Hex(g) + byte2Hex(b);
                }

                var colorArr = [];

                if (midpoint != null){
                    // White to blue spectrum
                    if (startpoint==undefined) {
                        var startpoint = {};
                            startpoint.r = 255;
                            startpoint.g = 251;
                            startpoint.b = 193;
                    }
                    if (midpoint==undefined) {
                        var midpoint = {};
                            midpoint.r = 195;
                            midpoint.g = 120;
                            midpoint.b = 13;
                    }
                    if (endpoint==undefined) {
                        var endpoint = {};
                            endpoint.r = 75;
                            endpoint.g = 48;
                            endpoint.b = 0;
                    }

                    // first half
                    for (var i = 0; i < ((steps/2)+1); i++) {
                        // red
                        var redInt = (startpoint.r - midpoint.r)/(steps/2);
                        var redVal = startpoint.r - (redInt*i);
                        // green
                        var greenInt = (startpoint.g - midpoint.g)/(steps/2);
                        var greenVal = startpoint.g - (greenInt*i);
                        // blue
                        var blueInt = (startpoint.b - midpoint.b)/(steps/2);
                        var blueVal = startpoint.b - (blueInt*i);

                        colorArr.push(RGB2Color(redVal,greenVal,blueVal));
                    }

                    // second half
                    for (var i = 0; i < ((steps/2)+1); i++) {
                        // red
                        var redInt = (midpoint.r - endpoint.r)/(steps/2);
                        var redVal = midpoint.r - (redInt*i);
                        // green
                        var greenInt = (midpoint.g - endpoint.g)/(steps/2);
                        var greenVal = midpoint.g - (greenInt*i);
                        // blue
                        var blueInt = (midpoint.b - endpoint.b)/(steps/2);
                        var blueVal = midpoint.b - (blueInt*i);

                        colorArr.push(RGB2Color(redVal,greenVal,blueVal));
                    }
                } else {
                    // White to blue spectrum
                    if (startpoint==undefined) {
                        var startpoint = {};
                            startpoint.r = 255;
                            startpoint.g = 255;
                            startpoint.b = 255;
                    }
                    if (endpoint==undefined) {
                        var endpoint = {};
                            endpoint.r = 30;
                            endpoint.g = 77;
                            endpoint.b = 155;
                    }

                    for (var i = 0; i < (steps+2); i++) {
                        // red
                        var redInt = (startpoint.r - endpoint.r)/steps;
                        var redVal = startpoint.r - (redInt*i);
                        // green
                        var greenInt = (startpoint.g - endpoint.g)/steps;
                        var greenVal = startpoint.g - (greenInt*i);
                        // blue
                        var blueInt = (startpoint.b - endpoint.b)/steps;
                        var blueVal = startpoint.b - (blueInt*i);

                        colorArr.push(RGB2Color(redVal,greenVal,blueVal));
                    }
                }
            }
            return colorArr;
        }

        function generateSLD(filename, minVal, maxVal, steps, startpoint, midpoint, endpoint ) {
            var standard_range;

            if(/bioclim_12|bioclim_17|bioclim_16|bioclim_18|bioclim_13|bioclim_19|bioclim_15|bioclim_14/g.test(filename)){
                var standard_range = 'rainfall';
            } else if(/bioclim_11|bioclim_10|bioclim_02|bioclim_03|bioclim_01|bioclim_06|bioclim_07|bioclim_04|bioclim_05|bioclim_08|bioclim_09/g.test(filename)){
                var standard_range = 'temperature';
            } else {
                var standard_range = 'soil';
            }

            var rangeArr = generateRangeArr(standard_range, minVal, maxVal, steps);
            var colorArr = generateColorArr(standard_range, steps, startpoint, midpoint, endpoint);

            var xmlStylesheet = '<StyledLayerDescriptor version="1.1.0" xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.1.0/StyledLayerDescriptor.xsd" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:se="http://www.opengis.net/se" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><NamedLayer><se:Name>DEFAULT</se:Name><UserStyle><se:Name>xxx</se:Name><se:FeatureTypeStyle><se:Rule><se:RasterSymbolizer><se:Opacity>0.7</se:Opacity><se:ColorMap><se:Categorize fallbackValue="#78c818"><se:LookupValue>Rasterdata</se:LookupValue>';

            for (var i = 0; i < (steps+1); i++) {
                xmlStylesheet += '<se:Value>'+colorArr[i]+'</se:Value><se:Threshold>'+rangeArr[i]+'</se:Threshold>';
            }

            xmlStylesheet += '<se:Value>'+colorArr[colorArr.length-1]+'</se:Value>';

            xmlStylesheet += '</se:Categorize></se:ColorMap></se:RasterSymbolizer></se:Rule></se:FeatureTypeStyle></UserStyle></NamedLayer></StyledLayerDescriptor>';

            return xmlStylesheet;
        }

        /* END SLD GENERATION */

        /* FUNCTIONS FOR CREATING LEGEND */
        // -------------------------------------------------------------------------------------------

        function createLegend(layer, id, minVal, maxVal, steps, startpoint, midpoint, endpoint) {
            // have to make a new legend for each layerswap, as layer positioning doesn't work without an iframe
            $('.olLegend').remove();

            var standard_range;

            if(/B12|B17|B16|B18|B13|B19|B15|B14|bioclim_12|bioclim_17|bioclim_16|bioclim_18|bioclim_13|bioclim_19|bioclim_15|bioclim_14/g.test(layer.name)){
                var standard_range = 'rainfall';
            } else if(/B11|B10|B02|B03|B01|B06|B07|B04|B05|B08|B09|bioclim_11|bioclim_10|bioclim_02|bioclim_03|bioclim_01|bioclim_06|bioclim_07|bioclim_04|bioclim_05|bioclim_08|bioclim_09/g.test(layer.name)){
                var standard_range = 'temperature';
            } else {
                var standard_range = 'soil';
            }
            // Get hex color range and map values
            var rangeArr = generateRangeArr(standard_range, minVal, maxVal, steps);
            var colorArr = generateColorArr(standard_range, steps, startpoint, midpoint, endpoint);
            // Build legend obj
            var legend = document.createElement('div');
            legend.className = 'olLegend';
            if (standard_range == 'rainfall'){
                legend.innerHTML = '<h5>Units (mm)</h5>';
                for (var i = 0; i < (rangeArr.length); i = i+1) {
                    if (i == (rangeArr.length-1)){
                        legend.innerHTML += '<label><i style="background:'+colorArr[i]+'"></i>&nbsp;'+Math.round(rangeArr[i])+'&nbsp;+</label>';
                    } else {
                        legend.innerHTML += '<label><i style="background:'+colorArr[i]+'"></i>&nbsp;'+Math.round(rangeArr[i])+'&nbsp;-&nbsp;'+Math.round(rangeArr[i+1])+'</label>';
                    }
                }
            } else if (standard_range == 'temperature') {
                legend.innerHTML = '<h5>Units (&deg;C)</h5>';
                for (var i = 0; i < (rangeArr.length); i = i+1) {
                    if (i == (rangeArr.length-1)){
                        legend.innerHTML += '<label><i style="background:'+colorArr[i]+'"></i>&nbsp;'+Math.round(rangeArr[i])+'&nbsp;+</label>';
                    } else {
                        legend.innerHTML += '<label><i style="background:'+colorArr[i]+'"></i>&nbsp;'+Math.round(rangeArr[i])+'&nbsp;-&nbsp;'+Math.round(rangeArr[i+1])+'</label>';
                    }
                }
            } else {
                legend.innerHTML = '<h5>Units ('+layer.units+')</h5>';
                for (var i = 0; i < (steps+1); i = i+5) {
                    if (i == (steps)){
                        legend.innerHTML += '<label><i style="background:'+colorArr[i]+'"></i>&nbsp;'+Math.round(rangeArr[i])+'&nbsp;+</label>';
                    } else {
                        legend.innerHTML += '<label><i style="background:'+colorArr[i]+'"></i>&nbsp;'+Math.round(rangeArr[i])+'&nbsp;-&nbsp;'+Math.round(rangeArr[i+5])+'</label>';
                    }
                }
            }
            // have to make a new legend for each layerswap, as layer positioning doesn't work without an iframe
            $('#'+id+' .olMapViewport').append(legend);
        }

        /* END LEGEND FUNCTION */

        // RENDER DATA LAYERS
        // -------------------------------------------------------------------------------------------
        function renderMap(uuid, url, id, type, visibleLayer){

            // CREATE BASE MAP
            // -------------------------------------------------------------------------------------------

            // NEED TO DESTROY ANY EXISTING MAP
            var container = $('#'+id);
            if (container.hasClass('olMap'))
                window.map.destroy();

            window.map;
            var mercator, geographic;
            var loading_panel;

            // DecLat, DecLng
            geographic = new OpenLayers.Projection("EPSG:4326");

            // Spherical Meters
            // The official name for the 900913 (google) projection
            mercator = new OpenLayers.Projection("EPSG:3857");

            // Australia Bounds
            australia_bounds = new OpenLayers.Bounds();
            australia_bounds.extend(new OpenLayers.LonLat(111,-10));
            australia_bounds.extend(new OpenLayers.LonLat(152,-44));
            australia_bounds = australia_bounds.transform(geographic, mercator);
            var zoom_bounds = australia_bounds;

            map = new OpenLayers.Map(id, {
                projection: mercator,
                eventListeners: {
                    "changelayer": mapLayerChanged
                }
            });

            loading_panel = new OpenLayers.Control.LoadingPanel();
            map.addControl(loading_panel);

            // Base layers
            var osm = new OpenLayers.Layer.OSM();
            var gmap = new OpenLayers.Layer.Google("Google Streets", {visibility: false});

            var ls = new OpenLayers.Control.LayerSwitcher();

            map.addLayers([osm, gmap]);
            map.addControl(ls);
            map.zoomToExtent(zoom_bounds);

            // Make the layer switcher open by default
            ls.maximizeControl();

            // Remove all the existing data layers, keep the baselayers and map.
            var dataLayers = map.getLayersBy('isBaseLayer', false);
            $.each(dataLayers, function(i){
                map.removeLayer(dataLayers[i]);
            });
            // Remove any existing legends.
            $('.olLegend').remove();

            var responseSuccess = false;

            $.getJSON(dmurl, {'datasetid': uuid}, function( data ) {
                responseSuccess = true;

                var myLayers = [];
                var filepath = data.file;

                // check for layers metadata, if none exists than the request is returning a single layer
                if ( $.isEmptyObject(data.layers) ) {
                    //single layer
                    var layerName;
                    if(data.description!=''){
                        layerName = data.description;
                    } else {
                        layerName = 'Data Overlay';
                    }
                    if (type !== 'occurence'){
                        var newLayer = new OpenLayers.Layer.WMS(
                            ''+layerName+'', // Layer Name
                            (location.protocol+'//'+window.location.hostname+'/_visualiser/api/wms/1/wms'),    // Layer URL
                            {
                                DATA_URL: data.vizurl,   // The data_url the user specified
                                SLD_BODY: generateSLD(data.filename, styleObj.minVal, styleObj.maxVal, styleObj.steps, styleObj.startpoint, styleObj.midpoint, styleObj.endpoint),
                                layers: "DEFAULT",
                                transparent: "true",
                                format: "image/png"
                            },
                            {
                                isBaseLayer: false
                            }
                        );
                        var legend = {}; legend.name = data.filename;
                        createLegend(legend, id, styleObj.minVal, styleObj.maxVal, styleObj.steps, styleObj.startpoint, styleObj.midpoint, styleObj.endpoint);
                    } else {
                        var newLayer = new OpenLayers.Layer.WMS(
                            ''+layerName+'', // Layer Name
                            (location.protocol+'//'+window.location.hostname+'/_visualiser/api/wms/1/wms'),    // Layer URL
                            {
                                DATA_URL: data.vizurl,   // The data_url the user specified
                                layers: "DEFAULT",
                                transparent: "true",
                                format: "image/png"
                            },
                            {
                                isBaseLayer: false
                            }
                        );
                    }
                    myLayers.push(newLayer);
                } else {
                    // multiple layers
                    var i = 0;
                    $.each( data.layers, function(namespace, layer){

                        // DETERMINE VISIBILITY, IF LAYER IS NOMINATED - RENDER IT, IF NOT - DEFAULT TO FIRST
                        i += 1;
                        var isVisible;
                        // if a layer is specified to render first, make it visible
                        if (typeof visibleLayer !== 'undefined') {
                            if (layer.filename == visibleLayer) {
                                isVisible = true;
                                var legend = {}; legend.name = layer.label;
                                createLegend(legend, id, layer.min, layer.max, 20);
                            } else {
                                isVisible = false;
                            }
                        } else {
                            if (i == 1){
                                isVisible = true;
                                var legend = {}; legend.name = layer.label;
                                createLegend(legend, id, layer.min, layer.max, 20);
                            } else {
                                isVisible = false;
                            }
                        }


                        var newLayer = new OpenLayers.Layer.WMS(
                            ''+layer.label+'', // Layer Name
                            (location.protocol+'//'+window.location.hostname+'/_visualiser/api/wms/1/wms'),    // Layer URL
                            {
                                DATA_URL: filepath+'#'+layer.filename,   // The data_url the user specified
                                SLD_BODY: generateSLD(layer.filename, layer.min, layer.max, 20),
                                layers: "DEFAULT",
                                transparent: "true",
                                format: "image/png"
                            },
                            {
                                isBaseLayer: false,
                                visibility: isVisible
                            }
                        );
                        myLayers.push(newLayer);
                    });
                }

                map.addLayers(myLayers);
            });
            setTimeout(function() {
                if (!responseSuccess) {
                    alert("Could not find metadata for layer. There may be a problem with the dataset. Try again later, or re-upload the dataset.");
                }
            }, 5000);

            // eventListener which only allows one overlay to displayed at a time
            function mapLayerChanged(event) {
                ls.dataLayers.forEach(function(dataLayer) {
                    if (dataLayer.layer.name == event.layer.name && event.layer.visibility) {
                        dataLayer.layer.visibility = true;
                        dataLayer.layer.display(true);
                        // create a legend if type requires it
                        if (type != 'occurence'){
                            createLegend(dataLayer.layer, id, styleObj.minVal, styleObj.maxVal, styleObj.steps, styleObj.startpoint, styleObj.midpoint, styleObj.endpoint);
                        }
                    }
                    else {
                        dataLayer.layer.visibility = false;
                        dataLayer.layer.display(false);
                    }
                });
            }
        }



    }
);
