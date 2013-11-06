// The build will inline common dependencies into this file.

// Third party dependencies, like jQuery, should go in the lib folder.

// Configure loading modules from the lib directory,
// except for 'js' ones, which are in a sibling
// directory.

var local = (window.location.hostname == 'localhost');

requirejs.config({
    baseUrl: (local ? 'lib' : '/++theme++org.bccvl.theme/lib'),          // load modules from the lib folder
    paths: {
        'js':        (local ? '../js' : '/++theme++org.bccvl.theme/js'),  // bccvl stuff, which starts with js/, is in the js folder
        'jquery':        'jquery/jquery-2.0.3',                           // Ima say 'jquery', u say jquery-x.y.z.js, dawg
        'jquery-xmlrpc': 'jquery-xmlrpc/jquery.xmlrpc.min',
        'bootstrap':     'bootstrap/js/bootstrap.min'
    },
    shim: {
        'bootstrap':     ['jquery'],  // bootstrap needs jquery
        'jquery-xmlrpc': ['jquery']
    }
});