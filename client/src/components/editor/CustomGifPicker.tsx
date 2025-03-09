import {
  DefaultReactGridSuggestionItem,
  GridSuggestionMenuProps,
} from "@blocknote/react";
import { useEffect, useState } from "react";
import classes from "./CustomGifPicker.module.css";

export default function CustomGifPicker(
  props: GridSuggestionMenuProps<DefaultReactGridSuggestionItem>,
) {
  const [gifList, setGifList] = useState<{ url: string; id: string }[]>([]);
  useEffect(() => {
    fetch("api/gifs")
      .then((res) => res.json())
      .then((data) => setGifList(data));
  }, []);

  console.log(props);

  return (
    gifList && (
      <div
        className={classes["gif-picker"]}
        style={{ gridTemplateColumns: `repeat(${props.columns || 1}, 1fr)` }}
      >
        {props.items.map((item, index) => (
          <div
            className={`gif-picker-item ${
              props.selectedIndex === index ? " selected" : ""
            }`}
            onClick={() => {
              props.onItemClick?.(item);
            }}
            key={index}
          >
            {item.icon}
          </div>
        ))}
        {/*{gifList.map((item, index) => (*/}
        {/*  <div*/}
        {/*    className={`gif-picker-item ${*/}
        {/*      props.selectedIndex === index ? " selected" : ""*/}
        {/*    }`}*/}
        {/*    onClick={() => {*/}
        {/*      console.log(props);*/}
        {/*    }}*/}
        {/*    key={index}*/}
        {/*  >*/}
        {/*    <img*/}
        {/*      src={item.url}*/}
        {/*      alt={item.url}*/}
        {/*      className="object-scale-down aspect-square"*/}
        {/*    />*/}
        {/*  </div>*/}
        {/*))}*/}
      </div>
    )
  );
}
