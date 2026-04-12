const Legend = ({ maxCount }: { maxCount: number }) => {

  const gradientStyle = {
    width: "200px",
    height: "10px",
    background:
      "linear-gradient(to right, #440154, #21908C, #FDE725)"
  };

  return (
    <div style={{ marginBottom: "6px" }}>
      <div style={gradientStyle}></div>
      <div style={{ fontSize: "12px" }}>
        0 → {maxCount} medals
      </div>
    </div>
  );
};

export default Legend;