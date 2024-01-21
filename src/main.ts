import App from './App.svelte';
import { shimXHR } from './shim';

// Run shim functions
(function() {
	shimXHR();

	new App({
		target: document.body,
	});
})();
