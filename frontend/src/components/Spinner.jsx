import "../App.css";

const Spinner = ({ label }) => {
  return (
    <div className="spinner" aria-live="polite" aria-busy="true">
      <div className="spinner-ring" />
      {label ? <span className="spinner-label">{label}</span> : null}
    </div>
  );
};

export default Spinner;

