const Database = require('better-sqlite3')

class ChannelTime {
	 constructor (dbFilePath) {
		  this.db = new Database(dbFilePath, { timeout: 10000 });

		  // key channels off name because IDs are ephemeral
		  
		  // summary statistics - updated whenever a user starts / stops speaking or joins / leaves a channel.
		  this.db.exec("create table if not exists channel_stats (channel text, uid unsigned big int, joined_seconds real DEFAULT 0, speaking_seconds real DEFAULT 0, PRIMARY KEY (channel, uid))")

		  // tracking data - checked & updated whenever a user starts / stops speaking or joins / leaves a channel, then updates channel_stats. last_state_time is node.js Date.now(); speaking is bool
		  this.db.exec("create table if not exists current_channel (uid unsigned big int primary key, channel text, joined_time integer, last_state_time integer, speaking integer)")

		  // prepare statements
		  this.get_current_channel = this.db.prepare('SELECT channel, joined_time, last_state_time, speaking FROM current_channel WHERE uid = ?')
		  this.insert_current_channel = this.db.prepare('INSERT OR REPLACE INTO current_channel VALUES (?, ?, ?, ?, 0)')
		  this.update_current_channel = this.db.prepare('UPDATE current_channel SET last_state_time = ?, speaking = ? WHERE uid = ?')
		  this.delete_current_channel = this.db.prepare('DELETE FROM current_channel WHERE uid = ?')
		  this.update_speaking = this.db.prepare('UPDATE channel_stats SET speaking_seconds = speaking_seconds + ? WHERE uid = ? AND channel = ?')
		  this.update_joined = this.db.prepare('UPDATE channel_stats SET joined_seconds = joined_seconds + ? WHERE uid = ? AND channel = ?')
		  this.add_channel_stats = this.db.prepare('INSERT OR IGNORE INTO channel_stats (channel, uid) VALUES (?, ?)')

		  this.stats_query = this.db.prepare("SELECT s.uid, (joined_seconds + ifnull(strftime('%s','now') - cc.joined_time/1000, 0)) AS total_seconds, speaking_seconds, cc.joined_time FROM channel_stats s LEFT JOIN current_channel cc ON s.channel = cc.channel AND s.uid = cc.uid WHERE s.channel = ? AND total_seconds >= ? ORDER BY total_seconds DESC")
		  process.on('exit', () => this.db.close())
	 }

	 get_channel_stats(channel_name, min_seconds = 0) {
		  const stats = this.stats_query.all(channel_name, min_seconds)
		  // for (const row of stats) {
		  // 		console.log(`${row.uid} ${row.total_seconds}`);
		  // }
		  return stats;
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
				if (!cur.speaking) {
					 // was not speaking before - ignore
					 return
				}
				this.update_speaking.run((Date.now() - cur.last_state_time)/1000, uid, cur.channel)
		  }
		  // update current_channel
		  this.update_current_channel.run(Date.now(), is_speaking, uid)
	 }

	 on_channel_join(uid, channelName) {
		  this.add_channel_stats.run(channelName, uid)
		  this.insert_current_channel.run(uid, channelName, Date.now(), Date.now())
	 }

	 on_channel_leave(uid, channelName) { // note this must be called before on_channel_join for a leave/join pair
		  // update speaking just in case?
		  this.on_speaking_change(uid, false)

		  // update channel_stats
		  let cur = this.current_channel(uid)
		  if (cur.channel != channelName) {
				// channel mismatch, error / ignore
		  } else {
				this.update_joined.run((Date.now() - cur.joined_time)/1000, uid, channelName)
		  }

		  // clear current_channel
		  this.delete_current_channel.run(uid)
	 }
};

var instance = new ChannelTime("channel_stats.db")
global.channelstats = instance;
