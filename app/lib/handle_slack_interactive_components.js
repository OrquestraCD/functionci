'use strict';

const _ = require('lodash');
const cloudformation = require('./cloudformation');
const dao = require('./dao');
const async = require('async');

var functions = {};

functions.handle_create_project_dialog = function(payload, callback) {
    console.log('create_project');
    // "github_repo": "repo",
    // "github_branch": "branch",
    // "codebuid_compute_type": "BUILD_GENERAL1_SMALL",
    // "codebuid_image": "aws/codebuild/eb-nodejs-6.10.0-amazonlinux-64:4.0.0"
    //https://github.com/thestackshack/cim

    const github_url = payload.submission.github_repo;
    const github_branch = payload.submission.github_branch;
    const codebuid_compute_type = payload.submission.codebuid_compute_type;
    const codebuid_image = payload.submission.codebuid_image;
    const channel = payload.submission.channel;
    const user_id = payload.user.id;
    const user_name = payload.user.name;

    const github_repo_parts = _.split(_.replace(github_url, 'https://github.com/', ''), '/');
    if (_.size(github_repo_parts) != 2) {
        return callback(null, {
            statusCode: 200,
            body: 'Invalid github repo.  Valid format is https://github.com/<owner>/<repo>'
        });
    }
    const github_owner = github_repo_parts[0];
    const github_repo = github_repo_parts[1];
    const project_id = _.replace(_.join([github_repo, github_branch], '-'), /[^a-z0-9A-Z-]/g, '-');

    const params = {
        project_id: project_id,
        github_owner: github_owner,
        github_repo: github_repo,
        github_branch: github_branch,
        codebuid_compute_type: codebuid_compute_type,
        codebuid_image: codebuid_image,
        channel: channel,
        github_url: github_url,
        user_id: user_id,
        user_name: user_name
    };

    async.waterfall([
        function(next) {
            cloudformation.build_stack_up(params, next);
        },
        function(next) {
            dao.put_project(params, next);
        }
    ], function(err, results) {
        if (err) {
            console.log(err);
            return callback(null, {
                statusCode: 200,
                body: JSON.stringify({
                    "errors": [
                        {
                            "name": "github_repo",
                            "error": err
                        }
                    ]
                })
            });
        } else {
            return callback(null, {
                statusCode: 200,
                body: ''
            });
        }
    });
};

functions.handle = function(body, callback) {
    console.log('slack_interactive_components');
    var payload = JSON.parse(body.payload);
    console.log(JSON.stringify(payload, null, 3));

    // Is the token valid?
    if (!_.isEqual(payload.token, process.env.SlackVerificationToken)) {
        return callback(null, {
            statusCode: 200,
            body: 'Invalid token'
        });
    }

    // Route to the correct handler function.
    if (_.startsWith(payload.callback_id, 'create_project')) {
        functions.handle_create_project_dialog(payload, callback);
    } else {
        return callback(null, {
            statusCode: 500,
            body: 'Unknown slack interactive request.'
        });
    }
};

module.exports = functions;
