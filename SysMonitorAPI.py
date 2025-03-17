from flask import Flask, jsonify
from flask_cors import CORS
import psutil
import os
import threading

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}) # Allow all origins

pipe_path = "/tmp/stress_to_api"
current_test = {"type": "None", "duration": 0}

# Ensure the named pipe exists
if not os.path.exists(pipe_path):
    os.mkfifo(pipe_path)

# Function to continuously read from the named pipe
def read_named_pipe():
    global current_test
    while True:
        with open(pipe_path, "r") as pipe:
            for line in pipe:
                test_type, duration = line.strip().split(",")
                current_test["type"] = test_type
                current_test["duration"] = int(duration)

# Start the named pipe reader in a separate thread
pipe_thread = threading.Thread(target=read_named_pipe, daemon=True)
pipe_thread.start()

# Function to get system metrics
def get_cpu_metrics():
    return {"cpu_usage": psutil.cpu_percent(interval=1), "cpu_cores":
psutil.cpu_count(logical=True)}

def get_io_metrics():
    io_stats = psutil.net_io_counters()
    return {
        "io_bytes_sent": io_stats.bytes_sent,
        "io_bytes_recv": io_stats.bytes_recv,
        "io_packets_sent": io_stats.packets_sent,
        "io_packets_recv": io_stats.packets_recv,
    }

def get_vm_metrics():
    vm_stats = psutil.virtual_memory()
    return {
        "memory_total": vm_stats.total,
        "memory_used": vm_stats.used,
        "memory_free": vm_stats.free,
        "memory_percent": vm_stats.percent,
    }

def get_filesystem_metrics():
    fs_stats = psutil.disk_usage('/')
    return {
        "disk_total": fs_stats.total,
        "disk_used": fs_stats.used,
        "disk_free": fs_stats.free,
        "disk_percent": fs_stats.percent,
    }

def get_sock_metrics():
    sock_stats = psutil.net_connections(kind='inet')
    return {
        "active_sockets": len(sock_stats),
        "listening_sockets": len([s for s in sock_stats if s.status == 'LISTEN']),
        "established_sockets": len([s for s in sock_stats if s.status == 'ESTABLISHED']),
    }

@app.route('/api', methods=['GET'])
def metrics():
    """API Endpoint to return system metrics and current running test."""
    return jsonify({
        "current_test": current_test,
        "cpu_metrics": get_cpu_metrics(),
        "io_metrics": get_io_metrics(),
        "vm_metrics": get_vm_metrics(),
        "filesystem_metrics": get_filesystem_metrics(),
        "sock_metrics": get_sock_metrics(),
    })
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

