import {
  createStyles,
  makeStyles,
  Theme,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListSubheader,
  ListItemAvatar,
  Avatar,
  Link
} from "@material-ui/core";
import {
  Highlight as HighlightsIcon,
  FlashOn as LightningTalkIcon,
  Mic as InterviewIcon,
  Money as SponsorIcon,
  PanTool as QAIcon,
  People as PanelIcon,
  PersonalVideo as TalkIcon,
  Public as KeynoteIcon,
  School as WorkshopIcon
} from "@material-ui/icons";
import { default as NextLink } from "next/link";
import { Talk, EventEdition } from "../schema";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    list: {
      width: "100%"
    },
    chip: {
      margin: theme.spacing(0.3, 0, 0.3, 1)
    }
  })
);

const EditionList = ({
  editions,
  label
}: {
  editions: EventEdition[];
  label: string;
}) => {
  const classes = useStyles({});

  const editionDays = (edition: EventEdition) => {
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    const firstDate = new Date(edition.startDate);
    const secondDate = new Date(edition.endDate);

    return (
      Math.round(
        Math.abs((firstDate.getTime() - secondDate.getTime()) / oneDay)
      ) + 1
    );
  };

  const editionDateStart = (edition: EventEdition) => {
    const startDate = new Date(edition.startDate);
    var options = {
      month: "short",
      day: "numeric"
    };

    return startDate.toLocaleDateString(undefined, options);
  };

  return (
    <List
      subheader={<ListSubheader component="span">{label}</ListSubheader>}
      className={classes.list}
      component="nav"
    >
      {editions.map(edition => (
        <NextLink
          href={`/event/${edition.eventId}/${edition.id}`}
          passHref
          key={edition.id}
        >
          <ListItem button component="a" key={edition.id}>
            <ListItemAvatar>
              <Avatar
                alt={`${edition.eventTitle} ${edition.title} logo`}
                src={`${process.env.STORAGE_PATH}${encodeURIComponent(
                  edition.logo
                )}?alt=media`}
              />
            </ListItemAvatar>
            <ListItemText
              primary={`${edition.eventTitle} ${edition.title}`}
              secondary={
                <>
                  {edition.durationMinutes ? (
                    <>
                      {(edition.durationMinutes / 60).toFixed(1)} hours of
                      content
                    </>
                  ) : (
                    <>
                      {editionDateStart(edition)} at {edition.city},{" "}
                      {edition.country}
                    </>
                  )}
                  {edition.topTags && (
                    <>
                      {edition.topTags.map((tag, index) => (
                        <Chip
                          color="default"
                          variant="outlined"
                          size="small"
                          key={index}
                          label={`#${tag}`}
                          className={classes.chip}
                        ></Chip>
                      ))}
                      <Chip
                        color="default"
                        variant="outlined"
                        size="small"
                        label="…"
                        className={classes.chip}
                      ></Chip>
                    </>
                  )}
                </>
              }
            />
          </ListItem>
        </NextLink>
      ))}
    </List>
  );
};

export default EditionList;