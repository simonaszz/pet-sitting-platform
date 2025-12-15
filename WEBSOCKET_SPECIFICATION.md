# ⚡ WebSocket (Socket.IO) Specifikacija

## Connection

### Client setup
```typescript
import { io } from 'socket.io-client';

const socket = io('ws://localhost:5000', {
  auth: {
    token: accessToken // JWT token
  },
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});
```

### Server authentication
```typescript
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // Verify JWT and attach user to socket
  socket.data.userId = decodedUserId;
  next();
});
```

---

## 📨 Chat Events

### Client → Server

#### `join_chat`
Join chat room
```typescript
socket.emit('join_chat', {
  chatId: 'uuid'
});
```

#### `leave_chat`
Leave chat room
```typescript
socket.emit('leave_chat', {
  chatId: 'uuid'
});
```

#### `send_message`
Send message
```typescript
socket.emit('send_message', {
  chatId: 'uuid',
  text: 'Hello!',
  attachmentUrl: null // optional
});
```

#### `typing`
Typing indicator
```typescript
socket.emit('typing', {
  chatId: 'uuid',
  isTyping: true // or false
});
```

#### `mark_read`
Mark messages as read
```typescript
socket.emit('mark_read', {
  chatId: 'uuid',
  messageIds: ['uuid1', 'uuid2']
});
```

#### `edit_message`
Edit sent message
```typescript
socket.emit('edit_message', {
  messageId: 'uuid',
  newText: 'Updated text'
});
```

#### `delete_message`
Delete sent message
```typescript
socket.emit('delete_message', {
  messageId: 'uuid'
});
```

---

### Server → Client

#### `chat_joined`
Confirmation of joining chat
```typescript
socket.on('chat_joined', (data) => {
  // data: { chatId: 'uuid', success: true }
});
```

#### `new_message`
New message received
```typescript
socket.on('new_message', (message) => {
  /*
  {
    id: 'uuid',
    chatId: 'uuid',
    senderId: 'uuid',
    sender: {
      name: 'Jane Smith',
      avatar: 'url'
    },
    text: 'Hello!',
    attachmentUrl: null,
    isRead: false,
    createdAt: '2024-01-01T12:00:00Z'
  }
  */
});
```

#### `message_edited`
Message was edited
```typescript
socket.on('message_edited', (data) => {
  /*
  {
    messageId: 'uuid',
    newText: 'Updated text',
    editedAt: '2024-01-01T12:05:00Z'
  }
  */
});
```

#### `message_deleted`
Message was deleted
```typescript
socket.on('message_deleted', (data) => {
  /*
  {
    messageId: 'uuid',
    deletedAt: '2024-01-01T12:10:00Z'
  }
  */
});
```

#### `user_typing`
Other user is typing
```typescript
socket.on('user_typing', (data) => {
  /*
  {
    chatId: 'uuid',
    userId: 'uuid',
    userName: 'Jane Smith',
    isTyping: true
  }
  */
});
```

#### `messages_read`
Messages were read by recipient
```typescript
socket.on('messages_read', (data) => {
  /*
  {
    chatId: 'uuid',
    messageIds: ['uuid1', 'uuid2'],
    readBy: 'uuid',
    readAt: '2024-01-01T12:01:00Z'
  }
  */
});
```

---

## 📅 Booking Events

### Server → Client

#### `booking_status_changed`
Visit status was updated
```typescript
socket.on('booking_status_changed', (data) => {
  /*
  {
    visitId: 'uuid',
    status: 'ACCEPTED',
    updatedBy: {
      id: 'uuid',
      name: 'Jane Smith'
    },
    updatedAt: '2024-01-01T12:00:00Z'
  }
  */
});
```

#### `new_booking_request`
New booking request (for sitter)
```typescript
socket.on('new_booking_request', (data) => {
  /*
  {
    visitId: 'uuid',
    owner: {
      name: 'John Doe',
      avatar: 'url'
    },
    pet: {
      name: 'Buddy',
      type: 'DOG'
    },
    date: '2024-06-15',
    timeStart: '09:00',
    timeEnd: '17:00'
  }
  */
});
```

---

## 🔔 Notification Events

### Server → Client

