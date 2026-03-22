// Loader.jsx
// Full-screen (or full-container) loading overlay using the Mono spinner.
// Props:
//   label    — string shown below spinner     (default: "Loading")
//   fullPage — fills the entire viewport      (default: true)
//   bg       — background color               (default: "#111111")

const styles = `
  @keyframes spin-mono {
    to { transform: rotate(360deg); }
  }
  @keyframes loader-fade-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0);   }
  }
  @keyframes loader-pulse {
    0%, 100% { opacity: 0.3; }
    50%      { opacity: 0.75; }
  }
 
  .loader-overlay {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #111111;
  }
  .loader-overlay.full-page {
    position: fixed;
    inset: 0;
    z-index: 9999;
  }
  .loader-overlay.inline {
    width: 100%;
    height: 100%;
    min-height: 200px;
    border-radius: 12px;
  }
 
  .loader-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    animation: loader-fade-in 0.4s ease both;
  }
 
  .spinner-mono {
    position: relative;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .spinner-mono__ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background-image: linear-gradient(0deg, #333333 0%, #eeeeee 100%);
    animation: spin-mono 0.6s linear infinite;
  }
  .spinner-mono__hole {
    position: absolute;
    width: 85%;
    height: 85%;
    border-radius: 50%;
    background-color: #111111;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
 
  .loader-label {
    font-family: -apple-system, 'Segoe UI', sans-serif;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: #ffffff;
    animation: loader-pulse 1.2s ease-in-out infinite;
  }
`;

function Loader({ fullPage = true, bg = "oklch(0.22 0.01 285)" }) {
	return (
		<>
			<style>{styles}</style>
			<div
				className={`loader-overlay ${fullPage ? "full-page" : "inline"}`}
				style={{ background: bg }}
			>
				<div className="loader-inner">
					<div className="spinner-mono" style={{ width: 45, height: 45 }}>
						<div
							className="spinner-mono__ring"
							style={{
								backgroundImage:
									"linear-gradient(0deg, #333333 0%, #eeeeee 100%)",
							}}
						/>
						<div
							className="spinner-mono__hole"
							style={{
								backgroundColor: bg,
								width: `calc(100% - 5px)`,
								height: `calc(100% - 5px)`,
							}}
						/>
					</div>
				</div>
			</div>
		</>
	);
}

export default Loader;
