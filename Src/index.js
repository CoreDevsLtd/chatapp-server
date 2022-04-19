const express = require('express');
require('./Db/mongoDb');
const path = require('path');
const http = require('http');
const { Server, Socket } = require('socket.io');
const cors = require('cors');
const app = express();
app.use(cors())

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
    }
});

const MessageModel = require('./Schemas/Message');
const UserModel = require('./Schemas/User');
const Rooms = require('./Schemas/Rooms');

/**
 * This class function is used to take out last item from an array.
 */
class LastTen {
    constructor() {
        /**
         * This constructor carries the last 10 item.
         */
        this.lastTen = [];
    }
    /**
     * This function expects an array as its param and then it process the array and saves the last 10 item to it's constructor.
     * @param {array} array 
     */
    takeOut(array) {
        this.lastTen = array.slice(Math.max(array.length - 10, 0))
    }
}

io.on('connection', (socket) => {
    console.log('user connected');
    //join user
    socket.on('join user', (id) => socket.join(id))

    //get all users
    socket.on('allUser', async () => {
        const result = await UserModel.find({});
        socket.emit('allUser', result)
    });

    //get groups
    socket.on('getGroups', async (currentUser) => {
        const result = await Rooms.find({ isPrivate: false, users: { $in: currentUser } })
        socket.emit('groups', result);
    })

    //find a user with name
    socket.on('finduser', async (name) => {
        const result = await UserModel.findOne({ userName: name });
        if (result) {
            socket.emit('userId', result._id);
        }
        // if user not found then set user to database and send the id to client
        else {
            const result = await UserModel({ userName: name }).save();
            socket.emit('userId', result._id);
        }
    })

    //get user data with id
    socket.on('userData', async userId => {
        const result = await UserModel.findOne({ _id: userId })
        if (result) {
            socket.emit('userData', result)
        }
        else {
            socket.emit('userData', {})
        }
    })
    //create room for group
    socket.on('createGroup', async (data) => {
        const result = await new Rooms(data).save();
        socket.emit('groups', result)
    })

    //check if room exists 
    socket.on('checkRoom', async (data) => {
        const { isPrivate, users } = data;
        var result;
        if (isPrivate) {
            /**
             * If user on his own inbox then search for the first id in users array of room data. If not then search for the both in users array of room data.
             */
            if (users[0] === users[1]) {
                result = await Rooms.findOne({ isSelf: true, users: { $all: users[0] } })
            } else {
                result = await Rooms.findOne({ isPrivate, users: { $all: users } })
            }
        }
        else {
            const { targetInbox } = data;
            const response = await Rooms.findOne({ roomName: targetInbox, isPrivate });
            //set result if only response is present because if result has been set null from here then a new room will be created automatically. Auto room creation is implemented only for private chat.
            if (response) {
                result = response;
            }
        }
        if (result) {
            /**
             * If length of messages is more than 10 then take out the last 10 messages and send to frontend.
             */
            if (result.messages.length > 10) {
                const newArray = new LastTen();
                newArray.takeOut(result.messages);
                result['messages'] = newArray.lastTen;
                socket.emit('room', result);
            }
            else {
                socket.emit('room', result)
            }
        }
        // if room doesn't exists then create one
        else if (result === null) {
            var roomObj = { isPrivate, users };
            if (users[0] === users[1]) {
                roomObj['isSelf'] = true;
            }
            const cursor = new Rooms(roomObj);
            const roomRes = await cursor.save();
            socket.emit('room', roomRes)
        }
    })

    //when message sent
    socket.on('onChat', async (data) => {
        const { roomId, message, from, to, isThread } = data;
        var msgObject = { isThread, message, from, to };
        if (data.parent) {
            msgObject['parent'] = data.parent;
        }
        const result = await new MessageModel(msgObject).save();
        /**
         * If it is thread then update the threads field of room data and if it is not thread then update the messages field of room data.
         */
        if (isThread) {
            await Rooms.updateOne({ _id: roomId }, { $push: { threads: result.parent } });
        } else {
            await Rooms.updateOne({ _id: roomId }, { $push: { messages: result._id } });
        }
        //send reply
        io.in(roomId).emit('reply', result);
    });

    //get single message
    socket.on('singleMessage', async (messageId) => {
        const result = await MessageModel.findOne({ _id: messageId });
        if (result) {
            socket.emit('messageData', result);
        }
    });
    //get threads by parent
    socket.on('getThreads', async (parentId) => {
        const result = await MessageModel.find({ parent: parentId });
        if (result) {
            socket.emit('threads', result)
        }
    })
    //disconnect users
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

io.on('message', message => {
    console.log(message)
})

server.listen(8000, () => {
    console.log('listening on *:8000');
});