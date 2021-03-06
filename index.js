const fireworm = require('fireworm');
const fw = fireworm('/Users/Evan/nginx', { ignoreInitial: true });
const async = require('async');
const exec = require('child_process').exec;
const server = 'ubuntu@ec2-13-59-24-182.us-east-2.compute.amazonaws.com';
const key_pair = '/Users/Evan/aws_ssh/evanruby.pem';
const remote_dir = 'nginx';
const syncCmd =
	'rsync -avzr --progress --delete --exclude=".git" --exclude ".gitignore" --exclude="sendgrid.env" --exclude="build" --exclude="node_modules" --exclude="npm-debug.log" --exclude=".DS_Store" -e "ssh -i ' +
	key_pair +
	'" ~/nginx/ ' +
	server +
	':' +
	remote_dir;
var busy = false;
const sleepTime = 500;

function changed(filename) {
	if (!busy) {
		busy = true;

		exec(syncCmd, function(err, stdout, stderr) {
			console.log(stdout);
		});

		setTimeout(function() {
			busy = false;
		}, sleepTime);
	}
}

async.waterfall(
	[
		function(cb) {
			console.log('Creating remote directories...');
			exec(
				[
					'ssh -i ' + key_pair + ' ' + server + ' "',
					'mkdir -p ' + remote_dir + ';',
					'"'
				].join(''),
				cb
			);
		},
		function(stdout, stderr, cb) {
			console.log('\n***Starting file sync process***\n');
			fw.add('**');
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
	],
	function(err) {
		if (err) {
			console.log(err);
		}
	}
);
