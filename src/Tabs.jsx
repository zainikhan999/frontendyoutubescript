// Tabs.jsx
const Tabs = ({ tabs, currentTab, onChange }) => {
  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        marginBottom: "10px",
        flexWrap: "wrap",
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          style={{
            padding: "8px 16px",
            border: "1px solid #007bff",
            borderRadius: "6px",
            backgroundColor: currentTab === tab ? "#007bff" : "#fff",
            color: currentTab === tab ? "#fff" : "#007bff",
            cursor: "pointer",
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
