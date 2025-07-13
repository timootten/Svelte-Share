<script lang="ts">
	import '../app.css';
	import { toast, Toaster } from 'svelte-sonner';
	import { page } from '$app/state';
	import { betterPeer } from '$lib/global.svelte';
	import { beforeNavigate, goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { ModeWatcher } from 'mode-watcher';
	import ThemeSwitcher from '$lib/components/core/theme-switcher.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Button } from '$lib/components/ui/button';
	import { ArrowBigLeft, Home } from 'lucide-svelte';
	import { cn } from '$lib/utils';

	let { children } = $props();

	const { status, id, initialize, disconnect, onError, onSuccess } = betterPeer;

	onMount(initialize);
	onError((errorMessage) => toast.error(errorMessage));
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
<div class="flex h-screen w-full flex-col">
	<div
		class="fixed top-0 right-0 left-0 z-50 h-16 border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80"
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
					<div
						class={cn('h-2 w-2 rounded-full ', {
							'bg-blue-500': status() === 'CONNECTED',
							'bg-green-500': status() === 'READY',
							'bg-yellow-500': status() === 'LOADING' || status() === 'PENDING'
						})}
					></div>
					<span class="text-sm text-gray-600 dark:text-gray-400">Your Peer ID:</span>
					<span class="font-mono text-xl font-semibold text-gray-800 dark:text-gray-200">
						{#if status() === 'LOADING'}
							<Skeleton class="h-[30px] w-[120px] rounded-full" />
						{:else}
							{id().slice(0, 3) + ' • ' + id().slice(3)}
						{/if}
					</span>
				</div>

				<!-- Theme Switcher - Right -->
				<ThemeSwitcher />
			</div>
		</div>
	</div>

	<main class="flex-1 pt-20 pb-4">
		<div class="container mx-auto h-full px-4">
			<div class="flex h-full flex-col">
				{@render children()}
			</div>
		</div>
	</main>
</div>
