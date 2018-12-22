#!/usr/bin/env node
'use strict';
const path = require('path');
const fs = require('fs');
const meow = require('meow');
const inquirer = require('inquirer');
const chalk = require('chalk');
const Conf = require('conf');
const execa = require('execa');

const logSymbols = require('log-symbols');

const config = new Conf();

let filename = 'eula';
const extension = '.md';

const cli = meow(`
	Usage
	  $ eula

	Options
	  --uppercase, -c   Use uppercase characters (e.g. eula.md)
	  --underscore, -u  Use underscores instead of dashes (e.g. code_of_conduct.md)
`, {
	flags: {
		uppercase: {
			type: 'boolean',
			default: false,
			alias: 'c'
		},
		underscore: {
			type: 'boolean',
			default: false,
			alias: 'u'
		}
	}
});

const {flags} = cli;

if (flags.email) {
	config.set('email', flags.email);
}

if (flags.uppercase) {
	filename = filename.toUpperCase();
}

if (flags.underscore) {
	filename = filename.replace(/-/g, '_');
}

const filepath = `${filename}${extension}`;

function findEmail() {
	let email;
	try {
		email = execa.sync('git', ['config', 'user.email']).stdout.trim();
	} catch (_) {}

	return email;
}

function write(filepath, email, fileToRemove) {
	const src = fs.readFileSync(path.join(__dirname, 'vendor/eula.md'), 'utf8');
	fs.writeFileSync(filepath, src.replace('[INSERT EMAIL ADDRESS]', email));

	if (fileToRemove) {
		fs.unlinkSync(fileToRemove);
		console.log(`${logSymbols.warning} Deleted ${fileToRemove}`);
	}
}

function generate(filepath, email) {
	write(filepath, email);
	console.log(`${logSymbols.success} Added a End-user license agreement to your project ❤\n\n${chalk.bold('Please carefully read this document as its basic.')}\n\nAdd the following to your contributing.md or readme.md`);
}

async function init() {
	if (config.has('email')) {
		generate(filepath, config.get('email'));
		return;
	}

	const email = findEmail();
	if (email) {
		config.set('email', email);
		generate(filepath, email);
		return;
	}

	if (process.stdout.isTTY) {
		const answers = await inquirer.prompt([{
			type: 'input',
			name: 'email',
			message: `Couldn't infer your email. Please enter your email:`,
			validate: x => x.includes('@')
		}]);
		generate(filepath, answers.email);
	} else {
		console.error(`Run \`${chalk.cyan('conduct --email=your@email.com')}\` once to save your email.`);
		process.exit(1);
	}
}

init();
