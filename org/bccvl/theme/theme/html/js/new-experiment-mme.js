
//
// main JS for the new migratory experiment page.
//
define(
    ['jquery', 'bccvl-visualiser-common',
     'bccvl-visualiser-map', 'bccvl-wizard-tabs',
     'bccvl-form-jquery-validate',
     'bccvl-form-popover', 'bbq', 'faceted_view.js',
     'bccvl-widgets', 'openlayers3', 'new-experiment-common', 'bccvl-raven'],
    function($, vizcommon, vizmap, wiztabs, formvalidator,
             popover, bbq, faceted, bccvl, ol, expcommon) {

        // ==============================================================
        $(function() {
            wiztabs.init();         // hook up the wizard buttons

            // setup dataset select widgets
            new bccvl.SelectDict("species_occurrence_collections");
            new bccvl.SelectDict("environmental_datasets");

            // -- hook up algo config -------------------------------
            expcommon.init_algorithm_selector('input[name="form.widgets.function:list"]', false)
            // -- region selection ---------------------------------
            expcommon.init_region_selector()

            var constraints = expcommon.init_constraints_map('.constraints-map', $('a[href="#tab-geo"]'), 'form-widgets-modelling_region')
            
            // bind widgets to the constraint map
            $('.bccvl-new-mme').on('widgetChanged', function(e){
                // FIXME: the find is too generic (in case we add bboxes everywhere)
                expcommon.update_constraints_map(constraints, $('body').find('input[data-bbox]'))
            })
            
            
            $('.bccvl-new-mme').on('click', '#add_subset_button', function(e){
               var subset = $('#tab-enviro fieldset .mme-subset').last().clone(); 
               subset.find('input').val('');
               $(e.target).before(subset);
            });
            
            $('.bccvl-new-mme').on('click', '.remove-subset', function(e){
                if( $('#tab-enviro fieldset').find('.mme-subset').length > 1 ){
                    $(e.target).parents('.mme-subset').remove(); 
                } else {
                    alert('You must have at least one subset defined for this experiment type.');
                }
                
            });
                        
        });

        // ==============================================================
    }
);
