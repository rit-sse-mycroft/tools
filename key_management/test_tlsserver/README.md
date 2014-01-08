# TLS Test Server

## Setup

Two directories are required: `CA` and `Client`.
They should both have key/crt files to fit the following directory structure:

```
  cient/
    client.crt
    client.key
  ca/
    ca.crt
    ca.key
  test_server.js
  test_client.js
  README.md
```

## Running

To run simply run `test_server.js` and then `test_client.js`.

## Successful Output

### Successful server output:

```
server bound
server connected
Authorized
```

### Successful client output:

```
client connected
Unauthorized
Hostname/IP doesn't match certificate's altnames
welcome!
```

_NOTE:_ The client is expected to not trust the server.
