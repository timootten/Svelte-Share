<script lang="ts">
	import * as InputOTP from '$lib/components/ui/input-otp/index.js';
	import { PinInput as InputOTPPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import { REGEXP_ONLY_DIGITS } from 'bits-ui';

	let {
		value = $bindable(''),
		status = $bindable('DEFAULT'),
		...restProps
	}: {
		maxlength?: number;
		status?: 'DEFAULT' | 'ERROR' | 'SUCCESS' | 'PENDING';
	} & InputOTPPrimitive.RootProps = $props();

	const className = $derived(
		cn({
			'border-red-400': status === 'ERROR',
			'border-green-400': status === 'SUCCESS',
			'border-yellow-400': status === 'PENDING'
		})
	);
</script>

<InputOTP.Root autofocus pattern={REGEXP_ONLY_DIGITS} bind:value {...restProps}>
	{#snippet children({ cells })}
		<InputOTP.Group>
			{#each cells.slice(0, 3) as cell}
				<InputOTP.Slot class={className} {cell} />
			{/each}
		</InputOTP.Group>
		<InputOTP.Separator />
		<InputOTP.Group>
			{#each cells.slice(3, 6) as cell}
				<InputOTP.Slot class={className} {cell} />
			{/each}
		</InputOTP.Group>
	{/snippet}
</InputOTP.Root>
