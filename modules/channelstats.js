const Database = require('better-sqlite3')
const path = require('path')

class ChannelTime {
	 constructor (dbFilePath) {
		  this.db = new Database(dbFilePath, { timeout: 10000 });

		  // key channels off name because IDs are ephemeral (if a voice channel is deleted then recreated)
		  // really we want to key everything off puzzle IDs, but we don't have those
		  // puzzle data
		  // status - 0: none, 1: solved, 2: needs aha (lightbulb U+1F4A1), 3: fresh brains (brain U+1F9E0), 4: stdp (cursing U+1F92C), 5: stuck (confounded U+1F616), 6: parallelize (family U+1F46A)
		  this.db.exec("create table if not exists channels (channel text primary key, category text, status int DEFAULT 0)");
		  this._add_channel = this.db.prepare('INSERT OR IGNORE INTO channels VALUES (?, ?, 0)')
		  this._create_channel = this.db.prepare('INSERT OR REPLACE INTO channels VALUES (?, ?, 0)')

		  // summary statistics - updated whenever a user starts / stops speaking or joins / leaves a channel.
		  this.db.exec("create table if not exists channel_stats (channel text, uid unsigned big int, joined_seconds real DEFAULT 0, speaking_seconds real DEFAULT 0, last_seen integer, PRIMARY KEY (channel, uid))")

		  // tracking data - checked & updated whenever a user starts / stops speaking or joins / leaves a channel, then updates channel_stats. last_state_time is node.js Date.now(); speaking is bool
		  this.db.exec("create table if not exists current_channel (uid unsigned big int primary key, channel text, joined_time integer, last_state_time integer, speaking integer)")

		  // prepare statements
		  this._get_current_channel = this.db.prepare('SELECT channel, joined_time, last_state_time, speaking FROM current_channel WHERE uid = ?')
		  this._get_channel = this.db.prepare('SELECT channel, category, status FROM channels WHERE channel = ?')
		  this._insert_current_channel = this.db.prepare('INSERT OR REPLACE INTO current_channel VALUES (?, ?, ?, ?, 0)')
		  this._update_current_channel = this.db.prepare('UPDATE current_channel SET last_state_time = ?, speaking = ? WHERE uid = ?')
		  this._delete_current_channel = this.db.prepare('DELETE FROM current_channel WHERE uid = ?')
		  this._update_speaking = this.db.prepare('UPDATE channel_stats SET speaking_seconds = speaking_seconds + ? WHERE uid = ? AND channel = ?')
		  this._update_joined = this.db.prepare("UPDATE channel_stats SET joined_seconds = joined_seconds + ?, last_seen = ? WHERE uid = ? AND channel = ?")
		  this._add_channel_stats = this.db.prepare('INSERT OR IGNORE INTO channel_stats (channel, uid) VALUES (?, ?)')
		  this._find_channel = this.db.prepare('SELECT DISTINCT channel FROM channel_stats WHERE channel LIKE ?')

		  this._rename_channel = this.db.prepare('UPDATE channels SET channel = ? WHERE channel = ?')
		  this._rename_channel_stats = this.db.prepare('UPDATE channel_stats SET channel = ? WHERE channel = ?')
		  this._rename_current_channel = this.db.prepare('UPDATE current_channel SET channel = ? WHERE channel = ?')

		  this._max_seen = this.db.prepare("SELECT count(*) FROM current_channel WHERE channel = ?")
		  this._stats_query = this.db.prepare(
				`SELECT s.uid,
                   (joined_seconds + ifnull(strftime('%s','now') - cc.joined_time/1000, 0)) AS total_seconds,
                   speaking_seconds,
                   CASE WHEN cc.joined_time IS NOT NULL THEN 'now'
                        ELSE last_seen
                   END AS last_seen
              FROM channel_stats s LEFT JOIN current_channel cc ON s.channel = cc.channel AND s.uid = cc.uid WHERE s.channel = @channel AND total_seconds >= @min_seconds ORDER BY total_seconds DESC
            `);
		  this._stats_query.safeIntegers(true) // this is critical, because JavaScript is a shitty fucking mickey mouse language
		  
		  process.on('exit', () => this.db.close())
	 }

	 get_channels() {
		  var stmt = this.db.prepare("SELECT channel, category, status = 1 AS solved FROM channels ORDER BY category, channel ASC")
		  return stmt.all()
	 }

