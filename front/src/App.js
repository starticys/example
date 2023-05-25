import './App.css';
import {useEffect, useRef, useState} from "react";

function App() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');
  const [connId, setConnId] = useState(null);
  const [receiver, setReceiver] = useState(null);
  const [isLoggedIn, setLoggedIn] = useState(false);

  const ws = useRef(null);

  useEffect(() => {
     ws.current = new WebSocket('ws://localhost:8010/api/v1/chat');

     ws.current.onmessage = ({data}) => {
       const decodedMsg = JSON.parse(data);

       if (decodedMsg.type === 'NEW_MESSAGE') {
         setMessages(messages => [...messages, decodedMsg.message]);
       }

        if (decodedMsg.type === 'CONN_INFO') {
            setConnId(decodedMsg.id);
        }
     };

     ws.current.onclose = e => {
       console.log('connection closed!');
     };

     return () => ws.current.close();
  }, []);

  const changeMessage = ({currentTarget}) => {
    setMessage(currentTarget.value);
  };

  const changeUsername = ({currentTarget}) => {
    setUsername(currentTarget.value);
  };

    const sendData = data => {
        ws.current.send(JSON.stringify(data));
    };

  const sendUsername = e => {
      e.preventDefault();

      sendData({type: 'SET_USERNAME', username});
      setLoggedIn(true);
  };

  const sendMessage = e => {
      e.preventDefault();

      if (receiver) {
          sendData({
              type: 'PERSONAL_MESSAGE',
              text: message,
              receiverId: receiver.id
          });
          setReceiver(null);
      } else {
          sendData({type: 'CREATE_MESSAGE', text: message});
      }

      setMessage('');
  };

  let chat = (
    <div>
        {username && <h2>{username}</h2>}
        {
            messages.map((message, idx) => (
                <div key={idx}>
                    {
                        message.personal && <span>Answer from </span>
                    }
                    <b onClick={() => setReceiver({
                        id: message.senderId,
                        username: message.username
                    })}>
                        {message.senderId === connId ? 'you' : message.username }
                        {
                            message.personal
                            &&
                            <i> to { message.receiverId === connId ? 'you' : message.receiverName }</i>
                        }:
                    </b>
                    {message.text}
                </div>
            ))
        }
        <form onSubmit={sendMessage}>
            {receiver && <b>Answer for {receiver.username} </b>}
            <label>Enter message</label>
            <input
                onChange={changeMessage}
                value={message}
            />
            <button>Send</button>
        </form>
    </div>
  );

  if (!isLoggedIn) {
      chat = (
          <form onSubmit={sendUsername}>
              <label>Enter username</label>
              <input
                  onChange={changeUsername}
                  value={username}
              />
              <button>Send</button>
          </form>
      );
  }

  return <div className="App">{chat}</div>;
}

export default App;
