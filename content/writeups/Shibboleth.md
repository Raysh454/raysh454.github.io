```json
Alias: Shibboleth
Date: 18-08_2024
Platform: Hackthebox
OS: Windows
Difficulty: Medium
Status: Complete
IP: 10.129.239.32
```

# Shibboleth
# Summary

- Shibboleth is a medium difficulty Linux machine featuring IPMI and Zabbix software. IPMI authentication is found to be vulnerable to remote password hash retrieval. The hash can be cracked and Zabbix access can be obtained using these credentials. Foothold can be gained by abusing the Zabbix agent in order to run system commands. The initial password can be re-used to login as the `ipmi-svc` and acquire the user flag. A MySQL service is identified and found to be vulnerable to OS command execution. After successfully exploiting this service a root shell is gained.

 
---

# Information Gathering
## NMAP
```
Starting Nmap 7.95 ( https://nmap.org ) at 2024-08-18 08:40 PKT
Nmap scan report for 10.129.239.32
Host is up (0.27s latency).
Not shown: 999 closed tcp ports (conn-refused)
PORT   STATE SERVICE VERSION
80/tcp open  http    Apache httpd 2.4.41
|_http-title: Did not follow redirect to http://shibboleth.htb/
|_http-server-header: Apache/2.4.41 (Ubuntu)
Service Info: Host: shibboleth.htb

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
```
## Discovered Subdomains
```
shibboleth.htb
zabbix.shibboleth.htb
```

---
# Enumeration
Doing the nmap scan will only reveal the http port. Looking through the site we find then names of employees. We should note down their names. At the end of the page, the words "based on Zabbix & Bare Metal BMC automation". We also find some subdomains namely: monitor, monitoring and zabbix which lead to the login for zabbix.


---

# Exploitation
Bare Metal BMC Automation probably means IPMI is running, Reading on hacktricks we see that it runs on port 623 UDP. Doing a nmap udp scan reveals that it is open. 

We can use this msf module to dump hashes from IPMI

`auxiliary/scanner/ipmi/ipmi_dumphashes`

and crack with hashcat.

`hashcat hash.cat rockyou.txt -m 7300`

| User          | Password        |
| ------------- | --------------- |
| Administrator | ilovepumkinpie1 |

Apparently to access the host through the BMC interface, we need to reboot the host. That is not possible in this situation.

We can log in to zabbix with the credentials above.

Zabbix is an open-source monitoring solution designed to monitor and track the status of various IT components, including:

1. **Networks** - Devices such as routers, switches, and firewalls.
2. **Servers** - Physical, virtual, or cloud-based servers.
3. **Applications** - Software applications, including databases, web servers, and custom applications.
4. **Services** - Monitoring services like HTTP, FTP, and email services.
5. **IoT Devices** - Internet of Things devices for industrial or consumer use.

### **Items in Zabbix**:

In Zabbix, an **item** represents a specific metric or command that the Zabbix server will monitor or execute. For example:

- An item could monitor CPU usage on a server.
- It could also execute a command on the host using the **`system.run`** key.

[This](https://www.exploit-db.com/exploits/50816) Will help us get code execution after authenticating. It creates an item for the host. While creating the item we can supply the command in the "key" variable inside `system.run`. Then it does a post request to the created item to execute the command.

---

# Lateral Movement

ipmi-svc user has the same password as zabbix, we can do `su ipmi-svc` to confirm

---

# Privilege Escalation

Look around in /etc/zabbix. Doing a simple grep for password:

`grep password . -ir`

will give us the password for mariadb instance.

| Username | Password       |
| -------- | -------------- |
| zabbix   | bloooarskybluh |

This version of mariadb is vulnerable to `CVE-2021-27928`. A vulnerability where the sql super user can write to the variable `wsrep_provider` and `wsrep_notify_cmd system` at runtime. The server will try to dlopen() the wsrep_provider, which will lead to code execution as mysql user. The second variable can take the path to a script which it will execute.

We will use msf to generate a reverse shell payload and load it's path to `wsrep_provider`.

Transfer the .so file to host and setup a listener. Then run this to get root shell:

`mysql -u zabbix -p'bloooarskybluh' -e 'SET GLOBAL wsrep_provider="/tmp/rev.so";'`

---

# Flags
- 8fe52b9ea8e4a57f776f39d508c33f22
- c253af739b749dc80e60bd62bba1d8e4

#CTF #CTF/Hackthebox #CTF/Hackthebox/Medium #Linux #Linux/Privesc #Linux/Privesc/mysql #IPMI #WebApp #WebApp/Zabbix