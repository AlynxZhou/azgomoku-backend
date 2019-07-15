const Color = {NONE: 1, WHITE: 2, BLACK: 3}

class Session {
	constructor(sid) {
		this.sid = sid
		this.win = 5
		this.mapx = 15
		this.mapy = 15
		this.map = new Array(this.mapx * this.mapy).fill(Color.NONE)
		// Create cross lines to check.
		// lines1 is from top-left to bottom-right.
		this.lines1 = []
		for (let i = 0; i <= this.mapy - this.win; ++i) {
			this.lines1.push({
				'begin': {'x': 0, 'y': i},
				'end': {'x': this.mapy - 1 - i, 'y': this.mapy - 1}
			})
		}
		for (let i = 0; i <= this.mapx - this.win; ++i) {
			this.lines1.push({
				'begin': {'x': i, 'y': 0},
				'end': {'x': this.mapx - 1, 'y': this.mapx - 1 - i}
			})
		}
		// lines2 is from bottom-left to top-right.
		this.lines2 = []
		for (let i = this.mapx - 1; i >= this.win - 1; --i) {
			this.lines2.push({
				'begin': {'x': 0, 'y': i},
				'end': {'x': i, 'y': 0}
			})
		}
		for (let i = 0; i <= this.mapy - this.win; ++i) {
			this.lines2.push({
				'begin': {'x': i, 'y': this.mapy - 1},
				'end': {'x': this.mapx - 1, 'y': i}
			})
		}
		this.white = null
		this.black = null
		this.nextColor = Color.BLACK
		this.result = null
		this.records = []
	}
	getWatchers(watchers) {
		return Object.values(watchers).filter((watcher) => {
			return watcher.sid === this.sid
		})
	}
	canJoin(watcher) {
		return watcher != null &&
		       (this.black === watcher || this.white === watcher ||
					  this.black == null || this.white == null)
	}
	index(x, y) {
		return y * this.mapx + x
	}
	checkColumn() {
		for (let i = 0; i < this.mapx; ++i) {
			let gomoku = 0
			let lastColor = Color.NONE
			for (let j = 0; j < this.mapy; ++j) {
				if (this.map[this.index(i, j)] !== Color.NONE) {
					if (this.map[this.index(i, j)] === lastColor) {
						if (++gomoku >= this.win) {
							return lastColor
						}
					} else {
						lastColor = this.map[this.index(i, j)]
						gomoku = lastColor === Color.NONE ? 0 : 1
					}
				}
			}
		}
		return null
	}
	checkRow() {
		for (let j = 0; j < this.mapy; ++j) {
			let gomoku = 0
			let lastColor = Color.NONE
			for (let i = 0; i < this.mapx; ++i) {
				if (this.map[this.index(i, j)] !== Color.NONE) {
					if (this.map[this.index(i, j)] === lastColor) {
						if (++gomoku >= this.win) {
							return lastColor
						}
					} else {
						lastColor = this.map[this.index(i, j)]
						gomoku = lastColor === Color.NONE ? 0 : 1
					}
				}
			}
		}
		return null
	}
	checkCross() {
		for (let line of this.lines1) {
			let gomoku = 0
			let lastColor = Color.NONE
			for (let i = line.begin.x, j = line.begin.y;
					 i <= line.end.x && j <= line.end.y;
					 ++i, ++j) {
				if (this.map[this.index(i, j)] !== Color.NONE) {
 					if (this.map[this.index(i, j)] === lastColor) {
 						if (++gomoku >= this.win) {
 							return lastColor
 						}
 					} else {
						lastColor = this.map[this.index(i, j)]
						gomoku = lastColor === Color.NONE ? 0 : 1
 					}
 				}
			}
		}
		for (let line of this.lines2) {
			let gomoku = 0
			let lastColor = Color.NONE
			for (let i = line.begin.x, j = line.begin.y;
					 i <= line.end.x && j >= line.end.y;
					 ++i, --j) {
				if (this.map[this.index(i, j)] !== Color.NONE) {
 					if (this.map[this.index(i, j)] === lastColor) {
 						if (++gomoku >= this.win) {
 							return lastColor
 						}
 					} else {
 						lastColor = this.map[this.index(i, j)]
						gomoku = lastColor === Color.NONE ? 0 : 1
 					}
 				}
			}
		}
		return null
	}
	checkMap() {
		this.result = this.checkRow()
		if (this.result != null) {
			return
		}
		this.result = this.checkColumn()
		if (this.result != null) {
			return
		}
		this.result = this.checkCross()
		if (this.result != null) {
			return
		}
	}
}

class Watcher {
	constructor(wid, socket, color = Color.NONE) {
		this.wid = wid
		this.socket = socket
		this.color = color
		this.sid = null
	}
}

module.exports = {
	Color,
	Session,
	Watcher
}
