FROM kalilinux/kali-rolling:latest

LABEL maintainer="Auron Cybersecurity Platform"
LABEL description="Kali Linux with pre-installed penetration testing tools for Auron workshops"

# Set environment to noninteractive to avoid prompts during build
ENV DEBIAN_FRONTEND=noninteractive

# Update package lists and install essential tools
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    # Network scanning
    nmap \
    masscan \
    # Web scanners & fuzzing
    dirb \
    dirbuster \
    nikto \
    wfuzz \
    # SQL injection
    sqlmap \
    # Password cracking
    hydra \
    john \
    hashcat \
    # Utilities
    curl \
    wget \
    netcat-traditional \
    dnsutils \
    whois \
    traceroute \
    tcpdump \
    # Analysis
    wireshark-common \
    tshark \
    # Exploits & frameworks
    metasploit-framework \
    # SSL/TLS testing
    sslscan \
    sslyze \
    testssl.sh \
    # Misc
    git \
    vim \
    nano \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create scripts directory
RUN mkdir -p /scripts

# Set working directory
WORKDIR /scripts

# Keep container running
CMD ["tail", "-f", "/dev/null"]
