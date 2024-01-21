import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import css from 'rollup-plugin-css-only';
import preprocess from 'svelte-preprocess';
import pkg from './package.json';
import { spawn } from 'child_process';
import process from 'process';
import buble from '@rollup/plugin-buble';
import json from '@rollup/plugin-json';

const production = !process.env.ROLLUP_WATCH;
const minify = production;

function serve() {
	let server;

	function toExit() {
		if (server) server.kill(0);
	}

	return {
		writeBundle() {
			if (server) return;
			server = spawn('npm', ['run', 'start', '--', '--dev'], {
				stdio: ['ignore', 'inherit', 'inherit'],
				shell: true
			});

			process.on('SIGTERM', toExit);
			process.on('exit', toExit);
		}
	};
}

export default {
	input: 'src/main.ts',
	context: 'window',
	output: {
		sourcemap: !production,
		format: 'iife',
		name: 'app',
		file: `public/build/${pkg.name}.js`
	},
	external: [ 'wicg-mediasession' ],
	plugins: [
		json({
			compact: true
		}),
		
		svelte({
			preprocess: preprocess({
				sourceMap: !production,
			}),
			compilerOptions: {
				// enable run-time checks when not in production
				dev: !production
			}
		}),

		// we'll extract any component CSS out into
		// a separate file - better for performance
		css({ output: `${pkg.name}.css` }),

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration -
		// consult the documentation for details:
		// https://github.com/rollup/plugins/tree/master/packages/commonjs
		resolve({
			browser: true,
			dedupe: ['svelte']
		}),
		commonjs(),
		typescript({
			sourceMap: !production,
			inlineSources: !production
		}),

		// Transpile down to ES5
		buble({
			transforms: {
				parameterDestructuring: true,
				defaultParameter: true,
				spreadRest: true,
				templateString: true,
				classes: true,
				arrow: true,
				dangerousForOf: true,
			}
		}),

		// In dev mode, call `npm run start` once
		// the bundle has been generated
		!production && serve(),

		// Watch the `public` directory and refresh the
		// browser on changes when not in production
		!production && livereload('public'),

		// Minify Javascript
		minify && terser({
			output: {
				comments: false,
			},
			safari10: true,
			keep_fnames: false,
			compress: {
				drop_console: true,
			},
		}),

	],
	watch: {
		clearScreen: false
	}
};
