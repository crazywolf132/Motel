const http = require('http');
const https = require('https');
const fs = require('fs');

import app from './app';
const port = process.env.PORT || 8080;

let httpServer;
if (process.env.NODE_ENV === 'production') {
	console.info('creating server with https');
	console.info('KEYFILE_PATH:' + process.env.KEYFILE_PATH);
	console.info('CERTFILE_PATH:' + process.env.CERTFILE_PATH);
	httpServer = https.createServer(
		{
			key: fs.readFileSync(process.env.KEYFILE_PATH),
			cert: fs.readFileSync(process.env.CERTFILE_PATH)
		},
		app
	);
} else {
	console.info('creating server with http');
	httpServer = http.createServer(app);
}

httpServer.listen(port, () => {
	console.log(String.raw`

██╗    ██╗ ██████╗ ██╗     
██║    ██║██╔═══██╗██║     
██║ █╗ ██║██║   ██║██║     
██║███╗██║██║▄▄ ██║██║     
╚███╔███╔╝╚██████╔╝███████╗
 ╚══╝╚══╝  ╚══▀▀═╝ ╚══════╝

    WQL API running on port: ${port}
                                                    
`);
});
