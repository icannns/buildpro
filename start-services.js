const { spawn } = require('child_process');
const path = require('path');

// Configuration
const services = [
    {
        name: 'API Gateway',
        command: 'node',
        args: ['index.js'],
        cwd: 'services/api-gateway',
        color: '\x1b[36m' // Cyan
    },
    {
        name: 'Project Service (Node)',
        command: 'node',
        args: ['index.js'],
        cwd: 'services/project-service',
        color: '\x1b[32m' // Green
    },
    {
        name: 'Material Service (Python)',
        command: 'C:\\Users\\Legion\\AppData\\Local\\Programs\\Python\\Python314\\python.exe',
        args: ['app.py'],
        cwd: 'services/material-service',
        color: '\x1b[33m' // Yellow
    },
    {
        name: 'Vendor Service (Go)',
        command: 'go',
        args: ['run', 'main.go'],
        cwd: 'services/vendor-service',
        color: '\x1b[35m' // Magenta
    },
    {
        name: 'Budget Service (Java)',
        command: '"C:\\Program Files\\Java\\jdk-22\\bin\\java.exe"',
        args: ['-cp', '.;mysql-connector-j-9.5.0.jar;json-20230227.jar', 'BudgetServiceMySQL'], // Run MySQL version
        cwd: 'services/budget-service',
        color: '\x1b[31m' // Red
    },
    {
        name: 'Frontend Client',
        command: 'npm.cmd', // npm.cmd for Windows
        args: ['run', 'dev'],
        cwd: 'client',
        color: '\x1b[37m' // White
    }
];

// Compile Java first
console.log('Compiling Java Service...');
const javac = spawn('"C:\\Program Files\\Java\\jdk-22\\bin\\javac.exe"', ['-cp', '.;mysql-connector-j-9.5.0.jar;json-20230227.jar', 'BudgetServiceMySQL.java'], {
    cwd: path.join(__dirname, 'services/budget-service'),
    shell: true
});

javac.on('close', (code) => {
    if (code !== 0) {
        console.error('Failed to compile Java service');
        return;
    }
    console.log('Java compiled successfully. Starting all services...\n');
    startServices();
});

function startServices() {
    services.forEach(service => {
        const p = spawn(service.command, service.args, {
            cwd: path.join(__dirname, service.cwd),
            shell: true,
            stdio: 'pipe'
        });

        p.stdout.on('data', (data) => {
            const lines = data.toString().split('\n');
            lines.forEach(line => {
                if (line.trim()) {
                    console.log(`${service.color}[${service.name}] ${line.trim()}\x1b[0m`);
                }
            });
        });

        p.stderr.on('data', (data) => {
            console.error(`${service.color}[${service.name}] ERROR: ${data.toString().trim()}\x1b[0m`);
        });

        p.on('close', (code) => {
            console.log(`${service.color}[${service.name}] exited with code ${code}\x1b[0m`);
        });
    });
}
