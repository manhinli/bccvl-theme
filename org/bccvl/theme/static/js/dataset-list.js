
//
// main JS for the dataset list page.
//
define(     ['jquery',  'js/bccvl-stretch', 'js/bccvl-visualiser', 'bootstrap', 'jquery-tablesorter'],
  function(   $      ,   stretch          ,  viz ) {
  // ==============================================================
    $(function() {

      viz.init();
      stretch.init({ topPad: 60, bottomPad: 10 });

      $('.bccvl-datasetstable').tablesorter({
        headers: { 
            2: { sorter: false } // should be link column
        },
            sortList: [[0,1]]
      });

      if ($('.dataset-import').length > 0) {
        pollImportStatus();
        var pollID = window.setInterval(pollImportStatus, 5000);
      }


    });

    function pollImportStatus(pollID) {
      var $datasets = $('.dataset-import');

      $datasets.each(function (){
        var dataset = $(this)
        var dataUrl = dataset.attr('data-url');

        var jmUrl = dataUrl + '/jm/getJobStatus'
        
        $.ajax({
          url: jmUrl,
          success: function (data) {

            var completed = false;

            data.forEach(function(job){
              var jobName = job[0];
              var jobStatus = job[1];

              if (jobStatus == 'Running') {
                completed = false;
                dataset.addClass('bccvl-small-spinner');
              }

              if (jobStatus == 'Completed' || jobStatus == 'Queued'){
                completed = true;
              }
            })

            if (completed) {
              dataset.removeClass('bccvl-small-spinner');
              dataset.removeClass('dataset-import')
            
              generateControlButtons(dataset);             
            }
          }
        });
      })
    }

    function generateControlButtons(dataset) {
      var $controlGroup = dataset.parent();
      var $tableLabel = $controlGroup.parent().find('.bccvl-table-label');
      var dataUrl = dataset.attr('data-url');
      var dmUrl = dataUrl + '/dm/getMetadata'

      $.ajax({
        url: dmUrl,
        async: false,
        success: function (data) {
          var downloadButtonHTML = '<a href="' + data.file + '"><i class="icon-circle-arrow-down" title="download"></i></a>';
          if (data.mimetype == 'text/csv') {
            var visualiseButtonHTML = '<a href="#" class="bccvl-occurrence-viz" data-viz-id="' + data.vizurl + '"><i class="icon-eye-open icon-link" title="preview"></i></a>';
          }
          else {
            var visualiseButtonHTML = '<a href="#" class="bccvl-auto-viz" data-viz-id="' + data.vizurl + '"><i class="icon-eye-open icon-link" title="preview"></i></a>';
          }
          var descriptionHTML = '<p>' + data.description + '</p>';
          $controlGroup.append(downloadButtonHTML);
          $controlGroup.append(visualiseButtonHTML);
          $tableLabel.append(descriptionHTML);
          viz.init();
        }
      });
    }

  // ==============================================================
  }
);