import createConnection from './io';

import Interview from './components/Interview';
import ClientsList from './components/ClientsList';

// const serverConnection = createConnection('wss://webrtc-interview.ru');
const serverConnection = createConnection('wss://0.0.0.0:6969/');

Interview.iceServers = [
  { url: 'stun:stun.l.google.com:19302' },
  // { url: 'stun:stun1.l.google.com:19302' },
  // { url: 'stun:stun2.l.google.com:19302' },
  // { url: 'stun:stun3.l.google.com:19302' },
  // { url: 'stun:stun4.l.google.com:19302' },
  // {
  //   url: 'turn:numb.viagenie.ca',
  //   credential: 'muazkh',
  //   username: 'webrtc@live.com',
  // },
  // {
  //   url: 'turn:192.158.29.39:3478?transport=udp',
  //   credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
  //   username: '28224511:1379330808',
  // },
  {
    url: 'turn:192.158.29.39:3478?transport=tcp',
    credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
    username: '28224511:1379330808',
  },
];
Interview.connection = serverConnection;

// ClientsList.clientsServer = 'https://webrtc-interview.ru';
ClientsList.clientsServer = 'https://0.0.0.0:6969';
ClientsList.connection = serverConnection;

customElements.define('webrtc-interview', Interview);
customElements.define('clients-list', ClientsList);

serverConnection.on('connect', () => {
  console.log(`Create connection: ${serverConnection.id}`);
});

serverConnection.on('createConnection', (roomId) => {
  console.log(`Add to room: ${roomId}`);
  const container = document.getElementById('root_container');
  container.removeChild(container.firstChild);
  container.innerHTML = `<webrtc-interview connection="${roomId}" />`;
});