	 channel_status() {
		  var stmt = this.db.prepare("SELECT channel, category, status FROM channels WHERE status != 1 ORDER BY status DESC, channel ASC")
		  return stmt.all()
	 }

	 check_channel_exists(chan) {
		  var result = this._get_channel.all(chan);
		  return result.length > 0
	 }

	 channel_details(chan) {
		  var result = this._get_channel.all(chan);
		  return result[0];
	 }
	 
	 find_channels(search_str, unsolved_only) {
		  var stmt
		  if (unsolved_only) {
				stmt = this.db.prepare(`SELECT channel FROM channels WHERE channel LIKE '%${search_str}%' AND status != 1`);
		  } else {
				stmt = this.db.prepare(`SELECT channel FROM channels WHERE channel LIKE '%${search_str}%'`);
		  }
		  return stmt.all();
	 }

	 set_status(channel_name, status) {
		  var stmt = this.db.prepare(`UPDATE channels SET status=${status} WHERE channel='${channel_name}'`);
		  const inf = stmt.run()
		  return inf.changes
	 }
	 
	 solve_puzzle(channel_name) {
		  return this.set_status(channel_name, 1);
	 }
	 
	 get_channel_stats(channel_name, min_seconds = 0) {
		  return this._stats_query.all({channel: channel_name, min_seconds: min_seconds})
	 }
	 
	 current_channel(uid) {
		  let state = this._get_current_channel.all(uid)
		  if (state.length < 1) {
				// error
				return false
		  } else if (state.length > 1) {
				// error
				return false
		  }
		  return state[0]
	 }

	 rename_channel(oldName, newName) {
		  const upd = this.db.transaction(() => {
				const chanResult = this._rename_channel.run(newName, oldName);
				const statsResult = this._rename_channel_stats.run(newName, oldName);
				const curResult = this._rename_current_channel.run(newName, oldName);
				return [chanResult.changes, statsResult.changes, curResult.changes];
		  });
		  return upd();
	 }

	 recategorize_channel(channel_name, new_category) {
		  var stmt = this.db.prepare('UPDATE channels SET category=? WHERE channel=?')
		  const info = stmt.run(new_category, channel_name)
		  return info.changes;
	 }
	 
	 on_speaking_change(uid, is_speaking) {
		  if (!is_speaking) {
				// update speaking_seconds
				let cur = this.current_channel(uid)
				if (!cur.speaking) {
					 // was not speaking before - ignore
					 return
				}
				this._update_speaking.run((Date.now() - cur.last_state_time)/1000, uid, cur.channel)
		  }
		  // update current_channel
		  this._update_current_channel.run(Date.now(), is_speaking, uid)
	 }

	 on_channel_create(channelName, category) {
		  // called when bot creates a new channel, not really necessary as we pick up the channel automatically when anyone joins
		  this._create_channel.run(channelName, category);
	 }
	 
	 on_channel_join(uid, channelName, category = undefined) {
		  console.log(`on_channel_join ${typeof uid} ${uid} ${channelName}`)
		  const join = this.db.transaction(() => {
				this._add_channel.run(channelName, category);
				this._add_channel_stats.run(channelName, uid);
				this._insert_current_channel.run(uid, channelName, Date.now(), Date.now());
		  });
		  join();
	 }

	 on_channel_leave(uid, channelName) { // note this must be called before on_channel_join for a leave/join pair
		  console.log(`on_channel_leave ${uid} ${channelName}`)
		  // update speaking just in case?
		  //this.on_speaking_change(uid, false)

		  // update channel_stats
		  let cur = this.current_channel(uid)
		  if (cur.channel != channelName) {
				// channel mismatch, error / ignore
		  } else {
				let now = Date.now();
				this._update_joined.run((now - cur.joined_time)/1000, now, uid, channelName)
		  }

		  // clear current_channel
		  this._delete_current_channel.run(uid)
	 }
};

const persistentFilePath = process.env.PERSISTENT_FILE_PATH || path.join('.', 'data');
// Use of DBPATH envvar is deprecated and can eventually be removed
// PERSISTENT_FILE_PATH should be set to a folder that persists across deployments
var dbpath = process.env.DBPATH || path.join(persistentFilePath, 'channel_stats.db');
var instance = new ChannelTime(dbpath)
global.channelstats = instance;
