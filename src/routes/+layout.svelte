<script lang="ts">
	import '../app.css';
	import { toast, Toaster } from 'svelte-sonner';
	import { page } from '$app/state';
	import { betterPeer } from '$lib/global.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { children } = $props();

	const { status, initialize, onError } = betterPeer;

	onMount(initialize);
	onError(toast.error);

	$effect(() => {
		const pathname = page.url.pathname;
		if (status() === 'CONNECTED') {
			if (pathname !== '/connected') {
				goto('/connected');
			}
		} else {
			if (pathname !== '/') {
				goto('/');
			}
		}
	});
</script>

<Toaster position="top-right" richColors />
{@render children()}
