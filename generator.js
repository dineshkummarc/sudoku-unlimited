self.onmessage = function (event) {
	self.postMessage('ECHO: ' + event.data);
};
