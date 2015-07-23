
// JS code to initialise the visualiser map

define(['jquery', 'js/bccvl-preview-layout', 'openlayers3', 'ol3-layerswitcher', 'js/bccvl-visualiser-common', 'jquery-xmlrpc'],
    function( $, preview, ol, layerswitcher, vizcommon  ) {

        // Bring in generic visualiser error handling of timeouts
        vizcommon.commonAjaxSetup();

        // REGISTER CLICK EVENT
        // -------------------------------------------------------------------------------------------

        $(function () {
            renderBase($('.bccvl-preview-pane:visible').attr('id'));
            createLegendBox($('.bccvl-preview-pane:visible').attr('id'));
        });

        $('body').on('click', 'a.bccvl-compare-viz', function(event){
            event.preventDefault();
            var viztype = $(this).data('viz-type') || 'auto';
            addNewLayer($(this).data('uuid'),$(this).data('viz-id'), $('.bccvl-preview-pane:visible').attr('id'), viztype, $(this).data('layername'));
            $(this).removeClass('bccvl-compare-viz').addClass('bccvl-remove-viz');
            $(this).find('i').removeClass('icon-eye-open').addClass('icon-eye-close');
        });

        $('body').on('click', 'a.bccvl-remove-viz', function(event){
            event.preventDefault();

            var layerTitle = $(this).data('layername');

            visLayers.getLayers().forEach(function (lyr) {
                if ( lyr.get('title') == layerTitle){
                    visLayers.getLayers().remove(lyr);
                }          
            });

            $('.olLegend label[data-uuid="'+$(this).data('uuid')+'"]').remove();
            $(this).removeClass('bccvl-remove-viz').addClass('bccvl-compare-viz');
            $(this).find('i').removeClass('icon-eye-close').addClass('icon-eye-open');
        });

        /* Global configuration */
        // ----------------------------------------------------------------
        // visualiser base url
        var visualiserBaseUrl = window.bccvl.config.visualiser.baseUrl;
        var visualiserWMS = visualiserBaseUrl + 'api/wms/1/wms';
        // dataset manager getMetadata endpoint url
        var dmurl = portal_url + '/dm/getMetadata';

        var map;
        var visLayers;
        // Australia Bounds
        var aus_SW = ol.proj.transform([110, -44], 'EPSG:4326', 'EPSG:3857');
        var aus_NE = ol.proj.transform([157, -10.4], 'EPSG:4326', 'EPSG:3857');
        var australia_bounds = new ol.extent.boundingExtent([aus_SW, aus_NE]);

        var layer_vocab = {};
        $.getJSON(portal_url + "/dm/getVocabulary", {name: 'layer_source'}, function(data, status, xhr) {
            $.each(data, function(index, value) {
                layer_vocab[value.token] = value.title;
            });
        });
        
        var styleArray = [
            { "minVal": 0, "maxVal": 1, "steps": 20,
              "startpoint": {r:255,g:255,b:255},
              "midpoint": {r:139,g:208,b:195},
              "endpoint": {r:18,g:157,b:133}
            },
            { "minVal": 0,"maxVal" :1, "steps": 20,
              "startpoint": {r:255,g:255,b:255},
              "midpoint": {r:233,g:170,b:129},
              "endpoint": {r:210,g:96,b:19}
            },
            { "minVal": 0, "maxVal": 1, "steps": 20,
              "startpoint": {r:255,g:255,b:255},
              "midpoint": {r:255,g:172,b:236},
              "endpoint": {r:247,g:108,b:215}
            },
            { "minVal": 0, "maxVal": 1, "steps": 20,
              "startpoint": {r:255,g:255,b:255},
              "midpoint": {r:248,g:225,b:135},
              "endpoint": {r:241,g:196,b:15}
            },
            { "minVal": 0, "maxVal": 1, "steps": 20,
              "startpoint": {r:255,g:255,b:255},
              "midpoint": {r:198,g:162,b:214},
              "endpoint": {r:143,g:76,b:176}
            },
            { "minVal": 0, "maxVal": 1, "steps": 20,
              "startpoint": {r:255,g:255,b:255},
              "midpoint": {r:154,g:164,b:175},
              "endpoint": {r:48,g:71,b:94}
            },  
            { "minVal": 0, "maxVal": 1, "steps": 20,
              "startpoint": {r:255,g:255,b:255},
              "midpoint": {r:151,g:229,b:184},
              "endpoint": {r:45,g:195,b:108}
            },
            { "minVal": 0, "maxVal": 1, "steps": 20,
              "startpoint": {r:255,g:255,b:255},
              "midpoint": {r:154,g:203,b:237},
              "endpoint": {r:47,g:150,b:220}
            },
            { "minVal": 0, "maxVal": 1, "steps": 20,
              "startpoint": {r:255,g:255,b:255},
              "midpoint": {r:223,g:156,b:149},
              "endpoint": {r:192,g:57,b:43}
            },
            { "minVal": 0, "maxVal": 1, "steps": 20,
              "startpoint": {r:255,g:255,b:255},
              "midpoint": {r:154,g:154,b:154},
              "endpoint":{r:47,g:47,b:47}
            }
        ];

        function createLegendBox(id){
            // have to make a new legend for each layerswap, as layer positioning doesn't work without an iframe
            $('.olLegend').remove();
            // Build legend obj
            var legend = document.createElement('div');
            legend.className = 'olLegend';
            $('#'+id+' .ol-viewport').append(legend);
        }

        function addLayerLegend(layername, color, uuid){  
            if (color == 'occurrence'){
                $('.olLegend').append('<label data-uuid="'+uuid+'" style="padding-top:1px;"><i style="color:red;text-align:center;margin-top:3px;" class="fa fa-circle"></i>&nbsp;'+layername+'</label>');
                $('.olLegend').show(0);
            } else {
                var colorRGB = 'rgba('+color.r+','+color.g+','+color.b+',1)';
                $('.olLegend').append('<label data-uuid="'+uuid+'"><i style="background:'+colorRGB+'"></i>&nbsp;'+layername+'</label>');
                $('.olLegend').show(0);
            }
        }

        // RENDER EMPTY MAP
        function renderBase(id){
            // CREATE BASE MAP
            // -------------------------------------------------------------------------------------------

            // NEED TO DESTROY ANY EXISTING MAP
            var container = $('#'+id);
            if (container.hasClass('active')) {
                container.empty();
                map = null;
            }


            // destroy any html from images or text files
            container.html('');

            visLayers = new ol.layer.Group({
                title: 'Layers',
                layers: []
            });

            map = new ol.Map({
                target: id,
                layers: [
                    new ol.layer.Group({
                        'title': 'Base maps',
                        layers: [
                            new ol.layer.Tile({
                                title: 'OSM',
                                type: 'base',
                                preload: 10,
                                visible: true,
                                source: new ol.source.OSM()
                            })
                            // new ol.layer.Tile({
                            //     title: 'Satellite',
                            //     type: 'base',
                            //     visible: false,
                            //     source: new ol.source.MapQuest({layer: 'sat'})
                            // })
                        ]
                    }),
                    visLayers
                ],
                view: new ol.View({
                  center: ol.proj.transform([133, -27], 'EPSG:4326', 'EPSG:3857'),
                  zoom: 4
                })
            });

            map.getView().fit(australia_bounds, map.getSize());

            var fullScreenToggle = new ol.control.FullScreen();
            map.addControl(fullScreenToggle);
            // remove crappy unicode icon so fontawesome can get in
            $('#'+id+' button.ol-full-screen-false').html('');

            container.addClass('active');

            // hook up exportAsImage
            $('#'+id+' .ol-viewport').append('<a class="export-map" download="map.png" href=""><i class="fa fa-save"></i> Image</a>');
            $('#'+id+' a.export-map').click(
                { map: map,
                  mapTitle: 'Overlay'
                }, vizcommon.exportAsImage);
        }

        // RENDER DATA LAYERS
        // -------------------------------------------------------------------------------------------
        function addNewLayer(uuid, url, id, type, layerName){

            var numLayers = visLayers.getLayers().getLength();

            if (numLayers > 9) {
                alert('This interface supports a maximum of ten layers, please remove a layer before adding another.');
                return;
            } 

            $.xmlrpc({
                url: dmurl,
                params: {'datasetid': uuid},
                success: function(data, status, jqXHR) {
                    // xmlrpc returns an array of results
                    data = data[0];

                    // check for layers metadata, if none exists then the request is returning a data like a csv file
                    if ($.isEmptyObject(data.layers)) {
                        // occurrence data 
                        
                        // TODO: use data.title (needs to be populated)
                        layerName = layerName || data.filename || 'Data Overlay';
                        var newLayer = vizcommon.createLayer(data, data, layerName, 'wms-occurrence', true);
                        addLayerLegend(layerName, 'occurrence', uuid);

                        newLayer.setOpacity(1);
                        // add layer to layer group
                        // TODO: should occurrence be always on top? (insert at 0)
                        visLayers.getLayers().push(newLayer);

                    } else {
                        // raster data
                        $.each( data.layers, function(layerid, layer){

                            layerName = layer_vocab[layer.layer] || layer.layer || layer.filename;
                            // TODO: double check ... we should only have probability rasters here
                            var max = vizcommon.roundUpToNearestMagnitude(layer.max);
                            var styleObj = $.extend({}, styleArray[numLayers]);
                            styleObj.maxVal = max;
                            var newLayer = vizcommon.createLayer(data, layer, layerName, 'wms', true, styleObj);

                            addLayerLegend(layerName, styleArray[numLayers].endpoint, uuid);
                            
                            // add layer to layer group
                            visLayers.getLayers().push(newLayer);

                        });
                    }
                    map.render();
                }
            });
        }
    }

);
