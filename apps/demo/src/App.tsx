import "./App.css";
import { init, errorPlugin, reportPlugin } from "@dare/web-sdk/dev";

init({
  plugins: [
    reportPlugin({
      url: "http://localhost:3000/api/report",
    }),
    errorPlugin(),
  ],
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
