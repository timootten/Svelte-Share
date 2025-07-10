<script lang="ts">
	import { PUBLIC_PEER_PREFIX } from '$env/static/public';
	import { BetterPeer } from '$lib/betterPeer.svelte';
	import { onMount } from 'svelte';

	const { id, peerId, status, initialize, connect, send, onData, onError } =
		BetterPeer(PUBLIC_PEER_PREFIX);

	onMount(() => {
		initialize();
	});

	onError((message) => {
		// TODO add toasts
		console.error('XXX Error:', message);
	});

	type SEND = {
		type: 'file';
		fileName: string;
		fileType: string;
		fileSize: number;
		fileData: ArrayBuffer;
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

	let remotePeerId = $state<string>('');

	const connectToPeer = async () => {
		console.log('Connecting to remote peer:', remotePeerId);
		await connect(remotePeerId);
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

		// Check file size (PeerJS has a ~16MB limit for single messages)
		/*if (file.size > 16 * 1024 * 1024) {
			console.error('File too large. Maximum size is 16MB');
			return;
		}*/

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

{#if status() === 'PENDING'}
	<p>Pending</p>
	<input type="text" bind:value={remotePeerId} placeholder="Enter remote peer ID" />
	<button onclick={connectToPeer}>Connect</button>
{:else if status() === 'CONNECTED'}
	<p>Connected to {remotePeerId}</p>

	<input
		type="file"
		bind:files
		disabled={isUploading}
		placeholder="Send file to remote connection"
	/>

	{#if isUploading}
		<p>Uploading file...</p>
	{/if}

	<button onclick={() => send('ABC')}>Test</button>
{:else}
	<p>Disconnected</p>
{/if}

<p>Your Peer ID: {id()}</p>
