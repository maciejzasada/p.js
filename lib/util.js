var fs = require('fs');


/**
 * util
 * @type {{deleteFolderRecursive: Function}}
 */
module.exports = {

    /**
     * Deletes a directory including all its contents.
     * @param path
     */
    deleteFolderRecursive: function (path) {
        var self = this;
        if (fs.existsSync(path)) {
            fs.readdirSync(path).forEach(function(file){
                var curPath = path + '/' + file;
                if (fs.lstatSync(curPath).isDirectory()) {
                    self.deleteFolderRecursive(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    }

};