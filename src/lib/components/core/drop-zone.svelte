<script lang="ts">
	import { cn } from '$lib/utils';

	const {
		onUpload
	}: {
		onUpload: (files: File[]) => void;
	} = $props();

	let isDragOver = $state(false);

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files) {
			const files = Array.from(target.files);
			onUpload(files);
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragOver = true;
		// Change cursor to copy when files are dragged over
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'copy';
		}
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;

		if (event.dataTransfer?.files) {
			const files = Array.from(event.dataTransfer.files);
			onUpload(files);
		}
	}
</script>

<label
	for="dropzone-file"
	class={cn(
		'flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-all duration-200 hover:border-blue-500 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-blue-500',
		isDragOver && 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
	)}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
>
	<div class="flex flex-col items-center justify-center pt-5 pb-6">
		<svg
			class={cn(
				'mb-4 h-8 w-8 text-gray-500 dark:text-gray-400',
				isDragOver && 'text-blue-500 dark:text-blue-400'
			)}
			aria-hidden="true"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 20 16"
		>
			<path
				stroke="currentColor"
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
			/>
		</svg>
		<p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
			<span class="font-semibold">Click to upload</span> or drag and drop files here
		</p>
		<p class="text-center text-xs text-gray-500 dark:text-gray-400">
			Files will be sent directly to your connected peer.
			<br />
			Please verify your selection before upload.
		</p>
	</div>
	<input id="dropzone-file" type="file" class="hidden" multiple onchange={handleFileSelect} />
</label>
