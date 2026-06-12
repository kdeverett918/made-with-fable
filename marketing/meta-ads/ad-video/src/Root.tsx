import "./index.css";
import { Composition } from "remotion";
import { Ad } from "./Ad";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AdSquare"
        component={Ad}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="AdStory"
        component={Ad}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
