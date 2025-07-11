import { redirect } from '@sveltejs/kit';

export const load = async ({ isDataRequest }) => {
	if (!isDataRequest) redirect(307, '/');

	return {};
};
