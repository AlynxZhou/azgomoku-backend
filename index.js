const Server = require('socket.io')
const io = new Server()
const {Color, Session, Watcher} = require('./types')

const sessions = {}
const watchers = {}

let nextWid = 0
let nextSid = 0
const newWid = () => {
	return `w${nextWid++}`
}
const newSid = () => {
	return `s${nextSid++}`
}

io.on('connection', (socket) => {
	let watcher = new Watcher(newWid(), socket)
	watchers[watcher.wid] = watcher
	console.log(watcher.wid)
  socket.emit('connected', JSON.stringify({'wid': watcher.wid}))

	socket.on('list', (msg) => {
		console.log(msg)
		socket.emit("list", JSON.stringify({
			"sessions": Object.values(sessions).map((session) => {
				return {
					'sid': session.sid,
					'watchersLength': session.watchers.length
				}
			}),
		}))
	})

	socket.on('session', (msg) => {
		console.log(msg)
		const session = new Session(newSid())
		sessions[session.sid] = session
		socket.emit("session", JSON.stringify({
			"sid": session.sid
		}))
	})

	socket.on('yoroshiku', (msg) => {
		console.log(msg)
		const data = JSON.parse(msg)
		let {sid, wid} = data
		if (wid == null) {
			return
		}
		const watcher = watchers[wid]
		if (watcher == null) {
			return
		}
		let session
		if (sid == null) {
			session = new Session(newSid())
      sessions[session.sid] = session
			sid = session.sid
		} else {
			session = sessions[sid]
			if (session == null) {
				return
			}
		}
		if (session.black == null) {
			watcher.color = Color.BLACK
			session.black = watcher
		} else if (session.white == null) {
			watcher.color = Color.WHITE
			session.white = watcher
		}
		// Add watcher to session.
		session.watchers[watcher.wid] = watcher
		socket.emit('kochirakoso', JSON.stringify({
			'sid': session.sid,
			'color': watcher.color
		}))
		socket.emit('map', JSON.stringify({
			'result': session.result,
			'nextColor': session.nextColor,
			'map': sessions[sid]['map'],
			'mapx': sessions[sid]['mapx'],
			'mapy': sessions[sid]['mapy']
		}))
	})

	socket.on('sumimasen', (msg) => {
		console.log(msg)
		const data = JSON.parse(msg)
		const {wid, sid} = data
		if (wid == null) {
			return
		}
		const watcher = watchers[wid]
		if (watcher == null) {
			return
		}
		const session = sessions[sid]
		if (session == null) {
			return
		}
		// Add watcher to session.
		session.watchers[watcher.wid] = watcher
		socket.emit('hai', JSON.stringify({
			'sid': session.sid
		}))
		socket.emit('map', JSON.stringify({
			'result': session.result,
			'nextColor': session.nextColor,
			'map': sessions[sid]['map'],
			'mapx': sessions[sid]['mapx'],
			'mapy': sessions[sid]['mapy']
		}))
	})

	socket.on('step', (msg) => {
		console.log(msg)
		const data = JSON.parse(msg)
		const {sid, wid, step} = data
		const session = sessions[sid]
		if (session == null) {
			// TODO
			return
		}
		const watcher = session.watchers[wid]
		const {color} = watcher
		if (color === Color.NONE || Object.values(Color).indexOf(color) === -1) {
			return
		}
		const record = {'color': color, 'x': step.x, 'y': step.y}
		if (session.map[session.index(record.x, record.y)] === Color.NONE) {
			session.map[session.index(record.x, record.y)] = record.color
		} else {
			// TODO: Check map.
			return
		}
		session.records.push(record)
		result = session.checkMap()
		if (color === Color.WHITE) {
			session.nextColor = Color.BLACK
		} else if (color === Color.BLACK) {
			session.nextColor = Color.WHITE
		}
		Object.values(session.watchers).map((watcher) => {
			watcher.socket.emit('map', JSON.stringify({
				'result': session.result,
				'nextColor': session.nextColor,
				'map': sessions[sid]['map'],
				'mapx': sessions[sid]['mapx'],
				'mapy': sessions[sid]['mapy']
			}))
		})
	})

	socket.on('disconnect', () => {

	})
})

io.listen(3003)
