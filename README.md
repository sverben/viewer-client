# McViewer
View Minecraft servers in your browser!

This is the client for the minecraft viewer, you must have at least 1 server instance running to use this client.

[Server Repo]("https://github.com/sverben/viewer-server")

## Setup
Add all the names and ips of all the servers in a config file named `servers.json`.

the file should look like this
```json
[
  {
    "name": "server-1",
    "ip": "http://server1.example.com:5767"
  },
  {
    "name": "server-2",
    "ip": "http://server2.example.com:5767"
  }
]
```