import { io } from 'socket.io-client';

function createConnection(urlService) {
  const connection = io(urlService);

  return connection;
}

export default createConnection;
