//
// main JS for the new ensemble experiment page.
//
define(
    ['jquery', 'js/bccvl-wizard-tabs', 'js/bccvl-form-jquery-validate',
     'jquery-tablesorter', 'jquery-arrayutils',
     'bbq', 'faceted_view.js', 'js/bccvl-widgets'],
    function($, wiztabs, formvalidator, tablesorter, arryutils,
             bbq, faceted, bccvl) {

        $(function() {

            console.log('ensemble experiment page behaviour loaded.');

            // hook up the wizard buttons
            wiztabs.init();

            var datasets = new bccvl.SelectDict("datasets");
            // Let Ensemble use facet variants based on experiment type select box
            var $experiment_type = $('#form-widgets-experiment_type');
            datasets.modal.settings.remote = datasets.$modaltrigger.attr("href") + '_' + $experiment_type.val();
            
            $experiment_type
                .on('change', function(event, par1, par2) {
                    // update settings with new search parameters
                    var exptype = $(this).val();
                    
                    datasets.modal.settings.remote = datasets.$modaltrigger.attr("href") + '_' + exptype;
                    
                    // clear dependent widget
            
                    datasets.$widget.empty();
                });

        });
    }
);
