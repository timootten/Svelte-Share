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

	let peer = $state<Peer>();
	let connection = $state<DataConnection>();

	let status = $state<'PENDING' | 'CONNECTED'>('PENDING');

	// Error callback
	let errorCallback: ((message: string) => void) | null = null;
	let dataCallback: ((data: unknown) => void) | null = null;

	// Initialize peer
	function initialize() {
		id = generateRandomString();
		peerId = `${prefix}_${id}`;
		peer = new Peer(peerId);

		peer.on('open', () => {
			console.log('Peer ready:', peerId);
		});

		peer.on('error', (error) => {
			if (errorCallback) {
				errorCallback(error.message);
			} else {
				console.error('Peer error:', error);
			}
		});

		peer.on('connection', handleIncomingConnection);
	}

	function setupConnectionListeners(conn: DataConnection) {
		conn.on('open', () => {
			status = 'CONNECTED';
			console.log('Connection established');

			// Set up data listener immediately when connection opens
			if (dataCallback) {
				conn.on('data', (data: unknown) => {
					dataCallback?.(data);
				});
			}
		});

		conn.on('close', () => {
			connection = undefined;
			status = 'PENDING';
			console.log('Connection closed');
		});

		conn.on('error', (error) => {
			if (errorCallback) {
				errorCallback(error.message);
			} else {
				console.error('Connection error:', error);
			}
			connection = undefined;
			status = 'PENDING';
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
		setupConnectionListeners(conn);
	}

	async function connect(targetId: string) {
		if (connection) {
			throw new Error('Already connected to a peer');
		}

		const targetPeerId = `${prefix}_${targetId}`;
		console.log('Connecting to peer:', targetPeerId);

		const conn = peer?.connect(targetPeerId);
		if (!conn) {
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
			connection.close();
			connection = undefined;
			status = 'PENDING';
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
