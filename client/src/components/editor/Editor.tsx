import {
  BlockNoteEditor,
  BlockNoteSchema,
  defaultBlockSpecs,
  defaultInlineContentSpecs,
  filterSuggestionItems,
} from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import {
  DefaultReactSuggestionItem,
  getDefaultReactSlashMenuItems,
  GridSuggestionMenuController,
  SuggestionMenuController,
  useCreateBlockNote,
} from "@blocknote/react";

import { MotionGif } from "@/components/editor/MotionGif";

const schema = BlockNoteSchema.create({
  blockSpecs: {
    // Adds all default blocks.
    ...defaultBlockSpecs,
    // Adds MotionGif
    motionGif: MotionGif,
  },
  inlineContentSpecs: {
    // Adds all default inline content.
    ...defaultInlineContentSpecs,
  },
});

// List containing all default Slash Menu Items, as well as our custom one.
const getCustomSlashMenuItems = (
  editor: BlockNoteEditor,
): DefaultReactSuggestionItem[] => [
  ...getDefaultReactSlashMenuItems(editor),
  insertMotionGif(editor),
];

const getMotionGifItems = (
  editor: typeof schema.BlockNoteEditor,
): DefaultReactSuggestionItem[] => {
  const gifs = [
    { url: "assets/gifs/3demail.gif" },
    {
      url: "assets/gifs/850f9d2c-6c14-4924-ba68-a3914e2e181b_220x200.gif",
    },
    { url: "assets/gifs/Snowglobe.gif" },
    { url: "assets/gifs/SnowglobeJesus.gif" },
    { url: "assets/gifs/VFWComputerMouseAnim.gif" },
    { url: "assets/gifs/aniheart.gif" },
    { url: "assets/gifs/arroba.gif" },
    { url: "assets/gifs/canada_flag.gif" },
    { url: "assets/gifs/clipart_tech_computers_007.gif" },
    { url: "assets/gifs/cool.gif" },
    { url: "assets/gifs/garfield.gif" },
    { url: "assets/gifs/garfield29.gif" },
    { url: "assets/gifs/garfield42.gif" },
    { url: "assets/gifs/heart_2.gif" },
    { url: "assets/gifs/mail.gif" },
    { url: "assets/gifs/mountainsnowglobe.gif" },
    { url: "assets/gifs/smashingcomputer.gif" },
    { url: "assets/gifs/snowglobe7.gif" },
    { url: "assets/gifs/snowglobeelvis.gif" },
    { url: "assets/gifs/studentatcomputer.gif" },
    { url: "assets/gifs/warning.gif" },
    { url: "assets/gifs/wwwdani.gif" },
  ];

  return gifs.map((gif) => ({
    title: gif.url,
    onItemClick: () => {
      editor.insertInlineContent([
        {
          type: "motionGif",
          props: {
            url: gif.url,
          },
        },
        " ", // add a space after the mention
      ]);
    },
    icon: <img src={gif.url} />,
  }));
};

const insertMotionGif = (editor: typeof schema.BlockNoteEditor) => ({
  title: "MotionGif",
  onItemClick: () => {
    editor.openSuggestionMenu(">");
  },
  group: "Other",
});

export function Editor() {
  const editor = useCreateBlockNote({
    schema,
    initialContent: [
      {
        type: "paragraph",
        content: "Welcome to this demo!",
      },
      {
        type: "paragraph",
        content:
          "Press the '/' key to insert a block (headings, paragraphs, lists)",
      },
      {
        type: "paragraph",
        content:
          "Press the '>' key to open gif menu, start typing to filter" +
          " results",
      },
      {
        type: "paragraph",
      },
    ],
  });

  return (
    <BlockNoteView editor={editor} slashMenu={false} emojiPicker={true}>
      <SuggestionMenuController
        triggerCharacter={"/"}
        getItems={async (query) =>
          filterSuggestionItems(getCustomSlashMenuItems(editor), query)
        }
      />

      <GridSuggestionMenuController
        triggerCharacter={">"}
        // gridSuggestionMenuComponent={CustomGifPicker}
        getItems={async (query) =>
          // Filters gifs by query string
          filterSuggestionItems(getMotionGifItems(editor), query)
        }
        columns={3}
        minQueryLength={0}
      />
    </BlockNoteView>
  );
}

export default Editor;
