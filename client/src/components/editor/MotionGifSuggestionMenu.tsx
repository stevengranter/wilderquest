import { useEffect, useState } from "react";

export default MotionGifSuggestionMenu() {
  const [gifList, setGifList] = useState([]);
  useEffect(() => {
    fetch("api/gifs")
      .then((res) => res.json())
      .then((data) => setGifList(data));
  }, []);

  return (
    gifList && (
      <div
        className={"gif-picker"}
        style={
          { gridTemplateColumns: `repeat(${props.columns || 1}, 1fr)` } as any
        }
      >
        {gifList.map((item, index) => (
          <div
            className={`gif-picker-item ${
              props.selectedIndex === index ? " selected" : ""
            }`}
            onClick={() => {
              console.log(props);
            }}
            key={index}
          >
            <img
              src={item.url}
              alt={item.url}
              className="object-scale-down aspect-square"
            />
          </div>
        ))}
      </div>
    )
  );
}