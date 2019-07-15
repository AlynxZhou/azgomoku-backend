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

const emitList = (socket, watcher) => {
	socket.emit("list", JSON.stringify({
		"sessions": Object.values(sessions).map((session) => {
			return {
				'sid': session.sid,
				'wids': session.getWatchers(watchers).map((watcher) => {
					return watcher.wid
				}),
				'canJoin': session.canJoin(watcher)
			}
		}),
	}))
}

const emitMap = (socket, session) => {
	socket.emit('map', JSON.stringify({
		'result': session.result,
		'nextColor': session.nextColor,
		'map': session['map'],
		'mapx': session['mapx'],
		'mapy': session['mapy']
	}))
}

io.on('connection', (socket) => {
	socket.on('watcher', (msg) => {
		const watcher = new Watcher(newWid(), socket)
		watchers[watcher.wid] = watcher
		socket.wid = watcher.wid
		socket.emit('watcher', JSON.stringify({'wid': watcher.wid}))
	})

	socket.on('list', (msg) => {
		const data = JSON.parse(msg)
		const {wid} = data
		const watcher = watchers[wid]
		emitList(socket, watcher)
	})

	socket.on('session', (msg) => {
		const session = new Session(newSid())
		sessions[session.sid] = session
		socket.emit("session", JSON.stringify({"sid": session.sid}))
		Object.values(watchers).map((watcher) => {
			emitList(watcher.socket, watcher)
		})
	})

	socket.on('yoroshiku', (msg) => {
		const data = JSON.parse(msg)
		let {sid, wid} = data
		if (wid == null) {
			return
		}
		const watcher = watchers[wid]
		if (watcher == null) {
			return
		}
		const session = sessions[sid]
		if (session == null) {
			socket.emit('arimasen')
			return
		}
		if (!session.canJoin(watcher)) {
			return
		}
		if (session.black !== watcher && session.white !== watcher) {
			// First is black.
			if (session.black == null) {
				watcher.color = Color.BLACK
				session.black = watcher
			} else if (session.white == null) {
				watcher.color = Color.WHITE
				session.white = watcher
			}
		}
		// Add watcher to session.
		watcher.sid = session.sid
		socket.emit('kochirakoso', JSON.stringify({
			'sid': session.sid,
			'color': watcher.color
		}))
		emitMap(watcher.socket, session)
	})

	socket.on('sumimasen', (msg) => {
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
		watcher.sid = session.sid
		socket.emit('hai', JSON.stringify({
			'sid': session.sid
		}))
		emitMap(watcher.socket, session)
	})

	socket.on('step', (msg) => {
		const data = JSON.parse(msg)
		const {sid, wid, step} = data
		const session = sessions[sid]
		if (session == null) {
			return
		}
		const watcher = watchers[wid]
		const {color} = watcher
		if (color === Color.NONE ||
		    Object.values(Color).indexOf(color) === -1 ||
		    color !== session.nextColor) {
			return
		}
		const record = {'color': color, 'x': step.x, 'y': step.y}
		if (session.map[session.index(record.x, record.y)] === Color.NONE) {
			session.map[session.index(record.x, record.y)] = record.color
		} else {
			return
		}
		session.records.push(record)
		session.checkMap()
		if (color === Color.WHITE) {
			session.nextColor = Color.BLACK
		} else if (color === Color.BLACK) {
			session.nextColor = Color.WHITE
		}
		session.getWatchers(watchers).map((watcher) => {
			emitMap(watcher.socket, session)
		})
		if (session.result != null) {
			session.getWatchers(watcher).map((watcher) => {
				watcher.sid = null
			})
			delete sessions[session.sid]
			Object.values(watchers).map((watcher) => {
				emitList(watcher.socket)
			})
		}
	})

	socket.on('sayonara', (msg) => {
		const data = JSON.parse(msg)
		const {wid} = data
		const watcher = watchers[wid]
		const session = sessions[watcher.sid]
		delete watchers[watcher.wid]
		if (session == null) {
			return
		}
		if (session.black === watcher) {
			session.getWatchers(watchers).map((watcher) => {
				watcher.socket.emit('sayonara', JSON.stringify({
					'sayonara': Color.BLACK
				}))
			})
			delete sessions[session.sid]
			Object.values(watchers).map((watcher) => {
				emitList(watcher.socket)
			})
		}
		if (session.white === watcher) {
			session.getWatchers(watchers).map((watcher) => {
				watcher.socket.emit('sayonara', JSON.stringify({
					'sayonara': Color.WHITE
				}))
			})
			delete sessions[session.sid]
			Object.values(watchers).map((watcher) => {
				emitList(watcher.socket)
			})
		}
	})

	socket.on('disconnect', () => {
		if (socket.wid == null) {
			return
		}
		const watcher = watchers[socket.wid]
		delete watcher[socket.wid]
		if (watcher == null) {
			return
		}
		const session = sessions[watcher.sid]
		if (session == null) {
			return
		}
		if (session.black === watcher) {
			session.getWatchers(watchers).map((watcher) => {
				watcher.socket.emit('sayonara', JSON.stringify({
					'sayonara': Color.BLACK
				}))
			})
			delete sessions[session.sid]
			Object.values(watchers).map((watcher) => {
				emitList(watcher.socket)
			})
		}
		if (session.white === watcher) {
			session.getWatchers(watchers).map((watcher) => {
				watcher.socket.emit('sayonara', JSON.stringify({
					'sayonara': Color.WHITE
				}))
			})
			delete sessions[session.sid]
			Object.values(watchers).map((watcher) => {
				emitList(watcher.socket)
			})
		}
	})
})

io.listen(3003)
