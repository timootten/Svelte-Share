import { browser } from '$app/environment';

export const getRemoteId = () => {
	if (!browser) return '';
	const match = window?.location?.hash.match(/#(\d{6})\b/);
	return match ? match[1] : '';
};
