//
// main JS for the new species trait model experiment page.
//
define(
    ['jquery', 'js/bccvl-visualiser', 'js/bccvl-wizard-tabs',
     'js/bccvl-stretch', 'js/bccvl-search',
     'js/bccvl-form-validator', 'jquery-tablesorter', 'jquery-arrayutils',
     'select2'],
    function($, viz, wiztabs, stretch, search, formvalidator) {

    $(function() {

        console.log('species trait model experiment page behaviour loaded.');

        // hook up stretchers
        stretch.init({ topPad: 60, bottomPad: 10 });

        // init the visualiser
        viz.init();

        // hook up the wizard buttons
        wiztabs.init();

        // hook up the search fields
        search.init();


        // -- hook up algo config -------------------------------
        // algorithm configuration blocks should be hidden and
        // revealed depending on whether the algorithm is
        // selected.

        var $algoCheckboxes = $('input[name="form.widgets.algorithm"]');
        $.each($algoCheckboxes, function(index, checkbox) {
            var $checkbox = $(checkbox);

            // when the checkbox changes, update the config block's visibility
            $checkbox.change( function(evt) {

                // Hide all previously selected config blocks
                $.each($('div.accordion-group:visible'), function(i1, div) {
                    $accordionGroup = $(div);
                    var $accordionToggle = $accordionGroup.find('.accordion-toggle');
                    var $accordionBody = $accordionGroup.find('.accordion-body');

                    // Collapse if necessary
                    if ($accordionBody.hasClass('in')) {
                        $accordionBody.collapse('hide');
                        $accordionToggle.addClass('collapsed');
                        $accordionBody.removeClass('in');
                    }

                    // This is to avoid parsley thinking that there are validation errors on algo conifg items that have been
                    // deselected - so we put the default value back into the text field when deselected.
                    $.each($accordionGroup.find('input[type="number"], input[type="text"]'), function(i2, c) {
                        $(c).val($(c).attr('data-default'));
                        $(c).parsley().validate();
                    });

                    // Finally - hide
                    $accordionGroup.hide(250);
                });

                // Now show the one that was selected
                $('.accordion-group[data-function="' + $(this).attr('value') + '"]').show(250);
            });

            // start with all algo config groups hidden.
            $('.accordion-group[data-function="' + $(this).attr('value') + '"]').hide(0);
        });

    });
});
