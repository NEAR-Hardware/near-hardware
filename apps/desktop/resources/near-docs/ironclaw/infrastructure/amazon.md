> ## Documentation Index
> Fetch the complete documentation index at: https://docs.ironclaw.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Amazon EC2

> Host IronClaw on an Amazon EC2 Instance

Amazon Elastic Compute Cloud (EC2) lets you run virtual machines on AWS infrastructure with flexible pricing and a free tier for new accounts. In this guide we will launch an EC2 instance and configure it securely so you can run IronClaw and expose it to the internet.

> [!TIP]
>
> Do not feel like setting up your own infrastructure? You can install IronClaw with a few clicks on [agent.near.ai](https://agent.near.ai)

***

## Create an EC2 Instance

Sign in to the [AWS Management Console](https://console.aws.amazon.com) and navigate to **EC2 → Instances → Launch Instances**.

![Launch instance](https://mintcdn.com/nearai/xCUukXB56POLoVpD/images/infrastructure/amazon/amazon-create.png?fit=max\&auto=format\&n=xCUukXB56POLoVpD\&q=85\&s=ff0bceb22d85590c141e5aae0031ae53)

Configure the following:

* **Name**: choose a descriptive name (e.g. `ironclaw`)
* **AMI**: Ubuntu Server 24.04 LTS (free tier eligible)
* **Instance type**: `t2.micro` or `t3.micro` (free tier eligible) — sufficient for most use cases
* **Key pair**: click **Create new key pair**, give it a name, choose RSA and `.pem` format, then download the file. Keep it in a safe place — you will not be able to download it again.

![Key pair creation dialog](https://mintcdn.com/nearai/xCUukXB56POLoVpD/images/infrastructure/amazon/amazon-ssh.png?fit=max\&auto=format\&n=xCUukXB56POLoVpD\&q=85\&s=9f46ff4ce4703e5bdb2898710e63fb5a)

```bash theme={null}
# Restrict permissions on the downloaded key (required by SSH)
chmod 400 ~/.ssh/your-key.pem
```

Under **Network settings**, click **Edit** and make sure the following inbound rules are set in the security group:

| Type | Protocol | Port | Source |
| - | - | - | - |
| SSH | TCP | 22 | My IP |
| HTTP | TCP | 80 | Anywhere |
| HTTPS | TCP | 443 | Anywhere |

> [!NOTE]
>
> Restricting SSH to **My IP** is strongly recommended. It prevents brute-force attacks from the open internet. You can update this rule later if your IP changes.

![EC2 instance configuration](https://mintcdn.com/nearai/xCUukXB56POLoVpD/images/infrastructure/amazon/amazon-firewall.png?fit=max\&auto=format\&n=xCUukXB56POLoVpD\&q=85\&s=c58fd6986d706e430f4354e03d1a30a0)

Click **Launch Instance**. AWS will take a few seconds to provision the instance.

***

## Access Your Instance

Once the instance is running, find its **Public IPv4 address** in the **Instances** list.

![EC2 instance IP address](https://mintcdn.com/nearai/xCUukXB56POLoVpD/images/infrastructure/amazon/amazon-ip.png?fit=max\&auto=format\&n=xCUukXB56POLoVpD\&q=85\&s=fe397f8b7b07a3735bc70fed2eb7cd44)

Connect from your terminal using the `.pem` key you downloaded:

```bash theme={null}
# Replace <KEY_PATH> and <IP_ADDRESS> accordingly
ssh -i <KEY_PATH> ubuntu@<IP_ADDRESS>
```

> [!NOTE]
>
> The default username for Ubuntu AMIs is `ubuntu`. For Amazon Linux AMIs it would be `ec2-user`.

### Root Access

Unlike DigitalOcean Droplets, EC2 Ubuntu instances do not let you log in directly as `root`. Instead, the `ubuntu` user has passwordless `sudo` privileges. All privileged commands in this guide are prefixed with `sudo` so you can run them directly without switching users.

***

## Configure Your Instance

Now that we are inside the instance, we need to perform some initial configuration. We want to strengthen security by setting up a dedicated user and preparing the system for running IronClaw.

### Update and Upgrade

First, make sure the system is up to date:

```bash theme={null}
sudo apt update && sudo apt upgrade -y
```

### Create a New User

It is good practice to create a dedicated user with sudo privileges instead of using `ubuntu` for all operations. You can create a new user (for example, `ironclaw`) and add it to the sudo group:

```bash theme={null}
sudo adduser ironclaw
sudo usermod -aG sudo ironclaw
```

Copy the SSH keys from `ubuntu` to the new user so you can log in with the same key pair:

```bash theme={null}
# Create the .ssh directory for the user
sudo mkdir -p /home/ironclaw/.ssh

# Copy the authorized_keys from the ubuntu user
sudo cp ~/.ssh/authorized_keys /home/ironclaw/.ssh/authorized_keys

# Set the correct ownership (critical — SSH will ignore the file otherwise)
sudo chown -R ironclaw:ironclaw /home/ironclaw/
sudo chmod 700 /home/ironclaw/.ssh
sudo chmod 600 /home/ironclaw/.ssh/authorized_keys
```

Open a new terminal window and confirm you can log in with the new user before continuing:

```bash theme={null}
ssh -i <KEY_PATH> ironclaw@<IP_ADDRESS>
```

> [!WARNING]
>
> Do not move forward until you have confirmed that you can log in with the new user. If you lose access without another user set up, you will need to reset your instance and start over.

> [!NOTE]
>
> EC2 Security Groups already act as a network-level firewall. As long as your inbound rules are configured as shown above, no additional firewall configuration is needed on the instance itself.

***

## Install IronClaw

Now that the instance is set up and secured, install IronClaw:

```bash theme={null}
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/nearai/ironclaw/releases/latest/download/ironclaw-installer.sh | sh
```

Run the one-time setup, then start the agent:

```bash theme={null}
ironclaw onboard
ironclaw serve
```

`onboard` prints a login link for the web interface. On a remote host, forward the port
from your own machine rather than exposing it:

```bash theme={null}
ssh -N -L 3000:127.0.0.1:3000 <user>@<IP_ADDRESS>
```

Once you've confirmed it works, stop the foreground server (Ctrl-C) and run it as a
service instead so it survives disconnects — the service runs `serve` itself, so the two
cannot share the port:

```bash theme={null}
ironclaw service install && ironclaw service start
```

> [!TIP]
>
> We recommend using a session manager like `tmux` or `screen` so you can easily detach and reattach to your running IronClaw instance between SSH sessions.

***

## Next Steps

Follow our [Quickstart Guide](https://docs.ironclaw.com/quickstart.md) to create your first agent, connect it to Telegram, and start exploring IronClaw's capabilities.

Want to talk with your agent using a messaging app? Check out the [**Channels**](https://docs.ironclaw.com/channels/overview.md) documentation to learn how to connect.

Need your agent to perform complex tasks that require multiple tools? Check out the [**Extensions**](https://docs.ironclaw.com/extensions/overview.md) documentation.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.