import Button from "../ui/Button";

type ButtonGroupSize = "small" | "medium" | "large";

type ButtonGroupProps = {
  size: ButtonGroupSize;
  clickHandler?: (arg0: string) => void;
};

export default function ButtonGroup({
  size = "medium",
  clickHandler = () => {},
}: ButtonGroupProps) {
  return (
    <div className="*:rounded-none">
      <Button
        className="!rounded-l-lg"
        size={size}
        clickHandler={() => clickHandler("h1")}
      >
        H1
      </Button>
      <Button size={size} clickHandler={() => clickHandler("h2")}>
        H2
      </Button>
      <Button
        size={size}
        className="!rounded-r-lg"
        clickHandler={() => clickHandler("h3")}
      >
        H3
      </Button>
    </div>
  );
}
