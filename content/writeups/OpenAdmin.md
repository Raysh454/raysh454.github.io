```json
Alias: OpenAdmin
Date: 13-08_2024
Platform: Hackthebox
OS: Linux
Difficulty: Easy
Status: Complete
IP: 10.129.243.171
```

# OpenAdmin
# Summary

- OpenAdmin is an easy difficulty Linux machine that features an outdated OpenNetAdmin CMS instance. The CMS is exploited to gain a foothold, and subsequent enumeration reveals database credentials. These credentials are reused to move laterally to a low privileged user. This user is found to have access to a restricted internal application. Examination of this application reveals credentials that are used to move laterally to a second user. A sudo misconfiguration is then exploited to gain a root shell.

---

# Information Gathering
## NMAP
```
# Nmap 7.95 scan initiated Tue Aug 13 05:31:17 2024 as: nmap -sC -sV -oA nmap 10.129.243.171
Nmap scan report for 10.129.243.171
Host is up (0.23s latency).
Not shown: 997 closed tcp ports (conn-refused)
PORT    STATE    SERVICE      VERSION
22/tcp  open     ssh          OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   2048 4b:98:df:85:d1:7e:f0:3d:da:48:cd:bc:92:00:b7:54 (RSA)
|   256 dc:eb:3d:c9:44:d1:18:b1:22:b4:cf:de:bd:6c:7a:54 (ECDSA)
|_  256 dc:ad:ca:3c:11:31:5b:6f:e6:a4:89:34:7c:9b:e5:50 (ED25519)
80/tcp  open     http         Apache httpd 2.4.29 ((Ubuntu))
|_http-server-header: Apache/2.4.29 (Ubuntu)
|_http-title: Apache2 Ubuntu Default Page: It works
749/tcp filtered kerberos-adm
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Tue Aug 13 05:32:02 2024 -- 1 IP address (1 host up) scanned in 45.62 seconds
```

---

# Exploitation

Start by doing a directory scan on port 80, we will find a directory called /music.
Go to the login page of music and we will arrive to a vulnerable version of OpenAdmin.

Doing a simple OpenAdmin exploit search will lead us to [this](https://github.com/amriunix/ona-rce/blob/master/ona-rce.py)

Well run the tool, go to www/local/config
to find an interesting file with credentials

| Username | Password      |
| -------- | ------------- |
| jimmy    | n1nj4W4rri0R! |

---

# Lateral Movement

This gives us access to the internal folder in www, We can look at the apache config to find that it's running on port 52486 and a request to main.php will give us the password to joanna

| Username | Password    |
| -------- | ----------- |
| joanna   | bloodninjas |

---

# Privilege Escalation

jonna can use nano as root to edit a file, we can use control R to go to insert file section and get command execution with:
`reset; sh 1>&0 2>&0`

---

# Flags
- f12455f60e2b3bf2a9e72b691ad8c168
- 4a7da043eadf8807a7284f439494c2db

#CTF #CTF/Hackthebox #CTF/Hackthebox/Easy #Linux #Linux/Privesc/nano