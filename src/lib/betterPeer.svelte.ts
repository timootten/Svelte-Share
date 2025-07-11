import { type DataConnection, default as Peer } from 'peerjs';

function generateRandomString(length = 6): string {
	const chars = '0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

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
	let dataCallback: ((data: unknown) => void) | null = null;

	function resetConnection() {
		if (connection) {
			connection.close();
		}
		connection = undefined;
		// Reset to READY instead of PENDING since peer is still available
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
			if (errorCallback) {
				if (error.type === 'peer-unavailable') {
					status = 'READY';
					errorCallback("This peer doesn't exist or is not reachable");
				} else {
					errorCallback(error.message);
				}
			} else {
				console.error('Peer error:', error);
			}
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
		if (connection) {
			throw new Error('Already connected to a peer');
		}

		// Set to PENDING when attempting to connect
		status = 'PENDING';
		const targetPeerId = `${prefix}_${targetId}`;
		console.log('Connecting to peer:', targetPeerId);

		const conn = peer?.connect(targetPeerId);
		if (!conn) {
			// Reset to READY if connection fails
			status = 'READY';
			if (errorCallback) {
				errorCallback("This peer doesn't exist or is not reachable");
			} else {
				console.error("This peer doesn't exist or is not reachable");
			}
			return;
		}

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
		onError
	};
}
