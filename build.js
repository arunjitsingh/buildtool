#! /usr/local/bin/node
/**
 * @fileoverview The builder and linker for JS files.
 * @author Arunjit Singh <arunjit@me.com>
 */

/**
 * Dependencies.
 */
var fs = require('fs'),
  path = require('path'),
  util = require('util');

/**
 * A list of configurable properties.
 * @type {Array}
 * @const
 */
var CONFIG_PROPERTIES = ['root'];

/**
 * The default configuration.
 * @type {Object}
 * @const
 */
var DEFAULT_CONFIG = {
  root: '~/Developer/src',
};

/**
 * The currently loaded configuration.
 * @see DEFAULT_CONFIG
 * @type {Object}
 */
var config = null;

/**
 * Load a configuration from a given source or "~/.buildconfig". This file must
 * be valid JSON, or else the default config will be used.
 * @param {String=} opt_source The source path to load the configuration from.
 */
function loadConfig(opt_source) {
  opt_source = opt_source || '~/.buildconfig';
  try {
    config = JSON.parse(fs.readFileSync(opt_source));
    CONFIG_PROPERTIES.forEach(function(p) {
      if (!config.hasOwnProperty(p)) {
        throw Error;
      }
    });
  } catch (e) {
    console.log('WARNING! ' + opt_source + ' not parsed. Using defaults.');
    config = DEFAULT_CONFIG;
  }
  if ((/^~/).test(config.root)) {
    config.root = path.join(process.env.HOME, config.root.substring(1));
  }
}

/**
 * Handle an error.
 * TODO(arunjit): Make this better.
 * @param {Error} err The error.
 */
function handleError(err) {
  if (err.code === 'ENOENT') {
    // File not found
    console.log('build.json not found!');
    process.exit(0xf0);
  } else if (err instanceof SyntaxError) {
    // JSON parsing failed
    console.log('build.json isn\'t valid JSON!');
    process.exit(0xf1);
  } else {
    console.log('ERR!');
    console.log(util.inspect(e));
    process.exit(0xff);
  }
}

/**
 * Asynchronously copy a file from one location to another.
 * @param {String} from The file to copy.
 * @param {String} to The location to copy to.
 * @param {Function} callback The function to call when copy is complete.
 */
function copyPath(from, to, callback) {
  var fromFile = fs.createReadStream(from);
  var toFile = fs.createWriteStream(to);
  fromFile.once('open', function(fd) {
    util.pump(fromFile, toFile, callback);
  });
}

/**
 * Build a target.
 * @param {Object} target The target to build.
 */
function buildTarget(target) {
  var deps = target.deps;
  var outDir = (target.to && target.to.dir) || './';
  var copyFiles = (target.to && target.to.copy) || false;
  if (!path.existsSync(outDir)) {
    fs.mkdirSync(outDir, 0755);
  }
  deps.forEach(function (dep) {
    var depParts = dep.split(':');
    var depPath = depParts[0],
      depTarget = depParts[1];
    if ((/^\/\//).test(depPath)) {
      depPath = path.join(config.root, depPath);
    }
    if (depTarget) {
      if ((/\.js$/).test(depTarget)) {
        // Target is a JS file. Directly link to it.
        var outFile = path.join(outDir, depTarget);
        var inFile = path.join(depPath, depTarget);
        if (copyFiles) {
          console.log('copy', inFile, outFile);
          copyPath(inFile, outFile, function(err) {
            console.log('Error copying file for target', depTarget);
          });
        } else {
          if (path.existsSync(outFile)) {
            fs.unlinkSync(outFile);
          }
          fs.symlinkSync(inFile, outFile);
          console.log('✔ symlink', inFile, outFile);
        }
      } else {
        // Target is a build target
      }
    } else {
      // No target specified.
      throw new Error('No target');
    }
  });
}

/**
 * Build the specified targets based on build.json.
 * @param {Object} bulid The build object representing a `build.json` file.
 * @param {String} targets Comma-separated list of targets in `build.json`.
 */
function buildIt(build, targets) {
  targets = targets && targets.split(',');
  if (!targets || targets.length === 0) {
    console.log('Nothing to build.');
    return 0;  // nothing to build, so exit cleanly.
  }
  targets.forEach(function (target, idx) {
    if (build.hasOwnProperty(target)) {
      try {
        console.log('Building target "' + target + '"');
        buildTarget(build[target]);
      } catch (e) {
        console.log('Failed to build target "' + target + '"');
        console.log('Error was:');
        console.log(util.inspect(e));
        return (idx + 1) | 0x70;
      }
    }
  });
}

/**
 * The main function.
 */
function main(args) {
  loadConfig();
  var build = null;
  var targets = args[2];
  try {
    build = JSON.parse(fs.readFileSync('build.json'));
  } catch (e) {
    handleError(e);
  }
  process.exit(buildIt(build, targets));
}


main(process.argv);
