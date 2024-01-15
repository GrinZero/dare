import "./App.css";
import {
  init,
  errorPlugin,
  reportPlugin,
  envPlugin,
  webVitalsPlugin,
} from "@dare/web-sdk/dev";

init({
  plugins: [
    envPlugin(),
    reportPlugin({
      url: "http://localhost:3000/api/report",
    }),
    errorPlugin(),
    webVitalsPlugin(),
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
