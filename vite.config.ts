import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		allowedHosts: ['l5173.shadehost.eu', 'l4173.shadehost.eu']
	},
	preview: {
		allowedHosts: ['l5173.shadehost.eu', 'l4173.shadehost.eu']
	},
	ssr: {
		noExternal: ['svelte-sonner']
	}
});
