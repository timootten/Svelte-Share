<script lang="ts">
	import '../app.css';
	import { toast, Toaster } from 'svelte-sonner';
	import { page } from '$app/state';
	import { betterPeer } from '$lib/global.svelte';
	import { beforeNavigate, goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { children } = $props();

	const { status, initialize, onError, onSuccess } = betterPeer;

	onMount(initialize);
	onError(toast.error);
	onSuccess(() => toast.success('Connected successfully!'));

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

	beforeNavigate((event) => {
		if (status() !== 'CONNECTED' && event.to?.url.pathname === '/connected') {
			event.cancel();
		}
	});
</script>

<Toaster position="top-right" richColors />
{@render children()}
