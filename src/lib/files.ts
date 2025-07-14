import { v4 as uuidv4 } from 'uuid';

type ProgressCallback = (fileId: string, fileName: string, progress: number) => void;
type CompleteCallback = (file: CustomFileType) => void;

export type CustomFileType = {
	name: string;
	type: string;
	data: ArrayBuffer;
};

export type FileChunk = {
	type: 'file-chunk';
	id: string;
	fileName: string;
	fileType: string;
	chunkIndex: number;
	totalChunks: number;
	chunkData: ArrayBuffer;
};

export function sendFiles(files: File[], send: (data: FileChunk) => void) {
	const progressListeners: ProgressCallback[] = [];
	const completeListeners: CompleteCallback[] = [];

	files.forEach((file) => {
		const reader = new FileReader();
		const chunkSize = 64 * 1024; // 64KB Chunkgröße für bessere Performance
		let offset = 0;
		const id = uuidv4();
		const totalSize = file.size;
		const totalChunks = Math.ceil(totalSize / chunkSize);
		let chunkIndex = 0;

		reader.onload = () => {
			if (!reader.result) return;

			const chunkData = reader.result as ArrayBuffer;

			const chunk: FileChunk = {
				type: 'file-chunk',
				id,
				fileName: file.name,
				fileType: file.type,
				chunkIndex,
				totalChunks,
				chunkData
			};

			send(chunk);

			offset += chunkData.byteLength;
			chunkIndex++;

			const progress = Math.min((offset / totalSize) * 100, 100);
			progressListeners.forEach((cb) => cb(id, file.name, progress));

			if (offset < totalSize) {
				readSlice();
			} else {
				completeListeners.forEach((cb) =>
					cb({
						name: file.name,
						type: file.type,
						data: chunkData
					})
				);
			}
		};

		const readSlice = () => {
			const slice = file.slice(offset, offset + chunkSize);
			reader.readAsArrayBuffer(slice);
		};

		readSlice();
	});

	return {
		onProgress(cb: ProgressCallback) {
			progressListeners.push(cb);
		},
		onComplete(cb: CompleteCallback) {
			completeListeners.push(cb);
		}
	};
}

export function createChunkReceiver() {
	const chunkBuffers = new Map<string, Array<ArrayBuffer>>();
	const metaMap = new Map<string, { fileName: string; fileType: string; totalChunks: number }>();
	const progressListeners: ProgressCallback[] = [];
	const completeListeners: CompleteCallback[] = [];

	function handleChunk(data: FileChunk) {
		const { id, fileName, fileType, chunkIndex, totalChunks, chunkData } = data;

		if (!chunkBuffers.has(id)) {
			chunkBuffers.set(id, new Array(totalChunks).fill(null));
			metaMap.set(id, { fileName, fileType, totalChunks });
		}

		const buffer = chunkBuffers.get(id)!;
		buffer[chunkIndex] = chunkData;

		const receivedCount = buffer.filter(Boolean).length;
		const percent = Math.round((receivedCount / totalChunks) * 100);
		progressListeners.forEach((cb) => cb(id, fileName, percent));

		if (receivedCount === totalChunks) {
			const combined = concatenateChunks(buffer as Array<ArrayBuffer>);
			const meta = metaMap.get(id)!;

			completeListeners.forEach((cb) =>
				cb({
					name: meta.fileName,
					type: meta.fileType,
					data: combined
				})
			);

			// Cleanup
			chunkBuffers.delete(id);
			metaMap.delete(id);
		}
	}

	function concatenateChunks(chunks: Array<ArrayBuffer>): ArrayBuffer {
		const totalLength = chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
		const temp = new Uint8Array(totalLength);
		let offset = 0;
		for (const chunk of chunks) {
			temp.set(new Uint8Array(chunk), offset);
			offset += chunk.byteLength;
		}
		return temp.buffer;
	}

	return {
		handleChunk,
		onComplete(cb: CompleteCallback) {
			completeListeners.push(cb);
		},
		onProgress(cb: ProgressCallback) {
			progressListeners.push(cb);
		}
	};
}

export function downloadFile(file: CustomFileType): void {
	// Create blob from ArrayBuffer
	const blob = new Blob([file.data], { type: file.type });

	// Create object URL
	const url = URL.createObjectURL(blob);

	// Create temporary anchor element and trigger download
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = file.name;

	// Append to body, click, and cleanup
	document.body.appendChild(anchor);
	anchor.click();
	document.body.removeChild(anchor);

	// Revoke object URL to free memory
	URL.revokeObjectURL(url);
}
