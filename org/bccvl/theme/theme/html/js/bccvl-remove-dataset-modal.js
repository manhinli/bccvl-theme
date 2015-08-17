define(
    ['jquery', 'bootstrap', 'jquery-tablesorter', 'jquery-form'],
    function($) {

        return {
            init: function() {
                $(".bccvl-datasetlist").on("click", ".remove-dataset-btn", function(e) {
                    e.preventDefault();

                    var url = $(this).attr('href');

                    if (url.indexOf('#') == 0) {
                        $(url).modal('open');
                    } else {

                        // Show the modal
                        $('.modal').modal({
                            backdrop: 'static'
                        });

                        // Show the ajax spinner (while the form is loading)
                        $('.modal').html(renderSpinner());

                        $(".modal").load(url, function() {
                            // make sure there is no redirect when the form is submitted
                            // also hide and empty the modal
                            title = $(".modal-body h1").text();
                            var $form = $('.modal form');


                            $form.ajaxForm({
                                success: function() {
                                    // $('.modal').modal('hide');
                                    // $('.modal').empty();
                                    // $("#content-core").html('Reloading dataset list <img src="' + portal_url + '/++resource++bccvl/images/ajax-loader.gif"></img>');

                                    location.reload();
                                },
                                beforeSubmit: function() {
                                    // $(".modal button").prop('disabled', true);
                                    $(".modal .close").remove();
                                    $(".modal button").remove();

                                    $(".modal h1").text("Removing Dataset");
                                    $(".modal-body h1").html('Removing dataset &ldquo;' + title + '&rdquo;.');
                                    $(".modal .alert").remove();
                                    $("#content-core").html('Please Wait <img src="' + portal_url + '/++resource++bccvl/images/ajax-loader.gif"></img>');
                                }
                            });

                        });
                    }
                });

                // when the modal is shown
                $('.modal').on('show', function() {
                    $('.modal-body').scrollTop(0);
                    $("body").addClass("modal-open");
                });
                
                $('.modal').on('hidden', function() {
                    $("body").removeClass("modal-open");
                });
                
            }
        };

        function renderSpinner() {
            var html = '';
            html += '<div style="text-align: center;" id="ajax_loader">';
            html += '<img src="' + portal_url + '/++resource++bccvl/images/ajax-loader.gif"></img>';
            html += '<p>Loading. Please Wait</p>';
            html += '</div>';
            return html;
        }


    }
);
