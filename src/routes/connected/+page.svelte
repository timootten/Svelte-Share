<script lang="ts">
	import { betterPeer } from '$lib/global.svelte';

	const { remoteId, id, send, onData } = betterPeer;

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
		} else if (data.type === 'text') {
			remoteText = data.text;
			console.log('Received data:', data);
		}
	});

	let files = $state<FileList | null>(null);
	let isUploading = $state<boolean>(false);

	$effect(() => {
		const file = files?.[0];
		if (file && !isUploading) {
			sendFile(file);
		}
	});

	let remoteText = $state<string>('');

	const sendFile = async (file: File) => {
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

	<textarea
		bind:value={remoteText}
		oninput={() => send({ type: 'text', text: remoteText })}
		cols="50"
		rows="20">Text Here remote</textarea
	>
</div>
