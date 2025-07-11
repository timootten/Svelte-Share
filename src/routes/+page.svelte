<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { betterPeer } from '$lib/global.svelte';
	import { REGEXP_ONLY_DIGITS } from 'bits-ui';
	import * as InputOTP from '$lib/components/ui/input-otp/index.js';

	const { id, status, connect } = betterPeer;

	const connectToPeer = async () => {
		console.log('Connecting to remote peer:', inputRemoteId);
		await connect(inputRemoteId);
	};

	const getRemoteId = () => {
		if (!browser) return '';
		const match = window?.location?.hash.match(/#(\d{6})\b/);
		return match ? match[1] : '';
	};

	let inputRemoteId = $state<string>(getRemoteId());

	$effect(() => {
		const input = inputRemoteId.trim();
		if (status() === 'READY' && input.length === 6) {
			connectToPeer();
		}
	});

	let qrContainer;

	onMount(async () => {
		const { default: QRCodeStyling } = await import('qr-code-styling');

		const qrCode = new QRCodeStyling({
			width: 300,
			height: 300,
			type: 'svg',
			data: 'https://l4173.shadehost.eu/#' + id(),
			dotsOptions: {
				color: '#4267b2',
				type: 'dots' // Runde Dots
			},
			cornersSquareOptions: {
				color: '#4267b2',
				type: 'extra-rounded' // Abgerundete Ecken
			},
			cornersDotOptions: {
				color: '#4267b2',
				type: 'dots' // Runde Eck-Dots
			},
			backgroundOptions: {
				color: '#ffffff'
			}
		});

		qrCode.append(qrContainer);
	});
</script>

<div bind:this={qrContainer}></div>

{#if status() === 'LOADING'}
	<div class="status-container">
		<p>🔄 Loading peer connection...</p>
		<p>Initializing peer ID and connecting to PeerJS server...</p>
	</div>
{:else if status() === 'READY'}
	<div class="status-container">
		<p>✅ Ready to connect</p>
		<p>Your Peer ID: <strong>{id()}</strong></p>
		<div class="connect-section">
			<InputOTP.Root pattern={REGEXP_ONLY_DIGITS} maxlength={6} bind:value={inputRemoteId}>
				{#snippet children({ cells })}
					<InputOTP.Group>
						{#each cells.slice(0, 3) as cell}
							<InputOTP.Slot {cell} />
						{/each}
					</InputOTP.Group>
					<InputOTP.Separator />
					<InputOTP.Group>
						{#each cells.slice(3, 6) as cell}
							<InputOTP.Slot {cell} />
						{/each}
					</InputOTP.Group>
				{/snippet}
			</InputOTP.Root>
			<button onclick={connectToPeer} disabled={!inputRemoteId.trim()}> Connect </button>
		</div>
	</div>
{:else if status() === 'PENDING'}
	<div class="status-container">
		<p>⏳ Connecting...</p>
		<p>Attempting to connect to peer...</p>
		<p>Your Peer ID: <strong>{id()}</strong></p>
	</div>
{/if}

<a href="/connected">XX</a>

<style>
	.status-container {
		padding: 1rem;
		border: 1px solid #ccc;
		border-radius: 8px;
		margin: 1rem 0;
	}

	.connect-section {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.connect-section input {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
	}

	.connect-section button {
		padding: 0.5rem 1rem;
		background: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.connect-section button:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	.file-section {
		margin: 1rem 0;
	}

	.file-section input {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
	}

	.actions {
		margin-top: 1rem;
	}

	.actions button {
		padding: 0.5rem 1rem;
		background: #28a745;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}
</style>
