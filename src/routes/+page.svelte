<script lang="ts">
	import { PUBLIC_PEER_PREFIX } from '$env/static/public';
	import { onMount } from 'svelte';
	import { default as Peer } from 'peerjs';
	import { generateRandomString } from '$lib/utils';

	let loading = true;
	let error = true;
	let errorMessage = '';
	let id = '';
	let peerId = '';

	onMount(() => {
		id = generateRandomString();
		peerId = (PUBLIC_PEER_PREFIX ?? 'SHARE_FJEIDKD_') + '_' + id;

		const peer = new Peer(peerId);

		peer.on('open', (id) => {
			console.log('Peer ID:', id);
			loading = false;
		});

		peer.on('error', (err) => {
			console.error('Peer error:', err);
			error = true;
			errorMessage = err.message || 'An unknown error occurred';
		});
	});
</script>

{id}
{peerId}
