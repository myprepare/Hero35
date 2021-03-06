import YouTube, { Options } from "react-youtube";
import { makeStyles, createStyles, Theme, Box } from "@material-ui/core";
import {
  APP_BAR_HEIGHT,
  TALK_PAGE_PRIMARY_CONTENT_HEIGHT
} from "../../constants/sizes";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      position: "relative",
      height: "50vh",
      width: "100vw",
      maxHeight: `calc(100vh - ${APP_BAR_HEIGHT} - ${TALK_PAGE_PRIMARY_CONTENT_HEIGHT})`,
      [theme.breakpoints.up("md")]: {
        height: "100vh"
      }
    },
    youtubePlayer: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%"
    }
  })
);

type TalkVideo = {
  videoid: string;
  start?: number;
  end?: number;
};
const TalkVideo = ({ videoid, start, end }: TalkVideo) => {
  const classes = useStyles({});

  const opts: Options = {
    height: "100%",
    width: "100%",
    playerVars: { end, modestbranding: 1, playsinline: 1, rel: 0, start }
  };

  const onPlayerReady = event => {
    event.target.playVideo();
    const player = document.getElementById("widget2");
  };

  return (
    <Box marginBottom={2} className={classes.container}>
      <YouTube
        className={classes.youtubePlayer}
        videoId={videoid}
        opts={opts}
        onReady={onPlayerReady}
      />
    </Box>
  );
};

export default TalkVideo;
