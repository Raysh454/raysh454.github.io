```json
Alias: Outbound
Date: 15-07_2025
Platform: Hackthebox
OS: Linux
Difficulty: Easy
Status: Complete
IP: 10.129.104.150
```

# Outbound
# Summary

- Placeholder

# Used Tools

* Placeholder
 
---

# Information Gathering

As is common in real life pentests, you will start the Outbound box with credentials for the following account tyler / LhKL1o9Nm3X2

| Username | Password     |
| -------- | ------------ |
| tyler    | LhKL1o9Nm3X2 |

## NMAP
```
Nmap scan report for 10.129.104.150
Host is up (0.18s latency).
Not shown: 997 closed tcp ports (conn-refused)
PORT      STATE    SERVICE VERSION
22/tcp    open     ssh     OpenSSH 9.6p1 Ubuntu 3ubuntu13.12 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 0c:4b:d2:76:ab:10:06:92:05:dc:f7:55:94:7f:18:df (ECDSA)
|_  256 2d:6d:4a:4c:ee:2e:11:b6:c8:90:e6:83:e9:df:38:b0 (ED25519)
80/tcp    open     http    nginx 1.24.0 (Ubuntu)
|_http-title: Did not follow redirect to http://mail.outbound.htb/
|_http-server-header: nginx/1.24.0 (Ubuntu)
10778/tcp filtered unknown
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 44.45 seconds
```
## Discovered Subdomains
```
best.test.com
```

---
# Enumeration
## Port 80 - HTTP (Appache)
Lorem ipsum dolor sit amet.

- [ ] Enumerated
- [ ] Vulnerable

## Port 445 - SMB (SMBV2)
Lorem ipsum dolor sit amet.

- [ ] Enumerated
- [ ] Vulnerable

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