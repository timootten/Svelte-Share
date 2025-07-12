<script lang="ts">
	import '../app.css';
	import { toast, Toaster } from 'svelte-sonner';
	import { page } from '$app/state';
	import { betterPeer } from '$lib/global.svelte';
	import { beforeNavigate, goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { ModeWatcher } from 'mode-watcher';
	import ThemeSwitcher from '$lib/components/core/theme-switcher.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowBigLeft, Home } from 'lucide-svelte';

	let { children } = $props();

	const { status, id, initialize, disconnect, onError, onSuccess } = betterPeer;

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
<ModeWatcher />
<div class="h-screen w-full">
	<div
		class="fixed top-0 right-0 left-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80"
	>
		<div class="container mx-auto px-4 py-3">
			<div class="flex items-center justify-between">
				<!-- Back Button - Left -->
				<Button
					href="/"
					onclick={() => {
						if (status() === 'CONNECTED') {
							disconnect();
						}
					}}
					variant="outline"
					size="icon"
				>
					{#if status() === 'CONNECTED'}
						<ArrowBigLeft class="h-5 w-5" />
					{:else}
						<Home class="h-5 w-5" />
					{/if}
					<span class="hidden">Back</span>
				</Button>
				<!-- Peer ID - Center -->
				<div class="flex items-center space-x-2">
					<div class="h-2 w-2 rounded-full bg-green-500"></div>
					<span class="text-sm text-gray-600 dark:text-gray-400">Your Peer ID:</span>
					<span class="font-mono text-sm font-semibold text-gray-800 dark:text-gray-200"
						>{id()}</span
					>
				</div>

				<!-- Theme Switcher - Right -->
				<ThemeSwitcher />
			</div>
		</div>
	</div>

	<div class="min-h-[calc(100vh - 80px)] container mx-auto mt-16 h-full px-4 pt-0 lg:mt-0 lg:pt-16">
		<div class="flex h-full flex-col">
			{@render children()}
		</div>
	</div>
</div>
