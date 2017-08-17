var fireworm = require('fireworm');
var fw = fireworm('/Users/Evan/nginx', {ignoreInitial: true});
var scssfw = fireworm('/Users/Evan/nginx/ebr-ui/source/scss/');
var async = require('async');
var exec = require('child_process').exec;
var server = 'ubuntu@ec2-13-59-24-182.us-east-2.compute.amazonaws.com';
var key_pair = '/Users/Evan/aws_ssh/evanruby.pem';
var remote_dir = 'nginx';
var syncCmd   = 'rsync -avzr --progress --delete --exclude=".git" --exclude="bower_components" --exclude="sendgrid.env" --exclude="node_modules" --exclude=".DS_Store" -e "ssh -i ' + key_pair + '" ~/nginx/ ' + server + ':' + remote_dir;
var scssCmd  = 'node-sass -o /Users/Evan/nginx/ebr-ui/source/stylesheets /Users/Evan/nginx/ebr-ui/source/scss/main.scss --output-style compressed';
var busy = false;
var sleepTime = 500;

function changed(filename) {
    if(!busy) {
        busy = true;

        exec(syncCmd, function(err, stdout, stderr) {
            console.log(stdout);
        });

        setTimeout(function() {
            busy = false;
        }, sleepTime);
    }
}

function scssChanged(filename) {
    if(!busy) {
        console.log('\n***Pre-processing scss files***\n');
        busy = true;

        exec(scssCmd, function(err, stdout, stderr) {
            console.log(stdout);
        });

        setTimeout(function() {
            busy = false;
        }, sleepTime);
    }
}

async.waterfall([
    function(cb) {
        scssfw.add('**');
        scssfw.on('add', scssChanged);
        scssfw.on('change', scssChanged);
        scssfw.on('remove', scssChanged);
        cb();
    },
    function(cb) {
        console.log('Creating remote directories...');
        exec([
            'ssh -i ' + key_pair + ' ' + server + ' "',
            'mkdir -p ' + remote_dir + ';',
            '"'
        ].join(''), cb);
    },
    function(stdout, stderr, cb) {
        console.log('\n***Starting file sync process***\n');
        fw.add('**');
        fw.ignore('ebr-ui/source/scss/');
        fw.on('add', changed);
        fw.on('change', changed);
        fw.on('remove', changed);
        cb();
    },
    function(cb) {
        setInterval(function() {
            process.stdout.write('.');
        }, 5000);
        cb();
    }
], function(err) {
    if (err) {
        console.log(err);
    }
});
