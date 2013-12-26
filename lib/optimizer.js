var UglifyJS = require('uglify-js');


/**
 * optimizer
 * @type {{optimize: Function}}
 */
module.exports = {

    optimize: function (files, minify, sourceMap, root) {
        var output,
            map;

        output = UglifyJS.minify(files, {
            outSourceMap: 'out.js.map',
            sourceRoot: root,
            SourceMap: {
                root: 'abcde'
            }
        });

        return output;
    }

};