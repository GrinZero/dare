import "./App.css";
import { defineConfig, errorPlugin, memoryPlugin } from "@dare/web-sdk/dev";

defineConfig({
  reporter: {
    url: "http://localhost:3000/api/report",
  },
  plugins: [errorPlugin(), memoryPlugin()],
});

function App() {
  return (
    <>
      <h1>@dare/web-sdk</h1>
      <div className="card">
        <button
          onClick={() => {
            throw new Error("test error");
          }}
        >
          click to trigger error
        </button>
      </div>
    </>
  );
}

export default App;
