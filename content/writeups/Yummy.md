```json
Alias: Yummy
Date: 07-03_2025
Platform: Hackthebox
OS: Linux
Difficulty: Hard
Status: Complete
IP: 10.10.11.36
```

# Yummy
# Summary

- Placeholder

# Used Tools

* Placeholder
 
---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2025-03-07 23:23 PKT
Nmap scan report for 10.10.11.36
Host is up (0.50s latency).
Not shown: 998 closed tcp ports (conn-refused)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 9.6p1 Ubuntu 3ubuntu13.5 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 a2:ed:65:77:e9:c4:2f:13:49:19:b0:b8:09:eb:56:36 (ECDSA)
|_  256 bc:df:25:35:5c:97:24:f2:69:b4:ce:60:17:50:3c:f0 (ED25519)
80/tcp open  http    Caddy httpd
|_http-title: Did not follow redirect to http://yummy.htb/
|_http-server-header: Caddy
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 89.95 seconds
```
## Discovered Subdomains
```
best.test.com
```

---
# Enumeration

### Potential Usernames
- Walter White
- Sarah Jhonson
- William Anderson

---

# Exploitation

## CVE-2099-123

---

# Lateral Movement

## Local Enumeration
Lorem ipsum dolor sit amet.

## Lateral Movement Vector
Lorem ipsum dolor sit amet.

---

# Privilege Escalation

## Local Enumeration
Lorem ipsum dolor sit amet.

## Privilege Escalation Vector
Lorem ipsum dolor sit amet.

---

# Flags
- user.txt
- root.txt

#CTF