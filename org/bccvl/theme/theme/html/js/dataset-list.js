
//
// main JS for the dataset list page.
//
define(     ['jquery', 'js/bccvl-visualiser', 'js/bccvl-visualiser-map', 'js/bccvl-sharing-modal', 'js/layer-edit-modal', 'OpenLayers', 'bootstrap', 'jquery-tablesorter', 'jquery-form', 'jquery-timer'],
  function(   $      ,  viz                 ,  vizmap                 ,  sharing                ,  editmodal) {

  // ==============================================================
  $(function() {

        viz.init();
        sharing.init();
        editmodal.init();

        $('.bccvl-datasetstable').tablesorter({
            headers: {
                2: { sorter: false } // should be link column
            },
            sortList: [[0,1]]
        });

        // Identify datasets that are currently importing.
        // These are the spinner icons.
        $.each($('i.dataset-import'), function(i, spinner) {
            var datasetURL = $(spinner).attr('data-url');
            var pollURL = datasetURL + '/jm/getJobStatus';
            var completeURL = datasetURL + '/@@datasets_list_item';

            // Start a timer that does the polling
            var timer = $.timer(function() {
                $.ajax({
                    url: pollURL,
                    success: function(status) {
                        if (status == 'COMPLETED' || status == 'FAILED') {
                            timer.stop();
                            // The import is complete, now render the row.
                            renderDatasetRow(completeURL, $(spinner).parents('.datasets-list-entry'));
                        }
                    }
                });
            });
            timer.set({
                time: 5000,
                autostart: true
            });
        });


        // Dateset entry dropdown functions
        $('body').on('click', '.dropdown-button', function(event){
            event.preventDefault();
            var el = $(this);
            if (el.hasClass('open')){
                $('div.preview-dropdown:visible').slideUp(300);
                el.find('i').removeClass('icon-chevron-up').addClass('icon-chevron-down');
                el.removeClass('open');
            } else {
                if($('div.preview-dropdown:visible').length != 0){
                    $('div.preview-dropdown:visible').slideUp(300, function(){
                        el.prev('div.preview-dropdown').slideDown(300, function(){
                            $('html,body').animate({
                              scrollTop: (el.parents('div.datasets-list-entry').offset().top - 10)
                            }, 1000); 
                        });
                    });
                } else {
                    el.prev('div.preview-dropdown').slideDown(300, function(){
                        $('html,body').animate({
                          scrollTop: (el.parents('div.datasets-list-entry').offset().top - 10)
                        }, 1000); 
                    });
                }
                el.find('i').removeClass('icon-chevron-down').addClass('icon-chevron-up');
                el.addClass('open')
            } 
            
                       
            
        });

        // Request metadata for datasets
        // These buttons have a fallback to open their request in a new tab (if JS is disabled)
        $('body').on('click', '.dataset-info-btn', function(event){
             event.preventDefault();
             var requestUrl = $(this).attr('href');
             $('body').append('<div class="modal hide fade" id="dataset-meta-modal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true"><div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button><h3 id="myModalLabel">Dataset Metadata</h3></div><div class="modal-body"><span class="loading-gif"></span></div><div class="modal-footer"><button class="btn" data-dismiss="modal" aria-hidden="true">Close</button></div></div>');
             $.ajax(requestUrl)
                .done(function(data){
                    console.log(data);
                    $('#dataset-meta-modal .modal-body').fadeOut(300, function(){
                        $('#dataset-meta-modal .modal-body').html(data);
                        $('#dataset-meta-modal .modal-body').fadeIn(300);
                    });
                })
                .fail(function() {
                    $('#dataset-meta-modal .modal-body').fadeOut(300, function(){
                        $('#dataset-meta-modal .modal-body').html('<h1>No metadata is available for this dataset at this time.</h1>');
                        $('#dataset-meta-modal .modal-body').fadeIn(300);
                    });
                });
             $('#dataset-meta-modal').modal();
             $('#dataset-meta-modal').on('hidden', function(){
                $('#dataset-meta-modal .modal-body').html('<span class="loading-gif"></span>');
             });
        });

    });

    function renderDatasetRow(completeURL, $tr) {
        $.ajax({
            url: completeURL,
            success: function(rowHTML) {
                $tr.replaceWith($(rowHTML));
                // Wire up visualiser and sharing
                viz.init();
                sharing.init();
            }
        });
    };


});
