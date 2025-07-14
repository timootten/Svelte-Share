<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { cn } from '$lib/utils';
	import { MoveDown, MoveUp } from 'lucide-svelte';
	import { createChunkReceiver, downloadFile, sendFiles, type FileChunk } from '$lib/files';
	import { betterPeer } from '$lib/global.svelte';
	import DropZone from '$lib/components/core/drop-zone.svelte';

	const { send, onData } = betterPeer;

	type SEND =
		| {
				type: 'text';
				text: string;
		  }
		| FileChunk;

	const receiver = createChunkReceiver();

	receiver.onComplete((file) => {
		console.log('File received:', file.name);
		downloadFile(file);
	});

	receiver.onProgress((id, fileName, percent) => {
		console.log(`[Download] ID: ${id} File: ${fileName} Progress: ${percent}%`);
		upsertFileTransfer(id, fileName, percent, 'download');
	});

	onData<SEND>((data) => {
		if (data.type === 'file-chunk') {
			receiver.handleChunk(data);
		} else if (data.type === 'text') {
			textArea = data.text;
			console.log('Received data:', data);
		}
	});

	const onUpload = (files: File[]) => {
		if (files.length < 0) return;

		const { onComplete, onProgress } = sendFiles([...files], send);

		onComplete((file) => {
			console.log('File upload complete', file.name);
		});

		onProgress((id, fileName, percent) => {
			console.log(`[Upload] ID: ${id} File: ${fileName} Progress: ${percent}%`);
			upsertFileTransfer(id, fileName, percent, 'upload');
		});
	};

	function upsertFileTransfer(
		id: string,
		fileName: string,
		progress: number,
		type: 'upload' | 'download'
	) {
		const index = fileTransfers.findIndex((t) => t.id === id);

		if (fileTransfers[index]?.progress >= progress) return; // Ignorieren wenn der Fortschritt nicht steigt

		if (index !== -1) {
			// Eintrag existiert → aktualisieren
			fileTransfers[index] = { ...fileTransfers[index], progress };
			fileTransfers = [...fileTransfers]; // reaktive Änderung
		} else {
			// Neuer Eintrag → hinzufügen
			const newTransfer: FileTransfer = { id, fileName, progress, type };
			fileTransfers = [newTransfer, ...fileTransfers];
		}
	}

	type FileTransfer = {
		id: string;
		fileName: string;
		progress: number;
		type: 'upload' | 'download';
	};

	let fileTransfers: FileTransfer[] = $state([]);

	let textArea = $state<string>('');
</script>

<div class="flex h-full items-center justify-center">
	<div class="grid w-full max-w-7xl grid-cols-1 gap-6 lg:h-[600px] lg:grid-cols-2">
		<!-- Left Card - Fileupload -->
		<Card.Root class="h-full">
			<Card.Header class="text-center">
				<h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">Share Files</h2>
				<p class="text-sm text-gray-600 dark:text-gray-400">Share files with your connected peer</p>
			</Card.Header>
			<hr />
			<Card.Content class="flex h-full flex-col items-center justify-center p-8">
				<div class="flex h-64 w-full flex-col items-center space-y-2 lg:h-full">
					<DropZone {onUpload} />
				</div>
				<!-- Progress Bar -->
				<span class="mt-4 w-full text-xl font-semibold">Status:</span>
				<div
					class="mt-4 flex h-48 w-full flex-col items-center space-y-4 overflow-x-hidden overflow-y-auto rounded-lg border-2 border-gray-600 bg-gray-50 p-4 dark:bg-gray-700"
				>
					{#if fileTransfers.length === 0}
						<p
							class="flex h-full items-center justify-center text-center text-sm text-gray-500 dark:text-gray-400"
						>
							No file transfers in progress.
						</p>
					{:else}
						{#each fileTransfers as { fileName, progress, type }, index (index)}
							<div class="flex w-full min-w-0 items-center">
								<div class="mr-2 min-w-0 flex-1">
									<div class="flex items-center gap-2">
										<span
											class="w-20 flex-shrink-0 overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap lg:w-32"
											>{fileName}</span
										>
										<Progress
											value={progress}
											class="h-2 w-full flex-1 rounded"
											progressClass={cn({
												'bg-green-500': progress === 100,
												'bg-yellow-500': progress < 100,
												'bg-red-500': progress < 50
											})}
										/>
										<span class="min-w-[35px] flex-shrink-0 text-xs font-medium sm:text-sm"
											>{progress.toFixed(0)}%</span
										>
									</div>
								</div>
								{#if type === 'download'}
									<div
										class="ml-1 flex items-center text-lg text-blue-500 transition-colors sm:text-xl"
									>
										<MoveDown />
									</div>
								{:else}
									<div
										class="ml-1 flex items-center text-lg text-green-500 transition-colors sm:text-xl"
									>
										<MoveUp />
									</div>
								{/if}
							</div>
						{/each}
					{/if}
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Right Card - Textarea -->
		<Card.Root class="h-full">
			<Card.Header class="text-center">
				<h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">Share Text</h2>
				<p class="text-sm text-gray-600 dark:text-gray-400">
					Share text messages with your connected peer
				</p>
			</Card.Header>
			<hr />
			<Card.Content class="flex h-96 flex-col items-center justify-center p-8 lg:h-full">
				<Textarea
					bind:value={textArea}
					class="h-full w-full"
					oninput={() => send({ type: 'text', text: textArea })}
				/>
			</Card.Content>
		</Card.Root>
	</div>
</div>
