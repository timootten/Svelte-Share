<script lang="ts">
	import { betterPeer } from '$lib/global.svelte';

	const { id, remoteId, status, connect, send, onData } = betterPeer;

	type SEND =
		| {
				type: 'file';
				fileName: string;
				fileType: string;
				fileSize: number;
				fileData: ArrayBuffer;
		  }
		| {
				type: 'text';
				text: string;
		  };

	onData<SEND>((data) => {
		if (data.type === 'file') {
			console.log('Received file:', data.fileName);

			// Reconstruct the File object from the received data
			const blob = new Blob([data.fileData], { type: data.fileType });
			const file = new File([blob], data.fileName, { type: data.fileType });

			// Auto-download the file
			const url = URL.createObjectURL(file);
			const a = document.createElement('a');
			a.href = url;
			a.download = data.fileName;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} else {
			console.log('Received data:', data);
		}
	});

	let inputPeerId = $state<string>('');

	const connectToPeer = async () => {
		console.log('Connecting to remote peer:', inputPeerId);
		await connect(inputPeerId);
	};

	let files = $state<FileList | null>(null);
	let isUploading = $state<boolean>(false);

	$effect(() => {
		const file = files?.[0];
		if (file && !isUploading) {
			sendFile(file);
		}
	});

	const sendFile = async (file: File) => {
		if (status() !== 'CONNECTED') {
			console.error('Not connected to peer');
			return;
		}

		isUploading = true;
		console.log('Sending file:', file.name);

		try {
			// Convert File to ArrayBuffer
			const fileData = await file.arrayBuffer();

			// Send file data with metadata
			send<SEND>({
				type: 'file',
				fileName: file.name,
				fileType: file.type,
				fileSize: file.size,
				fileData: fileData
			});

			console.log('File sent successfully');
		} catch (error) {
			console.error('Error sending file:', error);
		} finally {
			isUploading = false;
			// Reset file input
			files = null;
		}
	};
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
			<button onclick={connectToPeer} disabled={!inputPeerId.trim()}> Connect </button>
		</div>
	</div>
{:else if status() === 'PENDING'}
	<div class="status-container">
		<p>⏳ Connecting...</p>
		<p>Attempting to connect to peer...</p>
		<p>Your Peer ID: <strong>{id()}</strong></p>
	</div>
{:else if status() === 'CONNECTED'}
	<div class="status-container">
		<p>🔗 Connected</p>
		<p>Connected to peer: <strong>{remoteId()}</strong></p>
		<p>Your Peer ID: <strong>{id()}</strong></p>

		<div class="file-section">
			<input
				type="file"
				bind:files
				disabled={isUploading}
				placeholder="Send file to remote connection"
			/>

			{#if isUploading}
				<p>📤 Uploading file...</p>
			{/if}
		</div>

		<div class="actions">
			<button onclick={() => send({ type: 'text', text: 'Hello from peer!' })}>
				Send Test Message
			</button>
		</div>
	</div>
{:else}
	<div class="status-container">
		<p>❌ Disconnected</p>
		<p>Connection lost or failed</p>
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
