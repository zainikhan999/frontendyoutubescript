import { useState } from "react";
import Collapsible from "./Collapsible";
import Tabs from "./Tabs";
import { marked } from "marked";
import DOMPurify from "dompurify";

const LinkForm = () => {
  const [links, setLinks] = useState([""]);
  const [result, setResult] = useState("");
  const [script, setScript] = useState("");
  const [promptSuggestions, setPromptSuggestions] = useState("");
  const [loading, setLoading] = useState(false);
  const [contentOptions, setContentOptions] = useState(["full"]);
  const [activeTab, setActiveTab] = useState("Result");

  const handleLinkChange = (index, value) => {
    const updatedLinks = [...links];
    updatedLinks[index] = value;
    setLinks(updatedLinks);
  };

  const removeLinkField = (index) => {
    const updatedLinks = links.filter((_, i) => i !== index);
    const updatedOptions = contentOptions.filter((_, i) => i !== index);
    setLinks(updatedLinks);
    setContentOptions(updatedOptions);
  };

  const addLinkField = () => {
    setLinks([...links, ""]);
    setContentOptions([...contentOptions, "full"]);
  };

  const handleContentOptionChange = (index, value) => {
    const updatedOptions = [...contentOptions];
    updatedOptions[index] = value;
    setContentOptions(updatedOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setScript("");
    setResult("");
    setPromptSuggestions("");
    setLoading(true);

    let combinedText = "";

    for (let index = 0; index < links.length; index++) {
      const link = links[index];
      if (!link.trim()) continue;

      const selectedOption = contentOptions[index];
      const isYouTube =
        link.includes("youtube.com") || link.includes("youtu.be");

      const endpoint = isYouTube
        ? "http://localhost:5000/api/transcript"
        : "http://localhost:5000/api/web-analyze";

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ link }),
        });

        const data = await res.json();
        const content = isYouTube ? data.transcript : data.website_text;

        if (!content) {
          combinedText += `\n\n[Error for ${link}]: ${
            data.error || "No content"
          }`;
          continue;
        }

        if (selectedOption === "full") {
          combinedText += `\n\n[Full Content for ${link}]:\n${content}`;
        } else if (selectedOption === "summary" || selectedOption === "both") {
          const summaryRes = await fetch(
            "http://localhost:5000/api/summarize",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ text: content }),
            }
          );

          const summaryData = await summaryRes.json();

          if (summaryData.summary) {
            if (selectedOption === "summary") {
              combinedText += `\n\n[Summary for ${link}]:\n${summaryData.summary}`;
            } else {
              combinedText += `\n\n[Full Content for ${link}]:\n${content}\n\n[Summary]:\n${summaryData.summary}`;
            }
          } else {
            combinedText += `\n\n[Error summarizing ${link}]: ${
              summaryData.error || "Unknown error"
            }`;
          }
        }
      } catch (error) {
        combinedText += `\n\n[Network error for ${link}]: ${error.message}`;
      }
    }

    setResult(combinedText);
    setActiveTab("Result");
    setLoading(false);
  };

  const handleGenerateScript = async () => {
    if (!result.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/generate-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcript: result }),
      });

      const data = await res.json();
      setScript(data.script || "Failed to generate script: " + data.error);
    } catch (error) {
      setScript("Network error or backend not running");
    }
    setActiveTab("Script");
    setLoading(false);
  };

  const handleGeneratePrompts = async () => {
    if (!result.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/generate-prompts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: result }),
      });

      const data = await res.json();
      setPromptSuggestions(
        data.prompts || "Failed to generate prompts: " + data.error
      );
    } catch (error) {
      setPromptSuggestions("Network error or backend not running");
    }
    setActiveTab("Prompts");
    setLoading(false);
  };

  return (
    <>
      <h2
        style={{
          width: "100%",
          textAlign: "center",
          marginBottom: "20px",
          fontSize: "2rem",
        }}
      >
        Smart Youtube Script Generator
      </h2>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          minHeight: "100vh",
          width: "100%",
          padding: "40px 20px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: window.innerWidth < 768 ? "column" : "row",
            gap: "30px",
            // maxWidth: "1200px",
            width: "80%",
          }}
        >
          {/* Left Column */}
          <div
            style={{
              flex: 1,
              backgroundColor: "#f8f9fa",
              padding: "20px",
              borderRadius: "10px",
              boxShadow: "0 0 10px rgba(0,0,0,0.1)",
              width: "45%",
            }}
          >
            <form onSubmit={handleSubmit}>
              {links.map((link, index) => (
                <Collapsible key={index} title={`Link ${index + 1}`}>
                  <input
                    type="url"
                    required
                    placeholder="https://youtube.com/... or website"
                    value={link}
                    onChange={(e) => handleLinkChange(index, e.target.value)}
                    style={{
                      width: "100%",
                      // paddingbottom: "20px",
                      fontSize: "16px",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      marginBottom: "10px",
                      height: "5vh",
                    }}
                  />
                  <label>
                    Content Type:
                    <select
                      value={contentOptions[index]}
                      onChange={(e) =>
                        handleContentOptionChange(index, e.target.value)
                      }
                      style={{
                        padding: "8px",
                        fontSize: "14px",
                        borderRadius: "6px",
                        marginLeft: "10px",
                      }}
                    >
                      <option value="full">Full Content</option>
                      <option value="summary">Summary Only</option>
                      <option value="both">Both</option>
                    </select>
                  </label>
                  {links.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLinkField(index)}
                      style={{
                        marginLeft: "10px",
                        padding: "5px 10px",
                        fontSize: "14px",
                        borderRadius: "6px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  )}
                </Collapsible>
              ))}

              <button
                type="button"
                onClick={addLinkField}
                style={{
                  marginBottom: "15px",
                  padding: "8px 16px",
                  fontSize: "14px",
                  borderRadius: "6px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                + Add Another Link
              </button>

              <br />

              <button
                type="submit"
                style={{
                  padding: "10px 20px",
                  fontSize: "16px",
                  borderRadius: "8px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {loading ? "Loading..." : "Submit"}
              </button>
            </form>
          </div>

          {/* Right Column */}
          <div
            style={{
              flex: 1,
              backgroundColor: "#fefefe",
              padding: "20px",
              borderRadius: "10px",
              boxShadow: "0 0 10px rgba(0,0,0,0.1)",
            }}
          >
            <Tabs
              tabs={["Result", "Script", "Prompts"]}
              currentTab={activeTab}
              onChange={setActiveTab}
            />

            <div
              style={{
                marginTop: "15px",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                backgroundColor: "#f9f9f9",
                maxHeight: "400px",
                overflowY: "auto",
                whiteSpace: "pre-wrap",
              }}
            >
              {activeTab === "Result" && (
                <>
                  <h3>Combined Content:</h3>
                  <p>{result || "No result yet. Submit some links."}</p>
                  <button
                    onClick={handleGenerateScript}
                    style={{
                      marginTop: "10px",
                      marginRight: "10px",
                      padding: "8px 16px",
                      backgroundColor: "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    Generate Script
                  </button>
                  <button
                    onClick={handleGeneratePrompts}
                    style={{
                      marginTop: "10px",
                      padding: "8px 16px",
                      backgroundColor: "#ffc107",
                      color: "black",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    Generate Prompts
                  </button>
                </>
              )}

              {activeTab === "Script" && (
                <>
                  <h3>Generated Script:</h3>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        marked.parse(script || "No script yet.")
                      ),
                    }}
                  />
                </>
              )}

              {activeTab === "Prompts" && (
                <>
                  <h3>Prompt Suggestions:</h3>
                  <div
                    className="rendered-markdown"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        marked.parse(
                          promptSuggestions ||
                            "No prompts yet. Submit result and click generate prompts."
                        )
                      ),
                    }}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LinkForm;
