import React, { useState, useEffect } from "react";
import InstanceDashboard from "./InstanceDashboard";

const API_INSTANCES = {
  instance1: process.env.REACT_APP_API_INSTANCE_1 || "http://34.23.126.245:5000/api",
  instance2: process.env.REACT_APP_API_INSTANCE_2 || "http://35.231.146.195:5000/api"
};

export default function Dashboard() {
  const [selectedInstance, setSelectedInstance] = useState("instance1");
  const [thresholds, setThresholds] = useState({
    cpu: 80,
    memory: 80,
    disk: 90,
    network_in: 50,
    network_out: 50
  });

  const handleThresholdChange = (metric, value) => {
    setThresholds(prev => ({
      ...prev,
      [metric]: Number(value)
    }));
  };

  const handleInstanceChange = (instance) => {
    setSelectedInstance(instance);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-center">Remote Monitoring Dashboard</h1>

      {/* API Instance Selector */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Select API Instance</h3>
        <div className="flex justify-center space-x-4">
          <button 
            onClick={() => handleInstanceChange("instance1")} 
            className={`px-4 py-2 rounded ${selectedInstance === "instance1" ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Instance 1
          </button>
          <button 
            onClick={() => handleInstanceChange("instance2")} 
            className={`px-4 py-2 rounded ${selectedInstance === "instance2" ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Instance 2
          </button>
        </div>
      </div>

      {/* Display Current Instance */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg text-center">
        <h3 className="text-lg font-semibold mb-3">Current Instance: {selectedInstance === "instance1" ? "Instance 1" : "Instance 2"}</h3>
      </div>

      {/* Simple Threshold Settings */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Alert Thresholds</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-sm mb-1">CPU (%):</label>
            <input 
              type="number" 
              min="0" 
              max="100" 
              value={thresholds.cpu} 
              onChange={(e) => handleThresholdChange("cpu", e.target.value)}
              className={`w-full p-1 border rounded`}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Memory (%):</label>
            <input 
              type="number" 
              min="0" 
              max="100" 
              value={thresholds.memory} 
              onChange={(e) => handleThresholdChange("memory", e.target.value)}
              className={`w-full p-1 border rounded`}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Disk (%):</label>
            <input 
              type="number" 
              min="0" 
              max="100" 
              value={thresholds.disk} 
              onChange={(e) => handleThresholdChange("disk", e.target.value)}
              className={`w-full p-1 border rounded`}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Net In (MB):</label>
            <input 
              type="number" 
              min="0" 
              max="1000" 
              value={thresholds.network_in} 
              onChange={(e) => handleThresholdChange("network_in", e.target.value)}
              className={`w-full p-1 border rounded`}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Net Out (MB):</label>
            <input 
              type="number" 
              min="0" 
              max="1000" 
              value={thresholds.network_out} 
              onChange={(e) => handleThresholdChange("network_out", e.target.value)}
              className={`w-full p-1 border rounded`}
            />
          </div>
        </div>
      </div>

      {/* Instance Dashboards */}
      <div style={{ display: selectedInstance === "instance1" ? "block" : "none" }}>
        <InstanceDashboard apiInstance={API_INSTANCES.instance1} thresholds={thresholds} />
      </div>
      <div style={{ display: selectedInstance === "instance2" ? "block" : "none" }}>
        <InstanceDashboard apiInstance={API_INSTANCES.instance2} thresholds={thresholds} />
      </div>
    </div>
  );
}