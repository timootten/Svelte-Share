<script lang="ts">
	import { onMount } from 'svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import DigitInput from '$lib/components/core/digit-input.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { getQRCode } from '$lib/qrcode';
	import { betterPeer } from '$lib/global.svelte';
	import { getRemoteId } from '$lib/browserHash';
	import { cn } from '$lib/utils';

	const { id, status, connect, onError, onSuccess } = betterPeer;

	let qrCodeElement: HTMLDivElement;

	onMount(async () => {
		const url = `https://l5173.shadehost.eu/#${id()}`;
		const qrCode = await getQRCode(url);
		qrCode.append(qrCodeElement);
	});

	let inputRemoteId = $state<string>(getRemoteId());
	let derviedRemoteId = $derived<string>(inputRemoteId);
	let digitStatus = $state<'DEFAULT' | 'PENDING' | 'ERROR'>('DEFAULT');

	onError((_, type) => {
		if (type === 'wrong-id') {
			digitStatus = 'ERROR';
		} else {
			digitStatus = 'DEFAULT';
		}
	});

	$effect(() => {
		if (inputRemoteId.length < 6) {
			digitStatus = 'DEFAULT';
		} else {
			digitStatus = 'PENDING';
		}
	});

	$effect(() => {
		if (status() === 'READY' && derviedRemoteId.length === 6) {
			console.log('Connecting with remote ID:', derviedRemoteId);
			connect(derviedRemoteId).then();
			derviedRemoteId = '';
		}
	});
</script>

<!-- Responsive Grid Container with improved centering -->
<div class="flex h-full items-center justify-center">
	<div class="grid w-full max-w-7xl grid-cols-1 gap-6 lg:h-[600px] lg:grid-cols-2">
		<!-- Left Card - DigitInput -->
		<Card.Root class="h-full">
			<Card.Header class="text-center">
				<h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">Connect Remotely</h2>
				<p class="text-sm text-gray-600 dark:text-gray-400">
					Enter the connection code to establish a remote connection
				</p>
			</Card.Header>
			<hr />
			<Card.Content class="flex h-full flex-col items-center justify-center p-8">
				<div class="flex w-full flex-col items-center space-y-2">
					<div class="flex flex-col items-center space-y-2">
						<DigitInput
							autofocus
							bind:status={digitStatus}
							bind:value={inputRemoteId}
							maxlength={6}
						/>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Right Card - QR Code -->
		<Card.Root class="h-full">
			<Card.Header class="text-center">
				<h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">QR Code</h2>
				<p class="text-sm text-gray-600 dark:text-gray-400">Scan this code to connect remotely</p>
			</Card.Header>
			<hr />
			<Card.Content class="flex h-full  flex-col items-center justify-center p-8">
				<div class=" space-y-4 text-center">
					{#if status() === 'LOADING'}
						<Skeleton class="h-[300px] w-[300px] rounded-3xl" />
					{/if}
					<div
						bind:this={qrCodeElement}
						class={cn('flex justify-center', {
							hidden: status() === 'LOADING'
						})}
					></div>
				</div>
			</Card.Content>
		</Card.Root>
	</div>
</div>
