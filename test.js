import fs from 'fs';
import path from 'path';
import test from 'ava';
import execa from 'execa';
import tempy from 'tempy';

const bin = path.join(__dirname, 'cli.js');

test('generate', async t => {
	const cwd = tempy.directory();
	await execa(bin, ['--email=foo@bar.com'], {cwd});
	const src = fs.readFileSync(path.join(cwd, 'eula.md'), 'utf8');
	t.true(src.includes('In the interest of fostering'));
	t.true(src.includes('foo@bar.com'));
});
