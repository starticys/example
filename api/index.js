const cors = require('cors');
const express = require('express');
const app = express();
const nanoid = require('fix-esm').require('nanoid').nanoid;
require('express-ws')(app);

app.use(cors());

const activeConnections = {};

app.ws('/api/v1/chat', (ws, res) => {
    const id = nanoid();
    let username = 'anonymous';
    console.log('client connected! id=' + id);
    activeConnections[id] = ws;

    ws.send(JSON.stringify({
        type: 'CONN_INFO',
        id
    }));

    ws.on('close', msg => {
        console.log('client disconnected! id=' + id);
        delete activeConnections[id];
    });

    ws.on('message', msg => {
        const decodedMsg = JSON.parse(msg);
        let data = '';

        switch (decodedMsg.type) {
            case 'SET_USERNAME':
                username = decodedMsg.username;
                ws.username = username;
                break;
            case 'CREATE_MESSAGE':
                data = JSON.stringify({
                    type: 'NEW_MESSAGE',
                    message: {
                        username,
                        senderId: id,
                        text: decodedMsg.text
                    }
                });

                Object.keys(activeConnections).forEach(connId => {
                   const conn = activeConnections[connId];
                   conn.send(data);
                });
                break;
            case 'PERSONAL_MESSAGE':
                const conn = activeConnections[decodedMsg.receiverId];
                data = JSON.stringify({
                    type: 'NEW_MESSAGE',
                    message: {
                        username,
                        receiverName: conn.username,
                        receiverId: decodedMsg.receiverId,
                        senderId: id,
                        personal: true,
                        text: decodedMsg.text
                    }
                });

                if (decodedMsg.receiverId !== id) conn.send(data);
                ws.send(data);
                break;
            default:
                console.log('Unknown message type:' + decodedMsg.type);
        }
    });
});

app.listen(
    8010,
    () => console.log("Server running on ://localhost:8010")
);
