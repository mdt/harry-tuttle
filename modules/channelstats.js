const Database = require('better-sqlite3')
const slugify = require("slug");

class ChannelTime {
	 constructor (dbFilePath) {
		  this.db = new Database(dbFilePath, { timeout: 10000 });

		  // summary statistics - updated whenever a user starts / stops speaking or joins / leaves a channel.
		  this.db.exec("create table if not exists channel_stats (channelId integer, uid integer, channel text, joined_seconds real DEFAULT 0, speaking_seconds real DEFAULT 0, PRIMARY KEY (channelId, uid))")

		  // tracking data - checked & updated whenever a user starts / stops speaking or joins / leaves a channel, then updates channel_stats. last_state_time is node.js Date.now(); speaking is bool
		  this.db.exec("create table if not exists current_channel (uid integer primary key, channelId integer, joined_time integer, last_state_time integer, speaking integer)")

		  // prepare statements
		  this.get_current_channel = this.db.prepare('SELECT channelId, joined_time, last_state_time, speaking FROM current_channel WHERE uid = ?')
		  this.get_current_channel.raw()
		  
		  this.insert_current_channel = this.db.prepare('INSERT OR REPLACE INTO current_channel VALUES (?, ?, ?, ?, 0)')
		  this.update_current_channel = this.db.prepare('UPDATE current_channel SET last_state_time = ?, speaking = ? WHERE uid = ?')
		  this.delete_current_channel = this.db.prepare('DELETE FROM current_channel WHERE uid = ?')
		  this.update_speaking = this.db.prepare('UPDATE channel_stats SET speaking_seconds = speaking_seconds + ? WHERE uid = ? AND channelId = ?')
		  this.update_joined = this.db.prepare('UPDATE channel_stats SET joined_seconds = joined_seconds + ? WHERE uid = ? AND channelId = ?')
		  this.stats_query = this.db.prepare('SELECT uid, joined_seconds, speaking_seconds FROM channel_stats WHERE channel = ? AND joined_seconds >= ? ORDER BY speaking_seconds DESC')
		  this.add_channel_stats = this.db.prepare('INSERT OR IGNORE INTO channel_stats (channelId, uid, channel) VALUES (?, ?, ?)')

		  process.on('exit', () => this.db.close())
	 }

	 get_channel_stats(channel_name, min_seconds = 0) {
		  // this isn't good enough, need to handle case where someone has been in one channel all day
		  return this.stats_query.all(channel_name, min_seconds)
	 }
	 
	 current_channel(uid) {
		  let state = this.get_current_channel.all(uid)
		  if (state.length < 1) {
				// error

				return false
		  } else if (state.length > 1) {
				// error

				return false
		  }
		  return state[0]
	 }
	 
	 on_speaking_change(uid, is_speaking) {
		  if (!is_speaking) {
				// update speaking_seconds
				let cur = this.current_channel(uid)
				if (!cur[3]) {
					 // was not speaking before - ignore
					 return
				}
				this.update_speaking.run(Date.now() - cur[2], uid, cur[0])
		  }
		  // update current_channel
		  this.update_current_channel.run(Date.now(), is_speaking, uid)
	 }

	 on_channel_join(uid, channelId, channelName) {
		  console.log(`on_channel_join ${uid} ${channelId} ${channelName}`)
		  const chanName = slugify(channelName.toLowerCase()).replace(/[^-0-9a-z_]/g, '');
		  this.add_channel_stats.run(channelId, uid, chanName)
		  this.insert_current_channel.run(uid, channelId, Date.now(), Date.now())
	 }

	 on_channel_leave(uid, channelId) { // note this must be called before on_channel_join for a leave/join pair
		  // update speaking just in case?
		  this.on_speaking_change(uid, false)

		  // update channel_stats
		  let cur = this.current_channel(uid)
		  if (cur[0] != channelId) {
				// channel mismatch, error / ignore
		  } else {
				this.update_joined.run(Date.now() - cur[1], uid, channelId)
		  }

		  // clear current_channel
		  this.delete_current_channel.run(uid)
	 }
};

var instance = new ChannelTime("channel_stats.db")
global.channelstats = instance;
