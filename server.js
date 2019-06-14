const { MongoClient } = require('mongodb')
const socketio = require('socket.io').listen(4000).sockets

const dbName = 'mongo-chat';

(async function () {
	const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true })

	console.log('MongoDb connected...')

	const db = client.db(dbName)
	// Connect to socket.io
	socketio.on('connection', function (socket) {
		const sendStatus = function (s) {
			socket.emit('status', s)
		}

		const chatCollection = db.collection('chats')

		chatCollection.find().limit(100).sort({ _id: 1 }).toArray(function (err, result) {
			if (err) throw err

			socket.emit('output', result)
		})

		socket.on('input', async function ({ name, message }) {
			if (!name || !message) {
				sendStatus('Please enter a name and a message')
			} else {
				await chatCollection.insertOne({
					name,
					message
				})
				socketio.emit('output', [{ name, message }])

				sendStatus({
					message: 'Message sent',
					clear: true
				})
			}
		})

		socket.on('clear', async function (data) {
			// Remove all chat
			await chatCollection.deleteMany({})
			socketio.emit('cleared')
		})
	})
})()
