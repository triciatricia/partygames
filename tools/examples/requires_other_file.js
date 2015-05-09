/**
 * Google Closure isn't properly recognizing that should_be_string is a string.
 *
 * Will have to figure this out for full commonjs integration.
 *
 * java -jar ../closure-compiler.jar --warning_level VERBOSE  --process_common_js_modules --transform_amd_modules --common_js_entry_module=requires_other_file.js --js exports_string.js requires_other_file.js
 */
var should_be_string = require('exports_string');

++should_be_string;
