import { type DataConnection, default as Peer } from 'peerjs';
import { generateRandomString } from './utils';

export function BetterPeer(prefix: string = 'DEFEDFJEIDKD') {
	let id = $state<string>('');
	let peerId = $state<string>('');
	let remoteId = $state<string>('');
	let remotePeerId = $state<string>('');

	let peer = $state<Peer>();
	let connection = $state<DataConnection>();

	let status = $state<'LOADING' | 'READY' | 'PENDING' | 'CONNECTED'>('LOADING');

	// Store multiple error callbacks
	let errorCallbacks: ((message: string, type?: 'wrong-id') => void)[] = [];
	let successCallback: (() => void) | null = null;
	let dataCallback: ((data: unknown) => void) | null = null;

	// Function to invoke all registered error callbacks
	function triggerError(message: string, type?: 'wrong-id') {
		if (errorCallbacks.length > 0) {
			errorCallbacks.forEach((callback) => callback(message, type));
		} else {
			// Fallback to console.error if no callbacks are registered
			console.error('Peer Error:', message);
		}
	}

	function resetConnection() {
		console.log('Resetting connection');
		if (connection) {
			connection.close();
		}
		connection = undefined;
		status = 'READY';
		remoteId = '';
		remotePeerId = '';
	}

	function initialize() {
		status = 'LOADING';
		id = generateRandomString();
		peerId = `${prefix}_${id}`;
		peer = new Peer(peerId);

		peer.on('open', () => {
			console.log('Peer ready:', peerId);
			status = 'READY';
		});

		peer.on('error', (error) => {
			console.log('Peer error:', error);
			if (error.type === 'peer-unavailable') {
				triggerError("This peer doesn't exist or is not reachable", 'wrong-id');
			} else {
				triggerError(error.message);
			}
			resetConnection();
		});

		peer.on('connection', handleIncomingConnection);

		return destroy;
	}

	function setupConnectionListeners(conn: DataConnection) {
		conn.on('open', () => {
			status = 'CONNECTED';
			remotePeerId = conn.peer;
			remoteId = conn.peer.split('_')[1];

			if (dataCallback) {
				conn.on('data', (data: unknown) => {
					dataCallback?.(data);
				});
			}
			successCallback?.();
		});

		conn.on('close', () => {
			triggerError('Connection closed');
			resetConnection();
		});

		conn.on('error', (error) => {
			triggerError(error.message);
			resetConnection();
		});
	}

	function handleIncomingConnection(conn: DataConnection) {
		if (connection) {
			conn.close();
			return;
		}

		connection = conn;
		console.log('Incoming connection received');
		status = 'PENDING';
		setupConnectionListeners(conn);
	}

	async function connect(targetId: string) {
		console.log('Connecting to peer with ID:', targetId);
		if (connection) {
			throw new Error('Already connected to a peer');
		}

		status = 'PENDING';
		const targetPeerId = `${prefix}_${targetId}`;
		console.log('Connecting to peer:', targetPeerId);

		const conn = peer?.connect(targetPeerId);

		if (!conn) {
			triggerError('Unable to create connection object');
			resetConnection();
			return;
		}

		conn.on('error', (err) => {
			console.error('Connection error:', err);
			triggerError('Failed to connect to peer');
			resetConnection();
		});

		const timeout = setTimeout(() => {
			if (status === 'PENDING') {
				triggerError('Connection attempt timed out');
				conn.close();
				resetConnection();
			}
		}, 5000);

		conn.on('open', () => {
			clearTimeout(timeout);
		});

		connection = conn;
		setupConnectionListeners(conn);
	}

	function send<T>(data: T) {
		if (connection && status === 'CONNECTED') {
			console.log('Sending data:', data);
			connection.send(data);
		} else {
			const errorMsg = !connection ? 'No connection established' : 'Connection not ready';
			triggerError(errorMsg);
		}
	}

	function onData<T>(callback: (data: T) => void) {
		dataCallback = (data: unknown) => callback(data as T);
		if (connection && status === 'CONNECTED') {
			connection.on('data', (data: unknown) => {
				callback(data as T);
			});
		}
	}

	function disconnect() {
		if (connection) {
			resetConnection();
		}
	}

	function destroy() {
		disconnect();
		if (peer) {
			peer.destroy();
		}
	}

	// Updated onError to support multiple listeners
	function onError(callback: (message: string, type?: 'wrong-id') => void): () => void {
		errorCallbacks.push(callback);
		// Return an unsubscribe function
		return () => {
			errorCallbacks = errorCallbacks.filter((cb) => cb !== callback);
		};
	}

	function onSuccess(callback: () => void) {
		successCallback = callback;
	}

	return {
		id: () => id,
		peerId: () => peerId,
		remoteId: () => remoteId,
		remotePeerId: () => remotePeerId,
		status: () => status,
		initialize,
		connect,
		send,
		onData,
		disconnect,
		destroy,
		onError,
		onSuccess
	};
}
