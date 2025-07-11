import { PUBLIC_PEER_PREFIX } from '$env/static/public';
import { BetterPeer } from './betterPeer.svelte';

export const betterPeer = BetterPeer(PUBLIC_PEER_PREFIX);
