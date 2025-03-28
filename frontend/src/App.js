import React, { useState } from "react";

function App() {
  const [urls, setUrls] = useState(null); // Stores generated URLs
  const [loading, setLoading] = useState(false); // Loading state

  // === Handle Button Click ===
  const generateAndDeploy = async () => {
    setLoading(true); // Show loading while request is in progress

    try {
      console.log("🚀 Sending POST request to Flask API...");

      // Send POST request to Flask API
      const response = await fetch("http://127.0.0.1:8080/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Check if response is successful
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Response Data:", data);

        // Check if URLs were generated correctly
        if (data.quizTextURL || data.qtiZipURL) {
          setUrls(data); // Set URLs if files were uploaded successfully
        } else {
          console.error("❌ No URLs returned from Flask.");
        }
      } else {
        console.error("❌ Error generating and deploying files.");
      }
    } catch (error) {
      console.error("❌ Request failed:", error);
    }

    setLoading(false); // Stop loading after request is complete
  };

  return (
    <div className="App" style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Generate and Deploy Quiz</h1>
      <button
        onClick={generateAndDeploy}
        disabled={loading}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          cursor: loading ? "not-allowed" : "pointer",
          backgroundColor: loading ? "#ccc" : "#28a745",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          marginBottom: "20px",
        }}
      >
        {loading ? "Generating..." : "Generate and Deploy"}
      </button>

      {/* Show URLs only if available */}
      {urls && (
        <div style={{ marginTop: "20px" }}>
          <h3>✅ Generated Files:</h3>
          {urls.quizTextURL && (
            <p>
              <a
                href={urls.quizTextURL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#007bff", textDecoration: "none" }}
              >
                📄 Download Quiz Text
              </a>
            </p>
          )}
          {urls.qtiZipURL && (
            <p>
              <a
                href={urls.qtiZipURL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#007bff", textDecoration: "none" }}
              >
                📦 Download QTI Package
              </a>
            </p>
          )}
        </div>
      )}

      {/* Show error message if no URLs */}
      {!loading && urls === null && (
        <p style={{ color: "red", marginTop: "20px" }}>
          ⚠️ No files generated yet. Click the button to generate and deploy.
        </p>
      )}
    </div>
  );
}

export default App;
