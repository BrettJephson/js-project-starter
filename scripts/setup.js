const fs = require("fs");
const path = require("path");
const async = require("async");

const DEFAULT_OPTIONS = "universal";

/**
 * Config options.
 */
const options = {
    universal: {
        files: [ "src/app/README.md", "test/app/.keep", "src/server/README.md", "test/server/.keep" ]
    },
    server: {
        files: [ "src/server/README.md", "test/server/.keep" ]
    },
    client: {
        files: [ "src/app/README.md", "test/app/.keep" ]
    }
};

/**
 * Maps content of a file to its path.
 */
const content = {
    "src/app/README.md": "** Add clientside app content **",
    "src/server/README.md": "** Add serverside app content **"
};

function init() {
    createSrcScaffolding(getScaffoldingOptionsFromArgs(process.argv));
}

/**
 * Gets an options object based on args present when this script is called.
 * @param {Array} args arguments included when this script was called.
 * @returns {Object} options.
 */
function getScaffoldingOptionsFromArgs(args) {
    var result;
    var optionsKeys = Object.keys(options);
    result = options[args.find(arg => {
        var testKey = arg.replace("-", "");
        return optionsKeys.includes(testKey);
    })] || options[DEFAULT_OPTIONS];
    return result;
}

/**
 * Creates a file/directory structure for source code within this project.
 * @param {Object} options Configuration options.
 */
function createSrcScaffolding(options) {
    async.each(options.files, createAbsentFile);
}

/**
 * Writes to a file location but only if the file does not exist.
 * @param {string} file Where to create file if it is absent.
 * @param {Function} done A callback to trigger upon completion.
 */
function createAbsentFile(file, done) {
    fs.open(file, "wx", (err, fileData) => {
        if (err) {
            return handleFileOpenErrors(err, file, done);
        }
        fs.writeFile(file, content[file], err => handleWriteFile(err, file, done));
    });
}

/**
 * @param {Object} err Error details.
 * @param {string} file
 * @param {Function} done A callback to trigger upon completion.
 */
function handleFileOpenErrors(err, file, done) {
    if (err.code === "EEXIST") { // file already exists so moving on.
        //done();
        return;
    }
    if (err.code === "ENOENT") {
        makeDirectory(path.dirname(file), () => {
            fs.writeFile(file, content[file], err => handleWriteFile(err, file, done));
        });
        return;
    }
    throw err;
}

/**
 * Pass it a directory path and it will make the directories in the path if they are absent.
 * @param {string} directory The directory path to create.
 * @param {Function} allDone Callback to trigger upon completion of the sequence.
 */
function makeDirectory(directory, allDone) {
    async.each(getDirectorySequence(directory), (directory, done) => {
        console.log("making... " + directory);
        fs.mkdir(directory, err => handleDirectoryMade(err, done));
    }, err => handleComplete(err, allDone, "makeDirectory"));
}

/**
 * Creates an array of directories from a directory path.
 * @param {string} directory The directory path.
 * @returns {Array} A sequence of paths derived from each step in the directory path.
 * @example "src/server" becomes ["src", "src/server"]
 * @example "src/server/config" becomes ["src", "src/server", "src/server/config"]
 */
function getDirectorySequence(directory) {
    var previous = '';
    return directory.split(path.sep).map(dirName => {
        var result = previous + dirName;
        previous = result + path.sep;
        return result;
    });
}

/**
 * Async completion handler for makeDirectory.
 * @param {Object} err Error details.
 * @param {Function} done A callback to trigger upon completion.
 */
function handleDirectoryMade(err, done) {
    if (err) {
        if (err.code !== "EEXIST") {
            showError(err, "makeDirectory");
        }
    }
    done();
}

/**
 * Async completion handler for creating a file.
 * @param {Object} err Error details.
 * @param {string} file The path to created file.
 * @param {Function} done A callback to trigger upon completion.
 */
function handleWriteFile(err, file, done) {
    if (err) {
        showError(err, "createAbsentFile");
    }
    else {
        console.log("File " + file + " created");
    }
    done();
}

/**
 * Generic async completion handler.
 * @param {Object} err Error details.
 * @param {Function} done A callback to trigger upon completion.
 * @param {string} callerName An identifier for the caller being handled.
 */
function handleComplete(err, done, callerName) {
    if(err) {
        showError(err, callerName);
    }
    done();
}

/**
 * Show errors in console.
 * @param {Object} err Error details.
 * @param {string} callerName An identifier for the caller of this error view.
 */
function showError(err, callerName = "function") {
    console.error(callerName + " :: " + err);
}

init();