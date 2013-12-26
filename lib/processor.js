var fs = require('fs'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    http = require('http'),
    https = require('https'),

    importedBy = {}, // {filePath: byFilePath}
    importing = {}, // {filePath: filePath[]}
    files = [];


module.exports = {

    /**
     * Processes input file looking for nested imports.
     * @param filePath
     * @param root
     * @param tmpPath
     * @param callback
     * @param importedBy
     */
    process: function (filePath, root, tmpPath, callback, importedBy) {

        var self = this,
            lines,
            importModules,
            match,
            module,
            importPath,
            outputPath,
            onSourceFileReady,
            written = false,
            numChildrenLeft = 0,
            checkDone,
            i;

        console.log('->', filePath);
        if (!importedBy) {
            // First run.
            files = [];
        }

        // Read the file.
        fs.readFile(filePath, function (err, data) {
            if (err) {
                throw err;
            }

            checkDone = function () {
                if (written && numChildrenLeft === 0) {
                    console.log('+  Processed', filePath);
                    if (typeof callback === 'function') {
                        callback(files);
                    }
                }
            };

            // Split the file into lines.
            lines = data.toString().split('\n');

            // Find import modules.
            for (i = 0; i < lines.length; ++i) {
                match = /import\$\('(.+)'\)/g.exec(lines[i]);
                if (match) {
                    if (match.length > 1) {

                        numChildrenLeft++;

                        // Comment-out the import line in the source file.
                        lines[i] = '// p.js ' + lines[i];

                        importPath = self.resolveImportPath(match[1], root);
                        console.log('\timport$', match[1], '(' + importPath + ')');

                        onSourceFileReady = function (importPath, root, tmpPath) {
                            // Process this file now looking for nested imports.
                            self.process(importPath, root, tmpPath, function () {
                                // Processing complete.
                                numChildrenLeft--;
                                checkDone();
                            }, filePath);
                        };

                        if (importPath.indexOf('http') === -1) {
                            // This is a local file.
                            onSourceFileReady(importPath, root, tmpPath);
                        } else {
                            // This is a remote file, download it first.
                            (importPath.indexOf('https') === -1 ? http : https).get(importPath, (function (importPath) {
                                return function (res) {
                                    outputPath = path.join(tmpPath, importPath.replace('https://', '__remote__').replace('http://', '__remote__').replace(/\//g, '_'));
                                    res.pipe(fs.createWriteStream(outputPath));
                                    res.on('end', function () {
                                        importPath = outputPath;
                                        onSourceFileReady(importPath, root, tmpPath);
                                    });
                                };
                            }(importPath)));
                        }

                    } else {
                        throw new Error('Invalid import$ directive: ' + lines[i] + ' (' + filePath + ':' + i + ')');
                    }
                }
            }

            // Write the modified source file to temp directory.
            mkdirp(path.join(tmpPath, filePath.indexOf('/') === -1 ? filePath : filePath.substring(0, filePath.lastIndexOf('/'))), function (err) {
                if (err) {
                    throw err;
                }

                fs.writeFile(path.join(tmpPath, filePath), lines.join('\n'), function (err) {
                    if (err) {
                        throw err;
                    }

                    written = true;

                    if (importedBy) {
                        files.splice(files.indexOf(path.join(tmpPath, importedBy)), 0, path.join(tmpPath, filePath));
                    } else {
                        files.push(path.join(tmpPath, filePath));
                    }

                    checkDone();
                });
            });

        });

    },

    /**
     * Resolves import path given module name.
     * @param moduleName
     * @param root
     * @returns str
     */
    resolveImportPath: function (moduleName, root) {
        var pathName = moduleName;

        if (moduleName.indexOf('.js') === -1) {
            // Class or interface
            pathName = pathName.replace(/\./g, '/') + '.js';
        }

        if (moduleName.indexOf('http') === -1) {
            // Local, prepend root
            pathName = path.join(root, pathName);
        }

        return pathName;
    }

};