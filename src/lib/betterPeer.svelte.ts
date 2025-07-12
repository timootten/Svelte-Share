import { type DataConnection, default as Peer } from 'peerjs';
import { generateRandomString } from './utils';

export function BetterPeer(prefix: string = 'DEFEDFJEIDKD') {
	let id = $state<string>('');
	let peerId = $state<string>('');
	let remoteId = $state<string>('');
	let remotePeerId = $state<string>('');

	let peer = $state<Peer>();
	let connection = $state<DataConnection>();

	// Updated status type with all four states
	let status = $state<'LOADING' | 'READY' | 'PENDING' | 'CONNECTED'>('LOADING');

	// Error callback
	let errorCallback: ((message: string) => void) | null = null;
	let successCallback: (() => void) | null = null;
	let dataCallback: ((data: unknown) => void) | null = null;

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

	// Initialize peer
	function initialize() {
		// Set to LOADING when starting initialization
		status = 'LOADING';
		id = generateRandomString();
		peerId = `${prefix}_${id}`;
		peer = new Peer(peerId);

		peer.on('open', () => {
			console.log('Peer ready:', peerId);
			// Set to READY when peer is initialized and ready for connections
			status = 'READY';
		});

		peer.on('error', (error) => {
			console.log('Peer error:', error);
			if (errorCallback) {
				if (error.type === 'peer-unavailable') {
					errorCallback("This peer doesn't exist or is not reachable");
				} else {
					errorCallback(error.message);
				}
			} else {
				console.error('Peer error:', error);
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
			remoteId = conn.peer.split('_')[1]; // Extract remote ID from peer ID

			// Set up data listener immediately when connection opens
			if (dataCallback) {
				conn.on('data', (data: unknown) => {
					dataCallback?.(data);
				});
			}

			successCallback?.();
		});

		conn.on('close', () => {
			errorCallback?.('Connection closed by remote peer');
			resetConnection();
		});

		conn.on('error', (error) => {
			if (errorCallback) {
				errorCallback(error.message);
			} else {
				console.error('Connection error:', error);
			}
			resetConnection();
		});
	}

	function handleIncomingConnection(conn: DataConnection) {
		// Reject if already connected (1-to-1 only)
		if (connection) {
			conn.close();
			return;
		}

		connection = conn;
		console.log('Incoming connection received');
		// Set to PENDING when receiving incoming connection
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
			errorCallback?.('Unable to create connection object');
			resetConnection();
			return;
		}

		// Immediately attach error listener
		conn.on('error', (err) => {
			console.error('Connection error:', err);
			errorCallback?.('Failed to connect to peer');
			resetConnection();
		});

		// Optional: add a timeout in case neither 'open' nor 'error' is triggered
		const timeout = setTimeout(() => {
			if (status === 'PENDING') {
				errorCallback?.('Connection attempt timed out');
				conn.close();
				resetConnection();
			}
		}, 5000); // 5 seconds timeout

		conn.on('open', () => {
			clearTimeout(timeout); // Clear timeout on success
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
			if (errorCallback) {
				errorCallback(errorMsg);
			} else {
				console.error(errorMsg);
			}
		}
	}

	function onData<T>(callback: (data: T) => void) {
		dataCallback = (data: unknown) => callback(data as T);

		// If connection already exists and is open, set up listener immediately
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

	function onError(callback: (message: string) => void) {
		errorCallback = callback;
	}

	function onSuccess(callback: () => void) {
		successCallback = callback;
	}

	return {
		id() {
			return id;
		},
		peerId() {
			return peerId;
		},
		remoteId() {
			return remoteId;
		},
		remotePeerId() {
			return remotePeerId;
		},
		status() {
			return status;
		},
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
