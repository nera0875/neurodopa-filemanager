module.exports = {
  apps: [{
    name: 'filemanager',
    script: 'npm',
    args: 'start',
    cwd: '/home/pilote/filemanager',
    env: {
      NODE_ENV: 'production',
      PORT: 3010
    },
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};