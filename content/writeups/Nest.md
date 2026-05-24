```json
Alias: Nest
Date: 14-08_2024
Platform: Hackthebox
OS: Windows
Difficulty: Easy
Status: Complete
IP: 10.129.241.151
```

# Nest
# Summary

- Nest is an easy difficulty Windows machine featuring an SMB server that permits guest access. The shares can be enumerated to gain credentials for a low privileged user. This user is found to have access to configuration files containing sensitive information. Another user's password is found through source code analysis, which is used to gain a foothold on the box. A custom service is found to be running, which is enumerated to find and decrypt Administrator credentials.

# Used Tools

* ILSpy
 
---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2024-08-14 03:25 PKT
Nmap scan report for 10.129.33.156
Host is up (0.24s latency).
Not shown: 999 filtered tcp ports (no-response)
PORT    STATE SERVICE       VERSION
445/tcp open  microsoft-ds?

Host script results:
| smb2-security-mode:
|   2:1:0:
|_    Message signing enabled but not required
| smb2-time:
|   date: 2024-08-13T22:26:48
|_  start_date: 2024-08-13T22:01:50

4386/tcp open  unknown
| fingerprint-strings:
|   DNSStatusRequestTCP, DNSVersionBindReqTCP, Kerberos, LANDesk-RC, LDAPBindReq, LDAPSearchReq, LPDString, NULL, RPCCheck, SMBProgNeg, SSLSessionReq, TLSSessionReq, TerminalServer, TerminalServerCookie, X11Probe:
|     Reporting Service V1.2
|   FourOhFourRequest, GenericLines, GetRequest, HTTPOptions, RTSPRequest, SIPOptions:
|     Reporting Service V1.2
|     Unrecognised command
|   Help:
|     Reporting Service V1.2
|     This service allows users to run queries against databases using the legacy HQK format
|     AVAILABLE COMMANDS ---
|     LIST
|     SETDIR <Directory_Name>
|     RUNQUERY <Query_ID>
|     DEBUG <Password>
|_    HELP <Command>
1 service unrecognized despite returning data. If you know the service/version, please submit the following fingerprint at https://nmap.org/cgi-bin/submit.cgi?new-service :
SF-Port4386-TCP:V=7.95%I=7%D=8/14%Time=66BBDF74%P=x86_64-pc-linux-gnu%r(NU
SF:LL,21,"\r\nHQK\x20Reporting\x20Service\x20V1\.2\r\n\r\n>")%r(GenericLin
SF:es,3A,"\r\nHQK\x20Reporting\x20Service\x20V1\.2\r\n\r\n>\r\nUnrecognise
SF:d\x20command\r\n>")%r(GetRequest,3A,"\r\nHQK\x20Reporting\x20Service\x2
SF:0V1\.2\r\n\r\n>\r\nUnrecognised\x20command\r\n>")%r(HTTPOptions,3A,"\r\
SF:nHQK\x20Reporting\x20Service\x20V1\.2\r\n\r\n>\r\nUnrecognised\x20comma
SF:nd\r\n>")%r(RTSPRequest,3A,"\r\nHQK\x20Reporting\x20Service\x20V1\.2\r\
SF:n\r\n>\r\nUnrecognised\x20command\r\n>")%r(RPCCheck,21,"\r\nHQK\x20Repo
SF:rting\x20Service\x20V1\.2\r\n\r\n>")%r(DNSVersionBindReqTCP,21,"\r\nHQK
SF:\x20Reporting\x20Service\x20V1\.2\r\n\r\n>")%r(DNSStatusRequestTCP,21,"
SF:\r\nHQK\x20Reporting\x20Service\x20V1\.2\r\n\r\n>")%r(Help,F2,"\r\nHQK\
SF:x20Reporting\x20Service\x20V1\.2\r\n\r\n>\r\nThis\x20service\x20allows\
SF:x20users\x20to\x20run\x20queries\x20against\x20databases\x20using\x20th
SF:e\x20legacy\x20HQK\x20format\r\n\r\n---\x20AVAILABLE\x20COMMANDS\x20---
SF:\r\n\r\nLIST\r\nSETDIR\x20<Directory_Name>\r\nRUNQUERY\x20<Query_ID>\r\
SF:nDEBUG\x20<Password>\r\nHELP\x20<Command>\r\n>")%r(SSLSessionReq,21,"\r
SF:\nHQK\x20Reporting\x20Service\x20V1\.2\r\n\r\n>")%r(TerminalServerCooki
SF:e,21,"\r\nHQK\x20Reporting\x20Service\x20V1\.2\r\n\r\n>")%r(TLSSessionR
SF:eq,21,"\r\nHQK\x20Reporting\x20Service\x20V1\.2\r\n\r\n>")%r(Kerberos,2
SF:1,"\r\nHQK\x20Reporting\x20Service\x20V1\.2\r\n\r\n>")%r(SMBProgNeg,21,
SF:"\r\nHQK\x20Reporting\x20Service\x20V1\.2\r\n\r\n>")%r(X11Probe,21,"\r\
SF:nHQK\x20Reporting\x20Service\x20V1\.2\r\n\r\n>")%r(FourOhFourRequest,3A
SF:,"\r\nHQK\x20Reporting\x20Service\x20V1\.2\r\n\r\n>\r\nUnrecognised\x20
SF:command\r\n>")%r(LPDString,21,"\r\nHQK\x20Reporting\x20Service\x20V1\.2
SF:\r\n\r\n>")%r(LDAPSearchReq,21,"\r\nHQK\x20Reporting\x20Service\x20V1\.
SF:2\r\n\r\n>")%r(LDAPBindReq,21,"\r\nHQK\x20Reporting\x20Service\x20V1\.2
SF:\r\n\r\n>")%r(SIPOptions,3A,"\r\nHQK\x20Reporting\x20Service\x20V1\.2\r
SF:\n\r\n>\r\nUnrecognised\x20command\r\n>")%r(LANDesk-RC,21,"\r\nHQK\x20R
SF:eporting\x20Service\x20V1\.2\r\n\r\n>")%r(TerminalServer,21,"\r\nHQK\x2
SF:0Reporting\x20Service\x20V1\.2\r\n\r\n>");

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 89.32 seconds
```
## Discovered Subdomains
```
best.test.com
```

---
# Enumeration

## Port 445 - SMB (SMBV2)

- We can log in as guest by specifying a user and no password. There are 2 Readable shares, Users and Data. Data Contains a `Welcome Email.txt` file that says Users\\Username will have the home directory for users, It also contains credentials for a TempUser account

| Username | Password    |
| -------- | ----------- |
| TempUser | welcome2019 |

Now we have access to the directories from Data that we didn't have access before, the IT\\Config\\RU Scanner Directory contains an encrypted password and the notepad++ config contains the history file, which shows that the user has edited a file `Secure$\IT\Carl\Temp.txt`

We have access to that file if we try to open it directly instead of opening IT. In the `Carl/VB Projects/WIP/RU/RUScanner` directory the Utils.vb contains the class to decrypt the previously found password, [this](jdoodle.net) is the only online VB compiler that worked for me. Performing a password spray, we find that it's user C.Smith's password

| Username | Password           |
| -------- | ------------------ |
| C.Smith  | xRxRxPANCAK3SxRxRx |

---

# Exploitation

Apparently NTFS Files can have multiple data streams. It started with a compatibility thing so that mac users whose files have multiple data stream can easily go about transferring files to and from Windows. The `Users\C.Smith\HQK Reporting\Debug Mode Password.txt` Has an alternate data stream called Password, we can inspect it using smbclient with the command `allinfo filename` and get it with `get filename:dataStream`. 

The password is: `WBQ201953D8w`

This gives us access to the DEBUG mode of 'HQK Reporting Service V1.2' Running at port 4386.

---
# Privilege Escalation

Proceed by connecting to the service running at port 4386, I used telnet. We can go to the previous directory with the `SETDIR ..` Command,  From that go to the LDAP directory, use the `LIST` command and notice that there is a config file and the HqkLdap.exe that was also in the SMB Share of C.Smith. The config file has an encrypted password. To decrypt it we need to Reverse Engineer the exe we found. The class called CR has everything we need to decrypt it, and we get the password. Then we confirm that it is the Administrator password.

| Username      | Password         |
| ------------- | ---------------- |
| Administrator | XtH4nkS4Pl4y1nGX |

Great box overall! Teaches us the value of enumeration and I discovered NTFS ADS.

---

# Flags
- 11edcf64934915c25151c33f74843814
- 60843f61c9f7942933dd7051db27c7e1

#CTF #CTF/Hackthebox #CTF/Hackthebox/Easy #Reversing 