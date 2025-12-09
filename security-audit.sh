#!/bin/bash

# Script untuk memeriksa keamanan server dan membersihkan malware

echo "🔍 SECURITY AUDIT SCRIPT"
echo "========================"
echo ""

# 1. Check for malicious processes
echo "1. Checking for malicious processes..."
ps aux | grep -E "pew63|h437|172.237.55.180|wget.*sh|curl.*sh" || echo "✓ No suspicious processes found"
echo ""

# 2. Check network connections
echo "2. Checking network connections to malicious IP..."
netstat -tulpn 2>/dev/null | grep "172.237.55.180" || echo "✓ No connections to malicious IP"
ss -tunap 2>/dev/null | grep "172.237.55.180" || echo "✓ No connections found (ss)"
echo ""

# 3. Check for malicious files
echo "3. Checking for malicious files..."
find /home/apps/stmadb-superapp -name "pew63" -o -name "h437" 2>/dev/null || echo "✓ No malicious files in project directory"
echo ""

# 4. Check Docker containers
echo "4. Checking Docker containers..."
docker ps -a
echo ""

# 5. Check Docker images
echo "5. Checking Docker images..."
docker images
echo ""

# 6. Check for cron jobs
echo "6. Checking cron jobs..."
crontab -l 2>/dev/null || echo "✓ No user cron jobs"
echo ""

# 7. Check system-wide cron
echo "7. Checking system cron..."
ls -la /etc/cron.* 2>/dev/null | head -20
echo ""

# 8. Check for suspicious startup scripts
echo "8. Checking Docker entrypoint scripts..."
find /home/apps/stmadb-superapp -name "docker-entrypoint.sh" -o -name "entrypoint.sh" -exec cat {} \;
echo ""

# 9. Check recent file modifications
echo "9. Checking recently modified files (last 24 hours)..."
find /home/apps/stmadb-superapp -type f -mtime -1 -ls 2>/dev/null | head -20
echo ""

# 10. Resource usage
echo "10. Checking resource usage..."
top -bn1 | head -15
echo ""

echo "========================"
echo "✅ Security audit complete"
echo ""
echo "NEXT STEPS:"
echo "1. Review the output above for any suspicious activity"
echo "2. Stop all containers: docker compose down"
echo "3. Remove all images: docker system prune -af --volumes"
echo "4. Pull fresh code from your repository"
echo "5. Rebuild with the new secure Dockerfile"
