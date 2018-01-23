
//
// main JS for the new sdm experiment page.
//
define(
    ['jquery', 'bccvl-visualiser-common',
     'bccvl-visualiser-map', 'bccvl-wizard-tabs',
     'bccvl-form-jquery-validate',
     'bccvl-form-popover', 'bbq', 'faceted_view',
     'bccvl-widgets', 'openlayers3', 'new-experiment-common', 'bccvl-raven'],
    function($, vizcommon, vizmap, wiztabs, formvalidator,
             popover, bbq, faceted, bccvl, ol, expcommon) {

        // ==============================================================
        $(function() {

            wiztabs.init();         // hook up the wizard buttons

            // setup dataset select widgets
            new bccvl.SelectDict("species_occurrence_collections");
            new bccvl.SelectList("species_absence_collection");
            new bccvl.SelectDict("environmental_datasets");

            // -- hook up algo config -------------------------------
            expcommon.init_algorithm_selector('input[name="form.widgets.function:list"]', false)
            // -- region selection ---------------------------------
            expcommon.init_region_selector()
            // -- psuedo absence controls ---------------------------------
            expcommon.init_pa_controls()

            // -- set up absence radio buttons
            $('#have_absence').click(function(){
                $('.bccvl-noabsence-dataset').slideUp(100);
                $('.bccvl-absencestable').slideDown(100);
                update_pa_strategy('none');
            });
            $('#no_absence').click(function(){
                $('.bccvl-absencestable').slideUp(100);
                $('.bccvl-noabsence-dataset').slideDown(100);
                update_pa_strategy('random');
            });

            // Check if there is a pseudo absence dataset.
            if ($('input[name="form.widgets.species_absence_collection:list"]').length > 0) {
                $('#have_absence').prop('checked', true);
                $('.bccvl-noabsence-dataset').slideUp(100);
                $('.bccvl-absencestable').slideDown(100);
            } else {
                $('#no_absence').prop('checked', true);
                $('.bccvl-absencestable').slideUp(100);
                $('.bccvl-noabsence-dataset').slideDown(100);
            }
            
            // Change default PA settings for algorithm based on user PA selection
            $('.bccvl-new-sdm').on('change', '#have_absence', function(){
                if($(this).prop('checked')){
                    $('.paramgroup').find('select').each(function(){
                      var sel = $(this);
                      if(sel.attr('id').indexOf('pa-strategy') > -1){
                          sel.val('none');
                      }
                    })
                }
            });
                    
            $('.bccvl-new-sdm').on('change', '#no_absence', function(){
                if($(this).prop('checked')){
                    $('.paramgroup').find('select').each(function(){
                      var sel = $(this);
                      if(sel.attr('id').indexOf('pa-strategy') > -1){
                          sel.val('random');
                      }
                    })
                }
            });


            var constraints = expcommon.init_constraints_map('.constraints-map', $('a[href="#tab-geo"]'), 'form-widgets-modelling_region')

            // bind widgets to the constraint map
            $('.bccvl-new-sdm').on('widgetChanged', function(e){
                // FIXME: the find is too generic (in case we add bboxes everywhere)

                expcommon.update_constraints_map(constraints, $('body').find('input[data-bbox]'));
                // always default to convex hull after a selection.
                $("#use_convex_hull").prop('checked', true);
            })
            
            if(typeof uuid !== "undefined"){
                 $('.bccvl-new-sdm, .bccvl-jqueryvalidate').trigger('widgetChanged');
                 $('.bccvl-jqueryvalidate').valid();
                 
                 // -- hook up algo config -------------------------------
                expcommon.init_algorithm_selector('input[name="form.widgets.functions:list"]', true)
                // -- region selection ---------------------------------
                expcommon.init_region_selector()
                // -- psuedo absence controls ---------------------------------
                expcommon.init_pa_controls()
            }
        });

        // ==============================================================
        function update_pa_strategy(strategyname) {
            var $algoCheckboxes = $('input[name="form.widgets.functions:list"]');
            $.each($algoCheckboxes, function(index, checkbox) {
                var $checkbox = $(checkbox);
                if ($checkbox.prop('checked')) {
                    // Set new option
                    $('select[name="form.widgets.' + $checkbox.attr('value') + '.pa_strategy:list"]').val(strategyname);
                }
            });
        }

    }
);
