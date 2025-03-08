// import {
//   DefaultReactGridSuggestionItem,
//   GridSuggestionMenuProps,
// } from "@blocknote/react";
import { useEffect, useState } from "react";

export default function CustomGifPicker() {
  // props: GridSuggestionMenuProps<DefaultReactGridSuggestionItem>,
  const [gifList, setGifList] = useState([]);
  useEffect(() => {
    fetch("api/gifs")
      .then((res) => res.json())
      .then((data) => setGifList(data));
  }, []);

  return (
    gifList && (
      <div className="grid grid-cols-6 gap-6 items-center align-middle justify-center bg-slate-400 p-6">
        {gifList.map((item, index) => (
          <div
            key={index}
            className="flex justify-center items-center bg-slate-300 p-2 rounded-xl aspect-square"
          >
            <img
              src={item.path}
              alt={item.path}
              className="object-scale-down aspect-square"
            />
          </div>
        ))}
      </div>
    )
  );
}