#### `notification`
New notification
```typescript
socket.on('notification', (notification) => {
  /*
  {
    id: 'uuid',
    type: 'BOOKING_REQUEST',
    title: 'New booking request',
    body: 'John Doe wants to book you for June 15',
    relatedEntityId: 'visit_uuid',
    createdAt: '2024-01-01T12:00:00Z'
  }
  */
});
```

---

## 🔌 Connection Events

### Server → Client

#### `connect`
Successfully connected
```typescript
socket.on('connect', () => {
  console.log('Connected to WebSocket');
});
```

#### `disconnect`
Disconnected
```typescript
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
```

#### `connect_error`
Connection error
```typescript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

#### `reconnect`
Reconnected
```typescript
socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
});
```

---

## 🛡️ Error Handling

### Server → Client

#### `error`
General error
```typescript
socket.on('error', (error) => {
  /*
  {
    message: 'You are not authorized to join this chat',
    code: 'FORBIDDEN'
  }
  */
});
```

---

## 🔐 Security Features

### Rate Limiting
```typescript
// Max events per minute per user
const rateLimits = {
  send_message: 30,
  typing: 60,
  mark_read: 60
};
```

### Message Validation
```typescript
// Max message length
const MAX_MESSAGE_LENGTH = 5000;

// Allowed attachment types
const ALLOWED_ATTACHMENTS = ['image/jpeg', 'image/png', 'application/pdf'];
```

### Chat Authorization
```typescript
// User can only join chats they are part of
// Verify on server before emitting to room
```

---

## 📊 Rooms Structure

### Chat Rooms
```typescript
// Format: chat:{chatId}
socket.join(`chat:${chatId}`);
```

### User Rooms
```typescript
// Format: user:{userId}
// For personal notifications, booking updates
socket.join(`user:${userId}`);
```

---

## 🔄 Reconnection Strategy

### Client-side
```typescript
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

socket.on('disconnect', () => {
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    setTimeout(() => {
      socket.connect();
      reconnectAttempts++;
    }, 1000 * reconnectAttempts);
  }
});

socket.on('connect', () => {
  reconnectAttempts = 0;
  // Re-join active chats
  activeChats.forEach(chatId => {
    socket.emit('join_chat', { chatId });
  });
});
```

---

## 📝 Implementation Notes

### Backend (NestJS + Socket.IO)

```typescript
// gateway/chat.gateway.ts
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageDto
  ) {
    // 1. Validate data
    // 2. Save to DB
    // 3. Emit to chat room
    this.server.to(`chat:${data.chatId}`).emit('new_message', message);
  }
}
```

### Frontend (React + Socket.IO)

```typescript
// hooks/useSocket.ts
export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    const newSocket = io(WS_URL, {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Connected');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token]);

  return socket;
};

// hooks/useChat.ts
export const useChat = (chatId: string) => {
  const socket = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!socket) return;

    socket.emit('join_chat', { chatId });

    socket.on('new_message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      socket.emit('leave_chat', { chatId });
      socket.off('new_message');
    };
  }, [socket, chatId]);

  const sendMessage = (text: string) => {
    socket?.emit('send_message', { chatId, text });
  };

  return { messages, sendMessage };
};
```

---

## 🧪 Testing WebSocket

### Manual testing (Socket.IO client)
```bash
npm install -g socket.io-client-cli

# Connect
sioc connect http://localhost:5000 --auth '{"token":"YOUR_JWT"}'

# Send event
sioc emit send_message '{"chatId":"xxx","text":"test"}'

# Listen
sioc on new_message
```

### Automated testing
```typescript
// test/chat.gateway.spec.ts
import { io, Socket } from 'socket.io-client';

describe('ChatGateway', () => {
  let clientSocket: Socket;

  beforeAll((done) => {
    clientSocket = io('http://localhost:5000', {
      auth: { token: validToken }
    });
    clientSocket.on('connect', done);
  });

  afterAll(() => {
    clientSocket.close();
  });

  it('should send and receive messages', (done) => {
    clientSocket.on('new_message', (message) => {
      expect(message.text).toBe('Hello');
      done();
    });

    clientSocket.emit('send_message', {
      chatId: 'test-chat-id',
      text: 'Hello'
    });
  });
});
```
