import "./App.css";
import { init, errorPlugin } from "@dare/web-sdk/dev";

init({
  plugins: [errorPlugin({
    onError: (error) => {
      console.log("error", error);
    }
  })],
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
