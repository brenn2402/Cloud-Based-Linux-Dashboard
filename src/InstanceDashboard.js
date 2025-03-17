import React, { useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

export default function InstanceDashboard({ apiInstance, thresholds }) {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentTest, setCurrentTest] = useState({ type: "None", duration: 0 });
  const prevDataRef = useRef(null);
  const [alerts, setAlerts] = useState({});

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const response = await fetch(apiInstance);
        const data = await response.json();

        if (data && typeof data === "object") {
          const formattedData = {
            time: new Date().toLocaleTimeString(),
            cpu: data.cpu_metrics.cpu_usage || 0,
            memory: data.vm_metrics.memory_percent || 0,
            disk: data.filesystem_metrics.disk_percent || 0,
            io_in: (data.io_metrics.io_bytes_recv || 0) / 1024 / 1024, // Convert bytes to MB
            io_out: (data.io_metrics.io_bytes_sent || 0) / 1024 / 1024, // Convert bytes to MB
            network_in: data.sock_metrics.active_sockets || 0,
            network_out: data.sock_metrics.established_sockets || 0
          };

          if (JSON.stringify(formattedData) !== JSON.stringify(prevDataRef.current)) {
            setMetrics((prev) => [...prev.slice(-20), formattedData]); // Keep last 20 points
            prevDataRef.current = formattedData;

            const newAlerts = {};
            if (formattedData.cpu > thresholds.cpu) newAlerts.cpu = true;
            if (formattedData.memory > thresholds.memory) newAlerts.memory = true;
            if (formattedData.disk > thresholds.disk) newAlerts.disk = true;
            if (formattedData.io_in > thresholds.network_in) newAlerts.io_in = true;
            if (formattedData.io_out > thresholds.network_out) newAlerts.io_out = true;
            setAlerts(newAlerts);
          }

          setCurrentTest(data.current_test); // Update running test
        }
      } catch (error) {
        console.error("Error fetching metrics:", error);
      }
      setLoading(false);
    };

    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, [apiInstance, thresholds]);

  const resourceMetrics = metrics.map(item => ({
    time: item.time,
    cpu: item.cpu,
    memory: item.memory,
    disk: item.disk
  }));

  const ioMetrics = metrics.map(item => ({
    time: item.time,
    io_in: item.io_in,
    io_out: item.io_out
  }));

  const networkMetrics = metrics.map(item => ({
    time: item.time,
    network_in: item.network_in,
    network_out: item.network_out
  }));

  const ioMaxValue = React.useMemo(() => {
    if (ioMetrics.length === 0) return 100;
    const allIoValues = ioMetrics.flatMap(item => [
      item.io_in || 0, 
      item.io_out || 0
    ]);
    return Math.max(...allIoValues) * 1.5; // Add 50% headroom
  }, [ioMetrics]);

  const networkMaxValue = React.useMemo(() => {
    if (networkMetrics.length === 0) return 100;
    const allNetworkValues = networkMetrics.flatMap(item => [
      item.network_in || 0, 
      item.network_out || 0
    ]);
    return Math.max(...allNetworkValues) * 1.5; // Add 50% headroom
  }, [networkMetrics]);

  const formatYAxisTickInMB = (value) => {
    return value.toFixed(0); // Just show integer values for cleaner display
  };

  const colors = {
    cpu: { normal: "#ff7300", alert: "#ff0000" },
    memory: { normal: "#387908", alert: "#ff0000" },
    disk: { normal: "#0033cc", alert: "#ff0000" },
    io_in: { normal: "#8a2be2", alert: "#ff0000" },
    io_out: { normal: "#ff1493", alert: "#ff0000" },
    network_in: { normal: "#00bfff", alert: "#ff0000" },
    network_out: { normal: "#ff1493", alert: "#ff0000" }
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-center mb-6">Current Test: {currentTest.type} (Duration: {currentTest.duration}s)</h2>

      {loading && metrics.length === 0 ? (
        <p className="text-center text-gray-500">Loading metrics...</p>
      ) : metrics.length === 0 ? (
        <p className="text-center text-red-500">No data available. Check API.</p>
      ) : (
        <div className="space-y-8">
          {/* System Resources Chart */}
          <div className="bg-white shadow-md rounded-lg p-4">
            <h2 className="text-lg font-semibold text-center mb-4">System Resource Metrics</h2>
            <div className="flex">
              <div className="flex flex-col justify-center items-end pr-2">
                <span className="text-xs text-gray-500">% Usage</span>
              </div>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={resourceMetrics} 
                    barGap={4} 
                    barCategoryGap={20} 
                    margin={{ top: 30, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                    <YAxis 
                      tickFormatter={(value) => value.toFixed(0)} 
                      domain={[0, 100]}
                      width={40}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="cpu" name="CPU Usage (%)" fill={colors.cpu.normal} barSize={40}>
                      {resourceMetrics.map((entry, index) => (
                        <Cell key={`cpu-${index}`} fill={entry.cpu > thresholds.cpu ? colors.cpu.alert : colors.cpu.normal} />
                      ))}
                    </Bar>
                    <Bar dataKey="memory" name="Memory Usage (%)" fill={colors.memory.normal} barSize={40}>
                      {resourceMetrics.map((entry, index) => (
                        <Cell key={`memory-${index}`} fill={entry.memory > thresholds.memory ? colors.memory.alert : colors.memory.normal} />
                      ))}
                    </Bar>
                    <Bar dataKey="disk" name="Disk Usage (%)" fill={colors.disk.normal} barSize={40}>
                      {resourceMetrics.map((entry, index) => (
                        <Cell key={`disk-${index}`} fill={entry.disk > thresholds.disk ? colors.disk.alert : colors.disk.normal} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* I/O Traffic Chart */}
          <div className="bg-white shadow-md rounded-lg p-4">
            <h2 className="text-lg font-semibold text-center mb-4">I/O Traffic</h2>
            <div className="flex">
              <div className="flex flex-col justify-center items-end pr-2">
                <span className="text-xs text-gray-500">MB</span>
              </div>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={ioMetrics} 
                    barGap={4} 
                    barCategoryGap={20} 
                    margin={{ top: 30, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                    <YAxis 
                      tickFormatter={formatYAxisTickInMB} 
                      domain={[0, ioMaxValue]}
                      width={60}
                    />
                    <Tooltip formatter={(value) => [`${value.toFixed(2)} MB`]} />
                    <Legend />
                    <Bar dataKey="io_in" name="I/O In (MB)" fill={colors.io_in.normal} barSize={40}>
                      {ioMetrics.map((entry, index) => (
                        <Cell key={`io_in-${index}`} fill={entry.io_in > thresholds.network_in ? colors.io_in.alert : colors.io_in.normal} />
                      ))}
                    </Bar>
                    <Bar dataKey="io_out" name="I/O Out (MB)" fill={colors.io_out.normal} barSize={40}>
                      {ioMetrics.map((entry, index) => (
                        <Cell key={`io_out-${index}`} fill={entry.io_out > thresholds.network_out ? colors.io_out.alert : colors.io_out.normal} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Network Traffic Chart */}
          <div className="bg-white shadow-md rounded-lg p-4">
            <h2 className="text-lg font-semibold text-center mb-4">Network Traffic</h2>
            <div className="flex">
              <div className="flex flex-col justify-center items-end pr-2">
                <span className="text-xs text-gray-500">Sockets</span>
              </div>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={networkMetrics} 
                    barGap={4} 
                    barCategoryGap={20} 
                    margin={{ top: 30, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                    <YAxis 
                      tickFormatter={(value) => value.toFixed(0)} 
                      domain={[0, networkMaxValue]}
                      width={60}
                    />
                    <Tooltip formatter={(value) => [`${value.toFixed(2)} Sockets`]} />
                    <Legend />
                    <Bar dataKey="network_in" name="Active Sockets" fill={colors.network_in.normal} barSize={40}>
                      {networkMetrics.map((entry, index) => (
                        <Cell key={`network_in-${index}`} fill={entry.network_in > thresholds.network_in ? colors.network_in.alert : colors.network_in.normal} />
                      ))}
                    </Bar>
                    <Bar dataKey="network_out" name="Established Sockets" fill={colors.network_out.normal} barSize={40}>
                      {networkMetrics.map((entry, index) => (
                        <Cell key={`network_out-${index}`} fill={entry.network_out > thresholds.network_out ? colors.network_out.alert : colors.network_out.normal} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}