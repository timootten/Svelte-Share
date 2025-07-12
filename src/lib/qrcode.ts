export const getQRCode = async (url: string) => {
	const { default: QRCodeStyling } = await import('qr-code-styling');

	const qrCode = new QRCodeStyling({
		width: 300,
		height: 300,
		type: 'svg',
		data: url,
		dotsOptions: {
			color: '#36a8d1',
			type: 'extra-rounded'
		},
		cornersSquareOptions: {
			color: '#56a9c7',
			type: 'extra-rounded'
		},
		cornersDotOptions: {
			color: '#56a9c7',
			type: 'dot'
		},
		backgroundOptions: {
			color: 'transparent'
		},
		imageOptions: {
			crossOrigin: 'anonymous',
			margin: 20
		}
	});

	return qrCode;
};
