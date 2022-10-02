# Harry Tuttle: Discord Bot for Central Services

## Deployment instructions

### Initial setup

- `git clone` this repo
- Ask Josh to invite you to https://fly.io/apps/harry-tuttle
- Install https://fly.io cli
- `fly auth login`

### To do a deploy

- `fly deploy`

Generally that's all you'll need to do.  It will take several minutes and
you'll see a bunch of status messages


### To view logs

- To continuously follow the logs: `fly logs` or use https://fly.io/apps/harry-tuttle

### Debug, poke around

- To ssh into the running app: `fly ssh console`

### To change a configuration variable

You'll probably never need to do this, but:

- add K=V to `[env]` section of `fly.toml` to configure a non-secret env variable
- `fly secrets set K=V` to configure a secret env variable

These variables will be available in the code as an environment variable (e.g. `process.env.VAR`).

## To run the bot locally

To start the bot, in the command prompt, run the following command:
`node index.js`

## More info from the parent project

You shouldn't need anything beyond this point in order to do routine development and maintenance, but it's preserved in case it matters later

### Requirements

- `git` command line ([Windows](https://git-scm.com/download/win)|[Linux](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)|[MacOS](https://git-scm.com/download/mac)) installed
- `node` [Version 12.0.0 or higher](https://nodejs.org)
- The node-gyp build tools. This is a pre-requisite for Enmap, but also for a **lot** of other modules. See [The Enmap Guide](https://enmap.evie.codes/install#pre-requisites) for details and requirements for your OS. Just follow what's in the tabbed block only, then come back here!

You also need your bot's token. This is obtained by creating an application in
the [Developer section](https://discord.com/developers) of discord.com. Check the [first section of this page](https://anidiots.guide/getting-started/the-long-version.html) 
for more info.

### Intents

Guidebot uses intents which are required as of October 7, 2020. 
You can enable privileged intents in your bot page 
(the one you got your token from) under `Privileged Gateway Intents`.

By default GuideBot needs the Guilds, Guild Messages and Direct Messages intents to work.
For join messages to work you need Guild Members, which is privileged.
User counts that GuideBot has in places such as in the ready log, and the stats 
command may be incorrect without the Guild Members intent.

Intents are loaded from your config, and will get created by the setup scripts.

For more info about intents checkout the [official Discord.js guide page](https://discordjs.guide/popular-topics/intents.html) and the [official Discord docs page](https://discord.com/developers/docs/topics/gateway#gateway-intents).

### Inviting to a guild

To add the bot to your guild, you have to get an oauth link for it. 

You can use this site to help you generate a full OAuth Link, which includes a calculator for the permissions:
[https://finitereality.github.io/permissions-calculator/?v=0](https://finitereality.github.io/permissions-calculator/?v=0)

# History and Credits

This bot is based on the [example Discord.js Bot Handler](https://github.com/AnIdiotsGuide/guidebot) updated and Maintained by the Idiot's Guide Community.
