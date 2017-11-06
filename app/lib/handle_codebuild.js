'use strict';

const _ = require('lodash');
const slack = require('./slack');

var functions = {};

functions.handle = function(event, callback) {
    console.log('handle_codebuild');
    slack.post_message({
        channel: 'G6QD7UBRD',
        text: 'CodeBuild message'
    }, callback);
};

module.exports = functions;