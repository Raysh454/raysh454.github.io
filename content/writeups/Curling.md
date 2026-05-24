```json
Alias: Curling
Date: 15-08_2024
Platform: Hackthebox
OS: Linux
Difficulty: Easy
Status: Complete
IP: 10.129.242.33
```

# Curling
# Summary

- Curling is an Easy difficulty Linux box which requires a fair amount of enumeration. The password is saved in a file on the web root. The username can be download through a post on the CMS which allows a login. Modifying the php template gives a shell. Finding a hex dump and reversing it gives a user shell. On enumerating running processes a cron is discovered which can be exploited for root.
 
---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2024-08-15 09:32 PKT
Nmap scan report for 10.129.242.33
Host is up (0.22s latency).
Not shown: 998 closed tcp ports (conn-refused)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.5 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   2048 8a:d1:69:b4:90:20:3e:a7:b6:54:01:eb:68:30:3a:ca (RSA)
|   256 9f:0b:c2:b2:0b:ad:8f:a1:4e:0b:f6:33:79:ef:fb:43 (ECDSA)
|_  256 c1:2a:35:44:30:0c:5b:56:6a:3f:a5:cc:64:66:d9:a9 (ED25519)
80/tcp open  http    Apache httpd 2.4.29 ((Ubuntu))
|_http-title: Home
|_http-server-header: Apache/2.4.29 (Ubuntu)
|_http-generator: Joomla! - Open Source Content Management
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 63.93 seconds
```

---
# Enumeration

There is a joomla server running on port 80, Viewing Source of the index page we see a comment at the end of the file which contains a filename `secrets.txt`, navigating to that page we see a base64 encoded password decoding it we get the password and at the end of the first posted post the author has signed their name. We can go to /administrator to log in to the joomla panel.

| Username | Password     |
| -------- | ------------ |
| Floris   | Curling2018! |

---

# Exploitation

At the top of the page we can see the extensions tab. Going there we see that Protostar is the template being used by the site, we can edit that and add our php reverse shell at the end of the file to get a shell and login as www-data.

---

# Lateral Movement
We for some reason as www-data have read access to floris's home directory, it contains a file called password backup which is a hex dump. We can use [this](https://gchq.github.io/CyberChef/#recipe=From_Hexdump()) From cyberchef to convert it back to a file. Next we need to extract it a bunch of times until we finally extract a file called password.txt which has floris' password. I recommend using 7z to not repeatedly see what kind of file we are extracting.

| Username | Password            |
| -------- | ------------------- |
| floris   | 5d<wdCbdZu)\|hChXll |

---

# Privilege Escalation

This box has a fun privesc part. If we run pspy64 on the target machine we will notice that in some interval the box curls using the file in admin-area called input. We have the ability to specify the output directory of whatever file we get!

The way ssh works is if someone has your public key saved in their .ssh/authorized_keys, you can log in to their account without providing any credential. So that is what we are going to do. The user floris does not have .ssh already configured, so we will do it using 

`ssh-keygen`

Next after the files are created, modify the input file in admin-area as such:

```
url = "file:///home/floris/.ssh/id_rsa.pub"
output = "/root/.ssh/authorized_keys"
```

Wait a while for root to curl the file, and then simply

`ssh root@localhost`

I personally think this way is much cooler but we can also overwrite a cron which runs as root.
Creating a duplicate shadow file to replace the root password is also a possibility.

---

# Flags
- abf926628b39cc32dc723b2cb68da37f
- 0bdce1f7013c353706be96f4a1b92f72

#CTF #CTF/Hackthebox #CTF/Hackthebox/Easy #Linux #Linux/Privesc/curl #WebApp #WebApp/Joomla