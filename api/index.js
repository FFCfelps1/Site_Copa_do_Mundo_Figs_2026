let cachedHandler;

module.exports = async function handler(req, res) {
	if (!cachedHandler) {
		const serverModule = await import('../server/src/server.js');
		cachedHandler = serverModule.default;
	}

	return cachedHandler(req, res);
};
