import React, { useState } from "react";

function App() {
  const [urls, setUrls] = useState(null); // Stores generated URLs
  const [loading, setLoading] = useState(false); // Loading state
  const [courseUrl, setCourseUrl] = useState(""); // Canvas course URL

  // === Handle Button Click ===
  const generateAndDeploy = async () => {
    setLoading(true); // Show loading while request is in progress

    try {
      console.log("🚀 Sending POST request to Flask API...");

      // Create an empty object for the request body
      const requestBody = {};
      
      // Only add courseUrl to the request if it's not empty
      if (courseUrl.trim()) {
        requestBody.courseUrl = courseUrl.trim();
      }

      // Send POST request to Flask API
      const response = await fetch("http://127.0.0.1:8080/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
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
      
      {/* Canvas URL Input */}
      <div style={{ margin: "20px auto", maxWidth: "600px" }}>
        <label htmlFor="courseUrl" style={{ display: "block", marginBottom: "5px", textAlign: "left" }}>
          Canvas Course URL (Optional):
        </label>
        <input
          type="text"
          id="courseUrl"
          value={courseUrl}
          onChange={(e) => setCourseUrl(e.target.value)}
          placeholder="https://canvas-instance.instructure.com/courses/12345"
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            marginBottom: "15px"
          }}
        />
      </div>
      
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
          
          {/* Display Canvas upload result if available */}
          {urls.canvasUpload && (
            <div style={{ 
              margin: "20px auto", 
              maxWidth: "600px",
              padding: "10px", 
              backgroundColor: "#f8f9fa",
              borderRadius: "5px",
              border: "1px solid #ddd"
            }}>
              <h4>Canvas Upload Result:</h4>
              <p>{urls.canvasUpload.message}</p>
            </div>
          )}
        </div>
      )}

      {/* Show error message if no URLs */}
      {!loading && urls === null && (
        <p style={{ color: "#6c757d", marginTop: "20px" }}>
          Enter an optional Canvas URL above or just click the button to generate a quiz.
        </p>
      )}
    </div>
  );
}

export default App;
