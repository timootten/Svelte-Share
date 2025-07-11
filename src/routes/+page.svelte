<script lang="ts">
	import { browser } from '$app/environment';
	import * as InputOTP from '$lib/components/ui/input-otp/index.js';
	import { betterPeer } from '$lib/global.svelte';

	const { id, status, connect } = betterPeer;

	let inputPeerId = $state<string>('');

	const connectToPeer = async () => {
		console.log('Connecting to remote peer:', inputPeerId);
		await connect(inputPeerId);
	};

	const getRemoteId = () => {
		if (!browser) return '';
		console.log('XXX');
		const match = window?.location?.hash.match(/#(\d{6})/);
		if (match) {
			return match[1];
		} else {
			return '';
		}
	};

	let remoteId = $state<string>(getRemoteId());
</script>

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
			<input
				type="text"
				bind:value={inputPeerId}
				placeholder="Enter remote peer ID"
				disabled={false}
			/>
			<script lang="ts">
				import * as InputOTP from '$lib/components/ui/input-otp/index.js';
			</script>

			<InputOTP.Root maxlength={6} bind:value={remoteId}>
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
			<button onclick={connectToPeer} disabled={!inputPeerId.trim()}> Connect </button>
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
